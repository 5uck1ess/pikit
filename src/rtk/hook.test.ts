import { describe, it, expect, beforeEach } from "vitest";
import { getGains, resetGains, recordStepCompression, getStepBreakdown } from "./hook.js";

describe("RTK stats tracking", () => {
  beforeEach(() => {
    resetGains();
  });

  it("starts with zero gains", () => {
    const g = getGains();
    expect(g.original).toBe(0);
    expect(g.compressed).toBe(0);
    expect(g.saved).toBe(0);
    expect(g.percent).toBe(0);
  });

  it("resets gains cleanly", () => {
    recordStepCompression("s1", 1000, 300);
    resetGains();
    expect(getStepBreakdown()).toEqual([]);
  });
});

describe("per-step compression breakdown", () => {
  beforeEach(() => {
    resetGains();
  });

  it("records and retrieves step compression", () => {
    recordStepCompression("review-smart", 5000, 1500);
    recordStepCompression("review-fast", 3000, 900);

    const breakdown = getStepBreakdown();
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].stepId).toBe("review-smart");
    expect(breakdown[0].original).toBe(5000);
    expect(breakdown[0].compressed).toBe(1500);
    expect(breakdown[0].saved).toBe(3500);
    expect(breakdown[0].percent).toBe(70);
  });

  it("aggregates multiple entries for same step", () => {
    recordStepCompression("improve", 2000, 600);
    recordStepCompression("improve", 3000, 900);

    const breakdown = getStepBreakdown();
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].original).toBe(5000);
    expect(breakdown[0].compressed).toBe(1500);
    expect(breakdown[0].saved).toBe(3500);
  });

  it("handles zero compression gracefully", () => {
    recordStepCompression("noop", 0, 0);
    const breakdown = getStepBreakdown();
    expect(breakdown[0].percent).toBe(0);
  });
});
