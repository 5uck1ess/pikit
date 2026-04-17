import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Context pruning hook — reduces token usage by trimming old tool results.
 *
 * Strategy:
 * - On each LLM call, check context size
 * - When above threshold, collapse old tool results to summaries
 * - Keep recent results (last 5 turns) intact
 * - Keep all user/assistant messages intact (only prune tool results)
 *
 * This is a lightweight alternative to full compaction — it buys
 * extra turns before compaction kicks in.
 */

const PRUNE_THRESHOLD_PERCENT = 60; // Start pruning at 60% context usage
const KEEP_RECENT_TURNS = 5; // Never prune the last N turns

export function registerContextPrune(pi: ExtensionAPI): void {
  pi.on("context", (event, ctx) => {
    const usage = ctx.getContextUsage();
    if (!usage) return;

    const percent = (usage.tokens / usage.contextWindow) * 100;
    if (percent < PRUNE_THRESHOLD_PERCENT) return;

    const messages = event.messages;
    if (!messages || messages.length === 0) return;

    // Count turns from the end to preserve recent ones
    let turnCount = 0;

    // Walk backwards counting assistant messages as turns
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === "message" && msg.message?.role === "assistant") {
        turnCount++;
        if (turnCount >= KEEP_RECENT_TURNS) {
          // Everything before this index is eligible for pruning
          pruneToolResults(messages, i);
          return { messages };
        }
      }
    }
  });
}

interface PrunableMessage {
  type?: string;
  message?: {
    role?: string;
    content?: Array<{ type: string; text?: string }>;
  };
}

function pruneToolResults(messages: PrunableMessage[], beforeIndex: number): void {
  for (let i = 0; i < beforeIndex; i++) {
    const msg = messages[i];
    if (msg.type !== "message") continue;
    if (msg.message?.role !== "toolResult") continue;

    const content = msg.message.content;
    if (!Array.isArray(content)) continue;

    for (let j = 0; j < content.length; j++) {
      const block = content[j];
      if (block.type === "text" && block.text && block.text.length > 500) {
        const firstLine = block.text.split("\n")[0].slice(0, 100);
        content[j] = {
          type: "text",
          text: `[pruned: ${block.text.length} chars] ${firstLine}...`,
        };
      }
    }
  }
}
