/**
 * Grounded official facts (CLAUDE.md §2/§3). Every entry carries a source. HIGH-volatility figures
 * (amounts/fees/thresholds that change yearly or by program/state) keep `needsVerification: true`
 * so the UI renders them "unstamped" with a link to confirm — even though a value + year is shown.
 * LOW-volatility structural facts (ECTS/year, the German grade band, the 14-day Anmeldung window)
 * are grounded (`needsVerification: false`).
 *
 * Figures sourced from docs/research/facts-pack-2026-06.md; applicable to 2026 unless noted.
 */
import type { OfficialFact } from "@/lib/types";
import { source } from "@/lib/sources";

/** When these seed figures were gathered. The re-verify affordance shows this and lets the user re-check. */
export const FACTS_RETRIEVED_AT = "2026-06-19";

/* ── Structured constants (single source of truth — prose must derive from these, never restate) ── */

/** Non-EU student work allowance. Page prose derives from this so it can't drift (page-audit §3.4). */
export const WORK_LIMIT_DAYS = { full: 140, half: 280 } as const;

/** Anmeldung (address registration) deadline, in days after moving in. */
export const ANMELDUNG_DAYS = 14 as const;

/**
 * Numeric euro figures (single source of truth — calculators/estimators import these so a hardcoded
 * literal can't drift from the user-facing `OfficialFact`s below). All 2026, all needs_verification.
 */
export const SPERRKONTO_YEAR_EUR = 11904 as const;
export const SPERRKONTO_MONTH_EUR = 992 as const; // = 11904 / 12
export const VISA_FEE_EUR = 75 as const;
export const UNIASSIST_FIRST_EUR = 75 as const;
export const UNIASSIST_ADDITIONAL_EUR = 30 as const;
export const APS_INDIA_FEE_EUR = 225 as const; // illustrative — confirm with the APS office

/** Countries whose applicants need an APS certificate — single source of truth in lib/country. */
export { APS_REQUIRED_COUNTRIES } from "@/lib/country/country";

/* ── Finance ───────────────────────────────────────────────────────────────── */

export const SPERRKONTO_AMOUNT: OfficialFact = {
  label: "Blocked account (Sperrkonto) — required amount",
  value: "€11,904 / year (€992 / month)",
  source: source("studyFinance"),
  needsVerification: true,
  note: "Applies to 2026 (tied to the BAföG rate). Changes yearly and is confirmed per German mission — verify before opening an account.",
};

export const TUITION_PUBLIC: OfficialFact = {
  label: "Tuition — public universities",
  value: "No tuition fees in most federal states",
  source: source("daadCosts"),
  needsVerification: false,
  note: "Degree programs at public universities are generally tuition-free; you still pay the semester contribution.",
};

export const TUITION_BW: OfficialFact = {
  label: "Tuition — Baden-Württemberg (non-EU/EEA)",
  value: "€1,500 / semester",
  source: source("daadCosts"),
  needsVerification: true,
  note: "Baden-Württemberg charges non-EU/EEA students this fee; other states may revisit fees. Verify with the specific university.",
};

export const SEMESTERBEITRAG: OfficialFact = {
  label: "Semester contribution (Semesterbeitrag)",
  value: "~€70 – €430 / semester",
  source: source("daadCosts"),
  needsVerification: true,
  note: "Set per university; often includes student services and a transit ticket. Confirm the exact amount with your university.",
};

export const HEALTH_INSURANCE: OfficialFact = {
  label: "Statutory student health insurance",
  value: "~€120 – €140 / month (incl. nursing-care)",
  source: source("tk"),
  needsVerification: true,
  note: "BAföG-linked and revised yearly; identical across statutory insurers. Mandatory for enrolment. Fetch the current rate from the insurer.",
};

export const DEUTSCHLANDTICKET_PRICE: OfficialFact = {
  label: "Deutschlandticket",
  value: "€63 / month",
  source: source("deutschlandticketPrice"),
  needsVerification: true,
  note: "Raised from €58 on 1 Jan 2026. Students often get a discounted Deutschland-Semesterticket via their university.",
};

export const WORK_LIMIT: OfficialFact = {
  label: "Work limit — international (non-EU) students",
  value: `${WORK_LIMIT_DAYS.full} full or ${WORK_LIMIT_DAYS.half} half days / year`,
  source: source("daadSideJobs"),
  needsVerification: true,
  note: "Raised from 120/240. A half day is up to 4 hours. University student-assistant (HiWi) jobs are generally unrestricted. Verify your residence-permit conditions.",
};

/* ── Scholarships ──────────────────────────────────────────────────────────── */

