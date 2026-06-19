import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Finance-only seed data: scholarship catalogue, blocked-account providers, and student
 * health-insurance options. None of the euro figures below are authoritative — amounts that are
 * official (DAAD rate, Deutschlandstipendium, Sperrkonto) live in src/lib/facts.ts and are rendered
 * with their grounding/verification treatment. Everything here is illustrative reference data the UI
 * filters/displays, with a source link to confirm specifics (CLAUDE.md §2/§3).
 *
 * IMPORTANT: provider names (Fintiba, Expatrio, Coracle, TK, etc.) are NOT endorsed by DeutschPrep.
 * They are listed neutrally as options students commonly encounter; verify terms with each provider.
 */

/* ── Scholarships ─────────────────────────────────────────────────────────── */

export interface Scholarship {
  id: string;
  name: string;
  funder: string;
  /** Short, student-facing summary of what it covers. */
  amount: string;
  /** One-line eligibility summary. */
  eligibility: string;
  /** True when the scheme is, in principle, open to applicants of any nationality. */
  openToAllNationalities: boolean;
  /** Whether it is primarily merit-based, need-based, or mobility/exchange-based. */
  basis: "merit" | "need" | "mobility";
  source: Source;
  /** Minimum years of professional experience required after the first degree (EPOS-style), if any. */
  requiresExperienceYears?: number;
  /** The first degree must have been obtained within the last N years, if specified. */
  degreeWithinYears?: number;
  /** Optional caveats; always present results as needing confirmation per call. */
  note?: string;
}

export const SCHOLARSHIPS: Scholarship[] = [
  {
    id: "daad-study",
    name: "DAAD Master's Study Scholarship",
    funder: "DAAD (German Academic Exchange Service)",
    amount: "Monthly stipend + study allowance, travel, and insurance",
    eligibility:
      "International graduates, typically with a Bachelor's degree no more than 6 years old and a strong academic record.",
    openToAllNationalities: true,
    basis: "merit",
    source: source("daadScholarships"),
    note: "Subject, country, and amount are defined per call in the DAAD funding database — find the matching programme and confirm its deadline.",
  },
  {
    id: "deutschlandstipendium",
    name: "Deutschlandstipendium",
    funder: "Federal government + private sponsors (via your university)",
    amount: "€300 / month for at least two semesters",
    eligibility:
      "Enrolled or admitted students of any nationality with strong achievement; awarded and administered by each university.",
    openToAllNationalities: true,
    basis: "merit",
    source: source("deutschlandstipendium"),
    note: "Income-independent and not deducted from BAföG. Application windows are set per university — check your university's scholarship office.",
  },
  {
    id: "erasmus-emjm",
    name: "Erasmus Mundus Joint Master (EMJM)",
    funder: "Erasmus+ (European Union)",
    amount: "Full scholarships covering tuition, travel, and living costs (per programme)",
    eligibility:
      "Applicants admitted to a specific Erasmus Mundus joint Master's; open worldwide, with limits on consecutive years in the same country.",
    openToAllNationalities: true,
    basis: "mobility",
    source: source("erasmus"),
    note: "You apply to the joint programme directly, not to Erasmus+ centrally. Scholarship value and quotas are set per consortium.",
  },
  {
    id: "erasmus-ka171",
    name: "Erasmus+ International Mobility (KA171)",
    funder: "Erasmus+ (European Union)",
    amount: "Mobility grant for a study/exchange period at a partner university",
    eligibility:
      "Students at a partner university with an inter-institutional agreement with a German university; nationality rules depend on the partnership.",
    openToAllNationalities: false,
    basis: "mobility",
    source: source("erasmus"),
    note: "Covers exchange mobility rather than a full degree. Availability depends on agreements between your home and host universities.",
  },
  {
    id: "daad-epos",
    name: "DAAD EPOS — Development-Related Postgraduate Courses",
    funder: "DAAD (German Academic Exchange Service)",
    amount: "Full monthly stipend + travel, insurance, and study/research allowances",
    eligibility:
      "Graduates from eligible developing countries with a first degree (normally 4 years) AND at least 2 years of professional experience, with the degree obtained within the last 6 years.",
    openToAllNationalities: false,
    basis: "merit",
    requiresExperienceYears: 2,
    degreeWithinYears: 6,
    source: source("daadEpos"),
    note: "Eligible countries and the list of development-related Master's/PhD courses are defined per call. The 2-year experience and 6-year recency rules are indicative — verify against the official EPOS criteria.",
  },
  {
    id: "daad-helmut-schmidt",
    name: "Helmut-Schmidt-Programme (Master of Public Policy & Good Governance)",
    funder: "DAAD (funded by the Federal Foreign Office)",
    amount: "Full monthly stipend + allowances for selected public-policy Master's programmes",
    eligibility:
      "Graduates from developing countries pursuing public policy / good governance; typically at least 2 years of relevant professional experience and a recent first degree.",
    openToAllNationalities: false,
    basis: "merit",
    requiresExperienceYears: 2,
    degreeWithinYears: 6,
    source: source("daadHelmutSchmidt"),
    note: "Eligible programmes and countries are defined per call. Experience and recency rules are indicative — verify against the official programme page.",
  },
  {
    id: "studienstiftung",
    name: "Studienstiftung des deutschen Volkes",
    funder: "Studienstiftung (German Academic Scholarship Foundation)",
    amount: "Monthly stipend + study cost allowance, plus a non-material support programme",
    eligibility:
      "Outstanding students; international students already enrolled at a German university can be nominated or apply via defined routes.",
    openToAllNationalities: false,
    basis: "merit",
    source: source("daad"),
    note: "Germany's largest and most selective scheme. Access routes for international students are limited — confirm current eligibility before applying.",
  },
  {
    id: "stiftungen-political",
    name: "Political & church foundation scholarships",
    funder:
      "Konrad-Adenauer-, Friedrich-Ebert-, Heinrich-Böll-Stiftung; KAAD; Cusanuswerk; Villigst, etc.",
    amount: "Monthly stipend + allowances (varies by foundation)",
    eligibility:
      "Academically strong students who share each foundation's values or affiliation; several accept international applicants.",
    openToAllNationalities: true,
    basis: "merit",
    source: source("daadScholarships"),
    note: "Each of the 13 federally funded Begabtenförderungswerke runs its own process. Browse and filter them in the DAAD funding database.",
  },
];

