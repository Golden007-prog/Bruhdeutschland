/**
 * One reconciled "total need" across the three money tools (gap G6-03/05, CLAUDE.md golden rule 4).
 *
 * The application-cost estimator, the journey budget, and the funding-gap planner each used to hold
 * their own numbers, so the funding answer could silently contradict the budget. This computes the
 * shared need ONCE from grounded constants + the user's own months/city, and both the budget and the
 * funding planner consume it. Every euro default derives from a `lib/facts` constant — no re-literalled
 * official figure can drift (golden rule 4; fixes the old `992` literal that duplicated
 * `SPERRKONTO_MONTH_EUR`).
 *
 * Pure arithmetic; all volatile official figures stay flagged `needsVerification` in the UI.
 */
import { SPERRKONTO_MONTH_EUR } from "@/lib/facts";

export interface TotalNeedInput {
  /** One-time costs (application fees, APS, translations, visa, flights, deposit, misc). */
  oneTime: number;
  /** Monthly living cost (from the cost-of-living baseline / user override). */
  monthly: number;
  /** Months in Germany over the stay. */
  months: number;
}

export interface TotalNeed {
  oneTime: number;
  monthly: number;
  months: number;
  /** monthly × months. */
  livingTotal: number;
  /** oneTime + livingTotal — the figure both the budget and the funding planner reconcile to. */
  total: number;
}

const nn = (label: string, v: number): number => {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${label} must be a non-negative number`);
  return v;
};

/** The grounded living-cost fallback (€/month) — the Sperrkonto monthly rate, imported, never a literal. */
export const DEFAULT_MONTHLY_EUR = SPERRKONTO_MONTH_EUR;

/** A sensible default stay length when the caller has nothing better (a 2-year Master's). */
export const DEFAULT_MONTHS = 24;

export function computeTotalNeed(input: TotalNeedInput): TotalNeed {
  const oneTime = nn("oneTime", input.oneTime);
  const monthly = nn("monthly", input.monthly);
  const months = Math.max(0, Math.floor(input.months));
  const livingTotal = monthly * months;
  return { oneTime, monthly, months, livingTotal, total: oneTime + livingTotal };
}
