/**
 * Deterministic total-journey budget arithmetic (gap analysis G04, CLAUDE.md golden rule 4).
 * Sums the real end-to-end cost of getting from "deciding to apply" to "living in Germany": one-time
 * costs (APS, uni-assist, translations, visa, flights, deposit) + the blocked-account you must show +
 * recurring living costs over the stay. Every euro figure is supplied by the caller; grounded official
 * values (Sperrkonto, visa fee, uni-assist tiers) are flagged so the UI can mark what to verify.
 *
 * The blocked account is deliberately NOT counted as "spend": it is your own money, released to you
 * ~monthly after arrival. So we report two totals — upfront cash to mobilise vs. true cost over the stay.
 */

export interface JourneyBudgetInput {
  /** APS certificate fee (0 when not required for the country). */
  apsFee: number;
  /** Number of programmes applied to via uni-assist. */
  applications: number;
  /** uni-assist first-choice fee (grounded ~€75). */
  uniAssistFirst: number;
  /** uni-assist each additional choice (grounded ~€30). */
  uniAssistAdditional: number;
  /** Number of documents needing certified translation. */
  translationDocs: number;
  /** Estimated cost per certified-translation document. */
  translationPerDoc: number;
  /** Student-visa fee (grounded ~€75). */
  visaFee: number;
  /** One-way / return flight estimate. */
  flights: number;
  /** Up-front rental deposit (Kaution), typically 1–3 months' cold rent. */
  deposit: number;
  /** Any other one-time costs (apostille, courier, medical, SIM, etc.). */
  misc: number;
  /** Blocked-account amount you must prove (grounded €11,904 for 2026). */
  blockedAccount: number;
  /** Estimated monthly living cost (from the cost-of-living tool). */
  monthlyCost: number;
  /** Months you expect to be in Germany over the programme (e.g. 24 for a Master's). */
  months: number;
}

export interface BudgetLine {
  key: string;
  label: string;
  amount: number;
  /** True when the figure derives from a grounded official value. */
  grounded: boolean;
  needsVerification?: boolean;
}

export interface JourneyBudgetResult {
  oneTime: BudgetLine[];
  oneTimeTotal: number;
  uniAssistTotal: number;
  translationTotal: number;
  recurringMonthly: number;
  recurringTotal: number;
  blockedAccount: number;
  /** Cash you must have available before/at arrival (one-time + the blocked account you must show). */
  upfrontCash: number;
  /** True money spent across the journey (one-time + living); the blocked account is excluded — it's
   *  your own money, returned to you. */
  trueCost: number;
}

const nonNeg = (label: string, v: number): number => {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${label} must be a non-negative number`);
  return v;
};

/** uni-assist cost: first choice at the first-fee, each additional at the additional-fee. */
export function uniAssistCost(applications: number, first: number, additional: number): number {
  const n = Math.max(0, Math.floor(applications));
  if (n === 0) return 0;
  return first + (n - 1) * additional;
}

export function computeJourneyBudget(input: JourneyBudgetInput): JourneyBudgetResult {
  const apsFee = nonNeg("apsFee", input.apsFee);
  const uniAssistTotal = uniAssistCost(
    input.applications,
    nonNeg("uniAssistFirst", input.uniAssistFirst),
    nonNeg("uniAssistAdditional", input.uniAssistAdditional),
  );
  const translationTotal =
    Math.max(0, Math.floor(input.translationDocs)) * nonNeg("translationPerDoc", input.translationPerDoc);
  const visaFee = nonNeg("visaFee", input.visaFee);
  const flights = nonNeg("flights", input.flights);
  const deposit = nonNeg("deposit", input.deposit);
  const misc = nonNeg("misc", input.misc);
  const blockedAccount = nonNeg("blockedAccount", input.blockedAccount);
  const monthlyCost = nonNeg("monthlyCost", input.monthlyCost);
  const months = Math.max(0, Math.floor(input.months));

  const oneTime: BudgetLine[] = [
    { key: "aps", label: "APS certificate", amount: apsFee, grounded: true, needsVerification: true },
    { key: "uniAssist", label: "uni-assist application fees", amount: uniAssistTotal, grounded: true, needsVerification: true },
    { key: "translation", label: "Certified translations", amount: translationTotal, grounded: false },
    { key: "visa", label: "Student-visa fee", amount: visaFee, grounded: true, needsVerification: true },
    { key: "flights", label: "Flights to Germany", amount: flights, grounded: false },
    { key: "deposit", label: "Rental deposit (Kaution)", amount: deposit, grounded: false },
    { key: "misc", label: "Other one-time costs", amount: misc, grounded: false },
  ];
  const oneTimeTotal = oneTime.reduce((sum, l) => sum + l.amount, 0);
  const recurringTotal = monthlyCost * months;

  return {
    oneTime,
    oneTimeTotal,
    uniAssistTotal,
    translationTotal,
    recurringMonthly: monthlyCost,
    recurringTotal,
    blockedAccount,
    upfrontCash: oneTimeTotal + blockedAccount,
    trueCost: oneTimeTotal + recurringTotal,
  };
}
