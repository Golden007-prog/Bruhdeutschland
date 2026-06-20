/**
 * Deterministic student work-day budget (gap analysis G33, CLAUDE.md golden rule 4). Non-EU students
 * may work a limited number of days per year on a study residence permit — currently 140 full days OR
 * 280 half days (a half day is up to ~4 hours). A full day costs 1 unit; a half day costs 0.5. This
 * tallies logged days against the cap. The cap itself is a grounded official figure rendered with a
 * verify flag in the UI — here we only do the arithmetic.
 */

export interface WorkDayEntry {
  id: string;
  /** "YYYY-MM" the days were worked (for grouping; not validated here). */
  month: string;
  /** Number of full days worked in that entry. */
  fullDays: number;
  /** Number of half days (≤ ~4h) worked in that entry. */
  halfDays: number;
  note?: string;
}

export interface WorkDayBudget {
  /** Full-day cap (e.g. 140). */
  fullCap: number;
  /** Equivalent full-day units used (full + 0.5 × half). */
  used: number;
  /** Remaining full-day units (never below 0). */
  remaining: number;
  /** Percent of the annual budget used (0–100, may exceed 100 if over). */
  percent: number;
  /** True once the budget is exhausted or exceeded. */
  exhausted: boolean;
  totalFull: number;
  totalHalf: number;
}

/** Full-day-equivalent cost of an entry (a half day is 0.5). */
export function entryUnits(e: Pick<WorkDayEntry, "fullDays" | "halfDays">): number {
  const full = Math.max(0, e.fullDays || 0);
  const half = Math.max(0, e.halfDays || 0);
  return full + half * 0.5;
}

/**
 * Tally entries against the annual cap. `fullCap` defaults to 140 (the 140-full / 280-half rule, which
 * are the same budget expressed two ways: 280 half days × 0.5 = 140 units).
 */
export function computeWorkDayBudget(entries: WorkDayEntry[], fullCap = 140): WorkDayBudget {
  const totalFull = entries.reduce((s, e) => s + Math.max(0, e.fullDays || 0), 0);
  const totalHalf = entries.reduce((s, e) => s + Math.max(0, e.halfDays || 0), 0);
  const used = totalFull + totalHalf * 0.5;
  const remaining = Math.max(0, fullCap - used);
  const percent = fullCap > 0 ? Math.round((used / fullCap) * 100) : 0;
  return {
    fullCap,
    used,
    remaining,
    percent,
    exhausted: used >= fullCap,
    totalFull,
    totalHalf,
  };
}
