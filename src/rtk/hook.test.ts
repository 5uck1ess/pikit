import { describe, it, expect, beforeEach } from "vitest";
import { getGains, resetGains, rewrite } from "./hook.js";

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
  it("rewrites known commands", () => {
    const result = rewrite("git status");
    expect(result).toBe("rtk git status");
  });

  it("rewrites ls", () => {
    const result = rewrite("ls -la");
    expect(result).toBe("rtk ls -la");
  });

  it("returns null for unknown commands", () => {
    const result = rewrite("python3 -c 'print(1)'");
    expect(result).toBeNull();
  });
});
