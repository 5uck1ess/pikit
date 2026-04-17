import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { listWorkflows } from "../workflows/loader.js";
import { discoverSkills } from "../skills/loader.js";
import { checkEndpoint, formatHealth } from "../core/health.js";
import { activeProfile, getAliases } from "../config/profiles.js";

function checkCli(name: string): string | null {
  try {
    const version = execSync(`${name} --version 2>/dev/null`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return version;
  } catch {
    return null;
  }
}

export function registerStatus(pi: ExtensionAPI): void {
  pi.registerCommand("status", {
    description: "Show pikit health — installed CLIs, available skills, workflows, hooks",
    async handler(_args, ctx) {
      const cwd = ctx.cwd;
      const lines: string[] = ["## Pikit Status", ""];

      // Active model profile
      const profile = activeProfile(cwd);
      if (profile) {
        const aliases = getAliases(cwd);
        const aliasStr = Object.entries(aliases)
          .map(([name, { current }]) => `${name}=${current}`)
          .join(", ");
        lines.push(`### Model Profile: ${profile}`);
        lines.push(aliasStr);
        lines.push("");
      }

      // Local endpoint check
      const localEndpoints = [
        ["llama-swap", "http://localhost:8080/v1"],
        ["Ollama", "http://localhost:11434/v1"],
      ] as const;
      const endpointResults = await Promise.all(
        localEndpoints.map(async ([name, url]) => {
          const result = await checkEndpoint(url, 1500);
          return `- **${name}**: ${formatHealth(result)}`;
        }),
      );
      lines.push("### Local Endpoints");
      lines.push(...endpointResults);
      lines.push("");

      // CLIs
      lines.push("### External CLIs");
      const clis: Array<[string, string, string]> = [
        ["gh", "PR creation, CI monitoring", "brew install gh"],
        ["rtk", "Token optimization (60-90% savings)", "brew install rtk"],
        ["sg", "AST-based repo mapping", "brew install ast-grep"],
        ["ruff", "Python linting", "pip install ruff"],
      ];
      for (const [name, purpose, install] of clis) {
        const version = checkCli(name);
        lines.push(
          version
            ? `- **${name}** — installed (${version.split("\n")[0]})`
            : `- **${name}** — not installed (${purpose}). Install: \`${install}\``,
        );
      }
      lines.push("");

      // Skills
      const skillsDir = join(cwd, ".pi", "skills");
      const skills = discoverSkills(skillsDir);
      lines.push(`### Skills (${skills.length})`);
      for (const skill of skills) {
        lines.push(`- **${skill.name}** — ${skill.description.slice(0, 80)}`);
      }
      lines.push("");

      // Workflows
      const workflowsDir = join(cwd, ".pi", "workflows");
      const workflows = existsSync(workflowsDir) ? listWorkflows(workflowsDir) : [];
      lines.push(`### Workflows (${workflows.length})`);
      for (const wf of workflows) {
        lines.push(`- ${wf}`);
      }
      lines.push("");

      // Commands
      const commands = pi.getCommands();
      const extCommands = commands.filter((c) => c.source === "extension");
      lines.push(`### Commands (${extCommands.length})`);
      for (const cmd of extCommands) {
        lines.push(`- **/${cmd.name}** — ${cmd.description ?? ""}`);
      }
      lines.push("");

      // Hooks
      const hooksDir = join(cwd, ".pi", "src", "hooks");
      if (existsSync(hooksDir)) {
        const hooks = readdirSync(hooksDir).filter((f) => f.endsWith(".ts"));
        lines.push(`### Active Hooks (${hooks.length})`);
        for (const hook of hooks) {
          lines.push(`- ${hook.replace(".ts", "")}`);
        }
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
