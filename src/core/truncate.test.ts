import { describe, it, expect } from "vitest";
import { truncate } from "./truncate.js";

describe("truncate", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns text unchanged when exactly at limit", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });

  it("truncates and appends marker when over limit", () => {
    const result = truncate("hello world", 5);
    expect(result).toBe("hello\n\n[... truncated]");
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
    expect(truncate("", 0)).toBe("");
  });

  it("truncates to zero chars", () => {
    expect(truncate("abc", 0)).toBe("\n\n[... truncated]");
  });

  it("truncates long text correctly", () => {
    const long = "a".repeat(1000);
    const result = truncate(long, 100);
    expect(result).toBe("a".repeat(100) + "\n\n[... truncated]");
  });
});
