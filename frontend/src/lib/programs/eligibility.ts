/**
 * Deterministic eligibility (ADR-0006 §4). Compares the user's CONFIRMED profile against a programme's
 * KNOWN requirements. Where a requirement is unpublished/needs_verification or the profile lacks the
 * datum, the criterion is **Unknown** with the official/gap link — never a guess. Relevance (how well
 * the programme matches the user's interest) is computed separately in search.ts and labelled there.
 */
import { formatGermanGrade } from "@/lib/calc/gpa";
import { apsStatusFor } from "@/lib/country/country";
import { deriveGermanGpa } from "@/lib/profile/profile";
import { currentYM, formatYearsMonths, summarizeExperience, yearsFrom } from "@/lib/profile/experience";
import { summarizeEducation } from "@/lib/profile/education";
import type { UserProfile } from "@/lib/profile/types";
import type { Program } from "./types";

export type CriterionStatus = "meets" | "maybe" | "doesnt_meet" | "unknown";
export type EligibilityRollup = "likely" | "borderline" | "stretch" | "unknown";

export interface Criterion {
  key: string;
  label: string;
  status: CriterionStatus;
  detail: string;
  gapHref?: string;
}

export interface Eligibility {
  rollup: EligibilityRollup;
  criteria: Criterion[];
}

const CEFR_ORDER = ["", "none", "A1", "A2", "B1", "B2", "C1", "C2"];
const words = (s: string): string[] => (s.toLowerCase().match(/[a-z]{4,}/g) ?? []);

function fieldCriterion(profile: UserProfile, p: Program): Criterion {
  const target = `${profile.targetField} ${profile.currentDegree}`.trim();
  if (!target) {
    return { key: "field", label: "Subject fit", status: "unknown", detail: "Add your target field to assess subject fit.", gapHref: "/settings" };
  }
  const hay = [p.name, p.subjectGroup, ...p.areasOfStudy].join(" ").toLowerCase();
  const hits = [...new Set(words(target))].filter((w) => hay.includes(w)).length;
  if (hits >= 2) return { key: "field", label: "Subject fit", status: "meets", detail: `Aligns with ${p.areasOfStudy.join(", ") || p.subjectGroup}.` };
  if (hits === 1) return { key: "field", label: "Subject fit", status: "maybe", detail: `Partial overlap with ${p.areasOfStudy.join(", ") || p.subjectGroup}.` };
  return { key: "field", label: "Subject fit", status: "maybe", detail: `Check whether your background fits ${p.subjectGroup}.` };
}

function languageCriterion(profile: UserProfile, p: Program): Criterion {
  const idx = CEFR_ORDER.indexOf(profile.germanLevel);
  if (p.languages === "en") {
    return { key: "language", label: "Language of instruction", status: "meets", detail: "English-taught — German not required for admission." };
  }
  if (p.languages === "de_en") {
    return { key: "language", label: "Language of instruction", status: idx >= 5 ? "meets" : "maybe", detail: idx >= 5 ? "Some German modules — your level looks sufficient." : "Some German modules — verify the required level.", gapHref: idx >= 5 ? undefined : "/language/goethe-testdaf" };
  }
  return { key: "language", label: "Language of instruction", status: idx >= 6 ? "meets" : idx >= 5 ? "maybe" : "doesnt_meet", detail: idx >= 6 ? "German-taught — your level looks sufficient." : "German-taught — you'll likely need C1 (DSH-2 / TestDaF TDN 4).", gapHref: "/language/goethe-testdaf" };
}

function gradeCriterion(profile: UserProfile): Criterion {
  const conv = deriveGermanGpa(profile);
  if (!conv) {
    return { key: "grade", label: "Grade", status: "unknown", detail: "Add your grade & scale to compute your German grade.", gapHref: "/settings" };
  }
  return { key: "grade", label: "Grade", status: "unknown", detail: `Your German grade is ${formatGermanGrade(conv.germanGrade)} (computed). The programme's grade bar isn't published here — verify on the official page.` };
}

function englishTestCriterion(p: Program): Criterion | null {
  const need = p.languageLevelEn ?? (p.testsRequired?.ielts ? `IELTS ${p.testsRequired.ielts}` : undefined);
  if (!need) return null;
  return { key: "english_test", label: "English test", status: "unknown", detail: `Programme indicates ~${need}. Add your score to compare.`, gapHref: "/language/ielts-toefl" };
}

