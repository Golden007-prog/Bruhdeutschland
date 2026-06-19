/**
 * Deterministic band / scale / CEFR conversions (work-order §4/§7). All exam aggregates are computed
 * here in tested TypeScript — never by the model. Covers:
 *   - IELTS half-band rounding (.25 → up to half, .75 → up to whole)
 *   - TOEFL-2026 1–6 CEFR-aligned banding from section accuracy, overall averaging, and the temporary
 *     0–120 concordance shown through ~2028
 *   - a LEGACY 0–120 → 1–6 interpreter so a student holding an old TOEFL score still gets tracking
 *
 * Every threshold below is INDICATIVE and `needs_verification` — official conversions vary per form
 * and ETS pages are still transitioning. The UI must show the re-verify affordance and disclaimer.
 */

/** Round to the nearest 0.5 (IELTS / TOEFL-2026 band rule). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Average a list of half-band sub-scores and round to the nearest half band. */
export function averageBand(bands: number[]): number | undefined {
  if (bands.length === 0) return undefined;
  return roundToHalf(bands.reduce((a, b) => a + b, 0) / bands.length);
}

// ── TOEFL-2026: section accuracy (%) → 1–6 band ───────────────────────────────────────────────────
/** Descending accuracy→band thresholds (indicative; work-order §4 — needs_verification). */
const TOEFL_ACC_TO_BAND: { minPct: number; band: number }[] = [
  { minPct: 95, band: 6.0 },
  { minPct: 88, band: 5.5 },
  { minPct: 80, band: 5.0 },
  { minPct: 70, band: 4.5 },
  { minPct: 60, band: 4.0 },
  { minPct: 50, band: 3.5 },
  { minPct: 40, band: 3.0 },
  { minPct: 30, band: 2.5 },
  { minPct: 20, band: 2.0 },
  { minPct: 10, band: 1.5 },
  { minPct: 0, band: 1.0 },
];

export function accuracyToBand1to6(percent: number): number {
  for (const row of TOEFL_ACC_TO_BAND) {
    if (percent >= row.minPct) return row.band;
  }
  return 1.0;
}

// ── CEFR mapping for the 1–6 band (work-order §4: 6≈C2; 5–5.5≈C1; 4–4.5≈B2; 3–3.5≈B1 …) ──────────
export function bandToCefr(band: number): string {
  if (band >= 6) return "C2";
  if (band >= 5) return "C1";
  if (band >= 4) return "B2";
  if (band >= 3) return "B1";
  if (band >= 2) return "A2";
  return "A1";
}

// ── 0–120 concordance for the overall 1–6 band (transition aid, shown ~through 2028) ──────────────
/** Indicative 0–120 ranges per overall band (work-order §4: 6≈114–120, 5≈95+, 4≈72+, 3≈44+). */
const BAND_TO_120: { band: number; min: number; max: number }[] = [
  { band: 6.0, min: 114, max: 120 },
  { band: 5.5, min: 105, max: 113 },
  { band: 5.0, min: 95, max: 104 },
  { band: 4.5, min: 84, max: 94 },
  { band: 4.0, min: 72, max: 83 },
  { band: 3.5, min: 58, max: 71 },
  { band: 3.0, min: 44, max: 57 },
  { band: 2.5, min: 35, max: 43 },
  { band: 2.0, min: 27, max: 34 },
  { band: 1.5, min: 19, max: 26 },
  { band: 1.0, min: 0, max: 18 },
];

export interface Concordance120 {
  min: number;
  max: number;
  /** A representative midpoint, for a single number where one is needed. */
  rep: number;
}

export function band1to6To120(band: number): Concordance120 {
  const row = BAND_TO_120.find((r) => r.band === roundToHalf(band)) ?? BAND_TO_120[BAND_TO_120.length - 1];
  return { min: row.min, max: row.max, rep: Math.round((row.min + row.max) / 2) };
}

/** LEGACY interpreter: a held 0–120 TOEFL score → the new 1–6 band (+ CEFR via {@link bandToCefr}). */
export function legacy120ToBand1to6(score: number): number {
  const clamped = Math.max(0, Math.min(120, score));
  for (const row of BAND_TO_120) {
    if (clamped >= row.min) return row.band;
  }
  return 1.0;
}

/** Scale a 0–1 accuracy fraction to a legacy section range (R/L 0–30, W/S handled by rubric). */
export function legacySectionScaled(percent: number, max = 30): number {
  return Math.round((percent / 100) * max);
}

export const SCALE_DISCLAIMER =
  "Practice estimate only. Official IELTS bands and TOEFL scores are awarded solely by certified human raters (and ETS's own AI for TOEFL). Estimates can be off by a half-band / several points and have no admissions standing.";
