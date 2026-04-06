import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Language-aware code quality review hook.
 *
 * Ported from devkit's lang-review.sh.
 * Detects language from file extension and runs appropriate checks on edit/write content.
 */

interface LangCheck {
  readonly pattern: RegExp;
  readonly message: string;
}

const GO_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /if err != nil\s*\{[^}]*\}\s*\n\s*\w+\.\w+/, message: "accessing result after error check without return — value may be invalid" },
  { pattern: /go func.*\bmap\[/, message: "goroutine accessing map — maps are not safe for concurrent use without sync.Mutex or sync.Map" },
  { pattern: /return nil, nil/, message: "returning nil error with nil result — caller can't distinguish success from failure" },
  { pattern: /filepath\.(Join|Clean)\(.*\.\./, message: "path traversal risk — validate that resolved path stays within expected directory" },
];

const TS_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/, message: "empty catch block — handle the error or add a comment explaining why it's safe to ignore" },
  { pattern: /:\s*any\b/, message: "any type — use unknown and narrow, or define a proper type" },
  { pattern: /new Promise\b(?!.*\bcatch\b)/, message: "unhandled promise — ensure .catch() or try/catch wraps this" },
];

const RUST_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /\.unwrap\(\)/, message: "unwrap() in non-test code — use ? or handle the error" },
  { pattern: /let\s+_\s*=\s*\w+/, message: "let _ = discards a value — ensure this is intentional" },
  { pattern: /unsafe\s*\{/, message: "unsafe block — document the safety invariants" },
];

const PYTHON_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /except\s*:/, message: "bare except catches everything including KeyboardInterrupt — specify exception type" },
  { pattern: /except\s+\w+.*:\s*\n\s*pass\s*$/, message: "except: pass silently swallows errors" },
  { pattern: /def\s+\w+\([^)]*=\s*(\[\]|\{\}|set\(\))/, message: "mutable default argument — use None and create inside function" },
];

const SHELL_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /grep\s+-P/, message: "grep -P (Perl regex) not available on macOS — use grep -E" },
  { pattern: /sed\s+-i\s+[^'"]/, message: "sed -i without '' on macOS — use sed -i '' or ensure GNU sed" },
  { pattern: /readlink\s+-f/, message: "readlink -f not on macOS — use realpath or python -c" },
  { pattern: /\bstat\s+--format/, message: "stat --format is GNU — macOS uses stat -f" },
  { pattern: /\btimeout\s+/, message: "timeout not on macOS by default — install coreutils or use alternative" },
];

const LANG_MAP: ReadonlyMap<string, ReadonlyArray<LangCheck>> = new Map([
  [".go", GO_CHECKS],
  [".ts", TS_CHECKS],
  [".tsx", TS_CHECKS],
  [".js", TS_CHECKS],
  [".jsx", TS_CHECKS],
  [".mjs", TS_CHECKS],
  [".cjs", TS_CHECKS],
  [".rs", RUST_CHECKS],
  [".py", PYTHON_CHECKS],
  [".sh", SHELL_CHECKS],
  [".bash", SHELL_CHECKS],
]);

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot) : "";
}

function reviewContent(filePath: string, content: string): string | undefined {
  const ext = getExtension(filePath);
  const checks = LANG_MAP.get(ext);
  if (!checks) return;

  // Skip test files for some checks (e.g., unwrap in Rust tests is fine)
  const isTest = /[._]test\.|_test\.|\btest_|tests?\//i.test(filePath);

  const warnings: string[] = [];
  for (const check of checks) {
    // Allow unwrap() and unsafe in test files
    if (isTest && ext === ".rs" && (check.message.includes("unwrap()") || check.message.includes("unsafe"))) {
      continue;
    }
    if (check.pattern.test(content)) {
      warnings.push(check.message);
    }
  }

  return warnings.length > 0
    ? `[lang-review] ${filePath}: ${warnings.join("; ")}`
    : undefined;
}

export function registerLangReview(pi: ExtensionAPI): void {
  // Append warnings to tool result so the LLM sees them after write/edit
  pi.on("tool_result", (event, _ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const input = event.input as { path?: string; content?: string; edits?: Array<{ newText?: string }> };
    const filePath = input.path ?? "";
    let content = input.content ?? "";

    if (event.toolName === "edit" && input.edits) {
      content = input.edits.map((e) => e.newText ?? "").join("\n");
    }

    const warning = reviewContent(filePath, content);
    if (warning) {
      const existing = event.content ?? [];
      return {
        content: [
          ...existing,
          { type: "text" as const, text: `\n${warning}` },
        ],
      };
    }
  });
}