export const DAAD_STIPEND: OfficialFact = {
  label: "DAAD Master's study scholarship",
  value: "€992 / month (+ allowances & insurance)",
  source: source("daadScholarships"),
  needsVerification: true,
  note: "2026 cycle. Plus a study allowance and health/accident/liability cover. Amounts are set per call — confirm in the funding database.",
};

export const DEUTSCHLANDSTIPENDIUM: OfficialFact = {
  label: "Deutschlandstipendium",
  value: "€300 / month",
  source: source("deutschlandstipendium"),
  needsVerification: false,
  note: "€150 private sponsor + €150 federal. Open to all nationalities, merit-based, awarded by the university for ≥ 2 semesters.",
};

/* ── Visa & relocation ─────────────────────────────────────────────────────── */

export const VISA_TYPE: OfficialFact = {
  label: "Visa type",
  value: 'National visa "D" (stays over 90 days)',
  source: source("autoVisaFaq"),
  needsVerification: false,
  note: "Convert it to a residence permit (Aufenthaltstitel) at the local Ausländerbehörde after arrival.",
};

export const VISA_FEE: OfficialFact = {
  label: "Student visa fee",
  value: "€75",
  source: source("autoVisaFaq"),
  needsVerification: true,
  note: "Category-D visa fee for 2026. Verify with your German mission, which may also charge a service-provider fee.",
};

export const VISA_PROCESSING: OfficialFact = {
  label: "Visa processing time",
  value: "Several weeks, sometimes months",
  source: source("autoVisaFaq"),
  needsVerification: true,
  note: "Plus appointment wait time, which varies widely by mission. Book your appointment as early as possible.",
};

export const APS_INDIA: OfficialFact = {
  label: "APS certificate — India",
  value: "Mandatory for the student visa since 1 Nov 2022",
  source: source("apsIndia"),
  needsVerification: true,
  note: "Required for applicants from several countries (India, China, Vietnam, and others). The APS has signalled anabin-based criteria changes taking effect in 2026; the exact thresholds and dates change and aren't grounded here — see your country's status below and confirm with the APS office.",
};

export const ANMELDUNG_WINDOW: OfficialFact = {
  label: "Anmeldung (address registration) deadline",
  value: `Within ${ANMELDUNG_DAYS} days of moving in`,
  source: source("bundesmeldegesetz"),
  needsVerification: false,
  note: "Register at the local Bürgeramt. Bring your passport and the landlord's Wohnungsgeberbestätigung.",
};

/* ── Academic structure ───────────────────────────────────────────────────── */

export const ECTS_YEAR: OfficialFact = {
  label: "ECTS per academic year",
  value: "60 ECTS (30 per semester)",
  source: source("ects"),
  needsVerification: false,
  note: "A Master's is typically 120 ECTS over two years.",
};

export const GERMAN_GRADE_BAND: OfficialFact = {
  label: "German grade scale",
  value: "1.0 best · 4.0 lowest pass · 5.0 fail",
  source: source("uniAssist"),
  needsVerification: false,
  note: "Foreign grades are converted with the Modified Bavarian Formula (computed deterministically).",
};

/* ── Language thresholds (program-specific — all flagged) ──────────────────── */

export const IELTS_TYPICAL: OfficialFact = {
  label: "IELTS Academic — typical bar",
  value: "6.5 overall (5.5–7.0 range)",
  source: source("ielts"),
  needsVerification: true,
  note: "Thresholds are set per program. Always check the specific program page.",
};

export const TOEFL_TYPICAL: OfficialFact = {
  label: "TOEFL iBT — typical bar",
  value: "~85–90 (legacy 0–120 scale)",
  source: source("toefl"),
  needsVerification: true,
  note: "Program-specific. Note TOEFL iBT moved to a 1–6 scale in Jan 2026, reported alongside 0–120 during the transition.",
};

export const TESTDAF_TYPICAL: OfficialFact = {
  label: "TestDaF — typical bar",
  value: "TDN 4 in all four sections",
  source: source("testdaf"),
  needsVerification: true,
  note: "DSH-2, Goethe C1/C2, or telc C1 Hochschule are common alternatives. Confirm per program.",
};

/** Grouped accessors for convenience on overview pages. */
export const FINANCE_FACTS: OfficialFact[] = [
  SPERRKONTO_AMOUNT,
  HEALTH_INSURANCE,
  SEMESTERBEITRAG,
  TUITION_PUBLIC,
  WORK_LIMIT,
  DEUTSCHLANDTICKET_PRICE,
];

export const VISA_FACTS: OfficialFact[] = [VISA_TYPE, VISA_FEE, VISA_PROCESSING, APS_INDIA, ANMELDUNG_WINDOW];
