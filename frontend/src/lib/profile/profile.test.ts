import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile } from "./types";
import { deriveGermanGpa, isProfileStarted, scaleFor, toParsedProfile } from "./profile";

const make = (patch: Partial<UserProfile>): UserProfile => ({ ...DEFAULT_PROFILE, ...patch });

describe("scaleFor", () => {
  it("returns null when no scale is chosen", () => {
    expect(scaleFor(DEFAULT_PROFILE)).toBeNull();
  });

  it("resolves a named scale", () => {
    expect(scaleFor(make({ gradeScale: "cgpa10" }))).toMatchObject({ best: 10, minPass: 4 });
  });

  it("resolves a valid custom scale and rejects a degenerate one", () => {
    expect(scaleFor(make({ gradeScale: "custom", customBest: "20", customMinPass: "6" }))).toMatchObject({
      best: 20,
      minPass: 6,
    });
    expect(scaleFor(make({ gradeScale: "custom", customBest: "10", customMinPass: "10" }))).toBeNull();
  });
});

describe("deriveGermanGpa", () => {
  it("converts a 10-point CGPA via the Modified Bavarian Formula", () => {
    // 1 + 3*(10-8.4)/(10-4) = 1.8
    const conv = deriveGermanGpa(make({ gradeValue: "8.4", gradeScale: "cgpa10" }));
    expect(conv?.germanGrade).toBe(1.8);
  });

  it("converts a percentage", () => {
    // 1 + 3*(100-75)/(100-40) = 2.25 -> 2.3 (round half up, 1 dp)
    const conv = deriveGermanGpa(make({ gradeValue: "75", gradeScale: "percent" }));
    expect(conv?.germanGrade).toBe(2.3);
  });

  it("returns null for missing grade or scale", () => {
    expect(deriveGermanGpa(make({ gradeScale: "cgpa10" }))).toBeNull();
    expect(deriveGermanGpa(make({ gradeValue: "8.4" }))).toBeNull();
    expect(deriveGermanGpa(make({ gradeValue: "abc", gradeScale: "cgpa10" }))).toBeNull();
  });
});

describe("isProfileStarted", () => {
  it("is false for an empty profile and true once a field is filled", () => {
    expect(isProfileStarted(DEFAULT_PROFILE)).toBe(false);
    expect(isProfileStarted(make({ name: "Jane" }))).toBe(true);
    expect(isProfileStarted(make({ currentDegree: "B.Tech" }))).toBe(true);
  });
});

describe("toParsedProfile", () => {
  it("builds facts and a grounded German GPA from real input", () => {
    const parsed = toParsedProfile(
      make({
        name: "Jane Doe",
        currentDegree: "B.Tech CS",
        institution: "IIT Delhi",
        targetField: "Data Engineering",
        gradeValue: "8.4",
        gradeScale: "cgpa10",
      }),
    );
    expect(parsed.fileName).toBe("Jane Doe");
    expect(parsed.facts).toEqual(
      expect.arrayContaining([
        { label: "Degree", value: "B.Tech CS" },
        { label: "Institution", value: "IIT Delhi" },
        { label: "Target field", value: "Data Engineering" },
      ]),
    );
    expect(parsed.germanGpa.value).toBe(1.8);
    expect(parsed.germanGpa.needsVerification).toBe(false);
    // ECTS is never fabricated — stays ungrounded until the ECTS tool computes it.
    expect(parsed.totalEcts).toEqual({ value: null, needsVerification: true });
  });

  it("flags GPA for verification when no grade is given", () => {
    const parsed = toParsedProfile(make({ name: "No Grade" }));
    expect(parsed.germanGpa.value).toBeNull();
    expect(parsed.germanGpa.needsVerification).toBe(true);
  });
});