function apsCriterion(profile: UserProfile): Criterion {
  const { status } = apsStatusFor(profile.homeCountry);
  if (status === "required") return { key: "aps", label: "APS certificate", status: "maybe", detail: `${profile.homeCountry || "Your country"} requires an APS certificate before applying.`, gapHref: "/visa/aps" };
  if (status === "not_required") return { key: "aps", label: "APS certificate", status: "meets", detail: `${profile.homeCountry}: APS not required.` };
  return { key: "aps", label: "APS certificate", status: "unknown", detail: "Set your country to check whether APS applies.", gapHref: "/settings" };
}

/**
 * Experience criterion — only shown for programmes that require or value experience (real signal:
 * `workExperienceRequired`, `experienceRecommended`, or a part-time mode). Most consecutive MSc/MA
 * require none, so the criterion is omitted there. Never gates on a guessed threshold.
 */
function experienceCriterion(profile: UserProfile, p: Program): Criterion | null {
  const req = p.workExperienceRequired ?? 0;
  const recommended = p.experienceRecommended || p.mode === "part_time";
  if (req <= 0 && !recommended) return null;

  const s = summarizeExperience(profile, currentYM());
  if (req <= 0) {
    return {
      key: "experience",
      label: "Work experience",
      status: "meets",
      detail: s.totalMonths > 0
        ? `Experience is valued here — your ${formatYearsMonths(s.totalMonths)} is a plus (not a gate).`
        : "Experience is valued here (not required) — a plus if you have it.",
    };
  }
  if (s.totalMonths === 0) {
    return { key: "experience", label: "Work experience", status: "unknown", detail: `Indicates ~${req}+ yrs experience. Add your work history to check.`, gapHref: "/settings" };
  }
  const yrs = yearsFrom(s.postDegreeFullTimeMonths > 0 ? s.postDegreeFullTimeMonths : s.totalMonths);
  if (yrs >= req) {
    return { key: "experience", label: "Work experience", status: "meets", detail: `You have ${formatYearsMonths(s.totalMonths)} — meets the indicative ${req}-yr bar (verify on the official page).` };
  }
  return { key: "experience", label: "Work experience", status: "maybe", detail: `You have ${formatYearsMonths(s.totalMonths)}; this programme indicates ~${req}+ yrs. Verify the exact rule on the official page.` };
}

/**
 * Schooling-chain criterion — only shown when the applicant holds a degree/diploma but NO class 12
 * (e.g. the 10th → diploma → lateral-entry B.Tech path). Never auto-fails: the degree is usually the
 * qualifying credential, but the chain must be verified via uni-assist VPD (non-linear-paths addendum).
 */
function schoolingChainCriterion(profile: UserProfile): Criterion | null {
  const e = summarizeEducation(profile);
  if (!e.missingClass12) return null;
  return {
    key: "schooling_chain",
    label: "Schooling chain",
    status: "maybe",
    detail:
      "You reached your degree without class 12 (e.g. diploma + lateral entry). Your BACHELOR is usually the qualifying credential, but some universities scrutinise the full chain — verify via a uni-assist VPD.",
    gapHref: "/documents/vpd-helper",
  };
}

function rollupOf(criteria: Criterion[]): EligibilityRollup {
  if (criteria.some((c) => c.status === "doesnt_meet")) return "stretch";
  const known = criteria.filter((c) => c.status !== "unknown");
  if (known.length === 0) return "unknown";
  if (known.every((c) => c.status === "meets")) {
    return criteria.some((c) => c.status === "unknown") ? "borderline" : "likely";
  }
  return "borderline";
}

export function eligibility(profile: UserProfile, p: Program): Eligibility {
  const criteria = [
    fieldCriterion(profile, p),
    languageCriterion(profile, p),
    gradeCriterion(profile),
    englishTestCriterion(p),
    experienceCriterion(profile, p),
    schoolingChainCriterion(profile),
    apsCriterion(profile),
  ].filter((c): c is Criterion => c !== null);
  return { rollup: rollupOf(criteria), criteria };
}

export const ROLLUP_META: Record<EligibilityRollup, { label: string; className: string }> = {
  likely: { label: "Likely eligible", className: "bg-emerald-100 text-emerald-900" },
  borderline: { label: "Borderline", className: "bg-amber-100 text-amber-900" },
  stretch: { label: "Stretch", className: "bg-red-100 text-red-900" },
  unknown: { label: "Add your profile", className: "bg-muted text-muted-foreground" },
};
