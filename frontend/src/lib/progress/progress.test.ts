import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";
import { ROADMAP_STEPS } from "@/lib/seed/process";
import {
  completion,
  completionByCategory,
  categoryOf,
  nextActions,
  profileCompleteness,
  readinessScore,
  type StatusMap,
} from "./progress";

const full: UserProfile = {
  ...DEFAULT_PROFILE,
  name: "Jane",
  homeCountry: "India",
  currentDegree: "B.Tech",
  gradeValue: "8.4",
  gradeScale: "cgpa10",
  targetField: "Data Engineering",
  germanLevel: "B1",
  targetIntake: "WS",
};

describe("completion", () => {
  it("is 0% for an untouched roadmap and counts done steps", () => {
    expect(completion({}, ROADMAP_STEPS).pct).toBe(0);
    const map: StatusMap = { "ps-evaluate": "done", "ps-shortlist": "done" };
    const c = completion(map, ROADMAP_STEPS);
    expect(c.done).toBe(2);
    expect(c.total).toBe(ROADMAP_STEPS.length);
    expect(c.pct).toBe(Math.round((2 / ROADMAP_STEPS.length) * 100));
  });
});

describe("categoryOf / completionByCategory", () => {
  it("derives category from the step route", () => {
    const profileStep = ROADMAP_STEPS.find((s) => s.id === "ps-evaluate")!;
    expect(categoryOf(profileStep)).toBe("profile");
  });

  it("reports every represented category and 100% when its steps are done", () => {
    const map: StatusMap = { "ps-evaluate": "done", "ps-shortlist": "done" };
    const byCat = completionByCategory(map, ROADMAP_STEPS);
    const profile = byCat.find((c) => c.key === "profile");
    expect(profile?.completion.pct).toBe(100);
    // all categories present have at least one step
    expect(byCat.every((c) => c.completion.total > 0)).toBe(true);
  });
});

// DEFAULT_PROFILE seeds homeCountry "India" (India-primary), so a truly-empty profile clears it.
const empty: UserProfile = { ...DEFAULT_PROFILE, homeCountry: "" };

describe("profileCompleteness + readinessScore", () => {
  it("is 0 for an empty profile and 100 for a full one", () => {
    expect(profileCompleteness(empty)).toBe(0);
    expect(profileCompleteness(full)).toBe(100);
  });

  it("readiness is 0 with nothing done and 100 when profile + roadmap complete", () => {
    expect(readinessScore(empty, {}, ROADMAP_STEPS)).toBe(0);
    const allDone: StatusMap = Object.fromEntries(ROADMAP_STEPS.map((s) => [s.id, "done"]));
    expect(readinessScore(full, allDone, ROADMAP_STEPS)).toBe(100);
  });
});

describe("nextActions", () => {
  it("returns the first not-done steps in order", () => {
    const map: StatusMap = { "ps-evaluate": "done" };
    const next = nextActions(map, ROADMAP_STEPS, 2);
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("ps-shortlist");
  });
});
