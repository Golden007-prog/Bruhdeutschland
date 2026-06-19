/**
 * Deterministic cost-of-living arithmetic (CLAUDE.md golden rule 4). Mirrors the backend
 * `CostOfLivingService` contract: city base figures + user inputs combined by tested arithmetic.
 *
 * IMPORTANT: every euro figure here is an illustrative planning baseline, NOT an official value.
 * The UI must render results with the finance disclaimer and a `needsVerification` treatment — the
 * authoritative monthly minimum a student must prove is the Sperrkonto amount set by the Federal
 * Foreign Office, which changes yearly and must be confirmed against the official source.
 */

export interface CityCostProfile {
  city: string;
  /** Typical monthly student rent for a shared room / small flat (illustrative). */
  rent: number;
  food: number;
  transport: number;
  insurance: number;
  other: number;
}

export interface CostBreakdown {
  city: string;
  rent: number;
  food: number;
  transport: number;
  insurance: number;
  other: number;
  monthlyTotal: number;
  annualTotal: number;
}

/** Illustrative monthly baselines (EUR) for common student cities. Planning aid only. */
export const CITY_PROFILES: CityCostProfile[] = [
  { city: "Munich", rent: 750, food: 250, transport: 40, insurance: 130, other: 180 },
  { city: "Berlin", rent: 600, food: 230, transport: 40, insurance: 130, other: 170 },
  { city: "Hamburg", rent: 600, food: 230, transport: 40, insurance: 130, other: 170 },
  { city: "Frankfurt", rent: 650, food: 240, transport: 40, insurance: 130, other: 175 },
  { city: "Cologne", rent: 520, food: 230, transport: 40, insurance: 130, other: 165 },
  { city: "Stuttgart", rent: 600, food: 230, transport: 40, insurance: 130, other: 170 },
  { city: "Aachen", rent: 420, food: 220, transport: 40, insurance: 130, other: 155 },
  { city: "Leipzig", rent: 400, food: 210, transport: 40, insurance: 130, other: 150 },
  { city: "Dresden", rent: 400, food: 210, transport: 40, insurance: 130, other: 150 },
  { city: "Other / national average", rent: 480, food: 220, transport: 40, insurance: 130, other: 160 },
];

/** Combine a city baseline with optional per-line overrides into a deterministic monthly total. */
export function computeCost(
  base: CityCostProfile,
  overrides: Partial<Omit<CityCostProfile, "city">> = {},
): CostBreakdown {
  const lines = {
    rent: overrides.rent ?? base.rent,
    food: overrides.food ?? base.food,
    transport: overrides.transport ?? base.transport,
    insurance: overrides.insurance ?? base.insurance,
    other: overrides.other ?? base.other,
  };
  for (const [k, v] of Object.entries(lines)) {
    if (!Number.isFinite(v) || v < 0) throw new Error(`${k} must be a non-negative number`);
  }
  const monthlyTotal = lines.rent + lines.food + lines.transport + lines.insurance + lines.other;
  return {
    city: base.city,
    ...lines,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
  };
}

/** Format an integer euro amount, e.g. 11904 -> "€11,904". */
export function formatEur(amount: number): string {
  return `€${Math.round(amount).toLocaleString("en-US")}`;
}
