import { describe, expect, it } from "vitest";

import { computeFeasibility } from "./feasibility";

describe("computeFeasibility", () => {
  it("returns a blocked verdict with zero score for the blocked route", () => {
    const r = computeFeasibility({
      route: "blocked",
      targetLevel: "bachelor",
      highestQualification: "class10",
      germanLevel: "none",
      englishTaught: false,
    });
    expect(r.band).toBe("blocked");
    expect(r.score).toBe(0);
    expect(r.estYearsMin).toBe(0);
  });

  it("scores a Bachelor+English Master's applicant as strong", () => {
    const r = computeFeasibility({
      route: "master",
      targetLevel: "master",
      highestQualification: "bachelor",
      germanLevel: "B1",
      englishTaught: true,
    });
    expect(r.band).toBe("strong");
    expect(r.score).toBeGreaterThanOrEqual(75);
    // prep 1-2 + master 2-2
    expect(r.estYearsMin).toBe(3);
  });

  it("penalises a German gap on a German-taught route", () => {
    const withGerman = computeFeasibility({
      route: "master", targetLevel: "master", highestQualification: "bachelor", germanLevel: "C1", englishTaught: false,
    });
    const withoutGerman = computeFeasibility({
      route: "master", targetLevel: "master", highestQualification: "bachelor", germanLevel: "A2", englishTaught: false,
    });
    expect(withoutGerman.score).toBeLessThan(withGerman.score);
    // The German gap adds a prep year.
    expect(withoutGerman.estYearsMin).toBeGreaterThan(withGerman.estYearsMin);
  });

  it("routes an ongoing-degree (complete_degree) to a 'finish first' read, not a feasible Master's", () => {
    const r = computeFeasibility({ route: "complete_degree", targetLevel: "master", highestQualification: "some_bachelor", germanLevel: "B1", englishTaught: true });
    expect(r.band).toBe("challenging");
    expect(r.score).toBeLessThan(55);
    expect(r.factors[0].label).toMatch(/finish your bachelor first/i);
  });

  it("routes diploma-only (ausbildung) to a low, honest read — never 'feasible Master's'", () => {
    const r = computeFeasibility({ route: "ausbildung", targetLevel: "master", highestQualification: "", germanLevel: "none", englishTaught: true });
    expect(r.band).toBe("challenging");
    expect(r.score).toBeLessThan(40);
    expect(r.factors[0].detail).toMatch(/diploma/i);
  });

  it("keeps the score within 0–100", () => {
    const r = computeFeasibility({
      route: "medicine", targetLevel: "medicine", highestQualification: "class12", germanLevel: "none", englishTaught: false,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
