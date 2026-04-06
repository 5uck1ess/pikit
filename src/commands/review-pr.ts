import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const REVIEW_ASPECTS = [
  "comments — analyze comment accuracy and maintainability",
  "tests — review test coverage quality and completeness",
  "errors — check for silent failures and swallowed errors",
  "types — analyze type design and invariants",
  "code — general code review for project guidelines",
  "simplify — suggest simplifications for clarity",
  "all — run all applicable reviews (default)",
] as const;

export function registerReviewPr(pi: ExtensionAPI): void {
  pi.registerCommand("review-pr", {
    description: "Comprehensive PR review with specialized focus areas: /review-pr [aspects]",
    getArgumentCompletions(prefix) {
      const names = ["all", "comments", "tests", "errors", "types", "code", "simplify"];
      const filtered = names
        .filter((n) => n.startsWith(prefix))
        .map((n) => ({ value: n, label: n }));
      return filtered.length > 0 ? filtered : null;
    },
    async handler(args, _ctx) {
      const aspects = (args ?? "").trim() || "all";
      pi.sendUserMessage([
        `Run a comprehensive code review with focus on: ${aspects}`,
        "",
        "## Available Review Aspects",
        ...REVIEW_ASPECTS.map((a) => `- **${a}**`),
        "",
        "## Step 1: Gather Diff",
        "```bash",
        "git diff main...HEAD 2>/dev/null || git diff HEAD~1..HEAD 2>/dev/null || git diff --cached",
        "```",
        "Warn if diff exceeds 5000 lines.",
        "",
        "## Step 2: Run Reviews",
        "",
        aspects.includes("comments") || aspects === "all"
          ? [
              "### Comment Analysis",
              "For each comment in the diff:",
              "- Cross-reference claims against actual code",
              "- Flag comments that restate obvious code",
              "- Flag comments that will become outdated with likely changes",
              "- Prefer 'why' comments over 'what' comments",
              "",
            ].join("\n")
          : "",
        aspects.includes("tests") || aspects === "all"
          ? [
              "### Test Coverage Analysis",
              "- Are new code paths tested?",
              "- Do tests cover edge cases and error conditions?",
              "- Are tests testing behavior (not implementation)?",
              "- Any test anti-patterns (testing mocks, brittle assertions)?",
              "",
            ].join("\n")
          : "",
        aspects.includes("errors") || aspects === "all"
          ? [
              "### Silent Failure Hunt",
              "For EVERY catch/except/error handler in the diff:",
              "- Is the error logged with sufficient context?",
              "- Does the user receive actionable feedback?",
              "- Does the catch block catch only expected error types?",
              "- Does fallback behavior mask the underlying problem?",
              "- Could this catch block accidentally swallow unrelated errors?",
              "",
            ].join("\n")
          : "",
        aspects.includes("types") || aspects === "all"
          ? [
              "### Type Design Review",
              "- Are types capturing real invariants?",
              "- Are discriminated unions used where exactly one variant applies?",
              "- Is `any`/`unknown` used appropriately?",
              "- Are optional fields truly optional or should be separate types?",
              "",
            ].join("\n")
          : "",
        aspects.includes("code") || aspects === "all"
          ? [
              "### General Code Review",
              "- Bugs, logic errors, off-by-one",
              "- DRY violations (Rule of Three — flag at 3+ instances)",
              "- Unnecessary complexity",
              "- Missing edge cases",
              "- Security issues (injection, XSS, hardcoded secrets)",
              "",
            ].join("\n")
          : "",
        aspects.includes("simplify") || aspects === "all"
          ? [
              "### Simplification Opportunities",
              "- Can any code be replaced with stdlib/framework built-ins?",
              "- Can conditionals be flattened with early returns?",
              "- Are there unnecessary abstractions?",
              "",
            ].join("\n")
          : "",
        "## Step 3: Report",
        "```",
        "## Review Report",
        "",
        "### Critical Issues (must fix)",
        "- File:line — severity — description — suggested fix",
        "",
        "### Warnings (should fix)",
        "- ...",
        "",
        "### Suggestions (nice to have)",
        "- ...",
        "```",
      ]
        .filter(Boolean)
        .join("\n"));
    },
  });
}
