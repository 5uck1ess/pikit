import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Changelog generation command.
 * Sends a structured prompt to the agent to read git history and produce a changelog.
 */
export function registerChangelog(pi: ExtensionAPI): void {
  pi.registerCommand("changelog", {
    description: "Generate a changelog from recent git history: /changelog [since]",
    async handler(args, _ctx) {
      const since = (args ?? "").trim() || "last tag or 20 commits";

      const prompt = [
        `Generate a changelog from the git history.`,
        "",
        `Range: ${since}`,
        "",
        "Steps:",
        "1. Run git log to see recent commits (use --oneline for overview, then read individual commits for detail)",
        "2. Group changes by category:",
        "   - **Added** — new features",
        "   - **Changed** — modifications to existing features",
        "   - **Fixed** — bug fixes",
        "   - **Removed** — removed features",
        "3. Write each entry as a concise bullet point",
        "4. Skip merge commits and trivial changes (typos, formatting)",
        "",
        "Output format: markdown changelog following Keep a Changelog style.",
      ].join("\n");

      pi.sendUserMessage(prompt);
    },
  });
}
