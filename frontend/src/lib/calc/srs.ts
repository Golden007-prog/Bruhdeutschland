/**
 * Deterministic SM-2 spaced-repetition scheduling (work-order §5F). Pure, tested arithmetic — the
 * model never schedules cards. SM-2 (SuperMemo 2) maps a recall quality 0–5 to the next interval,
 * repetition count, and easiness factor.
 */

export interface SrsState {
  /** Easiness factor, ≥ 1.3. */
  easiness: number;
  /** Consecutive successful repetitions. */
  repetition: number;
  /** Current interval in days. */
  intervalDays: number;
}

/** A fresh card before any review. */
export const INITIAL_SRS: SrsState = { easiness: 2.5, repetition: 0, intervalDays: 0 };

/** SM-2 recall grades. We map the UI's three buttons onto these. */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

/** UI rating → SM-2 quality. Again = lapse (2), Good = correct-with-effort (4), Easy = perfect (5). */
export const QUALITY_FROM_RATING: Record<"again" | "good" | "easy", RecallQuality> = {
  again: 2,
  good: 4,
  easy: 5,
};

const MIN_EASINESS = 1.3;

/**
 * Apply one SM-2 review. Quality < 3 resets the repetition streak (interval back to 1 day); quality
 * ≥ 3 advances the interval (1 → 6 → previous × easiness). Easiness is nudged by the standard SM-2
 * formula and floored at 1.3.
 */
export function reviewCard(state: SrsState, quality: RecallQuality): SrsState {
  // SM-2 easiness update.
  const ef = Math.max(
    MIN_EASINESS,
    state.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  if (quality < 3) {
    // Lapse: restart the schedule but keep the (reduced) easiness.
    return { easiness: ef, repetition: 0, intervalDays: 1 };
  }

  const repetition = state.repetition + 1;
  let intervalDays: number;
  if (repetition === 1) intervalDays = 1;
  else if (repetition === 2) intervalDays = 6;
  else intervalDays = Math.round(state.intervalDays * ef);

  return { easiness: ef, repetition, intervalDays };
}

/** Convenience: review by the UI rating instead of a raw quality. */
export function reviewByRating(state: SrsState, rating: "again" | "good" | "easy"): SrsState {
  return reviewCard(state, QUALITY_FROM_RATING[rating]);
}
