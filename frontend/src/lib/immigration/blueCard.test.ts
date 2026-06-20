import { describe, expect, it } from "vitest";

import { BLUE_CARD_SHORTAGE_EUR, BLUE_CARD_STANDARD_EUR } from "@/lib/facts";
import { checkBlueCard } from "./blueCard";

describe("checkBlueCard", () => {
  it("uses the standard threshold for a non-shortage, non-graduate", () => {
    const r = checkBlueCard({ grossSalary: 60000, shortageOccupation: false, recentGraduate: false });
    expect(r.threshold).toBe(BLUE_CARD_STANDARD_EUR);
    expect(r.thresholdKind).toBe("standard");
    expect(r.eligible).toBe(true);
  });

  it("uses the reduced threshold for a shortage occupation", () => {
    const r = checkBlueCard({ grossSalary: 46000, shortageOccupation: true, recentGraduate: false });
    expect(r.threshold).toBe(BLUE_CARD_SHORTAGE_EUR);
    expect(r.thresholdKind).toBe("reduced");
    expect(r.reasons).toContain("shortage occupation / STEM");
    expect(r.eligible).toBe(true);
  });

  it("uses the reduced threshold for a recent graduate", () => {
    const r = checkBlueCard({ grossSalary: 46000, shortageOccupation: false, recentGraduate: true });
    expect(r.thresholdKind).toBe("reduced");
    expect(r.eligible).toBe(true);
  });

  it("reports the salary gap when below the threshold", () => {
    const r = checkBlueCard({ grossSalary: 40000, shortageOccupation: false, recentGraduate: false });
    expect(r.eligible).toBe(false);
    expect(r.gap).toBe(Math.round((BLUE_CARD_STANDARD_EUR - 40000) * 100) / 100);
  });

  it("flags borderline within ~5% below", () => {
    const r = checkBlueCard({ grossSalary: Math.round(BLUE_CARD_SHORTAGE_EUR * 0.97), shortageOccupation: true, recentGraduate: false });
    expect(r.eligible).toBe(false);
    expect(r.borderline).toBe(true);
  });

  it("treats invalid salary as 0 (not eligible)", () => {
    const r = checkBlueCard({ grossSalary: NaN, shortageOccupation: false, recentGraduate: false });
    expect(r.eligible).toBe(false);
  });
});
