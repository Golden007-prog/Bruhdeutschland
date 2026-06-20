/**
 * Section 9 §9.4 — ranking percentile math (deterministic + tested; NOT model-computed).
 *
 * The database `my_rank()` RPC is leak-safe: it returns only the caller's own value plus anonymized
 * cohort counts (`below`, `total`) and aggregates — never another user's row. The percentile *formula*
 * lives here so it is unit-tested and auditable in code, per CLAUDE.md golden rule #4.
 */
export interface RankCounts {
  /** How many opted-in/known users scored strictly below the caller (from the RPC). */
  below: number;
  /** Total users in the cohort with a value for this dimension (from the RPC). */
  total: number;
}

/** Percentile rank 0–100: the share of the cohort strictly below the caller. Empty cohort → 0. */
export function percentileRank({ below, total }: RankCounts): number {
  if (!Number.isFinite(below) || !Number.isFinite(total) || total <= 0) return 0;
  const b = Math.min(Math.max(below, 0), total);
  return Math.round((b / total) * 100);
}

/** 1-based rank where 1 = top. The caller is above `below` others, so rank = total − below. */
export function rankFromBelow({ below, total }: RankCounts): number {
  if (!Number.isFinite(below) || !Number.isFinite(total) || total <= 0) return 0;
  const b = Math.min(Math.max(below, 0), total);
  return Math.max(1, total - b);
}

/** A friendly "Top X%" label from a percentile rank (e.g. 92 → "Top 8%"). Floors at "Top 1%". */
export function topPercentLabel(percentile: number): string {
  if (!Number.isFinite(percentile)) return "Unranked";
  const top = Math.max(1, 100 - Math.round(percentile));
  return `Top ${top}%`;
}
