import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Family-reunion income sufficiency + A1-exemption detail — gap G9-04.
 *
 * Grounding (CLAUDE.md §2/§3): the income/means a sponsor must show is real but VOLATILE and
 * case-specific (it tracks living costs, housing, and household size and changes yearly), so NO
 * euro threshold is shipped as fact. The self-check is a deterministic SCAFFOLD: the user enters
 * their own net income and the household's monthly need, and the math (need vs. income) runs in
 * code — exactly the "LLM/data plans, deterministic code computes" rule. The A1-exemption
 * categories are grounded to make-it-in-germany but flagged for verification because eligibility
 * is decided per case.
 *
 * Verified 2026-06-21 against make-it-in-germany (family reunification / spouses).
 */

/** Make it in Germany — spouses joining non-EU citizens (A1 + means/housing rules). */
export const SOURCE_FR_SPOUSE: Source = {
  name: "Make it in Germany — Spouses joining non-EU citizens",
  url: "https://www.make-it-in-germany.com/en/visa-residence/family-reunification/spouses-joining-citizens-non-eu",
};

/** Categories commonly EXEMPT from the A1-before-arrival German requirement for a joining spouse. */
export interface A1Exemption {
  id: string;
  category: string;
  detail: string;
}

/**
 * Who is commonly exempt from proving basic German (A1) BEFORE a spouse joins. This list is grounded
 * but every case is decided individually → the page flags it needs-verification and cites the source.
 */
export const A1_EXEMPTIONS: A1Exemption[] = [
  {
    id: "a1-bluecard",
    category: "Spouse of an EU Blue Card / skilled-worker permit holder",
    detail:
      "Spouses joining holders of an EU Blue Card or a skilled-worker residence permit are generally exempt from the A1-before-arrival requirement and may work without restriction.",
  },
  {
    id: "a1-highlyqualified",
    category: "Spouse of a highly qualified person / researcher / self-employed founder",
    detail:
      "Family of certain highly qualified residents (e.g. researchers, some self-employed) is typically exempt from the pre-arrival language proof.",
  },
  {
    id: "a1-lowneed",
    category: "Recognisably low integration need / would be unreasonable",
    detail:
      "Where learning German before arrival is unreasonable or unnecessary in the individual case (e.g. evident integration capacity, or a disability/illness preventing it), the requirement can be waived.",
  },
  {
    id: "a1-nationality",
    category: "Nationals of certain countries",
    detail:
      "Citizens of some countries can enter Germany without a visa and are treated differently for the pre-arrival language requirement. Check your nationality's status.",
  },
];

/* ── Deterministic sufficiency self-check (no shipped threshold) ───────────────── */

export interface SufficiencyInput {
  /** Sponsor's net monthly income, € (user-entered). */
  netIncome: number;
  /** The household's estimated monthly need incl. rent for the larger family, € (user-entered/derived). */
  monthlyNeed: number;
}

export interface SufficiencyResult {
  surplus: number;
  /** True when income covers the household need (the structural test the officer applies). */
  covered: boolean;
}

/**
 * Deterministic: does the sponsor's net income cover the household's monthly need? This is the
 * STRUCTURE of the means test (income ≥ need, without recourse to public funds), computed in code.
 * It ships no official figure — both numbers are the user's own, and the officer applies the binding
 * threshold. Always render alongside a needs-verification note.
 */
export function checkSufficiency({ netIncome, monthlyNeed }: SufficiencyInput): SufficiencyResult {
  const surplus = Math.round((netIncome - monthlyNeed) * 100) / 100;
  return { surplus, covered: surplus >= 0 };
}

export const FAMILY_REUNION_SOURCES: Source[] = [
  SOURCE_FR_SPOUSE,
  source("familyReunion"),
  source("makeItInGermany"),
];
