/**
 * Deterministic ECTS arithmetic (CLAUDE.md golden rule 4). Mirrors the backend
 * `app/services/ects_calculator.py` contract: pure summation/normalization, never model-produced.
 *
 * ECTS (European Credit Transfer System): 1 academic year of full-time study ≈ 60 ECTS, so a
 * 2-year Master's is typically 120 ECTS and a 3-year Bachelor's 180. One ECTS credit corresponds
 * to roughly 25–30 hours of total student workload.
 */

export const ECTS_PER_YEAR = 60;
export const HOURS_PER_ECTS_MIN = 25;
export const HOURS_PER_ECTS_MAX = 30;

export interface CourseEntry {
  id: string;
  name: string;
  ects: number;
}

export interface EctsSummary {
  totalEcts: number;
  courseCount: number;
  /** Equivalent full-time years at 60 ECTS/year, to one decimal. */
  equivalentYears: number;
  /** Estimated total workload band in hours. */
  workloadHoursMin: number;
  workloadHoursMax: number;
}

/** Sum a list of course credits into a deterministic ECTS summary. Negative credits are rejected. */
export function summarizeEcts(courses: CourseEntry[]): EctsSummary {
  let total = 0;
  for (const c of courses) {
    if (!Number.isFinite(c.ects)) throw new Error(`course ${c.id}: ects must be finite`);
    if (c.ects < 0) throw new Error(`course ${c.id}: ects must be non-negative`);
    total += c.ects;
  }
  return {
    totalEcts: Math.round(total * 100) / 100,
    courseCount: courses.length,
    equivalentYears: Math.round((total / ECTS_PER_YEAR) * 10) / 10,
    workloadHoursMin: total * HOURS_PER_ECTS_MIN,
    workloadHoursMax: total * HOURS_PER_ECTS_MAX,
  };
}

/**
 * Convert a non-ECTS credit total to ECTS by linear scaling against the home system's
 * credits-per-year. E.g. 160 US-style credits over a 4-year degree → 40/year → factor 1.5.
 */
export function creditsToEcts(totalCredits: number, homeCreditsPerYear: number): number {
  if (homeCreditsPerYear <= 0) throw new Error("homeCreditsPerYear must be positive");
  return Math.round(((totalCredits / homeCreditsPerYear) * ECTS_PER_YEAR) * 100) / 100;
}
