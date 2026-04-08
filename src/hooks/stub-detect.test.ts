import { describe, it, expect } from "vitest";
import { STUB_PATTERNS, type StubPattern } from "./stub-detect.js";

function detectStubInLine(line: string): string | undefined {
  for (const { pattern, message } of STUB_PATTERNS) {
    if (pattern.test(line)) return message;
  }
  return undefined;
}

describe("stub-detect: catches stub patterns", () => {
  it("catches TODO comments", () => {
    expect(detectStubInLine("  // TODO: implement this")).toBeTruthy();
    expect(detectStubInLine("  # FIXME: broken")).toBeTruthy();
    expect(detectStubInLine("  // PLACEHOLDER")).toBeTruthy();
  });

  it("catches deferred markers", () => {
    expect(detectStubInLine("  // implement later")).toBeTruthy();
    expect(detectStubInLine("  # add later")).toBeTruthy();
    expect(detectStubInLine("  // coming soon")).toBeTruthy();
  });

  it("catches ellipsis comments", () => {
    expect(detectStubInLine("  // ...")).toBeTruthy();
    expect(detectStubInLine("  # ...")).toBeTruthy();
  });

  it("catches empty returns", () => {
    expect(detectStubInLine("  return null;")).toBeTruthy();
    expect(detectStubInLine("  return undefined")).toBeTruthy();
    expect(detectStubInLine("  return {}")).toBeTruthy();
    expect(detectStubInLine("  return []")).toBeTruthy();
    expect(detectStubInLine("  return None")).toBeTruthy();
  });

  it("catches Python pass", () => {
    expect(detectStubInLine("    pass")).toBeTruthy();
  });

  it("catches NotImplemented throws", () => {
    expect(detectStubInLine('  throw new Error("Not implemented")')).toBeTruthy();
    expect(detectStubInLine("  raise NotImplementedError('todo')")).toBeTruthy();
  });

  it("catches placeholder text", () => {
    expect(detectStubInLine('  title="placeholder"')).toBeTruthy();
    expect(detectStubInLine("  text='lorem ipsum'")).toBeTruthy();
    expect(detectStubInLine('  label="Coming Soon"')).toBeTruthy();
  });

  it("catches hardcoded values marked as temp", () => {
    expect(detectStubInLine("  count = 42 // hardcoded")).toBeTruthy();
    expect(detectStubInLine("  total: 100, # static")).toBeTruthy();
  });
});

describe("stub-detect: allows legitimate code", () => {
  it("allows real return values", () => {
    expect(detectStubInLine("  return result;")).toBeUndefined();
    expect(detectStubInLine("  return { name, age };")).toBeUndefined();
    expect(detectStubInLine("  return [1, 2, 3];")).toBeUndefined();
  });

  it("allows real comments", () => {
    expect(detectStubInLine("  // This validates the input format")).toBeUndefined();
    expect(detectStubInLine("  # Parse the configuration file")).toBeUndefined();
  });

  it("allows normal string content", () => {
    expect(detectStubInLine('  title="User Settings"')).toBeUndefined();
    expect(detectStubInLine("  label='Submit'")).toBeUndefined();
  });
});
