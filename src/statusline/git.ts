import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const STATUS_KEY = "pikit-git";

interface GitInfo {
  branch: string;
  dirty: number;
  staged: number;
  untracked: number;
  ahead: number;
  behind: number;
}

async function getGitInfo(pi: ExtensionAPI, cwd: string): Promise<GitInfo | null> {
  const check = await pi.exec("git", ["rev-parse", "--git-dir"], { cwd, timeout: 3000 });
  if (check.code !== 0) return null;

  const [branchResult, statusResult, aheadBehindResult] = await Promise.all([
    pi.exec("git", ["branch", "--show-current"], { cwd, timeout: 3000 }),
    pi.exec("git", ["status", "--porcelain"], { cwd, timeout: 3000 }),
    pi.exec("git", ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], { cwd, timeout: 3000 }),
  ]);

  const branch = branchResult.stdout.trim() || "HEAD";

  let staged = 0;
  let dirty = 0;
  let untracked = 0;
  for (const line of statusResult.stdout.split("\n")) {
    if (!line) continue;
    const x = line[0];
    const y = line[1];
    if (x === "?") {
      untracked++;
    } else {
      if (x !== " " && x !== "?") staged++;
      if (y !== " " && y !== "?") dirty++;
    }
  }

  let ahead = 0;
  let behind = 0;
  if (aheadBehindResult.code === 0) {
    const parts = aheadBehindResult.stdout.trim().split(/\s+/);
    ahead = parseInt(parts[0] ?? "0", 10) || 0;
    behind = parseInt(parts[1] ?? "0", 10) || 0;
  }

  return { branch, dirty, staged, untracked, ahead, behind };
}

function formatStatus(info: GitInfo, theme: { fg: (color: string, text: string) => string }): string {
  const parts: string[] = [];

  parts.push(theme.fg("accent", info.branch));

  const counts: string[] = [];
  if (info.staged > 0) counts.push(theme.fg("success", `+${info.staged}`));
  if (info.dirty > 0) counts.push(theme.fg("warning", `~${info.dirty}`));
  if (info.untracked > 0) counts.push(theme.fg("dim", `?${info.untracked}`));
  if (counts.length > 0) parts.push(counts.join(" "));

  const arrows: string[] = [];
  if (info.ahead > 0) arrows.push(theme.fg("success", `↑${info.ahead}`));
  if (info.behind > 0) arrows.push(theme.fg("error", `↓${info.behind}`));
  if (arrows.length > 0) parts.push(arrows.join(" "));

  return parts.join(" ");
}

export function registerStatusline(pi: ExtensionAPI): void {
  const update = async (ctx: { cwd: string; ui: { setStatus: (key: string, text: string) => void; theme: { fg: (color: string, text: string) => string } } }): Promise<void> => {
    const info = await getGitInfo(pi, ctx.cwd);
    if (info) {
      ctx.ui.setStatus(STATUS_KEY, formatStatus(info, ctx.ui.theme));
    } else {
      ctx.ui.setStatus(STATUS_KEY, "");
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    await update(ctx);
  });

  pi.on("session_switch", async (_event, ctx) => {
    await update(ctx);
  });

  pi.on("tool_execution_end", async (event, ctx) => {
    // Refresh after tools that likely change git state
    if (event.toolName === "bash" || event.toolName === "write" || event.toolName === "edit") {
      await update(ctx);
    }
  });
}
