/**
 * Deterministic intake derivations (intake "data engine" work order §3). Pure + unit-tested — these
 * turn collected fields into feature outputs so we never ask the user something we can compute:
 *  - documentsStillNeeded → the Document-gathering "still need" list (from documents-on-hand + country + level)
 *  - recommendedTests → Language/Mock test recommendations (from level + medium of instruction + test status)
 *  - insuranceTierHint → statutory vs private student insurance (from age)
 *  - intakeTargetLabel → "Wintersemester 2026" (from season + year)
 * Grounded rules stay needs_verification in the UI; this module only routes/derives.
 */
import { apsStatusFor } from "@/lib/country/country";
import { summarizeEducation } from "@/lib/profile/education";
import type { UserProfile } from "@/lib/profile/types";

export interface DocItem {
  key: string;
  label: string;
}

/** The application/visa document catalogue. `aps` only applies to APS countries (handled below). */
export const DOC_CATALOG: DocItem[] = [
  { key: "transcripts", label: "Academic transcripts / marksheets" },
  { key: "degree_cert", label: "Degree / Class-12 certificate" },
  { key: "passport", label: "Valid passport" },
  { key: "language_cert", label: "Language certificate (IELTS / TestDaF / …)" },
  { key: "cv", label: "CV (Europass)" },
  { key: "sop", label: "Statement of Purpose" },
  { key: "lors", label: "Letters of recommendation" },
  { key: "aps", label: "APS certificate" },
  { key: "financial_proof", label: "Proof of finances (blocked account)" },
  { key: "photos", label: "Biometric photos" },
  // Non-linear-path documents (diploma / lateral entry / no class 12) — surfaced conditionally below.
  { key: "diploma_transcript", label: "Diploma transcript & certificate" },
  { key: "vpd", label: "uni-assist VPD (Vorprüfungsdokumentation)" },
];

const NONLINEAR_DOC_KEYS = new Set(["diploma_transcript", "vpd"]);

/** Which documents apply to this profile (drops APS for non-APS countries + non-linear docs for linear paths). */
function applicableDocs(p: UserProfile): DocItem[] {
  const apsRequired = apsStatusFor(p.homeCountry).status === "required";
  const e = summarizeEducation(p);
  // Show diploma/VPD docs when the path is non-linear (diploma or missing class 12).
  const nonLinear = e.isNonLinear || e.missingClass12 || e.qualifyingCredential === "diploma";
  return DOC_CATALOG.filter((d) => {
    if (d.key === "aps") return apsRequired;
    if (NONLINEAR_DOC_KEYS.has(d.key)) return nonLinear;
    return true;
  });
}

/** Split the applicable documents into what the user already holds vs what's still needed. */
export function documentsStillNeeded(p: UserProfile): { have: DocItem[]; needed: DocItem[] } {
  const onHand = new Set(p.documentsOnHand ?? []);
  const docs = applicableDocs(p);
  return {
    have: docs.filter((d) => onHand.has(d.key)),
    needed: docs.filter((d) => !onHand.has(d.key)),
  };
}

export interface TestRec {
  test: string;
  reason: string;
  tone: "info" | "ok" | "warn";
}

/** Recommend the admission/language tests this applicant should plan, from level + MOI + test status. */
export function recommendedTests(p: UserProfile): TestRec[] {
  const recs: TestRec[] = [];
  const level = p.targetLevel;
  const hasEnglishTest = p.englishTestType !== "" && p.englishTestType !== "none" && p.englishTestType !== "planned";
  const hasGermanTest = p.germanTestType !== "" && p.germanTestType !== "none" && p.germanTestType !== "planned";

  if (level === "master" || level === "phd" || level === "") {
    if (p.mediumOfInstruction === "english") {
      recs.push({ test: "English test", reason: "Your degree was taught in English — many programmes WAIVE IELTS/TOEFL. Confirm the waiver with each one.", tone: "ok" });
    } else if (!hasEnglishTest) {
      recs.push({ test: "IELTS or TOEFL", reason: "English-taught Master's usually require it (≈IELTS 6.5). Book one if you don't hold a valid score.", tone: "info" });
    }
  }

  if (level === "bachelor" || level === "studienkolleg" || level === "medicine") {
    if (!hasGermanTest) {
      recs.push({ test: "German to C1 (TestDaF TDN 4 / DSH-2)", reason: "Bachelor/Medicine at public universities is German-taught — you'll need C1.", tone: "warn" });
    }
    if (level === "medicine") {
      recs.push({ test: "TestAS (non-EU) / TMS (EU)", reason: "Medicine admission usually requires one — TestAS for the international quota, TMS for the EU/HZB route.", tone: "info" });
    } else {
      recs.push({ test: "TestAS", reason: "Many Bachelor programmes use TestAS for international applicants.", tone: "info" });
    }
  }

  return recs;
}

/** Whole years between a "YYYY-MM-DD" birth date and now ("YYYY-MM-DD"). Null if unset/invalid. */
export function ageOn(dob: string, nowISO: string): number | null {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dob ?? "").trim());
  const n = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nowISO);
  if (!b || !n) return null;
  let age = Number(n[1]) - Number(b[1]);
  if (Number(n[2]) < Number(b[2]) || (Number(n[2]) === Number(b[2]) && Number(n[3]) < Number(b[3]))) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Statutory vs private student-insurance hint from age (KVdS is generally for students under 30). */
export function insuranceTierHint(p: UserProfile, nowISO: string): { age: number | null; hint: string } {
  const age = ageOn(p.dateOfBirth, nowISO);
  if (age == null) return { age: null, hint: "Add your date of birth for a statutory vs private insurance hint." };
  return age < 30
    ? { age, hint: "Under 30 → statutory student insurance (KVdS, ~€120/month) usually applies." }
    : { age, hint: "30+ → statutory student rates usually no longer apply; private/voluntary cover is common. Verify your case." };
}

const SEASON: Record<string, string> = { WS: "Wintersemester", SS: "Sommersemester" };

/** "Wintersemester 2026" from season + year, or just the season, or empty. */
export function intakeTargetLabel(p: UserProfile): string {
  const season = SEASON[p.targetIntake] ?? "";
  if (!season) return "";
  return p.targetIntakeYear.trim() ? `${season} ${p.targetIntakeYear.trim()}` : season;
}
