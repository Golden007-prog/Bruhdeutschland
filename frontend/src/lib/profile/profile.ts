/**
 * Pure, testable derivations over a {@link UserProfile}. No React, no I/O — so the GPA the dashboard
 * shows comes from the deterministic Modified Bavarian Formula (`lib/calc/gpa`), never the model and
 * never a hardcoded mock (page-audit §3.1, CLAUDE.md §4).
 */
import {
  COMMON_SCALES,
  GPA_METHOD,
  convertToGermanGpa,
  type GpaConversion,
  type GradeScale,
} from "@/lib/calc/gpa";
import type { ParsedProfile } from "@/lib/types";
import { currentYM, formatYearsMonths, summarizeExperience } from "./experience";
import type { GradeScaleKey, ScaleOption, UserProfile } from "./types";

/** Intake scale choices, in display order. Custom lets the user enter best/min-pass directly. */
export const SCALE_OPTIONS: ScaleOption[] = [
  { key: "cgpa10", label: "CGPA / 10 (best 10, pass 4)" },
  { key: "percent", label: "Percentage (best 100, pass 40)" },
  { key: "gpa4", label: "GPA / 4 (best 4, pass 1)" },
  { key: "custom", label: "Custom scale…" },
];

/** Resolve the {@link GradeScale} a profile's grade is on, or null when not specified/invalid. */
export function scaleFor(profile: UserProfile): GradeScale | null {
  const key = profile.gradeScale as GradeScaleKey | "";
  if (!key) return null;
  if (key === "custom") {
    const best = Number(profile.customBest);
    const minPass = Number(profile.customMinPass);
    if (!Number.isFinite(best) || !Number.isFinite(minPass) || best === minPass) return null;
    return { best, minPass, name: "Custom scale" };
  }
  return COMMON_SCALES[key] ?? null;
}

/**
 * Deterministically convert the profile's grade to the German 1.0–4.0 scale, or null when the grade
 * or scale is missing/invalid. Wraps the throwing `convertToGermanGpa` so callers stay simple.
 */
export function deriveGermanGpa(profile: UserProfile): GpaConversion | null {
  const scale = scaleFor(profile);
  const grade = Number(profile.gradeValue);
  if (!scale || profile.gradeValue.trim() === "" || !Number.isFinite(grade)) return null;
  try {
    return convertToGermanGpa(grade, scale);
  } catch {
    return null;
  }
}

/** True once the user has entered anything meaningful — gates the dashboard's empty state. */
export function isProfileStarted(p: UserProfile): boolean {
  return Boolean(
    p.name.trim() ||
      p.currentDegree.trim() ||
      p.gradeValue.trim() ||
      p.targetField.trim() ||
      p.institution.trim(),
  );
}

/**
 * Adapt a {@link UserProfile} into the {@link ParsedProfile} shape the ResumeAnalyzer/dashboard
 * widgets consume, so they render the user's real data. ECTS stays ungrounded (null +
 * needsVerification) until the ECTS tool computes it — never fabricated (CLAUDE.md §2).
 */
export function toParsedProfile(p: UserProfile): ParsedProfile {
  const conv = deriveGermanGpa(p);
  const facts: ParsedProfile["facts"] = [];
  if (p.currentDegree.trim()) facts.push({ label: "Degree", value: p.currentDegree.trim() });
  if (p.institution.trim()) facts.push({ label: "Institution", value: p.institution.trim() });
  if (p.targetField.trim()) facts.push({ label: "Target field", value: p.targetField.trim() });
  if (p.targetIntake) {
    facts.push({
      label: "Target intake",
      value: p.targetIntake === "WS" ? "Wintersemester" : "Sommersemester",
    });
  }
  if (p.germanLevel && p.germanLevel !== "none") {
    facts.push({ label: "German level", value: p.germanLevel });
  } else if (p.germanLevel === "none") {
    facts.push({ label: "German level", value: "Beginner" });
  }
  // Work experience is a first-class fact (addendum §3) — shown only when real (no fake value).
  const exp = summarizeExperience(p, currentYM());
  if (exp.hasExperience && exp.totalMonths > 0) {
    facts.push({
      label: "Work experience",
      value: `${formatYearsMonths(exp.totalMonths)}${exp.relevantMonths > 0 ? ` (${formatYearsMonths(exp.relevantMonths)} relevant)` : ""}`,
    });
  }

  return {
    fileName: p.name.trim() || "Your profile",
    facts,
    germanGpa: conv
      ? { value: conv.germanGrade, sourceName: GPA_METHOD, needsVerification: false }
      : { value: null, needsVerification: true },
    gpaMethod: GPA_METHOD,
    totalEcts: { value: null, needsVerification: true },
    skillGaps: [],
  };
}
