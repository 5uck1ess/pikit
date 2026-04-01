import type { ExecutionRegistry } from "./registry.js";
import type { CostHooks } from "./cost-hooks.js";

/** A complete workflow definition loaded from YAML */
export interface Workflow {
  name: string;
  description?: string;
  steps: Step[];
  budget?: TokenBudget;
  concurrency?: ConcurrencyConfig;
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
  parallel?: string[];
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

/** Token budget configuration */
export interface TokenBudget {
  /** Max characters (rough proxy: 1 token ~ 4 chars) */
  limit: number;
  /** Downgrade strategy when approaching limit */
  downgrade: "fast" | "skip" | "stop";
}

/** Concurrency configuration for parallel steps */
export interface ConcurrencyConfig {
  /** Max parallel steps (default: 3) */
  limit?: number;
}

/** Per-step execution stats */
export interface StepStats {
  stepId: string;
  model: string;
  inputChars: number;
  outputChars: number;
  rtkOriginal: number;
  rtkCompressed: number;
  filteredChars: number;
  durationMs: number;
}

/** Runtime state for a running workflow */
export interface WorkflowRun {
  workflow: Workflow;
  currentStep: number;
  stepExecutions: Map<string, number>;
  memory: Map<string, string>;
  stats: StepStats[];
  totalChars: number;
  aborted: boolean;
  dryRun: boolean;
  registry: ExecutionRegistry;
  costHooks: CostHooks;
}
