import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Workflow, WorkflowRun, Step, StepStats } from "./types.js";
import { resolvePrompt, contextFilterSavings } from "./loader.js";
import { resolveAlias } from "../config/profiles.js";
import { recordStepCompression, shrink } from "../rtk/hook.js";
import { Semaphore, DEFAULT_CONCURRENCY } from "./semaphore.js";
import { ExecutionRegistry } from "./registry.js";
import { CostHooks } from "./cost-hooks.js";

interface RunOptions {
  cwd: string;
  piDir?: string;
  dryRun?: boolean;
}

/**
 * Execute a workflow from start to finish.
 * Supports sequential steps, parallel groups, dry run preview,
 * token budgets with auto-downgrade, and per-step compression tracking.
 */
export async function runWorkflow(
  pi: ExtensionAPI,
  workflow: Workflow,
  input: string,
  opts: RunOptions,
): Promise<string> {
  const registry = new ExecutionRegistry();
  const costHooks = new CostHooks();

  // Register all steps upfront so the registry shows the full picture
  for (const step of workflow.steps) {
    registry.register(step.id);
  }

  const run: WorkflowRun = {
    workflow,
    currentStep: 0,
    stepExecutions: new Map(),
    memory: new Map(),
    stats: [],
    totalChars: 0,
    aborted: false,
    dryRun: opts.dryRun ?? false,
    registry,
    costHooks,
  };

  run.memory.set("input", input);
  const results: string[] = [];

  if (run.dryRun) {
    return dryRunPreview(workflow, input, opts.cwd);
  }

  while (run.currentStep < workflow.steps.length && !run.aborted) {
    const step = workflow.steps[run.currentStep];

    // Parallel step group — execute listed steps concurrently
    if (step.parallel?.length) {
      const parallelResults = await executeParallel(pi, step, run, opts);
      results.push(parallelResults);
      run.currentStep++;
      continue;
    }

    const execCount = (run.stepExecutions.get(step.id) ?? 0) + 1;
    run.stepExecutions.set(step.id, execCount);

    // Loop guard
    if (step.loop && execCount > step.loop.max) {
      registry.skip(step.id, `loop limit (${step.loop.max})`);
      results.push(`[${step.id}] Loop limit reached (${step.loop.max}). Moving on.`);
      run.currentStep++;
      continue;
    }

    // Token budget check
    const budgetAction = checkBudget(run, step, opts.cwd);
    if (budgetAction === "stop") {
      registry.skip(step.id, "budget exhausted");
      costHooks.emit({
        event: "budget:stop", stepId: step.id,
        usedChars: run.totalChars, limitChars: run.workflow.budget!.limit,
        usagePercent: Math.round((run.totalChars / run.workflow.budget!.limit) * 100),
      });
      results.push(`[${step.id}] Token budget exhausted. Stopping workflow.`);
      run.aborted = true;
      break;
    }
    if (budgetAction === "skip") {
      registry.skip(step.id, "over budget");
      costHooks.emit({
        event: "budget:skip", stepId: step.id,
        usedChars: run.totalChars, limitChars: run.workflow.budget!.limit,
        usagePercent: Math.round((run.totalChars / run.workflow.budget!.limit) * 100),
      });
      results.push(`[${step.id}] Skipped — over token budget.`);
      run.currentStep++;
      continue;
    }

    // Approval gate
    if (step.approval) {
      const approved = await requestApproval(pi, step);
      if (!approved) {
        run.aborted = true;
        results.push(`[${step.id}] User declined. Workflow stopped.`);
        break;
      }
    }

    // Resolve model (may be downgraded by budget)
    const model = resolveStepModel(step, run, opts.cwd, budgetAction === "downgrade");
    if (budgetAction === "downgrade") {
      costHooks.emit({
        event: "budget:downgrade", stepId: step.id, model,
        usedChars: run.totalChars, limitChars: run.workflow.budget!.limit,
        usagePercent: Math.round((run.totalChars / run.workflow.budget!.limit) * 100),
      });
    }

    // Execute
    registry.start(step.id, model);
    const start = Date.now();
    let result: string;
    try {
      result = await executeStep(pi, step, input, run, model);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      registry.fail(step.id, msg);
      results.push(`[${step.id}] Failed: ${msg}`);
      run.currentStep++;
      continue;
    }
    const elapsed = Date.now() - start;

    // Track stats including context filter savings
    const promptText = step.prompt ? resolvePrompt(step.prompt, input, run.memory) : "";
    const filtered = step.prompt ? contextFilterSavings(step.prompt, run.memory) : 0;
    const stat: StepStats = {
      stepId: step.id,
      model: model ?? "default",
      inputChars: promptText.length,
      outputChars: result.length,
      rtkOriginal: 0,
      rtkCompressed: 0,
      filteredChars: filtered,
      durationMs: elapsed,
    };
    run.stats.push(stat);
    run.totalChars += stat.inputChars + stat.outputChars;

    registry.done(step.id, { input: stat.inputChars, output: stat.outputChars });

    // Emit cost events after updating totals
    if (run.workflow.budget) {
      costHooks.check(step.id, run.totalChars, run.workflow.budget.limit, model);
    }

    results.push(result);
    run.memory.set(step.id, result);

    // Branch evaluation
    const jumped = evaluateBranches(step, result, run);
    if (!jumped) {
      if (step.loop?.until) {
        const done = result.toLowerCase().includes(step.loop.until.toLowerCase());
        if (!done) continue;
      }
      run.currentStep++;
    }
  }

  // Append stats and registry summary
  results.push(formatStats(run));
  results.push(registry.summary());
  return results.join("\n\n---\n\n");
}

