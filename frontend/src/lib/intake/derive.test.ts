import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";
import { ageOn, documentsStillNeeded, insuranceTierHint, intakeTargetLabel, recommendedTests } from "./derive";

const p = (patch: Partial<UserProfile>): UserProfile => ({ ...DEFAULT_PROFILE, ...patch });

describe("documentsStillNeeded", () => {
  it("includes APS for APS countries and excludes it otherwise", () => {
    const india = documentsStillNeeded(p({ homeCountry: "India", documentsOnHand: ["passport"] }));
    expect(india.needed.some((d) => d.key === "aps")).toBe(true);
    expect(india.have.some((d) => d.key === "passport")).toBe(true);

    const bd = documentsStillNeeded(p({ homeCountry: "Bangladesh" }));
    expect(bd.needed.some((d) => d.key === "aps")).toBe(false);
  });

  it("moves held documents out of 'needed' (trace: set documentsOnHand → checklist shrinks)", () => {
    const before = documentsStillNeeded(p({ homeCountry: "Bangladesh" })).needed.length;
    const after = documentsStillNeeded(p({ homeCountry: "Bangladesh", documentsOnHand: ["cv", "sop"] })).needed.length;
    expect(after).toBe(before - 2);
  });
});

describe("recommendedTests", () => {
  it("waives English when the medium of instruction was English (Master)", () => {
    const recs = recommendedTests(p({ targetLevel: "master", mediumOfInstruction: "english" }));
    expect(recs.some((r) => /WAIVE/i.test(r.reason))).toBe(true);
  });
  it("recommends IELTS/TOEFL for a Master with a non-English medium and no test", () => {
    const recs = recommendedTests(p({ targetLevel: "master", mediumOfInstruction: "other" }));
    expect(recs.some((r) => /IELTS or TOEFL/.test(r.test))).toBe(true);
  });
  it("recommends German C1 + TestAS/TMS for Medicine", () => {
    const recs = recommendedTests(p({ targetLevel: "medicine" }));
    expect(recs.some((r) => /C1/.test(r.test))).toBe(true);
    expect(recs.some((r) => /TestAS|TMS/.test(r.test))).toBe(true);
  });
});

describe("age + insurance tier", () => {
  it("computes whole-year age", () => {
    expect(ageOn("2000-06-21", "2026-06-20")).toBe(25); // birthday tomorrow → still 25
    expect(ageOn("2000-06-20", "2026-06-20")).toBe(26);
    expect(ageOn("", "2026-06-20")).toBeNull();
  });
  it("hints statutory under 30, private 30+", () => {
    expect(insuranceTierHint(p({ dateOfBirth: "2003-01-01" }), "2026-06-20").hint).toMatch(/statutory/i);
    expect(insuranceTierHint(p({ dateOfBirth: "1990-01-01" }), "2026-06-20").hint).toMatch(/private|voluntary/i);
  });
});

describe("intakeTargetLabel", () => {
  it("combines season + year", () => {
    expect(intakeTargetLabel(p({ targetIntake: "WS", targetIntakeYear: "2026" }))).toBe("Wintersemester 2026");
    expect(intakeTargetLabel(p({ targetIntake: "SS" }))).toBe("Sommersemester");
    expect(intakeTargetLabel(p({}))).toBe("");
  });
});
