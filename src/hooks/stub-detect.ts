import { readFileSync } from "node:fs";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Stub detection hook — catches placeholder implementations at write time.
 *
 * "Existence != Implementation" — a file existing does not mean a feature works.
 * This hook detects common stub patterns: TODO markers, placeholder text,
 * empty returns, hardcoded values where dynamic behavior is expected.
 *
 * Complements the verification skill by catching stubs at edit time rather
 * than waiting for a verification pass.
 *
 * Inspired by GSD's verification-patterns reference.
 */

/** Minimum file size to bother scanning (bytes) */
const MIN_FILE_SIZE = 200;

/** Maximum stubs to report per file to avoid noise */
const MAX_REPORTS_PER_FILE = 5;

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".rb", ".java", ".kt",
]);

export interface StubPattern {
  readonly pattern: RegExp;
  readonly message: string;
}

export const STUB_PATTERNS: ReadonlyArray<StubPattern> = [
  // Comment-based stubs
  { pattern: /(?:\/\/|#)\s*(?:TODO|FIXME|XXX|HACK|PLACEHOLDER)\b/i, message: "TODO/FIXME marker left in code" },
  { pattern: /(?:\/\/|#)\s*(?:implement|add later|coming soon|will be)\b/i, message: "deferred implementation marker" },
  { pattern: /(?:\/\/|#)\s*\.\.\.\s*$/, message: "ellipsis comment (placeholder)" },

  // Empty/trivial implementations
  { pattern: /return\s+(?:null|undefined|None|\{\}|\[\])\s*;?\s*$/, message: "function returns empty/null — likely a stub" },
  { pattern: /\bpass\s*$/, message: "Python pass statement — empty implementation" },
  { pattern: /\b(?:throw|raise)\s+.*(?:not\s*implement|todo)/i, message: "NotImplemented throw — stub" },

  // Placeholder text in UI/output
  { pattern: /["'](?:placeholder|lorem ipsum|coming soon|under construction|sample text)["']/i, message: "placeholder text in string literal" },

  // Hardcoded values where dynamic expected
  { pattern: /(?:count|total|length)\s*[:=]\s*\d+\s*[,;]?\s*(?:\/\/|#)\s*(?:hardcoded|temp|static)/i, message: "hardcoded value marked as temporary" },
];

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot) : "";
}

function detectStubs(filePath: string): string | undefined {
  const ext = getExtension(filePath);
  if (!CODE_EXTENSIONS.has(ext)) return;

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  if (content.length < MIN_FILE_SIZE) return;

  const hits: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    if (hits.length >= MAX_REPORTS_PER_FILE) break;
    for (const { pattern, message } of STUB_PATTERNS) {
      if (pattern.test(line)) {
        hits.push(message);
        break; // one hit per line
      }
    }
  }

  if (hits.length === 0) return;

  const unique = [...new Set(hits)];
  return `Stub patterns in ${filePath}: ${unique.join("; ")}`;
}

export function registerStubDetect(pi: ExtensionAPI): void {
  pi.on("tool_result", (event, _ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const filePath = (event.input as { path?: string }).path;
    if (!filePath) return;

    const warning = detectStubs(filePath);
    if (warning) {
      const existing = event.content ?? [];
      return {
        content: [
          ...existing,
          { type: "text" as const, text: `\n[stub-detect] ${warning}` },
        ],
      };
    }
  });
}
