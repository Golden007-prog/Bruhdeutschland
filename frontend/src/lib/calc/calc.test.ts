import { describe, expect, it } from "vitest";

import { computeCost, CITY_PROFILES, formatEur } from "./costOfLiving";
import { alertable, daysUntil, formatDate, relativeLabel, severityFor, sortByDate } from "./deadlines";
import { creditsToEcts, summarizeEcts } from "./ects";
import { convertToGermanGpa, formatGermanGrade, roundHalfUp } from "./gpa";

describe("gpa / Modified Bavarian Formula", () => {
  const percent = { best: 100, minPass: 40 };

  it("maps the best grade to 1.0 and the pass grade to 4.0", () => {
    expect(convertToGermanGpa(100, percent).germanGrade).toBe(1.0);
    expect(convertToGermanGpa(40, percent).germanGrade).toBe(4.0);
  });

  it("converts a mid-range percentage deterministically", () => {
    // 1 + 3*(100-75)/(100-40) = 1 + 3*25/60 = 2.25 -> 2.3 (half-up, 1 dp)
    const r = convertToGermanGpa(75, percent);
    expect(r.raw).toBeCloseTo(2.25, 6);
    expect(r.germanGrade).toBe(2.3);
  });

  it("clamps grades better than best / worse than pass into [1.0, 4.0]", () => {
    expect(convertToGermanGpa(110, percent).germanGrade).toBe(1.0);
    expect(convertToGermanGpa(110, percent).clamped).toBe(true);
    const failing = convertToGermanGpa(20, percent);
    expect(failing.germanGrade).toBe(4.0);
    expect(failing.isPassing).toBe(false);
  });

  it("handles a 10-point CGPA scale (higher is better)", () => {
    expect(convertToGermanGpa(10, { best: 10, minPass: 4 }).germanGrade).toBe(1.0);
    expect(convertToGermanGpa(4, { best: 10, minPass: 4 }).germanGrade).toBe(4.0);
  });

  it("rejects degenerate scales and non-finite input", () => {
    expect(() => convertToGermanGpa(50, { best: 5, minPass: 5 })).toThrow();
    expect(() => convertToGermanGpa(Number.NaN, percent)).toThrow();
  });

  it("rounds half-up and formats with a comma decimal", () => {
    expect(roundHalfUp(2.25, 1)).toBe(2.3);
    expect(formatGermanGrade(1.7)).toBe("1,7");
  });
});

describe("ects", () => {
  it("sums credits and derives equivalent years + workload band", () => {
    const s = summarizeEcts([
      { id: "a", name: "A", ects: 30 },
      { id: "b", name: "B", ects: 30 },
    ]);
    expect(s.totalEcts).toBe(60);
    expect(s.equivalentYears).toBe(1);
    expect(s.workloadHoursMin).toBe(1500);
    expect(s.workloadHoursMax).toBe(1800);
  });

  it("rejects negative credits", () => {
    expect(() => summarizeEcts([{ id: "x", name: "X", ects: -1 }])).toThrow();
  });

  it("scales non-ECTS credit totals", () => {
    // 160 credits over 4 years = 40/yr -> 60/40 factor -> 240 ECTS
    expect(creditsToEcts(160, 40)).toBe(240);
  });
});

describe("costOfLiving", () => {
  it("sums a city baseline and applies overrides", () => {
    const munich = CITY_PROFILES.find((c) => c.city === "Munich")!;
    const base = computeCost(munich);
    expect(base.monthlyTotal).toBe(750 + 250 + 40 + 130 + 180);
    expect(base.annualTotal).toBe(base.monthlyTotal * 12);

    const cheaper = computeCost(munich, { rent: 500 });
    expect(cheaper.monthlyTotal).toBe(base.monthlyTotal - 250);
  });

  it("rejects negative line items and formats euros", () => {
    const munich = CITY_PROFILES[0];
    expect(() => computeCost(munich, { rent: -1 })).toThrow();
    expect(formatEur(11904)).toBe("€11,904");
  });
});

describe("deadlines", () => {
  const now = new Date(2026, 5, 19); // 2026-06-19, fixed reference

  it("computes whole days until a date", () => {
    expect(daysUntil("2026-06-19", now)).toBe(0);
    expect(daysUntil("2026-06-26", now)).toBe(7);
    expect(daysUntil("2026-06-12", now)).toBe(-7);
  });

  it("buckets severity correctly", () => {
    expect(severityFor("2026-06-12", now)).toBe("overdue");
    expect(severityFor("2026-06-22", now)).toBe("urgent");
    expect(severityFor("2026-07-10", now)).toBe("soon");
    expect(severityFor("2026-09-01", now)).toBe("info");
  });

  it("produces relative labels and formatted dates", () => {
    expect(relativeLabel("2026-06-19", now)).toBe("today");
    expect(relativeLabel("2026-06-20", now)).toBe("tomorrow");
    expect(relativeLabel("2026-06-26", now)).toBe("in 7 days");
    expect(formatDate("2026-07-15")).toBe("15 Jul 2026");
  });

  it("sorts ascending and filters alertable (soon-or-worse) events", () => {
    const events = [
      { id: "1", title: "far", date: "2026-09-01", category: "visa" as const },
      { id: "2", title: "urgent", date: "2026-06-22", category: "finance" as const },
      { id: "3", title: "soon", date: "2026-07-10", category: "documents" as const },
    ];
    expect(sortByDate(events).map((e) => e.id)).toEqual(["2", "3", "1"]);
    expect(alertable(events, now).map((e) => e.id)).toEqual(["2", "3"]);
  });
});
