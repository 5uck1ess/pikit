import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * RTK (Rust Token Killer) integration.
 *
 * Intercepts shell command output and pipes it through `rtk compress`
 * to reduce token usage by 60-90% before it enters the context window.
 *
 * Requires: rtk >= 0.23.0 (https://github.com/rtk-ai/rtk)
 */

/** Check if rtk is available on PATH */
function isRtkAvailable(): boolean {
  try {
    execSync("rtk --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Compress text through rtk */
export function compress(text: string): string {
  try {
    return execSync("rtk compress", {
      input: text,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return text;
  }
}

/** Track cumulative savings */
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
 * Wraps bash command results — compresses output before it enters context.
 */
export function registerRtkHook(pi: ExtensionAPI): void {
  if (!isRtkAvailable()) {
    console.error("[pikit] rtk not found. Install: https://github.com/rtk-ai/rtk");
    return;
  }

  pi.on("bash_result", (event) => {
    const output = event.result;
    if (!output || output.length < 200) return;

    const compressed = compress(output);
    totalOriginal += output.length;
    totalCompressed += compressed.length;
    event.result = compressed;
  });

  pi.registerCommand({
    name: "rtk",
    description: "Show RTK token compression stats",
    async execute(_args, _ctx) {
      const g = getGains();
      return [
        `RTK Compression Stats`,
        `  Original:   ${(g.original / 1024).toFixed(1)} KB`,
        `  Compressed: ${(g.compressed / 1024).toFixed(1)} KB`,
        `  Saved:      ${(g.saved / 1024).toFixed(1)} KB (${g.percent}%)`,
      ].join("\n");
    },
  });
}
