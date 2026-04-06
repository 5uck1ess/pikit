import { describe, it, expect } from "vitest";

// Test the pattern matching logic directly

interface PatternDef {
  readonly pattern: RegExp;
  readonly message: string;
  readonly extensions: ReadonlyArray<string>;
}

const PATTERNS: ReadonlyArray<PatternDef> = [
  { pattern: /\beval\s*\(/, message: "eval()", extensions: [".js", ".ts", ".py"] },
  { pattern: /\.innerHTML\s*=/, message: "innerHTML", extensions: [".js", ".ts"] },
  { pattern: /\bos\.system\s*\(/, message: "os.system()", extensions: [".py"] },
  { pattern: /\bpickle\.loads?\s*\(/, message: "pickle", extensions: [".py"] },
  { pattern: /yaml\.load\s*\([^)]*\)(?!.*Loader)/, message: "yaml.load", extensions: [".py"] },
  { pattern: /(password|secret|api_key|apikey|token)\s*=\s*["'][^"']{8,}["']/, message: "hardcoded secret", extensions: [".js", ".ts", ".py", ".go"] },
  { pattern: /createHash\s*\(\s*['"]md5['"]/, message: "MD5", extensions: [".js", ".ts"] },
  { pattern: /createHash\s*\(\s*['"]sha1['"]/, message: "SHA-1", extensions: [".js", ".ts"] },
];

function checkContent(filePath: string, content: string): string[] {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  const warnings: string[] = [];
  for (const def of PATTERNS) {
    if (!def.extensions.includes(ext)) continue;
    if (def.pattern.test(content)) warnings.push(def.message);
  }
  return warnings;
}

describe("security-patterns", () => {
  it("catches eval() in JS", () => {
    expect(checkContent("foo.js", "const x = eval(input)")).toContain("eval()");
  });

  it("catches eval() in Python", () => {
    expect(checkContent("foo.py", "result = eval(expr)")).toContain("eval()");
  });

  it("catches innerHTML", () => {
    expect(checkContent("foo.ts", 'el.innerHTML = userInput')).toContain("innerHTML");
  });

  it("does not flag innerHTML in Python", () => {
    expect(checkContent("foo.py", 'el.innerHTML = x')).not.toContain("innerHTML");
  });

  it("catches os.system in Python", () => {
    expect(checkContent("foo.py", "os.system('rm -rf /')")).toContain("os.system()");
  });

  it("catches pickle.load in Python", () => {
    expect(checkContent("foo.py", "data = pickle.load(f)")).toContain("pickle");
  });

  it("catches yaml.load without Loader", () => {
    expect(checkContent("foo.py", "yaml.load(data)")).toContain("yaml.load");
  });

  it("allows yaml.safe_load", () => {
    expect(checkContent("foo.py", "yaml.safe_load(data)")).not.toContain("yaml.load");
  });

  it("catches hardcoded secrets", () => {
    const warns = checkContent("foo.ts", 'const password = "superSecret123"');
    expect(warns).toContain("hardcoded secret");
  });

  it("allows env var references", () => {
    const warns = checkContent("foo.ts", "const password = process.env.PASSWORD");
    expect(warns).not.toContain("hardcoded secret");
  });

  it("catches weak hashes", () => {
    expect(checkContent("foo.ts", 'createHash("md5")')).toContain("MD5");
    expect(checkContent("foo.ts", 'createHash("sha1")')).toContain("SHA-1");
  });

  it("allows strong hashes", () => {
    expect(checkContent("foo.ts", 'createHash("sha256")')).toHaveLength(0);
  });
});
