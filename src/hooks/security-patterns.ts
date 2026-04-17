import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Security patterns hook — catches vulnerability patterns at edit time.
 *
 * Ported from devkit's security-patterns.sh.
 * Warns once per file+pattern per session to avoid spam.
 */

interface PatternDef {
  readonly pattern: RegExp;
  readonly message: string;
  readonly extensions: ReadonlyArray<string>;
}

const PATTERNS: ReadonlyArray<PatternDef> = [
  // JS/TS patterns
  { pattern: /\beval\s*\(/, message: "eval() is a code injection risk", extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"] },
  { pattern: /\.innerHTML\s*=/, message: "innerHTML assignment — XSS risk. Use textContent or a sanitizer", extensions: [".js", ".jsx", ".ts", ".tsx"] },
  { pattern: /document\.write\s*\(/, message: "document.write — XSS risk", extensions: [".js", ".jsx", ".ts", ".tsx"] },
  { pattern: /\bnew Function\s*\(/, message: "new Function() is equivalent to eval()", extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"] },

  // Python patterns
  { pattern: /\beval\s*\(/, message: "eval() is a code injection risk", extensions: [".py"] },
  { pattern: /\bexec\s*\(/, message: "exec() is a code injection risk", extensions: [".py"] },
  { pattern: /\bos\.system\s*\(/, message: "os.system() — use subprocess with shell=False", extensions: [".py"] },
  { pattern: /\bpickle\.loads?\s*\(/, message: "pickle deserialization of untrusted data is dangerous", extensions: [".py"] },
  { pattern: /yaml\.load\s*\([^)]*\)(?!.*Loader)/, message: "yaml.load without Loader — use yaml.safe_load", extensions: [".py"] },

  // Shell injection (any language)
  { pattern: /child_process.*exec\s*\(/, message: "child_process.exec with string — use execFile or spawn", extensions: [".js", ".ts", ".mjs", ".cjs"] },

  // Weak crypto
  { pattern: /\b(md5|sha1)\s*\(/, message: "weak hash algorithm — use SHA-256+", extensions: [".js", ".ts", ".py", ".go", ".rs"] },
  { pattern: /createHash\s*\(\s*['"]md5['"]/, message: "MD5 is cryptographically broken", extensions: [".js", ".ts", ".mjs", ".cjs"] },
  { pattern: /createHash\s*\(\s*['"]sha1['"]/, message: "SHA-1 is cryptographically broken", extensions: [".js", ".ts", ".mjs", ".cjs"] },

  // Hardcoded secrets
  { pattern: /(password|secret|api_key|apikey|token)\s*=\s*["'][^"']{8,}["']/, message: "possible hardcoded secret — use environment variables", extensions: [".js", ".ts", ".py", ".go", ".rs", ".mjs", ".cjs"] },

  // Path traversal
  { pattern: /(readFile|writeFile|open|join|resolve)\s*\([^)]*\.\.\// , message: "path traversal in file operation — validate and sanitize paths", extensions: [".js", ".ts", ".py", ".go", ".rs"] },

  // Go patterns
  { pattern: /\bexec\.Command\s*\(\s*["']sh["']/, message: "exec.Command with shell — use direct command", extensions: [".go"] },
] as const;

const seen = new Set<string>();

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot) : "";
}

function checkContent(filePath: string, content: string): string | undefined {
  const ext = getExtension(filePath);
  if (!ext) return;

  const warnings: string[] = [];

  for (const def of PATTERNS) {
    if (!def.extensions.includes(ext)) continue;
    if (!def.pattern.test(content)) continue;

    const key = `${filePath}:${def.message}`;
    if (seen.has(key)) continue;
    seen.add(key);

    warnings.push(def.message);
  }

  return warnings.length > 0
    ? `Security warning in ${filePath}: ${warnings.join("; ")}`
    : undefined;
}

export function registerSecurityPatterns(pi: ExtensionAPI): void {
  pi.on("tool_result", (event, _ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const input = event.input as { path?: string; content?: string; edits?: Array<{ newText?: string }> };
    const filePath = input.path ?? "";
    const content = event.toolName === "write"
      ? (input.content ?? "")
      : (input.edits ?? []).map((e) => e.newText ?? "").join("\n");

    const warning = checkContent(filePath, content);
    if (warning) {
      const existing = event.content ?? [];
      return {
        content: [
          ...existing,
          { type: "text" as const, text: `\n[security] ${warning}` },
        ],
      };
    }
  });
}
