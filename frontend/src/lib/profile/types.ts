/**
 * The user's intake profile — the single personalization source for the whole app (page-audit §3.1).
 * Persisted via {@link useProfile} (localStorage-first, Supabase `profiles`/`settings` when signed in).
 * Replaces the old hardcoded `lib/mockData` profile on the dashboard and profile pages.
 *
 * India-primary defaults (master work order §7 / task #14): `homeCountry` starts at "India" and the
 * grade scale defaults to the 10-point CGPA common at Indian universities.
 */
import type { GradeScale } from "@/lib/calc/gpa";

export type GermanLevel = "" | "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type TargetIntake = "" | "WS" | "SS";

/** Study level the user is aiming for — routes the whole app into the right German pathway (addendum §0). */
export type TargetLevel = "" | "bachelor" | "master" | "phd" | "medicine" | "studienkolleg";

/** The applicant's highest completed qualification — gates HZB / Studienkolleg / direct-entry decisions. */
export type HighestQualification = "" | "class10" | "class12" | "some_bachelor" | "bachelor" | "master";

/**
 * The SHAPE of the applicant's education history (non-linear-paths addendum §1). Real applicants don't
 * all go 10 → 12 → Bachelor: a very common South-Asian path is 10th → polytechnic diploma → LATERAL
 * entry into year 2 of a B.Tech (i.e. NO class 12 / no Abitur-equivalent). Capturing the path lets the
 * engine route on the BACHELOR's recognition, not the schooling route — without fabricating any rule.
 */
export type EducationPathType =
  | "" // unset → fall back to highestQualification
  | "regular" //            10 + 12 + Bachelor (the linear default)
  | "diploma_lateral" //    10 + diploma + lateral-entry Bachelor (no class 12)
  | "diploma_only" //       diploma, no Bachelor (vocational — not a university HZB)
  | "class12_only" //       12, no Bachelor yet
  | "integrated" //         integrated / dual degree
  | "other";

export type EducationStageLevel = "class10" | "class12" | "diploma" | "bachelor" | "master" | "integrated";
/** How the applicant entered a degree — lateral entry (e.g. diploma → year 2) is the key non-linear case. */
export type DegreeEntryType = "regular" | "lateral";

/** One stage in the education timeline. Years are "YYYY" strings (kept as strings for controlled inputs). */
export interface EducationStage {
  id: string;
  level: EducationStageLevel;
  status: "completed" | "ongoing";
  startYear: string;
  endYear: string; // expected end if ongoing
  institution: string;
  board: string; // board / awarding university
  /** Degree stages only — regular vs lateral entry. */
  entryType?: DegreeEntryType;
  /** Ongoing degree stages only — current semester (e.g. "3" for a lateral-entry sem-3 student). */
  currentSemester?: string;
}

/** Keys into {@link COMMON_SCALES} plus an explicit custom scale. */
export type GradeScaleKey = "percent" | "cgpa10" | "gpa4" | "custom";

/** Kind of role — kept distinct so EPOS-style "post-degree professional" rules can be precise. */
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "internship"
  | "working_student"
  | "freelance"
  | "research"
  | "volunteer";

/**
 * One user-confirmed work experience (addendum §1). A FIRST-CLASS profile dimension, SEPARATE from the
 * academic GPA — it never alters the German grade. Dates are "YYYY-MM" (month precision is enough for
 * year/month totals and the EPOS "degree within N years" rule).
 */
export interface WorkExperience {
  id: string;
  title: string;
  employer: string;
  country: string;
  employmentType: EmploymentType;
  startDate: string; // "YYYY-MM"
  endDate: string; // "YYYY-MM" — ignored when ongoing
  ongoing: boolean;
  domain: string;
  skills: string[];
  description: string;
  /** User/parse flag: does this role relate to the target field? Drives "relevant experience". */
  relevantToTarget: boolean;
}

