import { describe, expect, it } from "vitest";

import { computeWorkDayBudget, entryUnits, type WorkDayEntry } from "./workDays";

const entry = (fullDays: number, halfDays: number): WorkDayEntry => ({
  id: `${fullDays}-${halfDays}`,
  month: "2026-10",
  fullDays,
  halfDays,
});

describe("entryUnits", () => {
  it("counts a full day as 1 and a half day as 0.5", () => {
    expect(entryUnits({ fullDays: 2, halfDays: 3 })).toBe(3.5);
  });
  it("floors negatives at 0", () => {
    expect(entryUnits({ fullDays: -5, halfDays: -2 })).toBe(0);
  });
});

describe("computeWorkDayBudget", () => {
  it("treats 280 half days as the full 140-unit budget", () => {
    const b = computeWorkDayBudget([entry(0, 280)]);
    expect(b.used).toBe(140);
    expect(b.remaining).toBe(0);
    expect(b.exhausted).toBe(true);
  });
  it("computes remaining and percent", () => {
    const b = computeWorkDayBudget([entry(70, 0)]);
    expect(b.used).toBe(70);
    expect(b.remaining).toBe(70);
    expect(b.percent).toBe(50);
    expect(b.exhausted).toBe(false);
  });
  it("never reports negative remaining when over budget", () => {
    const b = computeWorkDayBudget([entry(200, 0)]);
    expect(b.remaining).toBe(0);
    expect(b.percent).toBe(143);
    expect(b.exhausted).toBe(true);
  });
  it("sums multiple entries", () => {
    const b = computeWorkDayBudget([entry(10, 4), entry(5, 2)]);
    expect(b.totalFull).toBe(15);
    expect(b.totalHalf).toBe(6);
    expect(b.used).toBe(18);
  });
});
