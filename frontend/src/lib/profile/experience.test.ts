import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile, type WorkExperience } from "./types";
import { formatYearsMonths, monthIndex, summarizeExperience, unionMonths, yearsFrom } from "./experience";

let n = 0;
const role = (p: Partial<WorkExperience>): WorkExperience => ({
  id: `r${++n}`,
  title: "Engineer",
  employer: "Acme",
  country: "India",
  employmentType: "full_time",
  startDate: "2022-01",
  endDate: "2024-01",
  ongoing: false,
  domain: "Software",
  skills: [],
  description: "",
  relevantToTarget: true,
  ...p,
});

const profile = (exps: WorkExperience[], grad = ""): UserProfile => ({
  ...DEFAULT_PROFILE,
  graduationDate: grad,
  workExperiences: exps,
});

describe("monthIndex", () => {
  it("parses YYYY-MM and rejects junk", () => {
    expect(monthIndex("2024-01")).toBe(2024 * 12 + 0);
    expect(monthIndex("2024-12")).toBe(2024 * 12 + 11);
    expect(monthIndex("2024-13")).toBeNull();
    expect(monthIndex("nope")).toBeNull();
  });
});

describe("unionMonths (no double-counting concurrent roles)", () => {
  it("merges overlapping intervals", () => {
    expect(unionMonths([{ start: 0, end: 12 }, { start: 6, end: 18 }])).toBe(18);
    expect(unionMonths([{ start: 0, end: 12 }, { start: 12, end: 24 }])).toBe(24);
    expect(unionMonths([])).toBe(0);
  });
});

describe("summarizeExperience", () => {
  it("totals professional months and excludes volunteer work", () => {
    const s = summarizeExperience(
      profile([role({ startDate: "2022-01", endDate: "2024-01" }), role({ employmentType: "volunteer", startDate: "2020-01", endDate: "2021-01" })]),
      "2024-06",
    );
    expect(s.totalMonths).toBe(24); // only the full-time role; volunteer excluded
    expect(yearsFrom(s.totalMonths)).toBe(2);
    expect(s.hasExperience).toBe(true);
  });

  it("counts ongoing roles up to 'now'", () => {
    const s = summarizeExperience(profile([role({ startDate: "2024-01", endDate: "", ongoing: true })]), "2024-07");
    expect(s.totalMonths).toBe(6);
    expect(s.currentlyEmployed).toBe(true);
  });

  it("separates relevant from total", () => {
    const s = summarizeExperience(
      profile([role({ startDate: "2022-01", endDate: "2023-01", relevantToTarget: true }), role({ startDate: "2023-01", endDate: "2024-01", relevantToTarget: false })]),
      "2024-01",
    );
    expect(s.totalMonths).toBe(24);
    expect(s.relevantMonths).toBe(12);
  });

  it("computes post-degree full-time months for EPOS-style rules", () => {
    // Full-time 2021-01..2024-01 but degree obtained 2022-06 → only post-degree months count.
    const s = summarizeExperience(profile([role({ startDate: "2021-01", endDate: "2024-01" })], "2022-06"), "2024-06");
    expect(s.postDegreeFullTimeMonths).toBe(2024 * 12 + 0 - (2022 * 12 + 5)); // Jun-2022 → Jan-2024
    expect(s.monthsSinceGraduation).toBe(2024 * 12 + 5 - (2022 * 12 + 5)); // 24
  });

  it("flags a study/work gap since graduation", () => {
    // Graduated 2022-01, only job 2023-01..2024-01 → 12-month gap before the job.
    const s = summarizeExperience(profile([role({ startDate: "2023-01", endDate: "2024-01" })], "2022-01"), "2024-01");
    expect(s.gapMonths).toBe(12);
  });

  it("is empty for a new user (no fake value)", () => {
    const s = summarizeExperience(DEFAULT_PROFILE, "2024-06");
    expect(s.hasExperience).toBe(false);
    expect(s.totalMonths).toBe(0);
    expect(s.monthsSinceGraduation).toBeNull();
  });
});

describe("formatYearsMonths", () => {
  it("formats human durations", () => {
    expect(formatYearsMonths(0)).toBe("0");
    expect(formatYearsMonths(5)).toBe("5 mos");
    expect(formatYearsMonths(12)).toBe("1 yr");
    expect(formatYearsMonths(27)).toBe("2 yrs 3 mos");
  });
});
