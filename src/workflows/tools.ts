import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { listWorkflows, loadWorkflow } from "./loader.js";
import { runWorkflow } from "./runner.js";

export function registerWorkflowCommands(pi: ExtensionAPI): void {
  pi.registerCommand("workflow", {
    description: "Run a multi-step workflow: /workflow [--dry-run] <name> <input>",
    getArgumentCompletions(prefix) {
      const workflowsDir = join(process.cwd(), ".pi", "workflows");
      const names = ["list", "--dry-run", ...listWorkflows(workflowsDir)];
      const filtered = names
        .filter((n) => n.startsWith(prefix))
        .map((n) => ({ value: n, label: n }));
      return filtered.length > 0 ? filtered : null;
    },
    async handler(args, ctx) {
      const cwd = ctx.cwd;
      const workflowsDir = join(cwd, ".pi", "workflows");

      const tokens = (args ?? "").split(/\s+/);
      const dryRun = tokens[0] === "--dry-run";
      if (dryRun) tokens.shift();

      const [name, ...rest] = tokens;
      const input = rest.join(" ");

      if (!name || name === "list") {
        const available = listWorkflows(workflowsDir);
        const text = available.length
          ? `Available workflows:\n${available.map((w) => `  ${w}`).join("\n")}`
          : "No workflows found.";
        ctx.ui.notify(text, "info");
        return;
      }

      const filePath = join(workflowsDir, `${name}.yml`);
      try {
        const workflow = loadWorkflow(filePath);

        if (dryRun) {
          const preview = dryRunPreview(workflow, input, cwd);
          ctx.ui.notify(preview, "info");
          return;
        }

        await runWorkflow(pi, workflow, input, ctx);
      } catch (err) {
        ctx.ui.notify(
          `Failed to run workflow "${name}": ${err instanceof Error ? err.message : err}`,
          "error",
        );
      }
    },
  });
}

function dryRunPreview(workflow: { name: string; steps: Array<{ id: string; model?: string; prompt?: string; command?: string; args?: Record<string, string>; loop?: { max: number; until?: string }; branch?: Array<{ when: string; goto: string }>; parallel?: string[]; approval?: boolean }> ; budget?: { limit: number; downgrade: string } }, input: string, _cwd: string): string {
  const lines = [`Dry run: ${workflow.name}`, `Input: ${input}`, ""];

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const prefix = `${i + 1}. [${step.id}]`;

    if (step.parallel?.length) {
      lines.push(`${prefix} PARALLEL: ${step.parallel.join(", ")}`);
    } else if (step.command) {
      lines.push(`${prefix} COMMAND: ${step.command} ${JSON.stringify(step.args ?? {})}`);
    } else {
      lines.push(`${prefix} model=${step.model ?? "default"}`);
      if (step.loop) lines.push(`   loop: max ${step.loop.max}, until "${step.loop.until ?? "n/a"}"`);
      if (step.branch?.length) {
        for (const b of step.branch) {
          lines.push(`   branch: when "${b.when}" -> goto ${b.goto}`);
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
