import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { add, markDone, format, isDone, reset, remaining } from "./manager.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("add", () => {
  it("adds a todo and returns the new count", () => {
    expect(add(testDir, "Write tests")).toBe(1);
    expect(add(testDir, "Fix bugs")).toBe(2);
  });
});

describe("markDone", () => {
  it("marks a todo as complete", () => {
    add(testDir, "Task A");
    add(testDir, "Task B");
    expect(markDone(testDir, 0)).toBe(true);
    expect(format(testDir)).toContain("[x]");
  });

  it("returns false for out-of-range index", () => {
    add(testDir, "Only one");
    expect(markDone(testDir, 5)).toBe(false);
    expect(markDone(testDir, -1)).toBe(false);
  });

  it("returns false when no todos exist", () => {
    expect(markDone(testDir, 0)).toBe(false);
  });
});

describe("format", () => {
  it("returns 'No todos.' when empty", () => {
    expect(format(testDir)).toBe("No todos.");
  });

  it("formats todos with checkboxes and 1-based numbering", () => {
    add(testDir, "First");
    add(testDir, "Second");
    markDone(testDir, 0);
    const list = format(testDir);
    expect(list).toContain("[x] 1. First");
    expect(list).toContain("[ ] 2. Second");
  });
});

describe("isDone", () => {
  it("returns false when no todos exist", () => {
    expect(isDone(testDir)).toBe(false);
  });

  it("returns false when some todos are pending", () => {
    add(testDir, "A");
    add(testDir, "B");
    markDone(testDir, 0);
    expect(isDone(testDir)).toBe(false);
  });

  it("returns true when all todos are complete", () => {
    add(testDir, "A");
    add(testDir, "B");
    markDone(testDir, 0);
    markDone(testDir, 1);
    expect(isDone(testDir)).toBe(true);
  });
});

describe("reset", () => {
  it("removes all todos", () => {
    add(testDir, "A");
    add(testDir, "B");
    reset(testDir);
    expect(format(testDir)).toBe("No todos.");
  });

  it("is safe to call when no todos exist", () => {
    expect(() => reset(testDir)).not.toThrow();
  });
});

describe("remaining", () => {
  it("returns 0 when no todos exist", () => {
    expect(remaining(testDir)).toBe(0);
  });

  it("counts only incomplete todos", () => {
    add(testDir, "A");
    add(testDir, "B");
    add(testDir, "C");
    markDone(testDir, 1);
    expect(remaining(testDir)).toBe(2);
  });

  it("returns 0 when all are complete", () => {
    add(testDir, "A");
    markDone(testDir, 0);
    expect(remaining(testDir)).toBe(0);
  });
});
