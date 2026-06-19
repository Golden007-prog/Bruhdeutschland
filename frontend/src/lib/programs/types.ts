/**
 * A real German Master's programme (ADR-0006). Mirrors the Supabase `programs` table. Every record is
 * provenance-stamped (`source`, `sourceUrl`, `retrievedAt`) and keeps `needsVerification: true` on
 * admission requirements — the app assists, it does not certify. Never fabricate programmes.
 */
export type ProgramLanguage = "de" | "en" | "de_en" | "other";
export type InstitutionType = "uni" | "uas" | "art_music";
export type Intake = "winter" | "summer" | "both";
export type AdmissionMode = "open" | "nc" | "aptitude";
export type StudyMode = "full_time" | "part_time" | "online" | "dual";

export interface Program {
  id: string;
  source: string; // DAAD | Hochschulkompass | curated
  sourceUrl: string;
  retrievedAt: string; // YYYY-MM-DD
  name: string;
  degree: string; // M.Sc. | M.A. | M.Eng. | LL.M. | ...
  courseType: string; // master (v1)
  university: string;
  institutionType: InstitutionType;
  city: string;
  bundesland: string;
  lat?: number;
  lng?: number;
  languages: ProgramLanguage;
  languageLevelEn?: string; // e.g. "IELTS 6.5"
  languageLevelDe?: string; // e.g. "DSH-1" / none
  subjectGroup: string; // one of the DAAD subject groups
  areasOfStudy: string[];
  mode: StudyMode;
  semesters?: number;
  intake: Intake;
  applicationDeadline?: string; // free text (verify)
  tuitionPerSemester?: number | null; // euros; null/undefined = no tuition
  semesterContribution?: number;
  admissionMode?: AdmissionMode;
  jointDoubleDegree?: boolean;
  scholarships?: string[];
  testsRequired?: Record<string, string>; // e.g. { ielts: "6.5", gre: "recommended" }
  needsVerification: boolean;
  description?: string;
}

/** The DAAD-style subject groups used for the facet. */
export const SUBJECT_GROUPS = [
  "Engineering",
  "Mathematics & Natural Sciences",
  "Law, Economics & Social Sciences",
  "Language & Cultural Studies",
  "Art, Music & Design",
  "Medicine & Health",
  "Agriculture, Forestry & Nutrition",
] as const;

export const BUNDESLAND_TUITION_NOTE = "Baden-Württemberg charges non-EU/EEA students €1,500/semester.";
export const TUITION_STATES = new Set(["Baden-Württemberg"]);
