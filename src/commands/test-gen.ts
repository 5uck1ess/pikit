import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Test generation command.
 * Sends a structured prompt to the agent to analyze and generate tests.
 */
export function registerTestGen(pi: ExtensionAPI): void {
  pi.registerCommand("test-gen", {
    description: "Generate tests for a file or directory: /test-gen <target>",
    async handler(args, ctx) {
      const target = (args ?? "").trim();
      if (!target) {
        ctx.ui.notify("Usage: /test-gen <file-or-directory>", "info");
        return;
      }

      const prompt = [
        `Generate comprehensive tests for: ${target}`,
        "",
        "Steps:",
        "1. Read the target files and identify the public API surface",
        "2. Detect the project's test framework (vitest, jest, mocha, pytest, go test, etc.)",
        "3. Write test files covering:",
        "   - Happy path for each public function/method",
        "   - Edge cases (empty input, null, boundary values)",
        "   - Error conditions",
        "4. Place test files next to the source or in the project's test directory",
        "5. Run the tests to verify they pass",
        "",
        "Keep tests focused — one logical behavior per test.",
        "Name tests descriptively: 'returns empty array when no items exist'.",
        "Don't test private internals — test the contract.",
      ].join("\n");

      pi.sendUserMessage(prompt);
    },
  });
}
