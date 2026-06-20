/**
 * Indicative PR / citizenship timeline (long-game addendum §2/§4, CLAUDE.md golden rule 4). Deterministic
 * date arithmetic over the CURRENT 2026 rules (from lib/facts, with provenance + needs_verification):
 * Blue Card → PR in 21 months (with B1) / 27 (without); citizenship after 5 years' legal residence
 * (the 3-year fast-track was repealed 30 Oct 2025). Estimates only — the law is volatile and study time
 * may count only partially; the UI says "indicative" + "verify with the Ausländerbehörde".
 */
import {
  BLUE_CARD_PR_MONTHS_B1,
  BLUE_CARD_PR_MONTHS_NO_B1,
  CITIZENSHIP_YEARS,
} from "@/lib/facts";

/** Months of qualified residence typically needed for PR on a standard work permit (≈5 yrs). Indicative. */
export const STANDARD_WORK_PR_MONTHS = 60 as const;

export interface TimelineInput {
  /** Employed on an EU Blue Card (the fast PR route) vs a standard work permit. */
  onBlueCard: boolean;
  /** B1 German achieved — shortens Blue Card PR from 27 to 21 months. */
  hasB1: boolean;
}

export interface ImmigrationTimeline {
  route: "blue_card" | "standard";
  /** Indicative months of qualified residence to permanent residence. */
  prMonths: number;
  /** Years of legal residence to citizenship eligibility (current law). */
  citizenshipYears: number;
  notes: string[];
}

export function estimateImmigrationTimeline(input: TimelineInput): ImmigrationTimeline {
  const notes = [
    "Indicative only — your clock depends on permit type, contributions, and German level.",
    "Study time before qualified work often counts only partially toward citizenship — verify your case.",
  ];
  if (input.onBlueCard) {
    return {
      route: "blue_card",
      prMonths: input.hasB1 ? BLUE_CARD_PR_MONTHS_B1 : BLUE_CARD_PR_MONTHS_NO_B1,
      citizenshipYears: CITIZENSHIP_YEARS,
      notes: [input.hasB1 ? "B1 German qualifies you for the faster 21-month PR." : "Reach B1 German to cut PR from 27 to 21 months.", ...notes],
    };
  }
  return {
    route: "standard",
    prMonths: STANDARD_WORK_PR_MONTHS,
    citizenshipYears: CITIZENSHIP_YEARS,
    notes: ["A standard work permit's PR is typically ~5 years — the Blue Card is much faster.", ...notes],
  };
}

/** Add whole months to a "YYYY-MM" or "YYYY-MM-DD" anchor → "YYYY-MM". Empty/invalid → "". */
export function addMonthsYM(anchor: string, months: number): string {
  const m = /^(\d{4})-(\d{2})/.exec((anchor ?? "").trim());
  if (!m) return "";
  const date = new Date(Number(m[1]), Number(m[2]) - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface EligibilityDates {
  prMonth: string; // "YYYY-MM"
  citizenshipMonth: string; // "YYYY-MM"
}

/** Indicative PR + citizenship eligibility months from a qualified-residence start date. */
export function eligibilityDates(qualifiedResidenceStart: string, t: ImmigrationTimeline): EligibilityDates {
  return {
    prMonth: addMonthsYM(qualifiedResidenceStart, t.prMonths),
    citizenshipMonth: addMonthsYM(qualifiedResidenceStart, t.citizenshipYears * 12),
  };
}
