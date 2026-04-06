import { describe, it, expect, vi } from "vitest";

// We can't easily test the full pi extension registration, but we can test the pattern matching logic
// by extracting and testing the patterns directly

const BLOCKED_BASH_PATTERNS: Array<[RegExp, string]> = [
  [/(^|[;&|]\s*)rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|--force\s+)?(\/\s*$|\/\s+|~\s|~\/|\$HOME\b)/, "destructive rm"],
  [/rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+\.\s*$/, "rm -rf ."],
  [/DROP\s+(TABLE|DATABASE)\b/i, "SQL DROP"],
  [/\bdd\b.*\bof=\/dev\/(sd|hd|nvme|vd|xvd)/, "dd to disk"],
  [/\bmkfs\b.*\/dev\//, "mkfs"],
];

const RISKY_BASH_PATTERNS: Array<[RegExp, string]> = [
  [/git\s+push\s+.*--force.*\s+(main|master)\b|git\s+push\s+.*\s+(main|master)\s+.*--force/, "force push"],
  [/git\s+reset\s+--hard/, "git reset --hard"],
  [/chmod\s+777/, "chmod 777"],
  [/curl\s.*\|\s*(ba)?sh/, "curl pipe to shell"],
];

const BLOCKED_WRITE_PATTERNS: Array<[RegExp, string]> = [
  [/-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, "private key"],
];

function matchesBlocked(command: string): string | null {
  for (const [pattern, message] of BLOCKED_BASH_PATTERNS) {
    if (pattern.test(command)) return message;
  }
  return null;
}

function matchesRisky(command: string): string | null {
  for (const [pattern, message] of RISKY_BASH_PATTERNS) {
    if (pattern.test(command)) return message;
  }
  return null;
}

function matchesWriteBlocked(content: string): string | null {
  for (const [pattern, message] of BLOCKED_WRITE_PATTERNS) {
    if (pattern.test(content)) return message;
  }
  return null;
}

describe("safety-check: blocked commands", () => {
  it("blocks rm -rf /", () => {
    expect(matchesBlocked("rm -rf /")).toBeTruthy();
  });

  it("blocks rm -rf ~", () => {
    expect(matchesBlocked("rm -rf ~/")).toBeTruthy();
  });

  it("blocks rm -rf .", () => {
    expect(matchesBlocked("rm -rf .")).toBeTruthy();
  });

  it("blocks DROP TABLE", () => {
    expect(matchesBlocked("DROP TABLE users")).toBeTruthy();
  });

  it("blocks DROP DATABASE", () => {
    expect(matchesBlocked("drop database prod")).toBeTruthy();
  });

  it("blocks dd to disk device", () => {
    expect(matchesBlocked("dd if=/dev/zero of=/dev/sda bs=1M")).toBeTruthy();
  });

  it("allows normal rm", () => {
    expect(matchesBlocked("rm -rf node_modules")).toBeNull();
  });

  it("allows normal git rm", () => {
    expect(matchesBlocked("git rm src/old-file.ts")).toBeNull();
  });

  it("allows normal commands", () => {
    expect(matchesBlocked("ls -la")).toBeNull();
    expect(matchesBlocked("npm test")).toBeNull();
    expect(matchesBlocked("go build ./...")).toBeNull();
  });
});

describe("safety-check: risky commands", () => {
  it("flags force push to main", () => {
    expect(matchesRisky("git push --force origin main")).toBeTruthy();
  });

  it("flags git reset --hard", () => {
    expect(matchesRisky("git reset --hard HEAD~3")).toBeTruthy();
  });

  it("flags chmod 777", () => {
    expect(matchesRisky("chmod 777 /tmp/dir")).toBeTruthy();
  });

  it("flags curl piped to sh", () => {
    expect(matchesRisky("curl https://example.com/install.sh | sh")).toBeTruthy();
    expect(matchesRisky("curl -sL https://example.com | bash")).toBeTruthy();
  });

  it("allows normal git push", () => {
    expect(matchesRisky("git push origin feature/auth")).toBeNull();
  });

  it("allows normal git reset", () => {
    expect(matchesRisky("git reset HEAD file.ts")).toBeNull();
  });
});

describe("safety-check: write blocking", () => {
  it("blocks private keys", () => {
    expect(matchesWriteBlocked("-----BEGIN RSA PRIVATE KEY-----\nMIIE...")).toBeTruthy();
    expect(matchesWriteBlocked("-----BEGIN PRIVATE KEY-----\nMIIE...")).toBeTruthy();
    expect(matchesWriteBlocked("-----BEGIN OPENSSH PRIVATE KEY-----\nb3B...")).toBeTruthy();
  });

  it("allows normal content", () => {
    expect(matchesWriteBlocked("export const API_KEY = process.env.API_KEY;")).toBeNull();
    expect(matchesWriteBlocked("-----BEGIN PUBLIC KEY-----")).toBeNull();
  });
});
