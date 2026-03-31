import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as store from "../memory/store.js";
import { getCwd } from "../core/context.js";

interface QAPair {
  question: string;
  answer: string;
}

/**
 * Scan text for Q&A patterns and extract structured pairs.
 * Looks for patterns like:
 *   Q: ... / A: ...
 *   **Q:** ... / **A:** ...
 *   Question: ... / Answer: ...
 */
export function parseQAPairs(text: string): QAPair[] {
  const pairs: QAPair[] = [];
  const pattern = /(?:\*{0,2}(?:Q|Question)\s*:\*{0,2})\s*(.+?)(?:\n\s*(?:\*{0,2}(?:A|Answer)\s*:\*{0,2})\s*(.+?)(?=\n\s*(?:\*{0,2}(?:Q|Question)\s*:)|$))/gs;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    pairs.push({
      question: match[1].trim(),
      answer: match[2].trim(),
    });
  }
  return pairs;
}

/**
 * Register answer extraction hook.
 * After each assistant message, scans for Q&A and stores in the "qa" store.
 */
export function registerAnswerExtraction(pi: ExtensionAPI): void {
  pi.on("assistant_message", (event) => {
    const text = event.message;
    if (!text) return;

    const pairs = parseQAPairs(text);
    if (pairs.length === 0) return;

    const cwd = getCwd(event);
    for (const pair of pairs) {
      store.set(cwd, "qa", pair.question, pair.answer);
    }
  });
}
