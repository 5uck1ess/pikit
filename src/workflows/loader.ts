import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Workflow, Step, TokenBudget } from "./types.js";

/** Load a single workflow from a YAML file */
export function loadWorkflow(filePath: string): Workflow {
  const raw = readFileSync(filePath, "utf-8");
  const doc = parseYaml(raw);

  const steps: Step[] = (doc.steps ?? []).map((s: Record<string, unknown>, i: number) => {
    const step: Step = {
      id: (s.id as string) ?? `step-${i + 1}`,
    };

    if (s.model) step.model = s.model as string;
    if (s.prompt) step.prompt = s.prompt as string;
    if (s.command) step.command = s.command as string;
    if (s.args) step.args = s.args as Record<string, string>;
    if (s.skills) step.skills = s.skills as string[];
    if (s.modules) step.modules = s.modules as string[];
    if (s.approval) step.approval = true;

    if (s.loop) {
      const l = s.loop as Record<string, unknown>;
      step.loop = { max: (l.max as number) ?? 10, until: l.until as string | undefined };
    }

    if (s.branch) {
      step.branch = (s.branch as Array<Record<string, string>>).map((b) => ({
        when: b.when,
        goto: b.goto,
      }));
    }

    if (s.parallel) step.parallel = s.parallel as string[];

    return step;
  });

  const workflow: Workflow = {
    name: doc.name ?? "unnamed",
    description: doc.description,
    steps,
  };

  if (doc.budget) {
    const b = doc.budget as Record<string, unknown>;
    workflow.budget = {
      limit: (b.limit as number) ?? 500_000,
      downgrade: (b.downgrade as TokenBudget["downgrade"]) ?? "fast",
    };
  }

  return workflow;
}

/** List all available workflow names from a directory */
export function listWorkflows(workflowsDir: string): string[] {
  if (!existsSync(workflowsDir)) return [];
  return readdirSync(workflowsDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => f.replace(/\.ya?ml$/, ""));
}

/**
 * Resolve a prompt template with context filtering.
 *
 * Only injects memory values that the template actually references via {{key}}.
 * This prevents earlier step outputs from bloating the context when they're
 * not needed by the current step.
 */
export function resolvePrompt(template: string, input: string, memory: Map<string, string>): string {
  let result = template.replace(/\{\{input\}\}/g, input);

  // Only inject referenced keys — skip everything else
  const referenced = template.match(/\{\{([^}]+)\}\}/g);
  if (referenced) {
    for (const placeholder of referenced) {
      const key = placeholder.slice(2, -2);
      if (key === "input") continue;
      const val = memory.get(key);
      if (val !== undefined) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
      }
    }
  }

  return result;
}

/**
 * Estimate the token savings from context filtering.
 * Returns how many chars were NOT injected because they weren't referenced.
 */
export function contextFilterSavings(template: string, memory: Map<string, string>): number {
  const referenced = new Set<string>();
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (matches) {
    for (const m of matches) referenced.add(m.slice(2, -2));
  }

  let filtered = 0;
  for (const [key, val] of memory) {
    if (key === "input") continue;
    if (!referenced.has(key)) {
      filtered += val.length;
    }
  }
  return filtered;
}
