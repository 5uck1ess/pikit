import { describe, it, expect } from "vitest";

interface LangCheck {
  readonly pattern: RegExp;
  readonly message: string;
}

const GO_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /return nil, nil/, message: "nil-error return" },
  { pattern: /filepath\.(Join|Clean)\(.*\.\./, message: "path traversal" },
];

const TS_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/, message: "empty catch" },
  { pattern: /:\s*any\b/, message: "any type" },
];

const RUST_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /\.unwrap\(\)/, message: "unwrap()" },
  { pattern: /unsafe\s*\{/, message: "unsafe block" },
];

const PYTHON_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /except\s*:/, message: "bare except" },
  { pattern: /def\s+\w+\([^)]*=\s*(\[\]|\{\}|set\(\))/, message: "mutable default" },
];

const SHELL_CHECKS: ReadonlyArray<LangCheck> = [
  { pattern: /grep\s+-P/, message: "grep -P" },
  { pattern: /sed\s+-i\s+[^'"]/, message: "sed -i" },
  { pattern: /readlink\s+-f/, message: "readlink -f" },
];

const LANG_MAP: Record<string, ReadonlyArray<LangCheck>> = {
  ".go": GO_CHECKS,
  ".ts": TS_CHECKS,
  ".js": TS_CHECKS,
  ".rs": RUST_CHECKS,
  ".py": PYTHON_CHECKS,
  ".sh": SHELL_CHECKS,
};

function review(filePath: string, content: string): string[] {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  const checks = LANG_MAP[ext];
  if (!checks) return [];
  return checks.filter((c) => c.pattern.test(content)).map((c) => c.message);
}

describe("lang-review: Go", () => {
  it("catches nil-error returns", () => {
    expect(review("main.go", "return nil, nil")).toContain("nil-error return");
  });

  it("catches path traversal", () => {
    expect(review("main.go", 'filepath.Join(dir, "../secret")')).toContain("path traversal");
  });
});

describe("lang-review: TypeScript", () => {
  it("catches empty catch blocks", () => {
    expect(review("app.ts", "catch (e) {}")).toContain("empty catch");
  });

  it("catches any type", () => {
    expect(review("app.ts", "const x: any = 5")).toContain("any type");
  });

  it("applies same checks to .js", () => {
    expect(review("app.js", "catch (e) {}")).toContain("empty catch");
  });
});

describe("lang-review: Rust", () => {
  it("catches unwrap in non-test code", () => {
    expect(review("main.rs", "let x = result.unwrap()")).toContain("unwrap()");
  });

  it("catches unsafe blocks", () => {
    expect(review("main.rs", "unsafe { ptr::read(p) }")).toContain("unsafe block");
  });
});

describe("lang-review: Python", () => {
  it("catches bare except", () => {
    expect(review("app.py", "except:")).toContain("bare except");
  });

  it("catches mutable default arguments", () => {
    expect(review("app.py", "def foo(items=[])")).toContain("mutable default");
    expect(review("app.py", "def bar(data={})")).toContain("mutable default");
  });
});

describe("lang-review: Shell", () => {
  it("catches grep -P (not on macOS)", () => {
    expect(review("run.sh", "grep -P '\\d+'")).toContain("grep -P");
  });

  it("catches sed -i without '' (macOS issue)", () => {
    expect(review("run.sh", "sed -i s/old/new/ file")).toContain("sed -i");
  });

  it("catches readlink -f", () => {
    expect(review("run.sh", "readlink -f /tmp/link")).toContain("readlink -f");
  });

  it("allows grep -E", () => {
    expect(review("run.sh", "grep -E '\\d+'")).toHaveLength(0);
  });
});

describe("lang-review: unknown extensions", () => {
  it("returns empty for unrecognized files", () => {
    expect(review("readme.md", "catch (e) {}")).toEqual([]);
    expect(review("data.json", "eval(x)")).toEqual([]);
  });
});
