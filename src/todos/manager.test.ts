import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addTodo,
  completeTodo,
  listTodos,
  allComplete,
  clearTodos,
  pendingCount,
} from "./manager.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("addTodo", () => {
  it("adds a todo and returns the new count", () => {
    expect(addTodo(testDir, "Write tests")).toBe(1);
    expect(addTodo(testDir, "Fix bugs")).toBe(2);
  });
});

describe("completeTodo", () => {
  it("marks a todo as complete", () => {
    addTodo(testDir, "Task A");
    addTodo(testDir, "Task B");
    expect(completeTodo(testDir, 0)).toBe(true);
    expect(listTodos(testDir)).toContain("[x]");
  });

  it("returns false for out-of-range index", () => {
    addTodo(testDir, "Only one");
    expect(completeTodo(testDir, 5)).toBe(false);
    expect(completeTodo(testDir, -1)).toBe(false);
  });

  it("returns false when no todos exist", () => {
    expect(completeTodo(testDir, 0)).toBe(false);
  });
});

describe("listTodos", () => {
  it("returns 'No todos.' when empty", () => {
    expect(listTodos(testDir)).toBe("No todos.");
  });

  it("formats todos with checkboxes and 1-based numbering", () => {
    addTodo(testDir, "First");
    addTodo(testDir, "Second");
    completeTodo(testDir, 0);
    const list = listTodos(testDir);
    expect(list).toContain("[x] 1. First");
    expect(list).toContain("[ ] 2. Second");
  });
});

describe("allComplete", () => {
  it("returns false when no todos exist", () => {
    expect(allComplete(testDir)).toBe(false);
  });

  it("returns false when some todos are pending", () => {
    addTodo(testDir, "A");
    addTodo(testDir, "B");
    completeTodo(testDir, 0);
    expect(allComplete(testDir)).toBe(false);
  });

  it("returns true when all todos are complete", () => {
    addTodo(testDir, "A");
    addTodo(testDir, "B");
    completeTodo(testDir, 0);
    completeTodo(testDir, 1);
    expect(allComplete(testDir)).toBe(true);
  });
});

describe("clearTodos", () => {
  it("removes all todos", () => {
    addTodo(testDir, "A");
    addTodo(testDir, "B");
    clearTodos(testDir);
    expect(listTodos(testDir)).toBe("No todos.");
  });

  it("is safe to call when no todos exist", () => {
    expect(() => clearTodos(testDir)).not.toThrow();
  });
});

describe("pendingCount", () => {
  it("returns 0 when no todos exist", () => {
    expect(pendingCount(testDir)).toBe(0);
  });

  it("counts only incomplete todos", () => {
    addTodo(testDir, "A");
    addTodo(testDir, "B");
    addTodo(testDir, "C");
    completeTodo(testDir, 1);
    expect(pendingCount(testDir)).toBe(2);
  });

  it("returns 0 when all are complete", () => {
    addTodo(testDir, "A");
    completeTodo(testDir, 0);
    expect(pendingCount(testDir)).toBe(0);
  });
});
