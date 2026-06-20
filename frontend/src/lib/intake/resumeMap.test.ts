import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";
import { mapResumeDetails, type ResumeDetails } from "./resumeMap";

const details = (patch: Partial<ResumeDetails>): ResumeDetails => ({
  careerGoal: "", englishTestType: "", englishTestScore: "", germanTestType: "",
  mediumOfInstruction: "", gradeValue: "", gradeScale: "", graduationDate: "",
  dateOfBirth: "", targetField: "", highestQualification: "", coreSkills: [],
  ...patch,
});
const blank: UserProfile = DEFAULT_PROFILE;

describe("mapResumeDetails", () => {
  it("normalises loose test names + keeps the score", () => {
    const p = mapResumeDetails(blank, details({ englishTestType: "IELTS Academic", englishTestScore: "6.5", germanTestType: "TestDaF" }));
    expect(p.englishTestType).toBe("ielts");
    expect(p.englishTestScore).toBe("6.5");
    expect(p.germanTestType).toBe("testdaf");
  });

  it("maps medium of instruction + grade scale", () => {
    expect(mapResumeDetails(blank, details({ mediumOfInstruction: "English-medium" })).mediumOfInstruction).toBe("english");
    expect(mapResumeDetails(blank, details({ mediumOfInstruction: "Hindi" })).mediumOfInstruction).toBe("other");
    expect(mapResumeDetails(blank, details({ gradeScale: "CGPA out of 10" })).gradeScale).toBe("cgpa10");
    expect(mapResumeDetails(blank, details({ gradeScale: "85 percent" })).gradeScale).toBe("percent");
  });

  it("infers highest qualification from a degree mention", () => {
    expect(mapResumeDetails(blank, details({ highestQualification: "Bachelor of Technology" })).highestQualification).toBe("bachelor");
    expect(mapResumeDetails(blank, details({ highestQualification: "Higher Secondary (Class 12)" })).highestQualification).toBe("class12");
    expect(mapResumeDetails(blank, details({ highestQualification: "M.Sc. Physics" })).highestQualification).toBe("master");
  });

  it("only accepts well-formed dates", () => {
    expect(mapResumeDetails(blank, details({ graduationDate: "2024-05" })).graduationDate).toBe("2024-05");
    expect(mapResumeDetails(blank, details({ graduationDate: "2024" })).graduationDate).toBeUndefined();
    expect(mapResumeDetails(blank, details({ dateOfBirth: "2000-01-15" })).dateOfBirth).toBe("2000-01-15");
  });

  it("never overwrites a field the user already filled", () => {
    const filled: UserProfile = { ...DEFAULT_PROFILE, careerGoal: "my goal", englishTestType: "toefl", gradeScale: "gpa4" };
    const p = mapResumeDetails(filled, details({ careerGoal: "other", englishTestType: "IELTS", gradeScale: "percent" }));
    expect(p.careerGoal).toBeUndefined();
    expect(p.englishTestType).toBeUndefined();
    expect(p.gradeScale).toBeUndefined();
  });
});
