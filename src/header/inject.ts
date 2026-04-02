import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { activeProfile, getAliases } from "../config/profiles.js";

/**
 * Header injection: prepends session context to the system prompt.
 * Includes active model profile, current aliases, and AGENTS.md content.
 */
export function registerHeader(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event, ctx) => {
    const cwd = ctx.cwd;
    const parts: string[] = [];

    // Model context
    const profile = activeProfile(cwd);
    if (profile) {
      const aliases = getAliases(cwd);
      const aliasStr = Object.entries(aliases)
        .map(([name, { current }]) => `${name}=${current}`)
        .join(", ");
      parts.push(`Model profile: ${profile} (${aliasStr})`);
    }

    // AGENTS.md
    const agentsPath = join(cwd, "AGENTS.md");
    if (existsSync(agentsPath)) {
      parts.push(readFileSync(agentsPath, "utf-8"));
    }

    if (parts.length > 0) {
      return {
        systemPrompt: event.systemPrompt + "\n\n" + parts.join("\n\n"),
      };
    }
  });
}
