import { describe, it, expect } from "vitest";
import { percentileRank, rankFromBelow, topPercentLabel } from "./percentile";

describe("percentileRank", () => {
  it("is 0 for an empty cohort", () => {
    expect(percentileRank({ below: 0, total: 0 })).toBe(0);
  });
  it("computes the share strictly below the caller", () => {
    expect(percentileRank({ below: 50, total: 100 })).toBe(50);
    expect(percentileRank({ below: 99, total: 100 })).toBe(99);
    expect(percentileRank({ below: 0, total: 100 })).toBe(0);
  });
  it("clamps an out-of-range below into [0, total]", () => {
    expect(percentileRank({ below: 120, total: 100 })).toBe(100);
    expect(percentileRank({ below: -5, total: 100 })).toBe(0);
  });
  it("guards against non-finite input", () => {
    expect(percentileRank({ below: Number.NaN, total: 10 })).toBe(0);
    expect(percentileRank({ below: 5, total: Number.POSITIVE_INFINITY })).toBe(0);
  });
});

describe("rankFromBelow", () => {
  it("gives rank 1 to the top of the cohort", () => {
    expect(rankFromBelow({ below: 99, total: 100 })).toBe(1);
  });
  it("gives the last rank to the bottom", () => {
    expect(rankFromBelow({ below: 0, total: 100 })).toBe(100);
  });
  it("is 0 for an empty cohort", () => {
    expect(rankFromBelow({ below: 0, total: 0 })).toBe(0);
  });
});

describe("topPercentLabel", () => {
  it("turns a high percentile into a small Top X%", () => {
    expect(topPercentLabel(92)).toBe("Top 8%");
    expect(topPercentLabel(50)).toBe("Top 50%");
  });
  it("floors at Top 1%", () => {
    expect(topPercentLabel(100)).toBe("Top 1%");
  });
  it("labels non-finite input as Unranked", () => {
    expect(topPercentLabel(Number.NaN)).toBe("Unranked");
  });
});
