import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverSkills, loadSkill, discoverAllSkills } from "./loader.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

function createSkillDir(
  baseDir: string,
  dirName: string,
  frontmatter: string,
  body: string,
): string {
  const skillDir = join(baseDir, dirName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
  return skillDir;
}

describe("discoverSkills", () => {
  it("returns empty array for nonexistent directory", () => {
    expect(discoverSkills(join(testDir, "nope"))).toEqual([]);
  });

  it("discovers skills with SKILL.md files", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    createSkillDir(skillsDir, "code-review", "name: Code Review\ndescription: Reviews code", "Review instructions here.");
    createSkillDir(skillsDir, "refactor", "name: Refactor\ndescription: Refactors code", "Refactor instructions.");

    const skills = discoverSkills(skillsDir);
    expect(skills).toHaveLength(2);
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(["Code Review", "Refactor"]);
  });

  it("skips directories without SKILL.md", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    createSkillDir(skillsDir, "valid", "name: Valid\ndescription: yes", "body");
    mkdirSync(join(skillsDir, "invalid"));

    const skills = discoverSkills(skillsDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("Valid");
  });

  it("skips files (non-directories)", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    writeFileSync(join(skillsDir, "readme.md"), "not a skill dir");
    createSkillDir(skillsDir, "real", "name: Real\ndescription: a real skill", "body");

    const skills = discoverSkills(skillsDir);
    expect(skills).toHaveLength(1);
  });

  it("uses directory name when frontmatter name is missing", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    createSkillDir(skillsDir, "my-skill", "description: no name attr", "body");

    const skills = discoverSkills(skillsDir);
    expect(skills[0].name).toBe("my-skill");
  });

  it("populates the dir field correctly", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    createSkillDir(skillsDir, "test-skill", "name: Test\ndescription: d", "body");

    const skills = discoverSkills(skillsDir);
    expect(skills[0].dir).toBe(join(skillsDir, "test-skill"));
  });
});

describe("loadSkill", () => {
  it("returns null for nonexistent skill directory", () => {
    expect(loadSkill(join(testDir, "nope"))).toBeNull();
  });

  it("loads full skill content", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    const dir = createSkillDir(
      skillsDir,
      "review",
      "name: Review\ndescription: Code review skill",
      "Review the code carefully.",
    );

    const skill = loadSkill(dir);
    expect(skill).not.toBeNull();
    expect(skill!.name).toBe("Review");
    expect(skill!.description).toBe("Code review skill");
    expect(skill!.body).toBe("Review the code carefully.");
    expect(skill!.references).toEqual([]);
  });

  it("discovers reference files", () => {
    const skillsDir = join(testDir, "skills");
    mkdirSync(skillsDir);
    const dir = createSkillDir(
      skillsDir,
      "with-refs",
      "name: WithRefs\ndescription: has refs",
      "body",
    );
    const refsDir = join(dir, "references");
    mkdirSync(refsDir);
    writeFileSync(join(refsDir, "guide.md"), "# Guide");
    writeFileSync(join(refsDir, "examples.md"), "# Examples");
    writeFileSync(join(refsDir, "data.json"), "{}"); // non-md, should be skipped

    const skill = loadSkill(dir);
    expect(skill!.references).toHaveLength(2);
    expect(skill!.references.sort()).toEqual([
      join(refsDir, "examples.md"),
      join(refsDir, "guide.md"),
    ]);
  });
});

describe("discoverAllSkills", () => {
  it("merges skills from multiple directories", () => {
    const dir1 = join(testDir, "core-skills");
    const dir2 = join(testDir, "local-skills");
    mkdirSync(dir1);
    mkdirSync(dir2);
    createSkillDir(dir1, "a", "name: Alpha\ndescription: core", "body");
    createSkillDir(dir2, "b", "name: Beta\ndescription: local", "body");

    const skills = discoverAllSkills([dir1, dir2]);
    expect(skills).toHaveLength(2);
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(["Alpha", "Beta"]);
  });

  it("deduplicates by name, keeping first occurrence", () => {
    const dir1 = join(testDir, "core");
    const dir2 = join(testDir, "local");
    mkdirSync(dir1);
    mkdirSync(dir2);
    createSkillDir(dir1, "shared", "name: Shared\ndescription: from core", "core body");
    createSkillDir(dir2, "shared", "name: Shared\ndescription: from local", "local body");

    const skills = discoverAllSkills([dir1, dir2]);
    expect(skills).toHaveLength(1);
    expect(skills[0].description).toBe("from core");
  });

  it("handles empty directories gracefully", () => {
    expect(discoverAllSkills([])).toEqual([]);
    const emptyDir = join(testDir, "empty");
    mkdirSync(emptyDir);
    expect(discoverAllSkills([emptyDir])).toEqual([]);
  });
});
