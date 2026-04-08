import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Context monitor hook — tracks context window usage and injects warnings
 * when the agent is running low, so it can wrap up or checkpoint.
 *
 * Inspired by GSD's context-monitor pattern. Adapted for pi's extension API.
 *
 * Tiers:
 *   PEAK      (0-30%)  — full operations
 *   GOOD      (30-50%) — normal, prefer concise output
 *   DEGRADING (50-70%) — economize, warn user
 *   POOR      (70-85%) — checkpoint immediately
 *   CRITICAL  (85%+)   — stop, save state
 *
 * Debounce: warns at most once every 5 tool calls per tier.
 * Severity escalation bypasses debounce (e.g., GOOD -> DEGRADING fires immediately).
 *
 * Coordinates with context-prune hook (fires at 60%). This hook provides
 * awareness; context-prune provides mitigation by collapsing old tool results.
 */

export const enum Tier {
  PEAK = "PEAK",
  GOOD = "GOOD",
  DEGRADING = "DEGRADING",
  POOR = "POOR",
  CRITICAL = "CRITICAL",
}

interface TierConfig {
  readonly threshold: number;
  readonly message: string;
}

const TIERS: ReadonlyArray<readonly [Tier, TierConfig]> = [
  [Tier.CRITICAL, { threshold: 85, message: "CRITICAL: Context window nearly full. STOP current work and save state immediately. Summarize progress so the next session can continue." }],
  [Tier.POOR, { threshold: 70, message: "Context window is heavily used. Checkpoint your progress now — commit, write a summary, or note where to resume. Avoid reading large files." }],
  [Tier.DEGRADING, { threshold: 50, message: "Context usage is rising. Keep responses concise, avoid unnecessary file reads, delegate where possible." }],
  [Tier.GOOD, { threshold: 30, message: "" }], // silent tier, no injection
  [Tier.PEAK, { threshold: 0, message: "" }],
];

const DEBOUNCE_CALLS = 5;

export function getTier(percent: number): readonly [Tier, TierConfig] {
  for (const entry of TIERS) {
    if (percent >= entry[1].threshold) return entry;
  }
  return TIERS[TIERS.length - 1];
}

export function registerContextMonitor(pi: ExtensionAPI): void {
  let lastTier: Tier = Tier.PEAK;
  let callsSinceLastWarning = 0;

  pi.on("tool_result", (event, ctx) => {
    const usage = ctx.getContextUsage();
    if (!usage || usage.contextWindow === 0) return;

    const percent = (usage.tokens / usage.contextWindow) * 100;
    const [tier, config] = getTier(percent);

    // No message for low-usage tiers
    if (!config.message) {
      lastTier = tier;
      return;
    }

    callsSinceLastWarning++;

    // Severity escalation bypasses debounce
    const escalated = tier !== lastTier && TIERS.findIndex(([t]) => t === tier) < TIERS.findIndex(([t]) => t === lastTier);
    const shouldWarn = escalated || callsSinceLastWarning >= DEBOUNCE_CALLS;

    if (!shouldWarn) return;

    callsSinceLastWarning = 0;
    lastTier = tier;

    const pct = Math.round(percent);
    const label = `[context-monitor] ${pct}% used — ${config.message}`;

    const existing = event.content ?? [];
    return {
      content: [
        ...existing,
        { type: "text" as const, text: `\n${label}` },
      ],
    };
  });
}
