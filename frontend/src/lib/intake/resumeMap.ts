/**
 * Map AI-extracted résumé "details" onto structured profile fields (data-engine work order — résumé
 * pre-fill). Normalises loose model values (e.g. "TOEFL 100", "CGPA out of 10") to the profile's
 * enums, and fills ONLY empty fields so it never overwrites what the user typed/confirmed. Pure +
 * unit-tested; the user still reviews everything on the confirm screen before save.
 */
import type { UserProfile } from "@/lib/profile/types";

export interface ResumeDetails {
  careerGoal: string;
  englishTestType: string;
  englishTestScore: string;
  germanTestType: string;
  mediumOfInstruction: string;
  gradeValue: string;
  gradeScale: string;
  graduationDate: string;
  dateOfBirth: string;
  targetField: string;
  highestQualification: string;
  coreSkills: string[];
}

const pick = (s: string, opts: string[]): string => {
  const v = (s ?? "").toLowerCase();
  return opts.find((o) => v.includes(o)) ?? "";
};

export function mapResumeDetails(draft: UserProfile, d: ResumeDetails): Partial<UserProfile> {
  const patch: Partial<UserProfile> = {};
  if (!draft.careerGoal && d.careerGoal) patch.careerGoal = d.careerGoal;
  if (!draft.targetField && d.targetField) patch.targetField = d.targetField;
  if (!draft.gradeValue && d.gradeValue) patch.gradeValue = d.gradeValue;
  if (!draft.graduationDate && /^\d{4}-\d{2}$/.test(d.graduationDate)) patch.graduationDate = d.graduationDate;
  if (!draft.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth)) patch.dateOfBirth = d.dateOfBirth;

  const en = pick(d.englishTestType, ["ielts", "toefl", "pte", "duolingo"]) as UserProfile["englishTestType"];
  if (!draft.englishTestType && en) {
    patch.englishTestType = en;
    if (!draft.englishTestScore && d.englishTestScore) patch.englishTestScore = d.englishTestScore;
  }
  const de = pick(d.germanTestType, ["testdaf", "dsh", "goethe", "telc", "dsd"]) as UserProfile["germanTestType"];
  if (!draft.germanTestType && de) patch.germanTestType = de;

  if (!draft.mediumOfInstruction) {
    if (/english|englisch/i.test(d.mediumOfInstruction)) patch.mediumOfInstruction = "english";
    else if (/\b(no|other|hindi|regional|german|deutsch)\b/i.test(d.mediumOfInstruction)) patch.mediumOfInstruction = "other";
  }
  if (!draft.gradeScale) {
    const gs = d.gradeScale.toLowerCase();
    if (/percent|%/.test(gs)) patch.gradeScale = "percent";
    else if (/cgpa|out of 10|\/\s*10|\b10\b/.test(gs)) patch.gradeScale = "cgpa10";
    else if (/\/\s*4|gpa.*4|4\.0/.test(gs)) patch.gradeScale = "gpa4";
  }
  if (!draft.highestQualification) {
    const hq = d.highestQualification.toLowerCase();
    if (/master|m\.?sc|m\.?tech|mba|m\.?a\b/.test(hq)) patch.highestQualification = "master";
    else if (/bachelor|b\.?tech|b\.?sc|b\.?a\b|b\.?e\b/.test(hq)) patch.highestQualification = "bachelor";
    else if (/class ?12|higher secondary|hsc|intermediate|12th/.test(hq)) patch.highestQualification = "class12";
  }
  return patch;
}
