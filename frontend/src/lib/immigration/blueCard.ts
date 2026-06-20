/**
 * EU Blue Card salary-threshold check (long-game addendum §3, CLAUDE.md golden rule 4). Deterministic:
 * compares an expected gross salary against the CURRENT 2026 thresholds (from lib/facts, with provenance)
 * and reports the gap. The lower threshold applies to shortage occupations, STEM, and recent graduates
 * (within 3 years). The figures themselves are needs_verification in the UI — this is only arithmetic.
 */
import { BLUE_CARD_SHORTAGE_EUR, BLUE_CARD_STANDARD_EUR } from "@/lib/facts";

export interface BlueCardInput {
  /** Expected annual GROSS salary in euros. */
  grossSalary: number;
  /** Field is a recognised shortage occupation (Mangelberuf). */
  shortageOccupation: boolean;
  /** Graduated from a German (or recognised) university within the last 3 years. */
  recentGraduate: boolean;
}

export interface BlueCardResult {
  /** The threshold that applies to this applicant. */
  threshold: number;
  thresholdKind: "standard" | "reduced";
  /** Why the reduced threshold applies (empty for standard). */
  reasons: string[];
  eligible: boolean;
  /** Within ~5% below the threshold — "close". */
  borderline: boolean;
  /** Additional annual gross needed to reach the threshold (0 when eligible). */
  gap: number;
}

export function checkBlueCard(input: BlueCardInput): BlueCardResult {
  const salary = Number.isFinite(input.grossSalary) && input.grossSalary > 0 ? input.grossSalary : 0;
  const reasons: string[] = [];
  if (input.shortageOccupation) reasons.push("shortage occupation / STEM");
  if (input.recentGraduate) reasons.push("recent graduate (within 3 years)");
  const reduced = reasons.length > 0;
  const threshold = reduced ? BLUE_CARD_SHORTAGE_EUR : BLUE_CARD_STANDARD_EUR;
  const eligible = salary >= threshold;
  const gap = eligible ? 0 : Math.round((threshold - salary) * 100) / 100;
  const borderline = !eligible && salary >= threshold * 0.95;
  return { threshold, thresholdKind: reduced ? "reduced" : "standard", reasons, eligible, borderline, gap };
}
