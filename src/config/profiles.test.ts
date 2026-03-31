import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadProfile,
  listProfiles,
  applyProfile,
  unapplyProfile,
  resolveAlias,
  getAliases,
  activeProfile,
} from "./profiles.js";

let testDir: string;
let configsDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
  configsDir = join(testDir, "configs");
  mkdirSync(configsDir, { recursive: true });
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

function writeProfile(name: string, content: string): string {
  const path = join(configsDir, `${name}.yml`);
  writeFileSync(path, content);
  return path;
}

describe("loadProfile", () => {
  it("parses a valid profile YAML", () => {
    const path = writeProfile("fast", `
name: Fast Mode
description: Use faster models
configs:
  - name: smart
    value: claude-sonnet-4-6
  - name: fast
    value: claude-haiku-4-5
`);
    const profile = loadProfile(path);
    expect(profile.name).toBe("Fast Mode");
    expect(profile.description).toBe("Use faster models");
    expect(profile.models).toEqual({
      smart: "claude-sonnet-4-6",
      fast: "claude-haiku-4-5",
    });
  });

  it("handles missing description", () => {
    const path = writeProfile("bare", `
name: Bare
configs:
  - name: general
    value: gpt-4
`);
    const profile = loadProfile(path);
    expect(profile.description).toBe("");
  });

  it("handles missing configs", () => {
    const path = writeProfile("empty", `
name: Empty
`);
    const profile = loadProfile(path);
    expect(profile.models).toEqual({});
  });
});

describe("listProfiles", () => {
  it("returns empty array for nonexistent directory", () => {
    expect(listProfiles("/tmp/does-not-exist-xyz")).toEqual([]);
  });

  it("lists .yml and .yaml files without extension", () => {
    writeProfile("alpha", "name: Alpha");
    writeFileSync(join(configsDir, "beta.yaml"), "name: Beta");
    writeFileSync(join(configsDir, "readme.txt"), "ignore me");
    const names = listProfiles(configsDir).sort();
    expect(names).toEqual(["alpha", "beta"]);
  });

  it("returns empty for empty directory", () => {
    const emptyDir = join(testDir, "empty-configs");
    mkdirSync(emptyDir);
    expect(listProfiles(emptyDir)).toEqual([]);
  });
});

describe("applyProfile / unapplyProfile", () => {
  it("applies a profile and stores model aliases", () => {
    writeProfile("myprofile", `
name: My Profile
configs:
  - name: smart
    value: custom-model-1
  - name: fast
    value: custom-model-2
`);
    const msg = applyProfile(testDir, configsDir, "myprofile");
    expect(msg).toContain("My Profile");
    expect(resolveAlias(testDir, "smart")).toBe("custom-model-1");
    expect(resolveAlias(testDir, "fast")).toBe("custom-model-2");
    expect(activeProfile(testDir)).toBe("myprofile");
  });

  it("unapplyProfile reverts to defaults", () => {
    writeProfile("tmp", `
name: Tmp
configs:
  - name: smart
    value: overridden
`);
    applyProfile(testDir, configsDir, "tmp");
    expect(resolveAlias(testDir, "smart")).toBe("overridden");

    const msg = unapplyProfile(testDir);
    expect(msg).toContain("Reverted");
    expect(resolveAlias(testDir, "smart")).toBe("claude-opus-4-6");
    expect(activeProfile(testDir)).toBeNull();
  });
});

describe("resolveAlias", () => {
  it("returns default for known alias with no override", () => {
    expect(resolveAlias(testDir, "smart")).toBe("claude-opus-4-6");
    expect(resolveAlias(testDir, "general")).toBe("claude-sonnet-4-6");
    expect(resolveAlias(testDir, "fast")).toBe("claude-haiku-4-5");
  });

  it("returns the alias itself for unknown aliases", () => {
    expect(resolveAlias(testDir, "gpt-4o")).toBe("gpt-4o");
  });
});

describe("getAliases", () => {
  it("returns all aliases with defaults when no profile applied", () => {
    const aliases = getAliases(testDir);
    expect(aliases.smart.default).toBe("claude-opus-4-6");
    expect(aliases.smart.current).toBe("claude-opus-4-6");
    expect(aliases.general.default).toBe("claude-sonnet-4-6");
    expect(aliases.fast.default).toBe("claude-haiku-4-5");
  });

  it("reflects overrides after applying profile", () => {
    writeProfile("over", `
name: Over
configs:
  - name: smart
    value: custom-smart
`);
    applyProfile(testDir, configsDir, "over");
    const aliases = getAliases(testDir);
    expect(aliases.smart.current).toBe("custom-smart");
    expect(aliases.smart.default).toBe("claude-opus-4-6");
    expect(aliases.general.current).toBe("claude-sonnet-4-6");
  });
});

describe("activeProfile", () => {
  it("returns null when no profile applied", () => {
    expect(activeProfile(testDir)).toBeNull();
  });
});
