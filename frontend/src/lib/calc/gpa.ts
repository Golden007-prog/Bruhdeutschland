/**
 * Deterministic GPA conversion via the Modified Bavarian Formula (CLAUDE.md golden rule 4).
 *
 * Mirrors the tested backend `app/services/gpa_converter.py`. German universities and uni-assist
 * convert foreign grades with the KMK-stipulated formula:
 *
 *     german = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
 *
 * where `Nmax` is the best achievable grade, `Nmin` the lowest passing grade, and `Nd` the grade
 * achieved. The result lies in 1.0 (best) .. 4.0 (just passing). This is pure arithmetic — it runs
 * no model inference and reads no live data, so the converted grade is shown "stamped" / verified.
 */

/** The German grade band: 1.0 is the best mark, 4.0 the lowest passing mark. */
export const BEST_GERMAN_GRADE = 1.0;
export const PASS_GERMAN_GRADE = 4.0;

/** Identifier recorded on every conversion for provenance/auditability. */
export const GPA_METHOD = "Modified Bavarian Formula";

const TOL = 1e-9;

/** A source grading scale described by its best grade and minimum passing grade. */
export interface GradeScale {
  /** Nmax — value of the best achievable grade. */
  best: number;
  /** Nmin — value of the lowest passing grade. */
  minPass: number;
  name?: string;
}

export interface GpaConversion {
  /** Clamped to [1.0, 4.0] and rounded to `decimals`. */
  germanGrade: number;
  /** Unrounded, unclamped formula output (kept for auditing). */
  raw: number;
  sourceGrade: number;
  scale: GradeScale;
  method: typeof GPA_METHOD;
  /** True if `raw` fell outside [1.0, 4.0]. */
  clamped: boolean;
  /** True if the source grade meets the minimum pass (raw <= 4.0). */
  isPassing: boolean;
}

/** Round half-up to `decimals` places (German transcripts report grades to one decimal). */
export function roundHalfUp(value: number, decimals: number): number {
  const f = 10 ** decimals;
  // +TOL guards against binary-float representation pulling x.5 just below the boundary.
  return Math.round((value + TOL) * f) / f;
}

/**
 * Convert `sourceGrade` on `scale` to a German grade via the Modified Bavarian Formula.
 * Throws on non-finite input or a degenerate scale (best === minPass).
 */
export function convertToGermanGpa(
  sourceGrade: number,
  scale: GradeScale,
  decimals = 1,
): GpaConversion {
  if (!Number.isFinite(sourceGrade)) throw new Error("sourceGrade must be a finite number");
  if (!Number.isFinite(scale.best) || !Number.isFinite(scale.minPass)) {
    throw new Error("grade scale endpoints must be finite");
  }
  if (scale.best === scale.minPass) throw new Error("scale 'best' and 'minPass' must differ");
  if (decimals < 0) throw new Error("decimals must be non-negative");

  const raw = 1.0 + (3.0 * (scale.best - sourceGrade)) / (scale.best - scale.minPass);
  const clampedValue = Math.min(Math.max(raw, BEST_GERMAN_GRADE), PASS_GERMAN_GRADE);

  return {
    germanGrade: roundHalfUp(clampedValue, decimals),
    raw,
    sourceGrade,
    scale,
    method: GPA_METHOD,
    clamped: raw < BEST_GERMAN_GRADE - TOL || raw > PASS_GERMAN_GRADE + TOL,
    isPassing: raw <= PASS_GERMAN_GRADE + TOL,
  };
}

/** Format a German grade with a comma decimal, one place: 1.7 -> "1,7". */
export function formatGermanGrade(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Common source scales offered in the Profile Evaluation UI. */
export const COMMON_SCALES: Record<string, GradeScale> = {
  // India / many systems: percentage, 100 best, 40 typical pass.
  percent: { best: 100, minPass: 40, name: "Percentage (best 100, pass 40)" },
  // 10-point CGPA (e.g. many Indian universities): 10 best, 4 pass.
  cgpa10: { best: 10, minPass: 4, name: "CGPA / 10 (best 10, pass 4)" },
  // 4-point GPA (US): 4 best, 1 pass (varies by institution).
  gpa4: { best: 4, minPass: 1, name: "GPA / 4 (best 4, pass 1)" },
  // UK percentage with 40 pass behaves like `percent`.
};
