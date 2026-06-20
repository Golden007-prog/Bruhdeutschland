import { describe, expect, it } from "vitest";

import { CAREER_FIELDS, isShortageOccupation, scoreInterests } from "./fields";

describe("isShortageOccupation", () => {
  it("detects shortage fields by keyword", () => {
    expect(isShortageOccupation("Software Engineering")).toBe(true);
    expect(isShortageOccupation("Data Science")).toBe(true);
    expect(isShortageOccupation("Mechanical Engineering")).toBe(true);
    expect(isShortageOccupation("Nursing")).toBe(true);
  });
  it("does not flag clearly non-shortage fields", () => {
    expect(isShortageOccupation("Art History")).toBe(false);
    expect(isShortageOccupation("")).toBe(false);
  });
});

describe("CAREER_FIELDS", () => {
  it("shortage fields map to the reduced Blue Card tier (except recognition-route ones)", () => {
    const it = CAREER_FIELDS.find((f) => f.key === "it");
    expect(it?.shortage).toBe(true);
    expect(it?.blueCardTier).toBe("shortage");
  });
});

describe("scoreInterests", () => {
  it("ranks fields by how many selected interests point to them", () => {
    const ranked = scoreInterests(["build_software", "data_numbers"]);
    // data_ai is pointed to by both → should rank at/near the top
    expect(ranked[0].field.key === "data_ai" || ranked.some((r) => r.field.key === "data_ai" && r.score === 2)).toBe(true);
    expect(ranked.length).toBeGreaterThan(0);
  });
  it("returns nothing for no selections", () => {
    expect(scoreInterests([])).toHaveLength(0);
  });
});
