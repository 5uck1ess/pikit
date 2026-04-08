import { describe, it, expect } from "vitest";
import { getTier, Tier } from "./context-monitor.js";

describe("context-monitor: tier resolution", () => {
  it("returns PEAK for low usage", () => {
    expect(getTier(0)[0]).toBe(Tier.PEAK);
    expect(getTier(15)[0]).toBe(Tier.PEAK);
    expect(getTier(29)[0]).toBe(Tier.PEAK);
  });

  it("returns GOOD for moderate usage", () => {
    expect(getTier(30)[0]).toBe(Tier.GOOD);
    expect(getTier(45)[0]).toBe(Tier.GOOD);
    expect(getTier(49)[0]).toBe(Tier.GOOD);
  });

  it("returns DEGRADING at 50%", () => {
    expect(getTier(50)[0]).toBe(Tier.DEGRADING);
    expect(getTier(65)[0]).toBe(Tier.DEGRADING);
    expect(getTier(69)[0]).toBe(Tier.DEGRADING);
  });

  it("returns POOR at 70%", () => {
    expect(getTier(70)[0]).toBe(Tier.POOR);
    expect(getTier(80)[0]).toBe(Tier.POOR);
    expect(getTier(84)[0]).toBe(Tier.POOR);
  });

  it("returns CRITICAL at 85%+", () => {
    expect(getTier(85)[0]).toBe(Tier.CRITICAL);
    expect(getTier(95)[0]).toBe(Tier.CRITICAL);
    expect(getTier(100)[0]).toBe(Tier.CRITICAL);
  });
});

describe("context-monitor: warning behavior", () => {
  it("does not warn for PEAK or GOOD", () => {
    expect(getTier(10)[1].message).toBe("");
    expect(getTier(40)[1].message).toBe("");
  });

  it("warns for DEGRADING, POOR, CRITICAL", () => {
    expect(getTier(55)[1].message.length).toBeGreaterThan(0);
    expect(getTier(75)[1].message.length).toBeGreaterThan(0);
    expect(getTier(90)[1].message.length).toBeGreaterThan(0);
  });
});
