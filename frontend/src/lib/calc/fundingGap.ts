/**
 * Deterministic funding-gap / affordability arithmetic (gap analysis G32, CLAUDE.md golden rule 4).
 * Compares the money a student can mobilise (savings, family, loan, scholarship, expected work income)
 * against the total need (one-time costs + living over the stay). Pure arithmetic — all figures come
 * from the caller; grounded official values are flagged for verification in the UI.
 */

export interface FundingSources {
  savings: number;
  family: number;
  loan: number;
  /** Scholarship amount per month (0 if none). */
  scholarshipMonthly: number;
  /** Expected net work income per month (within the legal work-day limit). */
  workMonthly: number;
}

export interface FundingNeed {
  /** One-time costs (APS, uni-assist, translations, visa, flights, deposit, …). */
  oneTime: number;
  /** Monthly living cost. */
  monthly: number;
  /** Months in Germany over the stay. */
  months: number;
}

export interface FundingPlan {
  totalNeed: number;
  lumpSum: number;
  monthlyIncome: number;
  incomeOverStay: number;
  totalAvailable: number;
  /** Positive = surplus, negative = shortfall. */
  balance: number;
  shortfall: number;
  surplus: number;
  covered: boolean;
}

const nn = (label: string, v: number): number => {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${label} must be a non-negative number`);
  return v;
};

export function computeFundingPlan(sources: FundingSources, need: FundingNeed): FundingPlan {
  const lumpSum = nn("savings", sources.savings) + nn("family", sources.family) + nn("loan", sources.loan);
  const monthlyIncome = nn("scholarshipMonthly", sources.scholarshipMonthly) + nn("workMonthly", sources.workMonthly);
  const months = Math.max(0, Math.floor(need.months));
  const incomeOverStay = monthlyIncome * months;
  const totalAvailable = lumpSum + incomeOverStay;
  const totalNeed = nn("oneTime", need.oneTime) + nn("monthly", need.monthly) * months;
  const balance = totalAvailable - totalNeed;
  return {
    totalNeed,
    lumpSum,
    monthlyIncome,
    incomeOverStay,
    totalAvailable,
    balance,
    shortfall: balance < 0 ? -balance : 0,
    surplus: balance > 0 ? balance : 0,
    covered: balance >= 0,
  };
}
