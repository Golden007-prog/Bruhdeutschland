import { describe, expect, it } from "vitest";

import { addMonthsYM, eligibilityDates, estimateImmigrationTimeline } from "./timeline";

describe("estimateImmigrationTimeline", () => {
  it("Blue Card + B1 → 21-month PR", () => {
    const t = estimateImmigrationTimeline({ onBlueCard: true, hasB1: true });
    expect(t.route).toBe("blue_card");
    expect(t.prMonths).toBe(21);
    expect(t.citizenshipYears).toBe(5);
  });
  it("Blue Card without B1 → 27-month PR", () => {
    expect(estimateImmigrationTimeline({ onBlueCard: true, hasB1: false }).prMonths).toBe(27);
  });
  it("standard work permit → ~60-month PR", () => {
    const t = estimateImmigrationTimeline({ onBlueCard: false, hasB1: true });
    expect(t.route).toBe("standard");
    expect(t.prMonths).toBe(60);
  });
});

describe("addMonthsYM", () => {
  it("adds months and rolls the year", () => {
    expect(addMonthsYM("2026-10", 21)).toBe("2028-07");
    expect(addMonthsYM("2026-01-15", 12)).toBe("2027-01");
    expect(addMonthsYM("nope", 5)).toBe("");
  });
});

describe("eligibilityDates", () => {
  it("computes PR + citizenship months from a qualified-residence start", () => {
    const t = estimateImmigrationTimeline({ onBlueCard: true, hasB1: true });
    const d = eligibilityDates("2027-09", t);
    expect(d.prMonth).toBe("2029-06"); // +21 months
    expect(d.citizenshipMonth).toBe("2032-09"); // +5 years
  });
});
