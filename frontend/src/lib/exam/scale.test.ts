import { describe, expect, it } from "vitest";

import {
  accuracyToBand1to6,
  averageBand,
  band1to6To120,
  bandToCefr,
  legacy120ToBand1to6,
  legacySectionScaled,
  roundToHalf,
} from "./scale";

describe("IELTS / TOEFL-2026 band rounding", () => {
  it("rounds halves: .25 → up to half, .75 → up to whole", () => {
    expect(roundToHalf(6.25)).toBe(6.5);
    expect(roundToHalf(6.75)).toBe(7.0);
    expect(roundToHalf(6.1)).toBe(6.0);
  });
  it("averages section bands then half-rounds", () => {
    expect(averageBand([6, 6, 5, 5])).toBe(5.5);
    expect(averageBand([])).toBeUndefined();
  });
});

describe("TOEFL-2026 accuracy → 1–6 band", () => {
  it("is monotonic and bounded to [1,6]", () => {
    expect(accuracyToBand1to6(100)).toBe(6.0);
    expect(accuracyToBand1to6(80)).toBe(5.0);
    expect(accuracyToBand1to6(0)).toBe(1.0);
    expect(accuracyToBand1to6(100)).toBeGreaterThanOrEqual(accuracyToBand1to6(50));
  });
});

describe("CEFR mapping (work-order §4)", () => {
  it("maps the 1–6 band to CEFR levels", () => {
    expect(bandToCefr(6)).toBe("C2");
    expect(bandToCefr(5)).toBe("C1");
    expect(bandToCefr(4)).toBe("B2");
    expect(bandToCefr(3)).toBe("B1");
    expect(bandToCefr(2)).toBe("A2");
    expect(bandToCefr(1)).toBe("A1");
  });
});

describe("0–120 concordance + legacy interpreter", () => {
  it("gives an indicative 0–120 range for a band", () => {
    expect(band1to6To120(6).min).toBe(114);
    expect(band1to6To120(5).min).toBe(95);
  });
  it("round-trips a held legacy 0–120 score back to a 1–6 band", () => {
    expect(legacy120ToBand1to6(118)).toBe(6.0);
    expect(legacy120ToBand1to6(100)).toBe(5.0);
    expect(legacy120ToBand1to6(73)).toBe(4.0);
    expect(legacy120ToBand1to6(10)).toBe(1.0);
  });
  it("scales an accuracy fraction to a legacy section range", () => {
    expect(legacySectionScaled(100, 30)).toBe(30);
    expect(legacySectionScaled(50, 30)).toBe(15);
  });
});
