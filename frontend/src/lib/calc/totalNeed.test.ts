import { describe, expect, it } from "vitest";

import { SPERRKONTO_MONTH_EUR } from "@/lib/facts";
import { computeTotalNeed, DEFAULT_MONTHLY_EUR, DEFAULT_MONTHS } from "./totalNeed";

/**
 * The reconciled "total need" (G6-05) is the single figure the budget and the funding-gap planner share.
 * It must be pure deterministic arithmetic, and its living default must derive from the grounded
 * Sperrkonto constant — never the old re-literalled `992` (G6-03 / golden rule 4).
 */
describe("computeTotalNeed", () => {
  it("sums one-time + (monthly × months)", () => {
    const need = computeTotalNeed({ oneTime: 15000, monthly: 992, months: 24 });
    expect(need.livingTotal).toBe(992 * 24);
    expect(need.total).toBe(15000 + 992 * 24);
  });

  it("derives the living default from the grounded Sperrkonto constant, not a literal", () => {
    expect(DEFAULT_MONTHLY_EUR).toBe(SPERRKONTO_MONTH_EUR);
    // The old hardcoded default was 992 — assert it now tracks the source of truth.
    expect(DEFAULT_MONTHLY_EUR).toBe(992);
  });

  it("floors fractional months and treats zero months as no living cost", () => {
    expect(computeTotalNeed({ oneTime: 1000, monthly: 500, months: 2.9 }).livingTotal).toBe(1000);
    expect(computeTotalNeed({ oneTime: 1000, monthly: 500, months: 0 }).total).toBe(1000);
  });

  it("rejects negative inputs", () => {
    expect(() => computeTotalNeed({ oneTime: -1, monthly: 0, months: 0 })).toThrow();
    expect(() => computeTotalNeed({ oneTime: 0, monthly: -5, months: 1 })).toThrow();
  });

  it("exposes a sane default stay length", () => {
    expect(DEFAULT_MONTHS).toBe(24);
  });
});
