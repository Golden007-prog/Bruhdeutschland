import { describe, expect, it } from "vitest";

import { evaluatePathway, type PathwayInput } from "./pathway";

const input = (p: Partial<PathwayInput>): PathwayInput => ({
  country: "India",
  highestQualification: "class12",
  targetLevel: "bachelor",
  targetSubject: "Computer Science",
  ...p,
});

describe("evaluatePathway", () => {
  it("BLOCKS a Class-10 school-leaver honestly (no Studienkolleg either)", () => {
    const r = evaluatePathway(input({ highestQualification: "class10" }));
    expect(r.route).toBe("blocked");
    expect(r.title).toMatch(/Class 12/i);
  });

  it("routes India Class-12 Bachelor to Studienkolleg by default, with the WS2026/27 flag", () => {
    const r = evaluatePathway(input({ country: "India", highestQualification: "class12", targetLevel: "bachelor" }));
    expect(r.route).toBe("studienkolleg");
    expect(r.kurs?.code).toBe("T"); // CS → T-Kurs
    expect(r.notes.some((n) => /70%/.test(n.detail))).toBe(true);
    expect(r.needsVerification).toBe(true);
  });

  it("routes Bangladesh Class-12 Bachelor to Studienkolleg too", () => {
    const r = evaluatePathway(input({ country: "Bangladesh", targetLevel: "bachelor", targetSubject: "Business" }));
    expect(r.route).toBe("studienkolleg");
    expect(r.kurs?.code).toBe("W"); // business → W-Kurs
  });

  it("offers a direct-Bachelor carve-out for ~1 year of Indian university study", () => {
    const r = evaluatePathway(input({ country: "India", highestQualification: "some_bachelor", targetLevel: "bachelor" }));
    expect(r.route).toBe("direct_bachelor");
  });

  it("routes Medicine to the Humanmedizin pathway with the terminology reset + M-Kurs", () => {
    const r = evaluatePathway(input({ targetLevel: "medicine", targetSubject: "Medicine" }));
    expect(r.route).toBe("medicine");
    expect(r.title).toMatch(/Humanmedizin/);
    expect(r.title).toMatch(/no .*MBBS/i);
    expect(r.kurs?.code).toBe("M");
    expect(r.notes.some((n) => /German-taught|German only/i.test(n.label + n.detail))).toBe(true);
    expect(r.notes.some((n) => /Numerus Clausus|NC/i.test(n.label + n.detail))).toBe(true);
  });

  it("keeps the Master's flow for a Bachelor-holder", () => {
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "master" }));
    expect(r.route).toBe("master");
  });

  it("nudges a degree-holder away from a German Bachelor", () => {
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "bachelor" }));
    expect(r.route).toBe("master");
    expect(r.title).toMatch(/already hold a degree/i);
  });
});

import { summarizeEducation } from "@/lib/profile/education";
import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";

const profile = (o: Partial<UserProfile>): UserProfile => ({ ...DEFAULT_PROFILE, ...o });

describe("evaluatePathway — non-linear education paths", () => {
  it("diploma+lateral, Bachelor COMPLETED, target Master → master route + verify-recognition notes", () => {
    const education = summarizeEducation(profile({ highestQualification: "bachelor", educationPathType: "diploma_lateral" }));
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "master", education }));
    expect(r.route).toBe("master");
    expect(r.title).toMatch(/lateral-entry/i);
    expect(r.notes.some((n) => /qualifying credential/i.test(n.label))).toBe(true);
    expect(r.notes.some((n) => /schooling chain/i.test(n.label))).toBe(true);
    expect(r.sources.some((s) => /uni-assist/i.test(s.name))).toBe(true);
  });

  it("diploma+lateral, Bachelor ONGOING (sem 3) → complete_degree (finish first), not a rejection", () => {
    const education = summarizeEducation(
      profile({
        educationPathType: "diploma_lateral",
        educationStages: [
          { id: "1", level: "diploma", status: "completed", startYear: "2019", endYear: "2022", institution: "", board: "" },
          { id: "2", level: "bachelor", status: "ongoing", entryType: "lateral", currentSemester: "3", startYear: "2022", endYear: "2025", institution: "", board: "" },
        ],
      }),
    );
    const r = evaluatePathway(input({ highestQualification: "some_bachelor", targetLevel: "master", education }));
    expect(r.route).toBe("complete_degree");
    expect(r.title).toMatch(/finish your bachelor first/i);
    expect(r.summary).toMatch(/semester 3/i);
  });

  it("diploma only, no Bachelor → ausbildung route surfaces the Ausbildung alternative", () => {
    const education = summarizeEducation(profile({ educationPathType: "diploma_only" }));
    const r = evaluatePathway(input({ highestQualification: "", targetLevel: "master", education }));
    expect(r.route).toBe("ausbildung");
    expect(r.notes.some((n) => /Ausbildung/i.test(n.label))).toBe(true);
    expect(r.notes.some((n) => /university HZB/i.test(n.label))).toBe(true);
    expect(r.sources.some((s) => /Ausbildung/i.test(s.name))).toBe(true);
  });

  it("a linear bachelor is unaffected (still the standard Master's route)", () => {
    const education = summarizeEducation(profile({ highestQualification: "bachelor", educationPathType: "regular" }));
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "master", education }));
    expect(r.route).toBe("master");
    expect(r.title).not.toMatch(/lateral/i);
  });

  it("missing class 12 + completed degree + target BACHELOR → uses the degree, not a blind Studienkolleg (COR-7)", () => {
    const education = summarizeEducation(profile({ highestQualification: "bachelor", educationPathType: "diploma_lateral" }));
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "bachelor", targetSubject: "Computer Science", education }));
    expect(r.route).toBe("master"); // lateralMaster nudges them to use the degree they hold
    expect(r.route).not.toBe("studienkolleg");
  });

  it("missing class 12 still routes MEDICINE through the medicine route (not lateralMaster)", () => {
    const education = summarizeEducation(profile({ highestQualification: "bachelor", educationPathType: "diploma_lateral" }));
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "medicine", targetSubject: "Medicine", education }));
    expect(r.route).toBe("medicine");
  });
});
