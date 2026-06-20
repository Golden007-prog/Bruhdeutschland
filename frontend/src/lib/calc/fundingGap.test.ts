import { describe, expect, it } from "vitest";

import { computeFundingPlan } from "./fundingGap";

describe("computeFundingPlan", () => {
  const need = { oneTime: 3000, monthly: 1000, months: 24 };

  it("sums lump sums and monthly income over the stay", () => {
    const p = computeFundingPlan({ savings: 5000, family: 5000, loan: 10000, scholarshipMonthly: 300, workMonthly: 400 }, need);
    expect(p.lumpSum).toBe(20000);
    expect(p.monthlyIncome).toBe(700);
    expect(p.incomeOverStay).toBe(700 * 24);
    expect(p.totalAvailable).toBe(20000 + 700 * 24);
  });

  it("computes total need as one-time + monthly × months", () => {
    const p = computeFundingPlan({ savings: 0, family: 0, loan: 0, scholarshipMonthly: 0, workMonthly: 0 }, need);
    expect(p.totalNeed).toBe(3000 + 1000 * 24);
    expect(p.covered).toBe(false);
    expect(p.shortfall).toBe(27000);
  });

  it("flags a covered plan with surplus", () => {
    const p = computeFundingPlan({ savings: 30000, family: 0, loan: 0, scholarshipMonthly: 0, workMonthly: 0 }, need);
    expect(p.covered).toBe(true);
    expect(p.surplus).toBe(30000 - 27000);
    expect(p.shortfall).toBe(0);
  });

  it("rejects negative inputs", () => {
    expect(() => computeFundingPlan({ savings: -1, family: 0, loan: 0, scholarshipMonthly: 0, workMonthly: 0 }, need)).toThrow();
  });
});
