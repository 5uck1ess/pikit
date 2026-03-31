import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadVisibility,
  saveVisibility,
  showModule,
  hideModule,
  filterActiveTools,
} from "./manager.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("loadVisibility", () => {
  it("returns empty array when no visibility state exists", () => {
    expect(loadVisibility(testDir)).toEqual([]);
  });

  it("returns saved visibility state", () => {
    saveVisibility(testDir, ["git", "docker"]);
    expect(loadVisibility(testDir)).toEqual(["git", "docker"]);
  });
});

describe("saveVisibility", () => {
  it("persists visibility state", () => {
    saveVisibility(testDir, ["mod-a"]);
    expect(loadVisibility(testDir)).toEqual(["mod-a"]);
  });

  it("overwrites previous state", () => {
    saveVisibility(testDir, ["old"]);
    saveVisibility(testDir, ["new"]);
    expect(loadVisibility(testDir)).toEqual(["new"]);
  });
});

describe("showModule", () => {
  it("adds a module and returns true", () => {
    expect(showModule(testDir, "git")).toBe(true);
    expect(loadVisibility(testDir)).toContain("git");
  });

  it("returns false if module is already visible", () => {
    showModule(testDir, "git");
    expect(showModule(testDir, "git")).toBe(false);
  });

  it("can add multiple modules", () => {
    showModule(testDir, "git");
    showModule(testDir, "docker");
    expect(loadVisibility(testDir).sort()).toEqual(["docker", "git"]);
  });
});

describe("hideModule", () => {
  it("removes a visible module and returns true", () => {
    showModule(testDir, "git");
    expect(hideModule(testDir, "git")).toBe(true);
    expect(loadVisibility(testDir)).not.toContain("git");
  });

  it("returns false if module is not visible", () => {
    expect(hideModule(testDir, "nonexistent")).toBe(false);
  });
});

describe("filterActiveTools", () => {
  it("returns all tools when no modules are defined", () => {
    const tools = filterActiveTools(
      ["read", "write", "exec"],
      new Map(),
      [],
    );
    expect(tools).toEqual(["read", "write", "exec"]);
  });

  it("hides tools from non-visible modules", () => {
    const moduleTools = new Map([
      ["git", ["git-commit", "git-push"]],
      ["docker", ["docker-run"]],
    ]);
    const tools = filterActiveTools(
      ["read", "write", "git-commit", "git-push", "docker-run"],
      moduleTools,
      ["git"], // only git is visible
    );
    expect(tools).toEqual(["read", "write", "git-commit", "git-push"]);
  });

  it("keeps unassigned tools always active", () => {
    const moduleTools = new Map([["git", ["git-commit"]]]);
    const tools = filterActiveTools(
      ["read", "write", "git-commit"],
      moduleTools,
      [], // nothing visible
    );
    expect(tools).toEqual(["read", "write"]);
  });

  it("shows all module tools when all modules are visible", () => {
    const moduleTools = new Map([
      ["git", ["git-commit"]],
      ["docker", ["docker-run"]],
    ]);
    const tools = filterActiveTools(
      ["read", "git-commit", "docker-run"],
      moduleTools,
      ["git", "docker"],
    );
    expect(tools).toEqual(["read", "git-commit", "docker-run"]);
  });
});