/** Execute a parallel step group with concurrency limiting */
async function executeParallel(
  pi: ExtensionAPI,
  coordinator: Step,
  run: WorkflowRun,
  opts: RunOptions,
): Promise<string> {
  const stepIds = coordinator.parallel!;
  const stepsToRun = stepIds
    .map((id) => run.workflow.steps.find((s) => s.id === id))
    .filter((s): s is Step => s !== undefined);

  const limit = run.workflow.concurrency?.limit ?? DEFAULT_CONCURRENCY;
  const semaphore = new Semaphore(limit);

  // Snapshot memory before parallel execution so all steps see the same state
  const memorySnapshot = new Map(run.memory);

  const promises = stepsToRun.map((step) =>
    semaphore.run(async () => {
      const model = resolveStepModel(step, run, opts.cwd, false);
      run.registry.start(step.id, model);
      const start = Date.now();

      let result: string;
      try {
        result = await executeStep(pi, step, memorySnapshot.get("input") ?? "", run, model);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        run.registry.fail(step.id, msg);
        return `[${step.id}] Failed: ${msg}`;
      }
      const elapsed = Date.now() - start;

      // Track stats with proper resolved prompt length and context filtering
      const promptText = step.prompt ? resolvePrompt(step.prompt, memorySnapshot.get("input") ?? "", memorySnapshot) : "";
      const filtered = step.prompt ? contextFilterSavings(step.prompt, memorySnapshot) : 0;
      const stat: StepStats = {
        stepId: step.id,
        model: model ?? "default",
        inputChars: promptText.length,
        outputChars: result.length,
        rtkOriginal: 0,
        rtkCompressed: 0,
        filteredChars: filtered,
        durationMs: elapsed,
      };
      run.stats.push(stat);
      run.totalChars += stat.inputChars + stat.outputChars;

      run.registry.done(step.id, { input: stat.inputChars, output: stat.outputChars });
      run.memory.set(step.id, result);
      return `[${step.id}]\n${result}`;
    }),
  );

  const results = await Promise.all(promises);
  return results.join("\n\n");
}

/** Generate a dry run preview without executing anything */
function dryRunPreview(workflow: Workflow, input: string, cwd: string): string {
  const lines = [`Dry run: ${workflow.name}`, `Input: ${input}`, ""];

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const model = step.model ? resolveAlias(cwd, step.model) : "default";
    const prefix = `${i + 1}. [${step.id}]`;

    if (step.parallel?.length) {
      lines.push(`${prefix} PARALLEL: ${step.parallel.join(", ")}`);
    } else if (step.command) {
      lines.push(`${prefix} COMMAND: ${step.command} ${JSON.stringify(step.args ?? {})}`);
    } else {
      lines.push(`${prefix} model=${model}`);
      if (step.loop) lines.push(`   loop: max ${step.loop.max}, until "${step.loop.until ?? "n/a"}"`);
      if (step.branch?.length) {
        for (const b of step.branch) {
          lines.push(`   branch: when "${b.when}" → goto ${b.goto}`);
        }
      }
      if (step.approval) lines.push(`   requires approval`);
    }
  }

  if (workflow.budget) {
    lines.push("", `Token budget: ${(workflow.budget.limit / 1024).toFixed(0)} KB, strategy: ${workflow.budget.downgrade}`);
  }

  return lines.join("\n");
}

