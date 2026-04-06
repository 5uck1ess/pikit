import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function registerCommitCommands(pi: ExtensionAPI): void {
  pi.registerCommand("commit", {
    description: "Stage and commit changes with auto-generated message",
    async handler(_args, _ctx) {
      pi.sendUserMessage([
        "Look at the current git status and diff, then create a single commit.",
        "",
        "Steps:",
        "1. Run `git status` and `git diff HEAD` to see all changes",
        "2. Stage appropriate files with `git add`",
        "3. Write a concise, imperative commit message under 72 chars",
        "4. Run `git commit`",
        "",
        "Do not use `git add -A` blindly — review what you're staging.",
        "Do not push. Just commit.",
      ].join("\n"));
    },
  });

  pi.registerCommand("commit-push-pr", {
    description: "Commit, push, and open a PR in one shot",
    async handler(_args, _ctx) {
      pi.sendUserMessage([
        "Commit all changes, push, and create a pull request.",
        "",
        "Steps:",
        "1. Check current branch — if on main/master, create a feature branch first",
        "2. Run `git status` and `git diff HEAD`",
        "3. Stage and commit with a concise, imperative message",
        "4. Push the branch to origin: `git push -u origin $(git branch --show-current)`",
        "5. Create PR: `gh pr create --fill` (or with title/body if appropriate)",
        "",
        "If `gh` is not installed, push and report the branch name for manual PR creation.",
      ].join("\n"));
    },
  });

  pi.registerCommand("clean-gone", {
    description: "Delete local branches whose remote tracking branch is gone",
    async handler(_args, _ctx) {
      pi.sendUserMessage([
        "Clean up stale local git branches that have been deleted from the remote.",
        "",
        "Steps:",
        "1. Run `git fetch --prune` to update remote tracking info",
        "2. Run `git branch -v` to list branches with status",
        "3. Find branches marked `[gone]`",
        "4. For each gone branch, check for associated worktrees and remove them",
        "5. Delete each gone branch with `git branch -D`",
        "6. Report what was cleaned up",
        "",
        "If no branches are marked [gone], report that no cleanup was needed.",
      ].join("\n"));
    },
  });
}
