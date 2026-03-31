import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWorkflow, listWorkflows, resolvePrompt, contextFilterSavings } from "./loader.js";

let testDir: string;
beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "pikit-test-"));
});
afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("loadWorkflow", () => {
  it("loads a basic workflow with steps", () => {
    const path = join(testDir, "test.yml");
    writeFileSync(
      path,
      `
name: Build Pipeline
description: Compile and test
steps:
  - id: compile
    prompt: Compile the project
    model: fast
  - id: test
    command: npm test
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.name).toBe("Build Pipeline");
    expect(wf.description).toBe("Compile and test");
    expect(wf.steps).toHaveLength(2);
    expect(wf.steps[0].id).toBe("compile");
    expect(wf.steps[0].prompt).toBe("Compile the project");
    expect(wf.steps[0].model).toBe("fast");
    expect(wf.steps[1].id).toBe("test");
    expect(wf.steps[1].command).toBe("npm test");
  });

  it("auto-generates step IDs when not provided", () => {
    const path = join(testDir, "auto.yml");
    writeFileSync(
      path,
      `
name: Auto
steps:
  - prompt: First
  - prompt: Second
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.steps[0].id).toBe("step-1");
    expect(wf.steps[1].id).toBe("step-2");
  });

  it("defaults to 'unnamed' when name is missing", () => {
    const path = join(testDir, "noname.yml");
    writeFileSync(path, `steps: []`);
    const wf = loadWorkflow(path);
    expect(wf.name).toBe("unnamed");
  });

  it("parses loop configuration", () => {
    const path = join(testDir, "loop.yml");
    writeFileSync(
      path,
      `
name: Looper
steps:
  - id: retry
    prompt: Try again
    loop:
      max: 5
      until: success
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.steps[0].loop).toEqual({ max: 5, until: "success" });
  });

  it("parses branch configuration", () => {
    const path = join(testDir, "branch.yml");
    writeFileSync(
      path,
      `
name: Brancher
steps:
  - id: check
    prompt: Check status
    branch:
      - when: error
        goto: fix
      - when: ok
        goto: done
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.steps[0].branch).toEqual([
      { when: "error", goto: "fix" },
      { when: "ok", goto: "done" },
    ]);
  });

  it("parses parallel step groups", () => {
    const path = join(testDir, "parallel.yml");
    writeFileSync(
      path,
      `
name: Parallel
steps:
  - id: dispatch
    parallel: [review-a, review-b, review-c]
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.steps[0].parallel).toEqual(["review-a", "review-b", "review-c"]);
  });

  it("parses token budget configuration", () => {
    const path = join(testDir, "budget.yml");
    writeFileSync(
      path,
      `
name: Budgeted
budget:
  limit: 100000
  downgrade: skip
steps:
  - id: s1
    prompt: Do it
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.budget).toEqual({ limit: 100000, downgrade: "skip" });
  });

  it("defaults budget downgrade to fast", () => {
    const path = join(testDir, "budget-default.yml");
    writeFileSync(
      path,
      `
name: BudgetDefault
budget:
  limit: 50000
steps: []
`,
    );
    const wf = loadWorkflow(path);
    expect(wf.budget?.limit).toBe(50000);
    expect(wf.budget?.downgrade).toBe("fast");
  });

  it("has no budget when not specified", () => {
    const path = join(testDir, "nobudget.yml");
    writeFileSync(path, `name: NoBudget\nsteps: []`);
    const wf = loadWorkflow(path);
    expect(wf.budget).toBeUndefined();
  });

  it("parses skills, modules, args, and approval", () => {
    const path = join(testDir, "full.yml");
    writeFileSync(
      path,
      `
name: Full
steps:
  - id: s1
    prompt: Do it
    skills:
      - code-review
    modules:
      - git
    args:
      file: main.ts
    approval: true
`,
    );
    const wf = loadWorkflow(path);
    const step = wf.steps[0];
    expect(step.skills).toEqual(["code-review"]);
    expect(step.modules).toEqual(["git"]);
    expect(step.args).toEqual({ file: "main.ts" });
    expect(step.approval).toBe(true);
  });
});

describe("listWorkflows", () => {
  it("returns empty array for nonexistent directory", () => {
    expect(listWorkflows(join(testDir, "nope"))).toEqual([]);
  });

  it("lists .yml and .yaml files without extension", () => {
    const dir = join(testDir, "workflows");
    mkdirSync(dir);
    writeFileSync(join(dir, "deploy.yml"), "name: Deploy");
    writeFileSync(join(dir, "build.yaml"), "name: Build");
    writeFileSync(join(dir, "notes.txt"), "ignore");
    expect(listWorkflows(dir).sort()).toEqual(["build", "deploy"]);
  });

  it("returns empty for empty directory", () => {
    const dir = join(testDir, "empty");
    mkdirSync(dir);
    expect(listWorkflows(dir)).toEqual([]);
  });
});

describe("resolvePrompt", () => {
  it("replaces {{input}} with user input", () => {
    expect(resolvePrompt("Hello {{input}}!", "world", new Map())).toBe(
      "Hello world!",
    );
  });

  it("replaces multiple {{input}} occurrences", () => {
    expect(
      resolvePrompt("{{input}} and {{input}}", "x", new Map()),
    ).toBe("x and x");
  });

  it("replaces memory map placeholders", () => {
    const mem = new Map([
      ["name", "Alice"],
      ["role", "dev"],
    ]);
    expect(resolvePrompt("Hi {{name}}, you are a {{role}}", "", mem)).toBe(
      "Hi Alice, you are a dev",
    );
  });

  it("replaces both {{input}} and memory placeholders", () => {
    const mem = new Map([["lang", "TypeScript"]]);
    expect(
      resolvePrompt("Write {{input}} in {{lang}}", "tests", mem),
    ).toBe("Write tests in TypeScript");
  });

  it("leaves unknown placeholders unchanged", () => {
    expect(resolvePrompt("{{unknown}}", "hi", new Map())).toBe("{{unknown}}");
  });

  it("handles empty template", () => {
    expect(resolvePrompt("", "input", new Map())).toBe("");
  });

  it("only injects referenced memory keys (context filtering)", () => {
    const mem = new Map([
      ["used", "yes"],
      ["unused", "big blob of text that should not appear"],
    ]);
    const result = resolvePrompt("Value: {{used}}", "", mem);
    expect(result).toBe("Value: yes");
    expect(result).not.toContain("big blob");
  });
});

describe("contextFilterSavings", () => {
  it("returns 0 when all keys are referenced", () => {
    const mem = new Map([["a", "hello"], ["b", "world"]]);
    expect(contextFilterSavings("{{a}} {{b}}", mem)).toBe(0);
  });

  it("counts unreferenced memory values", () => {
    const mem = new Map([
      ["used", "short"],
      ["skipped", "a".repeat(1000)],
      ["also-skipped", "b".repeat(500)],
    ]);
    expect(contextFilterSavings("{{used}}", mem)).toBe(1500);
  });

  it("ignores input key", () => {
    const mem = new Map([["input", "the input"]]);
    expect(contextFilterSavings("no refs", mem)).toBe(0);
  });

  it("returns 0 for empty memory", () => {
    expect(contextFilterSavings("{{anything}}", new Map())).toBe(0);
  });
});
