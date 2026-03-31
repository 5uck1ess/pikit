import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import { activeProfile, getAliases } from "../config/profiles.js";

/**
 * Header injection: prepends session context to the system prompt.
 * Includes active model profile, current aliases, and AGENTS.md content.
 */
export function registerHeader(pi: ExtensionAPI): void {
  pi.on("session_start", (event) => {
    const cwd = getCwd(event);
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
    const piDir = event.piDir ?? cwd;
    const agentsPath = join(piDir, "AGENTS.md");
    if (existsSync(agentsPath)) {
      parts.push(readFileSync(agentsPath, "utf-8"));
    }

    if (parts.length > 0) {
      event.addSystemPrompt(parts.join("\n\n"));
    }
  });
}
