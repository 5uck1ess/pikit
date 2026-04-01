/**
 * Cost event hooks — lightweight event system for budget threshold notifications.
 * Lets workflows react to cost events in real-time instead of polling.
 */

export type CostEvent = "budget:warning" | "budget:critical" | "budget:exceeded" | "budget:downgrade" | "budget:skip" | "budget:stop";

export interface CostEventData {
  event: CostEvent;
  stepId: string;
  usedChars: number;
  limitChars: number;
  usagePercent: number;
  model?: string;
}

export type CostHookFn = (data: CostEventData) => void;

export class CostHooks {
  private hooks = new Map<CostEvent, CostHookFn[]>();

  /** Register a handler for a cost event */
  on(event: CostEvent, fn: CostHookFn): void {
    const list = this.hooks.get(event) ?? [];
    list.push(fn);
    this.hooks.set(event, list);
  }

  /** Remove a handler */
  off(event: CostEvent, fn: CostHookFn): void {
    const list = this.hooks.get(event);
    if (!list) return;
    this.hooks.set(event, list.filter((f) => f !== fn));
  }

  /** Emit a cost event to all registered handlers */
  emit(data: CostEventData): void {
    const handlers = this.hooks.get(data.event);
    if (!handlers) return;
    for (const fn of handlers) {
      try {
        fn(data);
      } catch {
        // Don't let a bad hook break the workflow
      }
    }
  }

  /** Convenience: evaluate budget and emit appropriate events */
  check(stepId: string, usedChars: number, limitChars: number, model?: string): void {
    const usagePercent = limitChars > 0 ? Math.round((usedChars / limitChars) * 100) : 0;
    const base = { stepId, usedChars, limitChars, usagePercent, model };

    if (usagePercent >= 100) {
      this.emit({ ...base, event: "budget:exceeded" });
    } else if (usagePercent >= 90) {
      this.emit({ ...base, event: "budget:critical" });
    } else if (usagePercent >= 80) {
      this.emit({ ...base, event: "budget:warning" });
    }
  }
}
