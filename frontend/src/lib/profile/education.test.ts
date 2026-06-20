import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type EducationStage, type UserProfile } from "./types";
import { summarizeEducation } from "./education";

const make = (over: Partial<UserProfile>): UserProfile => ({ ...DEFAULT_PROFILE, ...over });
const stage = (over: Partial<EducationStage>): EducationStage => ({
  id: Math.random().toString(36).slice(2),
  level: "class10",
  status: "completed",
  startYear: "",
  endYear: "",
  institution: "",
  board: "",
  ...over,
});

describe("summarizeEducation — fallback from highestQualification", () => {
  it("treats a linear bachelor as having class 12", () => {
    const s = summarizeEducation(make({ highestQualification: "bachelor" }));
    expect(s.hasClass12).toBe(true);
    expect(s.degreeCompleted).toBe(true);
    expect(s.missingClass12).toBe(false);
    expect(s.qualifyingCredential).toBe("degree");
  });

  it("flags a diploma+lateral bachelor as missing class 12", () => {
    const s = summarizeEducation(make({ highestQualification: "bachelor", educationPathType: "diploma_lateral" }));
    expect(s.hasClass12).toBe(false);
    expect(s.missingClass12).toBe(true);
    expect(s.degreeCompleted).toBe(true);
    expect(s.qualifyingCredential).toBe("degree");
    expect(s.isNonLinear).toBe(true);
  });

  it("treats diploma_only as a diploma credential, not a degree", () => {
    const s = summarizeEducation(make({ highestQualification: "", educationPathType: "diploma_only" }));
    expect(s.degreeCompleted).toBe(false);
    expect(s.missingClass12).toBe(true);
    expect(s.qualifyingCredential).toBe("diploma");
  });
});

describe("summarizeEducation — from structured stages", () => {
  it("sums total years and reads lateral entry + ongoing semester", () => {
    const s = summarizeEducation(
      make({
        educationPathType: "diploma_lateral",
        educationStages: [
          stage({ level: "class10", startYear: "2018", endYear: "2019" }),
          stage({ level: "diploma", startYear: "2019", endYear: "2022" }),
          stage({ level: "bachelor", status: "ongoing", entryType: "lateral", currentSemester: "3", startYear: "2022", endYear: "2025" }),
        ],
      }),
    );
    expect(s.hasClass12).toBe(false);
    expect(s.missingClass12).toBe(true);
    expect(s.degreeOngoing).toBe(true);
    expect(s.degreeCompleted).toBe(false);
    expect(s.bachelorEntryType).toBe("lateral");
    expect(s.currentSemester).toBe(3);
    expect(s.totalYears).toBe(1 + 3 + 3);
    expect(s.yearsOfDegree).toBe(3);
  });

  it("recognises class 12 in the chain", () => {
    const s = summarizeEducation(
      make({
        educationPathType: "regular",
        educationStages: [
          stage({ level: "class12", startYear: "2018", endYear: "2020" }),
          stage({ level: "bachelor", status: "completed", entryType: "regular", startYear: "2020", endYear: "2024" }),
        ],
      }),
    );
    expect(s.hasClass12).toBe(true);
    expect(s.missingClass12).toBe(false);
    expect(s.degreeCompleted).toBe(true);
  });

  it("a completed lateral bachelor is degree-completed despite no class 12", () => {
    const s = summarizeEducation(
      make({
        educationStages: [
          stage({ level: "diploma", startYear: "2018", endYear: "2021" }),
          stage({ level: "bachelor", status: "completed", entryType: "lateral", startYear: "2021", endYear: "2024" }),
        ],
      }),
    );
    expect(s.missingClass12).toBe(true);
    expect(s.degreeCompleted).toBe(true);
    expect(s.qualifyingCredential).toBe("degree");
    expect(s.pathType).toBe("diploma_lateral");
  });
});
