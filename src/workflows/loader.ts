import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Workflow, Step, BranchRule, LoopConfig } from "./types.js";

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

    return step;
  });

  return {
    name: doc.name ?? "unnamed",
    description: doc.description,
    steps,
  };
}

/** List all available workflow names from a directory */
export function listWorkflows(workflowsDir: string): string[] {
  if (!existsSync(workflowsDir)) return [];
  return readdirSync(workflowsDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => f.replace(/\.ya?ml$/, ""));
}

/** Resolve a prompt template — replaces {{input}} with the user's input */
export function resolvePrompt(template: string, input: string, memory: Map<string, string>): string {
  let result = template.replace(/\{\{input\}\}/g, input);
  for (const [key, val] of memory) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }
  return result;
}
