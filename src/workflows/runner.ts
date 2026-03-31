import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Workflow, WorkflowRun, Step } from "./types.js";
import { resolvePrompt } from "./loader.js";
import { resolveAlias } from "../config/profiles.js";
import { getCwd } from "../core/context.js";

/**
 * Execute a workflow from start to finish.
 * Handles step sequencing, branching, loops, and approval gates.
 */
export async function runWorkflow(
  pi: ExtensionAPI,
  workflow: Workflow,
  input: string,
  ctx: { cwd: string; piDir?: string },
): Promise<string> {
  const run: WorkflowRun = {
    workflow,
    currentStep: 0,
    stepExecutions: new Map(),
    memory: new Map(),
    aborted: false,
  };

  // Store the original input
  run.memory.set("input", input);

  const results: string[] = [];

  while (run.currentStep < workflow.steps.length && !run.aborted) {
    const step = workflow.steps[run.currentStep];
    const execCount = (run.stepExecutions.get(step.id) ?? 0) + 1;
    run.stepExecutions.set(step.id, execCount);

    // Loop guard
    if (step.loop && execCount > step.loop.max) {
      results.push(`[${step.id}] Loop limit reached (${step.loop.max}). Moving on.`);
      run.currentStep++;
      continue;
    }

    // Approval gate
    if (step.approval && ctx.piDir) {
      const approved = await requestApproval(pi, step, ctx);
      if (!approved) {
        run.aborted = true;
        results.push(`[${step.id}] User declined. Workflow stopped.`);
        break;
      }
    }

    // Execute the step
    const result = await executeStep(pi, step, input, run, ctx);
    results.push(result);

    // Store result in workflow memory
    run.memory.set(step.id, result);

    // Check branch conditions
    const jumped = await evaluateBranches(pi, step, result, run, ctx);
    if (!jumped) {
      // Check loop until condition
      if (step.loop?.until) {
        const done = result.toLowerCase().includes(step.loop.until.toLowerCase());
        if (!done) {
          // Stay on this step (loop)
          continue;
        }
      }
      run.currentStep++;
    }
  }

  return results.join("\n\n---\n\n");
}

async function executeStep(
  pi: ExtensionAPI,
  step: Step,
  input: string,
  run: WorkflowRun,
  ctx: { cwd: string },
): Promise<string> {
  if (step.command) {
    return `[${step.id}] Command: ${step.command} ${JSON.stringify(step.args ?? {})}`;
  }

  if (!step.prompt) {
    return `[${step.id}] No prompt or command defined.`;
  }

  const prompt = resolvePrompt(step.prompt, input, run.memory);
  const model = step.model ? resolveAlias(ctx.cwd, step.model) : undefined;

  const response = await pi.chat({
    message: prompt,
    model,
    skills: step.skills,
  });

  return response ?? `[${step.id}] No response.`;
}

async function requestApproval(
  pi: ExtensionAPI,
  step: Step,
  ctx: { cwd: string; piDir?: string },
): Promise<boolean> {
  try {
    const answer = await pi.ask(`Step "${step.id}" requires approval. Proceed? (yes/no)`);
    return answer?.toLowerCase().startsWith("y") ?? false;
  } catch {
    return true;
  }
}

async function evaluateBranches(
  pi: ExtensionAPI,
  step: Step,
  result: string,
  run: WorkflowRun,
  ctx: { cwd: string },
): Promise<boolean> {
  if (!step.branch?.length) return false;

  for (const rule of step.branch) {
    const matches = result.toLowerCase().includes(rule.when.toLowerCase());
    if (matches) {
      const targetIdx = run.workflow.steps.findIndex((s) => s.id === rule.goto);
      if (targetIdx !== -1) {
        run.currentStep = targetIdx;
        return true;
      }
    }
  }
  return false;
}
