import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import type { Workflow, Step } from "./types.js";
import { resolvePrompt } from "./loader.js";

/**
 * Execute a workflow by sending each step's prompt as a user message
 * and waiting for the agent to respond before proceeding.
 *
 * Each step's prompt is resolved with {{input}} and {{stepId}} references,
 * then sent to the agent. The agent's response is captured and stored
 * for use in subsequent steps.
 */
export async function runWorkflow(
  pi: ExtensionAPI,
  workflow: Workflow,
  input: string,
  ctx: ExtensionCommandContext,
): Promise<void> {
  const memory = new Map<string, string>();
  memory.set("input", input);

  ctx.ui.notify(`Starting workflow: ${workflow.name}`, "info");

  let stepIndex = 0;
  const execCounts = new Map<string, number>();

  while (stepIndex < workflow.steps.length) {
    const step = workflow.steps[stepIndex];

    // Parallel steps: run sequentially (agent can only handle one message at a time)
    if (step.parallel?.length) {
      for (const parallelId of step.parallel) {
        const parallelStep = workflow.steps.find((s) => s.id === parallelId);
        if (parallelStep) {
          await executeStep(pi, parallelStep, input, memory, ctx);
        }
      }
      stepIndex++;
      continue;
    }

    // Loop guard
    const count = (execCounts.get(step.id) ?? 0) + 1;
    execCounts.set(step.id, count);
    if (step.loop && count > step.loop.max) {
      ctx.ui.notify(`[${step.id}] Loop limit reached (${step.loop.max}). Moving on.`, "warning");
      stepIndex++;
      continue;
    }

    // Approval gate
    if (step.approval) {
      const approved = await ctx.ui.confirm(
        "Approval Required",
        `Step "${step.id}" requires approval. Proceed?`,
      );
      if (!approved) {
        ctx.ui.notify(`[${step.id}] User declined. Workflow stopped.`, "warning");
        return;
      }
    }

    // Execute the step
    const response = await executeStep(pi, step, input, memory, ctx);
    if (response === null) {
      stepIndex++;
      continue;
    }

    memory.set(step.id, response);

    // Branch evaluation
    const jumped = evaluateBranches(step, response, workflow.steps);
    if (jumped !== null) {
      stepIndex = jumped;
      continue;
    }

    // Loop: check if sentinel reached
    if (step.loop?.until) {
      const done = response.toLowerCase().includes(step.loop.until.toLowerCase());
      if (!done) continue; // Re-run same step
    }

    stepIndex++;
  }

  ctx.ui.notify(`Workflow "${workflow.name}" complete.`, "info");
}

/**
 * Execute a single step by sending its resolved prompt to the agent.
 * Returns the assistant's response text, or null if no prompt.
 */
async function executeStep(
  pi: ExtensionAPI,
  step: Step,
  input: string,
  memory: Map<string, string>,
  ctx: ExtensionCommandContext,
): Promise<string | null> {
  if (step.command) {
    // Shell commands: let the agent run them
    const prompt = `Run this command and report the results: ${step.command} ${JSON.stringify(step.args ?? {})}`;
    pi.sendUserMessage(prompt);
    await ctx.waitForIdle();
    return extractLastResponse(ctx);
  }

  if (!step.prompt) {
    return null;
  }

  const prompt = resolvePrompt(step.prompt, input, memory);

  // Prefix with step context so the user can follow along
  const message = `[Workflow step: ${step.id}]\n\n${prompt}`;
  pi.sendUserMessage(message);
  await ctx.waitForIdle();

  return extractLastResponse(ctx);
}

/**
 * Extract text from the last assistant message in the session.
 */
function extractLastResponse(ctx: ExtensionCommandContext): string {
  const leaf = ctx.sessionManager.getLeafEntry();
  if (!leaf || leaf.type !== "message") return "";

  const msg = leaf.message;
  if (msg.role !== "assistant") return "";

  if (!msg.content || !Array.isArray(msg.content)) return "";

  return msg.content
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { type: string; text?: string }) => c.text ?? "")
    .join("\n");
}

/**
 * Evaluate branch rules against a response.
 * Returns the step index to jump to, or null to continue normally.
 */
function evaluateBranches(step: Step, result: string, allSteps: Step[]): number | null {
  if (!step.branch?.length) return null;
  for (const rule of step.branch) {
    if (result.toLowerCase().includes(rule.when.toLowerCase())) {
      const idx = allSteps.findIndex((s) => s.id === rule.goto);
      if (idx !== -1) return idx;
    }
  }
  return null;
}
