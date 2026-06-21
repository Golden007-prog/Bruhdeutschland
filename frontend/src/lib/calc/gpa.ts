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

/**
 * Indicative competitiveness tier from a German grade (gap analysis G1-1). This is an ORIENTATION band,
 * NOT an admission threshold — German programmes set their own (often per-year) cut-offs, decided by the
 * university/anabin, never by us (CLAUDE.md golden rule #2). The bands are deliberately coarse and the
 * UI must label every output "indicative, non-binding". Lower German grade = better (1,0 is best).
 */
export type GradeTier = "top" | "competitive" | "moderate" | "limited" | "below_pass";

export interface GradeTierInfo {
  tier: GradeTier;
  label: string;
  /** A plain-language, explicitly non-binding read on what this grade tends to open. */
  detail: string;
}

const TIER_INFO: Record<GradeTier, GradeTierInfo> = {
  top: { tier: "top", label: "Top band (≤ 1,5)", detail: "Around 1,0–1,5 — generally opens the widest set of programmes, including selective ones. Still no guarantee: NC programmes set their own yearly cut-offs." },
  competitive: { tier: "competitive", label: "Competitive (1,6–2,5)", detail: "Around 1,6–2,5 — a solid, competitive range for many programmes; very selective ones may sit out of reach in a strong year." },
  moderate: { tier: "moderate", label: "Moderate (2,6–3,0)", detail: "Around 2,6–3,0 — workable for less selective programmes; widen your shortlist and lean on a strong overall profile." },
  limited: { tier: "limited", label: "Limited (3,1–4,0)", detail: "Around 3,1–4,0 — still a pass, but options narrow; target programmes with open or low-NC admission and strengthen other parts of your file." },
  below_pass: { tier: "below_pass", label: "Below passing", detail: "Below the German passing bar (worse than 4,0) — this would not meet a degree's minimum; re-check the grade and scale entered." },
};

/** Map a German grade (1,0 best … 4,0 pass) to an indicative, NON-BINDING competitiveness tier. */
export function gradeTier(germanGrade: number): GradeTierInfo {
  if (!Number.isFinite(germanGrade)) throw new Error("germanGrade must be finite");
  if (germanGrade > PASS_GERMAN_GRADE + TOL) return TIER_INFO.below_pass;
  if (germanGrade <= 1.5) return TIER_INFO.top;
  if (germanGrade <= 2.5) return TIER_INFO.competitive;
  if (germanGrade <= 3.0) return TIER_INFO.moderate;
  return TIER_INFO.limited;
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
