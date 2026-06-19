import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";
import { SEED_PROGRAMS } from "@/lib/seed/programs";
import { eligibility } from "./eligibility";
import { facetCounts, fuzzyScore, lexicalScore, rankByQuery, runSearch } from "./search";

const csProfile: UserProfile = {
  ...DEFAULT_PROFILE,
  name: "Jane",
  homeCountry: "India",
  currentDegree: "B.Tech Computer Science",
  targetField: "Computer Science",
  germanLevel: "B1",
  gradeValue: "8.4",
  gradeScale: "cgpa10",
};

describe("seed programmes are real, not fabricated (ADR-0006)", () => {
  it("every programme has https provenance + needs_verification + a real institution", () => {
    expect(SEED_PROGRAMS.length).toBeGreaterThanOrEqual(20);
    for (const p of SEED_PROGRAMS) {
      expect(p.sourceUrl).toMatch(/^https:\/\//);
      expect(p.needsVerification).toBe(true);
      expect(p.university.length).toBeGreaterThan(3);
      expect(/\b(demo|sample|lorem|example|placeholder|fake)\b/i.test(`${p.university} ${p.name}`)).toBe(false);
    }
  });
});

describe("hybrid search", () => {
  it("ranks an exact match at the top", () => {
    const r = rankByQuery(SEED_PROGRAMS, "machine learning");
    expect(r[0].program.name).toBe("Machine Learning");
  });

  it("is typo-tolerant where keyword-only fails", () => {
    const typo = "machien learnig";
    const ml = SEED_PROGRAMS.find((p) => p.name === "Machine Learning")!;
    expect(lexicalScore(ml, typo)).toBe(0); // pure keyword misses the typo
    expect(fuzzyScore(ml, typo)).toBeGreaterThan(0.18); // fuzzy catches it
    const r = rankByQuery(SEED_PROGRAMS, typo);
    expect(r.some((s) => s.program.name === "Machine Learning")).toBe(true);
  });

  it("facet counts cover the whole set (one language each)", () => {
    const f = facetCounts(SEED_PROGRAMS, {});
    expect(f.language.reduce((a, b) => a + b.count, 0)).toBe(SEED_PROGRAMS.length);
  });

  it("runSearch applies facet filters (AND across facets)", () => {
    const res = runSearch(SEED_PROGRAMS, { bundesland: ["Bavaria"] }, "az");
    expect(res.total).toBeGreaterThan(0);
    expect(res.results.every((s) => s.program.bundesland === "Bavaria")).toBe(true);
  });
});

describe("eligibility is honest (never guesses unknowns)", () => {
  it("matches subject + English instruction, leaves the unpublished grade bar Unknown", () => {
    const tum = SEED_PROGRAMS.find((p) => p.id === "tum-informatics")!;
    const e = eligibility(csProfile, tum);
    expect(e.criteria.find((c) => c.key === "field")!.status).toBe("meets");
    expect(e.criteria.find((c) => c.key === "language")!.status).toBe("meets");
    expect(e.criteria.find((c) => c.key === "grade")!.status).toBe("unknown");
    expect(["likely", "borderline"]).toContain(e.rollup);
  });
});
