import { execSync } from "node:child_process";
import { type ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * RTK (Rust Token Killer) integration.
 *
 * Uses `rtk rewrite` to transform bash commands into their
 * token-optimized RTK equivalents before execution.
 * Commands without an RTK wrapper run unmodified.
 *
 * Requires: rtk >= 0.23.0 (https://github.com/rtk-ai/rtk)
 */

/** Check if rtk binary exists on PATH */
function checkRtk(): boolean {
  try {
    execSync("rtk --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Rewrite a command to its RTK equivalent, or return null if none exists */
export function rewrite(command: string): string | null {
  try {
    return execSync(`rtk rewrite ${JSON.stringify(command)}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

/** Track rewrite stats */
let totalOriginal = 0;
let totalCompressed = 0;

export function getGains(): { original: number; compressed: number; saved: number; percent: number } {
  const saved = totalOriginal - totalCompressed;
  const percent = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0;
  return { original: totalOriginal, compressed: totalCompressed, saved, percent };
}

export function resetGains(): void {
  totalOriginal = 0;
  totalCompressed = 0;
}

/**
 * Register the RTK hook.
 * Rewrites bash commands to RTK equivalents before execution.
 */
export function registerRtkHook(pi: ExtensionAPI): void {
  if (!checkRtk()) {
    console.error("[pikit] rtk not found. Install: https://github.com/rtk-ai/rtk");
    return;
  }

  pi.on("tool_call", (event, _ctx) => {
    if (event.toolName !== "bash") return;

    const command = event.input?.command as string | undefined;
    if (!command) return;

    const rewritten = rewrite(command);
    if (!rewritten) return;

    totalOriginal++;
    totalCompressed++;

    return { input: { ...event.input, command: rewritten } };
  });

  pi.registerCommand("rtk", {
    description: "Show RTK rewrite stats",
    async handler(_args, ctx) {
      const g = getGains();
      ctx.ui.notify(`RTK: ${g.compressed} commands rewritten`, "info");
    },
  });
}