/* ── Blocked-account (Sperrkonto) providers ───────────────────────────────── */

export interface BlockedAccountProvider {
  id: string;
  name: string;
  /** What students typically use it for. */
  summary: string;
}

/**
 * Digital and bank options students commonly use to open a Sperrkonto. NOT an endorsement and NOT
 * an exhaustive list — fees, processing times, and acceptance by your mission vary. Confirm against
 * each provider and your German mission before paying.
 */
export const BLOCKED_ACCOUNT_PROVIDERS: BlockedAccountProvider[] = [
  {
    id: "fintiba",
    name: "Fintiba",
    summary: "Digital blocked account, often bundled with health-insurance options.",
  },
  {
    id: "expatrio",
    name: "Expatrio",
    summary: "Digital blocked account with an optional insurance package.",
  },
  {
    id: "coracle",
    name: "Coracle",
    summary: "Digital blocked account aimed at international students.",
  },
  {
    id: "deutsche-bank",
    name: "Deutsche Bank",
    summary: "Traditional bank blocked account; may require a branch or postal process.",
  },
];

/* ── Student health-insurance options ─────────────────────────────────────── */

export interface InsuranceOption {
  id: string;
  name: string;
  type: "statutory" | "private";
  summary: string;
}

/**
 * Illustrative health-insurance options students encounter. Statutory (gesetzlich) is the default
 * for most students under 30; private/voluntary may apply in specific cases. Listed neutrally — not
 * an endorsement. The selector on the page applies the facts-pack rules of thumb.
 */
export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    id: "tk",
    name: "Techniker Krankenkasse (TK)",
    type: "statutory",
    summary: "Statutory insurer popular with students; English-language support.",
  },
  {
    id: "aok",
    name: "AOK",
    type: "statutory",
    summary: "Large regional statutory insurer network.",
  },
  {
    id: "barmer",
    name: "Barmer",
    type: "statutory",
    summary: "Statutory insurer with student-focused services.",
  },
  {
    id: "private-expat",
    name: "Private / expat student plans",
    type: "private",
    summary: "Private cover sometimes used by students over 30 or those exempt from statutory cover.",
  },
];
