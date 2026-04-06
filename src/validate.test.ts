import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { loadWorkflow, listWorkflows } from "./workflows/loader.js";
import { discoverSkills, loadSkill } from "./skills/loader.js";

const PIKIT_DIR = process.cwd();
const SKILLS_DIR = join(PIKIT_DIR, "skills");
const WORKFLOWS_DIR = join(PIKIT_DIR, "workflows");

describe("skill auto-discovery", () => {
  const skills = discoverSkills(SKILLS_DIR);

  it("discovers all skill directories", () => {
    const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, "SKILL.md")))
      .map(d => d.name);
    expect(skills.length).toBe(dirs.length);
  });

  it("every skill has name and description", () => {
    for (const skill of skills) {
      expect(skill.name, `skill in ${skill.dir} missing name`).toBeTruthy();
      expect(skill.description, `${skill.name} missing description`).toBeTruthy();
    }
  });

  it("every skill body loads without error", () => {
    for (const skill of skills) {
      const full = loadSkill(skill.dir);
      expect(full, `${skill.name} failed to load`).not.toBeNull();
      expect(full!.body.length, `${skill.name} has empty body`).toBeGreaterThan(0);
    }
  });

  it("no duplicate skill names", () => {
    const names = skills.map(s => s.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes, `duplicate skill names: ${dupes.join(", ")}`).toEqual([]);
  });
});

describe("workflow validation", () => {
  const names = listWorkflows(WORKFLOWS_DIR);

  it("discovers all workflow files", () => {
    const ymlFiles = readdirSync(WORKFLOWS_DIR)
      .filter(f => f.endsWith(".yml"))
      .map(f => f.replace(".yml", ""));
    expect(names.sort()).toEqual(ymlFiles.sort());
  });

  for (const name of names) {
    describe(`workflow: ${name}`, () => {
      const wf = loadWorkflow(join(WORKFLOWS_DIR, `${name}.yml`));

      it("has a name", () => {
        expect(wf.name).toBeTruthy();
      });

      it("has steps", () => {
        expect(wf.steps.length).toBeGreaterThan(0);
      });

      it("all step IDs are unique", () => {
        const ids = wf.steps.map(s => s.id).filter(Boolean);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(dupes, `duplicate step IDs: ${dupes.join(", ")}`).toEqual([]);
      });

      it("branch targets exist", () => {
        const ids = new Set(wf.steps.map(s => s.id));
        for (const step of wf.steps) {
          if (step.branch) {
            for (const b of step.branch) {
              expect(ids.has(b.goto), `step ${step.id} branches to non-existent ${b.goto}`).toBe(true);
            }
          }
        }
      });

      it("parallel targets exist", () => {
        const ids = new Set(wf.steps.map(s => s.id));
        for (const step of wf.steps) {
          if (step.parallel) {
            for (const p of step.parallel) {
              expect(ids.has(p), `step ${step.id} parallels non-existent ${p}`).toBe(true);
            }
          }
        }
      });

      it("loop steps have max", () => {
        for (const step of wf.steps) {
          if (step.loop) {
            expect(step.loop.max, `step ${step.id} loop missing max`).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
