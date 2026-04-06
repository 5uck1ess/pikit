import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Output compression hook — strips noise from tool results before they hit context.
 *
 * Targets the biggest token sinks:
 * 1. Bash output: strips ANSI codes, deduplicates repeated lines, truncates huge output
 * 2. Test output: collapses passing tests into a summary, keeps failures verbose
 * 3. npm/yarn install: strips progress bars and download lines
 */

/** Strip ANSI escape codes */
function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

/** Collapse consecutive duplicate lines */
function deduplicateLines(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let lastLine = "";
  let dupeCount = 0;

  for (const line of lines) {
    if (line === lastLine) {
      dupeCount++;
    } else {
      if (dupeCount > 0) {
        result.push(`  ... (${dupeCount} identical lines omitted)`);
      }
      result.push(line);
      lastLine = line;
      dupeCount = 0;
    }
  }
  if (dupeCount > 0) {
    result.push(`  ... (${dupeCount} identical lines omitted)`);
  }

  return result.join("\n");
}

/** Compress test output: summarize passing, keep failing verbose */
function compressTestOutput(text: string): string {
  const lines = text.split("\n");
  const passing: string[] = [];
  const other: string[] = [];

  for (const line of lines) {
    // Common test pass patterns across frameworks
    if (/^\s*(PASS|✓|✅|ok\s+\d|\.{3,}$|\s+\d+ passing)/.test(line)) {
      passing.push(line);
    } else {
      other.push(line);
    }
  }

  if (passing.length > 10) {
    // Collapse verbose pass output
    const summary = `  (${passing.length} passing test lines collapsed)`;
    return [...other, summary].join("\n");
  }

  return text;
}

/** Strip npm/yarn install noise */
function compressInstallOutput(text: string): string {
  const lines = text.split("\n");
  return lines
    .filter((line) => {
      // Strip progress bars, download indicators, timing
      if (/^\s*(⸩|⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏|npm http|fetching|resolving|reifying)/.test(line)) return false;
      if (/^\s*$/.test(line)) return false;
      if (/^(added|removed|updated) \d+ packages? in/.test(line)) return true;
      if (/^(npm warn|npm ERR)/.test(line)) return true;
      return !/(progress|ETA|downloading|⣾|⣽|⣻|⢿|⡿|⣟|⣯|⣷)/.test(line);
    })
    .join("\n");
}

const LARGE_OUTPUT_THRESHOLD = 50_000; // ~12.5k tokens
const TRUNCATE_TO = 20_000; // ~5k tokens

export function registerOutputCompress(pi: ExtensionAPI): void {
  pi.on("tool_result", (event, _ctx) => {
    if (event.toolName !== "bash") return;

    const content = event.content;
    if (!content || !Array.isArray(content)) return;

    let modified = false;
    const newContent = content.map((block) => {
      if (block.type !== "text") return block;
      let text = block.text ?? "";
      const originalLen = text.length;

      // Strip ANSI
      text = stripAnsi(text);

      // Detect and compress specific patterns
      if (/npm install|yarn add|pnpm install|bun install/.test(text)) {
        text = compressInstallOutput(text);
      } else if (/PASS|FAIL|✓|✗|test.*passing|tests? ran/i.test(text)) {
        text = compressTestOutput(text);
      }

      // Deduplicate repeated lines
      text = deduplicateLines(text);

      // Hard truncate if still huge
      if (text.length > LARGE_OUTPUT_THRESHOLD) {
        const head = text.slice(0, TRUNCATE_TO / 2);
        const tail = text.slice(-TRUNCATE_TO / 2);
        const omitted = text.length - TRUNCATE_TO;
        text = `${head}\n\n... (${omitted} chars omitted) ...\n\n${tail}`;
      }

      if (text.length < originalLen) modified = true;
      return { ...block, text };
    });

    if (modified) {
      return { content: newContent };
    }
  });
}
