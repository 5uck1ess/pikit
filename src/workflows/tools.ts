import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import { listWorkflows, loadWorkflow } from "./loader.js";
import { runWorkflow } from "./runner.js";

export function registerWorkflowCommands(pi: ExtensionAPI): void {
  pi.registerCommand({
    name: "workflow",
    description: "Run a multi-step workflow: /workflow [--dry-run] <name> <input>",
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const piDir = ctx.piDir ?? cwd;
      const workflowsDir = join(piDir, "workflows");

      const tokens = (args ?? "").split(/\s+/);
      const dryRun = tokens[0] === "--dry-run";
      if (dryRun) tokens.shift();

      const [name, ...rest] = tokens;
      const input = rest.join(" ");

      if (!name || name === "list") {
        const available = listWorkflows(workflowsDir);
        return available.length
          ? `Available workflows:\n${available.map((w) => `  ${w}`).join("\n")}`
          : "No workflows found.";
      }

      const filePath = join(workflowsDir, `${name}.yml`);
      try {
        const workflow = loadWorkflow(filePath);
        return await runWorkflow(pi, workflow, input, { cwd, piDir, dryRun });
      } catch (err) {
        return `Failed to run workflow "${name}": ${err instanceof Error ? err.message : err}`;
      }
    },
  });
}