/** Check if we're within token budget. Returns action to take. */
function checkBudget(run: WorkflowRun, step: Step, cwd: string): "ok" | "downgrade" | "skip" | "stop" | null {
  const budget = run.workflow.budget;
  if (!budget) return "ok";

  const usage = run.totalChars;
  const remaining = budget.limit - usage;

  // Under 80% — fine
  if (remaining > budget.limit * 0.2) return "ok";

  // 80-100% — downgrade if strategy allows
  if (remaining > 0) {
    if (budget.downgrade === "fast") return "downgrade";
    if (budget.downgrade === "skip") return "skip";
    return "ok";
  }

  // Over budget
  if (budget.downgrade === "stop") return "stop";
  if (budget.downgrade === "skip") return "skip";
  return "downgrade";
}

/** Resolve the model for a step, with optional downgrade to fast */
function resolveStepModel(step: Step, run: WorkflowRun, cwd: string, downgrade: boolean): string | undefined {
  if (!step.model) return undefined;
  if (downgrade) return resolveAlias(cwd, "fast");
  return resolveAlias(cwd, step.model);
}

async function executeStep(
  pi: ExtensionAPI,
  step: Step,
  input: string,
  run: WorkflowRun,
  model: string | undefined,
): Promise<string> {
  if (step.command) {
    return `[${step.id}] Command: ${step.command} ${JSON.stringify(step.args ?? {})}`;
  }

  if (!step.prompt) {
    return `[${step.id}] No prompt or command defined.`;
  }

  // Compress memory values before injection to reduce prompt size.
  // Only compresses values over 500 chars (small values aren't worth it).
  const compressedMemory = new Map(run.memory);
  for (const [key, val] of compressedMemory) {
    if (val.length > 500) {
      const compressed = shrink(val);
      if (compressed.length < val.length) {
        recordStepCompression(step.id, val.length, compressed.length);
        compressedMemory.set(key, compressed);
      }
    }
  }

  const prompt = resolvePrompt(step.prompt, input, compressedMemory);

  const response = await pi.chat({
    message: prompt,
    model,
    skills: step.skills,
  });

  return response ?? `[${step.id}] No response.`;
}

async function requestApproval(pi: ExtensionAPI, step: Step): Promise<boolean> {
  try {
    const answer = await pi.ask(`Step "${step.id}" requires approval. Proceed? (yes/no)`);
    return answer?.toLowerCase().startsWith("y") ?? false;
  } catch {
    return true;
  }
}

function evaluateBranches(step: Step, result: string, run: WorkflowRun): boolean {
  if (!step.branch?.length) return false;
  for (const rule of step.branch) {
    if (result.toLowerCase().includes(rule.when.toLowerCase())) {
      const idx = run.workflow.steps.findIndex((s) => s.id === rule.goto);
      if (idx !== -1) {
        run.currentStep = idx;
        return true;
      }
    }
  }
  return false;
}

/** Format per-step stats as a summary table */
function formatStats(run: WorkflowRun): string {
  if (run.stats.length === 0) return "";
  const lines = ["Workflow Stats:"];
  let totalIn = 0, totalOut = 0, totalMs = 0, totalFiltered = 0;
  for (const s of run.stats) {
    totalIn += s.inputChars;
    totalOut += s.outputChars;
    totalMs += s.durationMs;
    totalFiltered += s.filteredChars;
    lines.push(`  ${s.stepId}: ${s.model} | in=${(s.inputChars / 1024).toFixed(1)}KB out=${(s.outputChars / 1024).toFixed(1)}KB | ${(s.durationMs / 1000).toFixed(1)}s`);
  }
  lines.push(`  Total: in=${(totalIn / 1024).toFixed(1)}KB out=${(totalOut / 1024).toFixed(1)}KB | ${(totalMs / 1000).toFixed(1)}s`);

  if (totalFiltered > 0) {
    lines.push(`  Context filtered: ${(totalFiltered / 1024).toFixed(1)}KB excluded from prompts`);
  }

  if (run.workflow.budget) {
    const pct = run.totalChars > 0 ? Math.round((run.totalChars / run.workflow.budget.limit) * 100) : 0;
    lines.push(`  Budget: ${pct}% used (${(run.totalChars / 1024).toFixed(1)}KB / ${(run.workflow.budget.limit / 1024).toFixed(0)}KB)`);
  }

  return lines.join("\n");
}
