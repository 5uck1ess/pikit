import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function registerDecompose(pi: ExtensionAPI): void {
  pi.registerCommand("decompose", {
    description: "Break a goal into a dependency-ordered task graph: /decompose <goal>",
    async handler(args, ctx) {
      const goal = (args ?? "").trim();
      if (!goal) {
        ctx.ui.notify("Usage: /decompose <goal description>", "info");
        return;
      }

      pi.sendUserMessage([
        `Decompose this goal into a task graph: ${goal}`,
        "",
        "## Step 1: Clarify",
        "If the goal is vague, ask:",
        "- What is the desired end state?",
        "- What files or systems are involved?",
        "- Any constraints?",
        "",
        "## Step 2: Decompose into Tasks",
        "Break into discrete tasks. For each:",
        "",
        "| # | Task | Depends On | Est. Effort |",
        "|---|------|------------|-------------|",
        "| 1 | ... | — | Low |",
        "| 2 | ... | 1 | Medium |",
        "",
        "Rules:",
        "- Each task should be completable in one focused session",
        "- Tasks with no dependencies can run in parallel",
        "- Include verification tasks (tests, review)",
        "- Prefer small, focused tasks over large monolithic ones",
        "",
        "## Step 3: Resolve Execution Order",
        "Topologically sort the DAG:",
        "```",
        "Depth 0: [Task 1] — no dependencies",
        "Depth 1: [Task 2] — depends on 1",
        "Depth 2: [Task 3, Task 4] — parallel",
        "```",
        "",
        "## Step 4: Output",
        "Present the full task graph with:",
        "- Dependency visualization",
        "- Recommended execution order",
        "- Which tasks can be parallelized",
        "- Risk areas (hardest tasks flagged)",
      ].join("\n"));
    },
  });
}
