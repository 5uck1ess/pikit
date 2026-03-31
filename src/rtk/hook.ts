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

/** Check if rtk binary exists on PATH */
function checkRtk(): boolean {
  try {
    execSync("rtk --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Shrink text through rtk compression */
export function shrink(text: string): string {
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

/** Per-step compression record */
interface CompressionEntry {
  stepId: string;
  original: number;
  compressed: number;
  timestamp: number;
}

/** Track cumulative and per-step savings */
let totalOriginal = 0;
let totalCompressed = 0;
const history: CompressionEntry[] = [];

export function getGains(): { original: number; compressed: number; saved: number; percent: number } {
  const saved = totalOriginal - totalCompressed;
  const percent = totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0;
  return { original: totalOriginal, compressed: totalCompressed, saved, percent };
}

/** Record compression for a specific workflow step */
export function recordStepCompression(stepId: string, original: number, compressed: number): void {
  history.push({ stepId, original, compressed, timestamp: Date.now() });
}

/** Get per-step compression breakdown */
export function getStepBreakdown(): Array<{ stepId: string; original: number; compressed: number; saved: number; percent: number }> {
  const byStep = new Map<string, { original: number; compressed: number }>();
  for (const entry of history) {
    const existing = byStep.get(entry.stepId) ?? { original: 0, compressed: 0 };
    existing.original += entry.original;
    existing.compressed += entry.compressed;
    byStep.set(entry.stepId, existing);
  }
  return Array.from(byStep.entries()).map(([stepId, { original, compressed }]) => {
    const saved = original - compressed;
    const percent = original > 0 ? Math.round((saved / original) * 100) : 0;
    return { stepId, original, compressed, saved, percent };
  });
}

export function resetGains(): void {
  totalOriginal = 0;
  totalCompressed = 0;
  history.length = 0;
}

/**
 * Register the RTK hook.
 * Wraps bash command results — compresses output before it enters context.
 */
export function registerRtkHook(pi: ExtensionAPI): void {
  if (!checkRtk()) {
    console.error("[pikit] rtk not found. Install: https://github.com/rtk-ai/rtk");
    return;
  }

  pi.on("bash_result", (event) => {
    const output = event.result;
    if (!output || output.length < 200) return;

    const compressed = shrink(output);
    totalOriginal += output.length;
    totalCompressed += compressed.length;
    event.result = compressed;
  });

  pi.registerCommand({
    name: "rtk",
    description: "Show RTK token compression stats. Use --steps for per-step breakdown.",
    async execute(args, _ctx) {
      const g = getGains();
      const lines = [
        `RTK Compression Stats`,
        `  Original:   ${(g.original / 1024).toFixed(1)} KB`,
        `  Compressed: ${(g.compressed / 1024).toFixed(1)} KB`,
        `  Saved:      ${(g.saved / 1024).toFixed(1)} KB (${g.percent}%)`,
      ];

      if (args?.includes("--steps")) {
        const breakdown = getStepBreakdown();
        if (breakdown.length > 0) {
          lines.push("", "Per-step breakdown:");
          for (const s of breakdown) {
            lines.push(`  ${s.stepId}: ${(s.saved / 1024).toFixed(1)} KB saved (${s.percent}%)`);
          }
        }
      }

      return lines.join("\n");
    },
  });
}
