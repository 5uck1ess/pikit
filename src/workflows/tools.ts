import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import { WORKFLOWS_DIR } from "../core/paths.js";
import { listWorkflows, loadWorkflow } from "./loader.js";
import { runWorkflow } from "./runner.js";

export function registerWorkflowCommands(pi: ExtensionAPI): void {
  pi.registerCommand({
    name: "workflow",
    description: "Run a multi-step workflow: /workflow <name> <input>",
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const piDir = ctx.piDir ?? cwd;
      const workflowsDir = join(piDir, WORKFLOWS_DIR);
      const [name, ...rest] = (args ?? "").split(/\s+/);
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
        return await runWorkflow(pi, workflow, input, { cwd, piDir });
      } catch (err) {
        return `Failed to run workflow "${name}": ${err instanceof Error ? err.message : err}`;
      }
    },
  });
}
