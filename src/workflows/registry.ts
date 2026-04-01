/**
 * Execution registry — centralized tracking of workflow step execution.
 * Provides visibility into what ran, what's running, what failed.
 */

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface StepEntry {
  stepId: string;
  status: StepStatus;
  model?: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  error?: string;
  chars?: { input: number; output: number };
}

export class ExecutionRegistry {
  private entries = new Map<string, StepEntry>();

  /** Register a step as pending before execution */
  register(stepId: string): void {
    this.entries.set(stepId, { stepId, status: "pending" });
  }

  /** Mark a step as running */
  start(stepId: string, model?: string): void {
    const entry = this.getOrCreate(stepId);
    entry.status = "running";
    entry.model = model;
    entry.startedAt = Date.now();
  }

  /** Mark a step as completed */
  done(stepId: string, chars?: { input: number; output: number }): void {
    const entry = this.getOrCreate(stepId);
    entry.status = "done";
    entry.finishedAt = Date.now();
    entry.durationMs = entry.startedAt ? entry.finishedAt - entry.startedAt : 0;
    if (chars) entry.chars = chars;
  }

  /** Mark a step as failed */
  fail(stepId: string, error: string): void {
    const entry = this.getOrCreate(stepId);
    entry.status = "failed";
    entry.finishedAt = Date.now();
    entry.durationMs = entry.startedAt ? entry.finishedAt - entry.startedAt : 0;
    entry.error = error;
  }

  /** Mark a step as skipped (budget, loop limit, etc.) */
  skip(stepId: string, reason?: string): void {
    const entry = this.getOrCreate(stepId);
    entry.status = "skipped";
    entry.error = reason;
  }

  /** Get a specific step entry */
  get(stepId: string): StepEntry | undefined {
    return this.entries.get(stepId);
  }

  /** Get all entries */
  all(): StepEntry[] {
    return [...this.entries.values()];
  }

  /** Get entries by status */
  byStatus(status: StepStatus): StepEntry[] {
    return this.all().filter((e) => e.status === status);
  }

  /** Format a summary for logging/display */
  summary(): string {
    const entries = this.all();
    if (entries.length === 0) return "No steps executed.";

    const lines = ["Execution Registry:"];
    for (const e of entries) {
      const dur = e.durationMs ? `${(e.durationMs / 1000).toFixed(1)}s` : "-";
      const chars = e.chars ? `in=${(e.chars.input / 1024).toFixed(1)}KB out=${(e.chars.output / 1024).toFixed(1)}KB` : "";
      const err = e.error ? ` (${e.error})` : "";
      lines.push(`  ${e.status.padEnd(7)} ${e.stepId} | ${e.model ?? "-"} | ${dur} ${chars}${err}`);
    }

    const failed = this.byStatus("failed");
    if (failed.length > 0) {
      lines.push(`  ⚠ ${failed.length} step(s) failed: ${failed.map((e) => e.stepId).join(", ")}`);
    }

    return lines.join("\n");
  }

  private getOrCreate(stepId: string): StepEntry {
    let entry = this.entries.get(stepId);
    if (!entry) {
      entry = { stepId, status: "pending" };
      this.entries.set(stepId, entry);
    }
    return entry;
  }
}
