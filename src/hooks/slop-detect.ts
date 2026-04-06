import { readFileSync } from "node:fs";
import { type ExtensionAPI, isToolCallEventType } from "@mariozechner/pi-coding-agent";

/**
 * Slop detection hook — catches AI-generated code patterns.
 *
 * Ported from devkit's slop-detect.sh.
 * Detects excessive documentation ratios and restating comments.
 */

const JS_TS_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const PYTHON_EXTENSIONS = new Set([".py"]);

/** Comments that just restate the code */
const RESTATING_PATTERNS: ReadonlyArray<RegExp> = [
  /\/\/\s*(set|get|return|create|initialize|import|export|define|declare)\s+(the\s+)?/i,
  /\/\/\s*This (function|method|class|variable|constant) /i,
  /#\s*(set|get|return|create|initialize|import|export|define|declare)\s+(the\s+)?/i,
  /#\s*This (function|method|class|variable|constant) /i,
];

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot) : "";
}

function analyzeFile(filePath: string): string | undefined {
  const ext = getExtension(filePath);
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return;
  }

  const lines = content.split("\n");
  const totalLines = lines.length;
  if (totalLines < 20) return; // skip tiny files

  const warnings: string[] = [];

  // Doc/code ratio check for JS/TS
  if (JS_TS_EXTENSIONS.has(ext)) {
    const docLines = lines.filter((l) => /^\s*(\*|\/\*\*|\/\/\/|\s*\*)/.test(l)).length;
    const blankLines = lines.filter((l) => /^\s*$/.test(l)).length;
    const codeLines = totalLines - docLines - blankLines;
    if (codeLines > 0 && docLines / codeLines > 1.5) {
      warnings.push(`doc/code ratio is ${(docLines / codeLines).toFixed(1)}:1 — more docs than code`);
    }
  }

  // Doc/code ratio check for Python
  if (PYTHON_EXTENSIONS.has(ext)) {
    const docLines = lines.filter((l) => /^\s*("""|'''|#)/.test(l)).length;
    const blankLines = lines.filter((l) => /^\s*$/.test(l)).length;
    const codeLines = totalLines - docLines - blankLines;
    if (codeLines > 0 && docLines / codeLines > 1.5) {
      warnings.push(`doc/code ratio is ${(docLines / codeLines).toFixed(1)}:1 — more docs than code`);
    }
  }

  // Restating comments
  let restating = 0;
  for (const line of lines) {
    for (const pattern of RESTATING_PATTERNS) {
      if (pattern.test(line)) {
        restating++;
        break;
      }
    }
  }
  if (restating > 5) {
    warnings.push(`${restating} comments that restate the code — remove or make them useful`);
  }

  return warnings.length > 0
    ? `Slop detected in ${filePath}: ${warnings.join("; ")}`
    : undefined;
}

export function registerSlopDetect(pi: ExtensionAPI): void {
  pi.on("tool_result", (event, _ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const filePath = (event.input as { path?: string }).path;
    if (!filePath) return;

    const warning = analyzeFile(filePath);
    if (warning) {
      const existing = event.content ?? [];
      return {
        content: [
          ...existing,
          { type: "text" as const, text: `\n[slop-detect] ${warning}` },
        ],
      };
    }
  });
}
