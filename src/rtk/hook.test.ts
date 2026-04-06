import { describe, it, expect, beforeEach, vi } from "vitest";
import { getGains, resetGains, rewrite } from "./hook.js";
import * as childProcess from "node:child_process";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

const mockExecSync = vi.mocked(childProcess.execSync);

describe("RTK stats tracking", () => {
  beforeEach(() => {
    resetGains();
  });

  it("starts with zero gains", () => {
    const g = getGains();
    expect(g.original).toBe(0);
    expect(g.compressed).toBe(0);
    expect(g.saved).toBe(0);
    expect(g.percent).toBe(0);
  });

  it("resets gains cleanly", () => {
    resetGains();
    const g = getGains();
    expect(g.original).toBe(0);
  });
});

describe("rtk rewrite", () => {
  beforeEach(() => {
    mockExecSync.mockReset();
  });

  it("rewrites known commands", () => {
    mockExecSync.mockReturnValue("rtk git status");
    const result = rewrite("git status");
    expect(result).toBe("rtk git status");
  });

  it("rewrites ls", () => {
    mockExecSync.mockReturnValue("rtk ls -la");
    const result = rewrite("ls -la");
    expect(result).toBe("rtk ls -la");
  });

  it("returns rewrite from exit code 3 stderr", () => {
    const err = Object.assign(new Error("exit 3"), { stdout: "rtk cat README.md" });
    mockExecSync.mockImplementation(() => { throw err; });
    const result = rewrite("cat README.md");
    expect(result).toBe("rtk cat README.md");
  });

  it("returns null for unknown commands", () => {
    mockExecSync.mockImplementation(() => { throw new Error("exit 1"); });
    const result = rewrite("python3 -c 'print(1)'");
    expect(result).toBeNull();
  });
});
