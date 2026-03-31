import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createStore,
  deleteStore,
  listStores,
  get,
  set,
  remove,
  keys,
  clear,
} from "./store.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("createStore", () => {
  it("creates a new store and returns true", () => {
    expect(createStore(testDir, "mystore")).toBe(true);
    expect(listStores(testDir)).toContain("mystore");
  });

  it("returns false if store already exists", () => {
    createStore(testDir, "mystore");
    expect(createStore(testDir, "mystore")).toBe(false);
  });

  it("creates multiple distinct stores", () => {
    createStore(testDir, "a");
    createStore(testDir, "b");
    expect(listStores(testDir).sort()).toEqual(["a", "b"]);
  });
});

describe("deleteStore", () => {
  it("deletes an existing store and returns true", () => {
    createStore(testDir, "temp");
    expect(deleteStore(testDir, "temp")).toBe(true);
    expect(listStores(testDir)).not.toContain("temp");
  });

  it("returns false for a nonexistent store", () => {
    expect(deleteStore(testDir, "nope")).toBe(false);
  });
});

describe("listStores", () => {
  it("returns empty array when no stores exist", () => {
    expect(listStores(testDir)).toEqual([]);
  });

  it("returns all store names", () => {
    createStore(testDir, "alpha");
    createStore(testDir, "beta");
    createStore(testDir, "gamma");
    expect(listStores(testDir).sort()).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("get / set", () => {
  it("returns null for a key in a nonexistent store", () => {
    expect(get(testDir, "missing", "key")).toBeNull();
  });

  it("returns null for a missing key in an existing store", () => {
    createStore(testDir, "s");
    expect(get(testDir, "s", "nokey")).toBeNull();
  });

  it("stores and retrieves a value", () => {
    set(testDir, "s", "color", "blue");
    expect(get(testDir, "s", "color")).toBe("blue");
  });

  it("overwrites a value", () => {
    set(testDir, "s", "color", "blue");
    set(testDir, "s", "color", "red");
    expect(get(testDir, "s", "color")).toBe("red");
  });

  it("auto-creates the store when using set", () => {
    set(testDir, "auto", "k", "v");
    expect(listStores(testDir)).toContain("auto");
    expect(get(testDir, "auto", "k")).toBe("v");
  });
});

describe("remove", () => {
  it("removes a key and returns old value", () => {
    set(testDir, "s", "x", "42");
    expect(remove(testDir, "s", "x")).toBe("42");
    expect(get(testDir, "s", "x")).toBeNull();
  });

  it("returns null when key does not exist", () => {
    createStore(testDir, "s");
    expect(remove(testDir, "s", "nope")).toBeNull();
  });

  it("returns null when store does not exist", () => {
    expect(remove(testDir, "nope", "key")).toBeNull();
  });
});

describe("keys", () => {
  it("returns empty array for nonexistent store", () => {
    expect(keys(testDir, "nope")).toEqual([]);
  });

  it("returns empty array for empty store", () => {
    createStore(testDir, "s");
    expect(keys(testDir, "s")).toEqual([]);
  });

  it("returns all keys in a store", () => {
    set(testDir, "s", "a", "1");
    set(testDir, "s", "b", "2");
    set(testDir, "s", "c", "3");
    expect(keys(testDir, "s").sort()).toEqual(["a", "b", "c"]);
  });
});

describe("clear", () => {
  it("clears all entries but keeps the store", () => {
    set(testDir, "s", "a", "1");
    set(testDir, "s", "b", "2");
    expect(clear(testDir, "s")).toBe(true);
    expect(keys(testDir, "s")).toEqual([]);
    expect(listStores(testDir)).toContain("s");
  });

  it("returns false for nonexistent store", () => {
    expect(clear(testDir, "nope")).toBe(false);
  });
});
