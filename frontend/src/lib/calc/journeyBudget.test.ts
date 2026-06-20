import { describe, expect, it } from "vitest";

import { computeJourneyBudget, uniAssistCost, type JourneyBudgetInput } from "./journeyBudget";

const BASE: JourneyBudgetInput = {
  apsFee: 225,
  applications: 3,
  uniAssistFirst: 75,
  uniAssistAdditional: 30,
  translationDocs: 4,
  translationPerDoc: 40,
  visaFee: 75,
  flights: 500,
  deposit: 1500,
  misc: 200,
  blockedAccount: 11904,
  monthlyCost: 992,
  months: 24,
};

describe("uniAssistCost", () => {
  it("is zero for no applications", () => {
    expect(uniAssistCost(0, 75, 30)).toBe(0);
  });
  it("charges the first fee for one application", () => {
    expect(uniAssistCost(1, 75, 30)).toBe(75);
  });
  it("adds the additional fee per extra choice", () => {
    expect(uniAssistCost(3, 75, 30)).toBe(75 + 30 + 30);
  });
});

describe("computeJourneyBudget", () => {
  const r = computeJourneyBudget(BASE);

  it("sums uni-assist tiers", () => {
    expect(r.uniAssistTotal).toBe(135);
  });
  it("sums translation per-doc", () => {
    expect(r.translationTotal).toBe(160);
  });
  it("sums one-time costs", () => {
    // 225 + 135 + 160 + 75 + 500 + 1500 + 200
    expect(r.oneTimeTotal).toBe(2795);
  });
  it("multiplies recurring by months", () => {
    expect(r.recurringTotal).toBe(992 * 24);
  });
  it("upfront cash includes the blocked account", () => {
    expect(r.upfrontCash).toBe(2795 + 11904);
  });
  it("true cost excludes the blocked account (it is returned)", () => {
    expect(r.trueCost).toBe(2795 + 992 * 24);
  });
  it("rejects negative inputs", () => {
    expect(() => computeJourneyBudget({ ...BASE, flights: -1 })).toThrow();
  });
});
