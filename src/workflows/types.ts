/** A complete workflow definition loaded from YAML */
export interface Workflow {
  name: string;
  description?: string;
  steps: Step[];
}

/** A single step in a workflow */
export interface Step {
  id: string;
  model?: string;
  prompt?: string;
  command?: string;
  args?: Record<string, string>;
  skills?: string[];
  modules?: string[];
  approval?: boolean;
  loop?: LoopConfig;
  branch?: BranchRule[];
}

/** Loop configuration for repeating steps */
export interface LoopConfig {
  max: number;
  until?: string;
}

/** Conditional branching rule */
export interface BranchRule {
  when: string;
  goto: string;
}

/** Runtime state for a running workflow */
export interface WorkflowRun {
  workflow: Workflow;
  currentStep: number;
  stepExecutions: Map<string, number>;
  memory: Map<string, string>;
  aborted: boolean;
}