export interface UserProfile {
  name: string;
  /** ISO-ish country name. Drives APS/visa logic (India-primary). */
  homeCountry: string;
  currentDegree: string;
  institution: string;
  /** Raw numeric grade as typed (kept as string for controlled inputs). */
  gradeValue: string;
  /** Which scale `gradeValue` is on, so GPA conversion is deterministic, not guessed. */
  gradeScale: GradeScaleKey | "";
  /** Only used when `gradeScale === "custom"`. */
  customBest: string;
  customMinPass: string;
  targetIntake: TargetIntake;
  targetField: string;
  germanLevel: GermanLevel;
  /** What the user is applying FOR — drives the pathway engine (Bachelor/Master/Medicine/Studienkolleg). */
  targetLevel: TargetLevel;
  /** The user's highest completed qualification — gates Studienkolleg-vs-direct-entry. */
  highestQualification: HighestQualification;
  /** Shape of the education history (non-linear-paths addendum). Drives lateral-entry / diploma routing. */
  educationPathType: EducationPathType;
  /** Optional structured education timeline (stages). Empty → the engine falls back to highestQualification. */
  educationStages: EducationStage[];
  /** Month the current degree was (or will be) obtained, "YYYY-MM". Drives "degree within N years". */
  graduationDate: string;
  /** Professional history (addendum §1). Empty for a new user → no fake experience value shown. */
  workExperiences: WorkExperience[];

  // ── Intake "data engine" fields (each powers a downstream feature) ────────────────────────────
  /** "YYYY-MM-DD" — drives health-insurance tier (under/over 30) + age-capped scholarships. */
  dateOfBirth: string;
  /** Target intake year (e.g. "2026") — with the season, drives deadline math + the roadmap. */
  targetIntakeYear: string;
  /** Was your degree taught in English? → IELTS/TOEFL waiver logic (Master's). */
  mediumOfInstruction: "" | "english" | "other";
  /** English test taken/planned → eligibility + mock-test recommendations. */
  englishTestType: "" | "ielts" | "toefl" | "pte" | "duolingo" | "none" | "planned";
  englishTestScore: string;
  /** German test taken/planned → eligibility + mock-test recommendations. */
  germanTestType: "" | "testdaf" | "dsh" | "goethe" | "telc" | "dsd" | "none" | "planned";
  /** How you'll fund your studies → finance + scholarship surfacing. */
  fundingSource: "" | "self" | "family" | "loan" | "scholarship";
  /** Blocked-account (Sperrkonto) progress → finance + visa readiness. */
  sperrkontoStatus: "" | "not_started" | "opening" | "done";
  /** Accompanying dependents → finance budget + family-reunion visa. */
  dependents: "" | "none" | "spouse" | "spouse_children";
  /** Passport expiry "YYYY-MM" → visa readiness (must be valid well beyond your stay). */
  passportExpiry: string;
  /** Previous Schengen/German visa refusal → visa interview prep. */
  visaRefusal: boolean;
  /** Documents you already hold → auto-derives the "documents you still need" list. */
  documentsOnHand: string[];
  /** One-line career goal/motivation → SOP generator + programme fit. */
  careerGoal: string;
  /** Number of recommenders available (for the LOR feature). */
  recommendersAcademic: number;
  recommendersProfessional: number;

  /** ISO timestamp of the last edit; null when never saved. */
  updatedAt: string | null;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  homeCountry: "India",
  currentDegree: "",
  institution: "",
  gradeValue: "",
  gradeScale: "",
  customBest: "",
  customMinPass: "",
  targetIntake: "",
  targetField: "",
  germanLevel: "",
  targetLevel: "",
  highestQualification: "",
  educationPathType: "",
  educationStages: [],
  graduationDate: "",
  workExperiences: [],
  dateOfBirth: "",
  targetIntakeYear: "",
  mediumOfInstruction: "",
  englishTestType: "",
  englishTestScore: "",
  germanTestType: "",
  fundingSource: "",
  sperrkontoStatus: "",
  dependents: "",
  passportExpiry: "",
  visaRefusal: false,
  documentsOnHand: [],
  careerGoal: "",
  recommendersAcademic: 0,
  recommendersProfessional: 0,
  updatedAt: null,
};

/** A selectable grade scale for the intake form (label + resolver handled in profile.ts). */
export interface ScaleOption {
  key: GradeScaleKey;
  label: string;
}

export type { GradeScale };
