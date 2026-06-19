import type { FacetKey } from "@/lib/programs/search";

export const LANG_LABEL: Record<string, string> = {
  en: "English",
  de: "German",
  de_en: "German & English",
  other: "Other",
};
export const INST_LABEL: Record<string, string> = {
  uni: "University",
  uas: "Univ. of Applied Sciences",
  art_music: "Art & Music college",
};
export const INTAKE_LABEL: Record<string, string> = {
  winter: "Winter (Oct)",
  summer: "Summer (Apr)",
  both: "Winter & Summer",
};
export const ADMISSION_LABEL: Record<string, string> = {
  open: "Open admission",
  nc: "NC (restricted)",
  aptitude: "Aptitude assessment",
};
export const MODE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  online: "Online",
  dual: "Dual",
};
export const TUITION_LABEL: Record<string, string> = { none: "No tuition", fees: "Has fees" };

export const FACET_TITLES: Record<FacetKey, string> = {
  subjectGroup: "Subject group",
  language: "Course language",
  degree: "Degree awarded",
  bundesland: "Federal state",
  city: "City",
  institutionType: "Institution type",
  intake: "Intake",
  admissionMode: "Admission",
  mode: "Mode of study",
  tuition: "Tuition",
};

/** Human label for a facet value. */
export function facetValueLabel(key: FacetKey, value: string): string {
  switch (key) {
    case "language":
      return LANG_LABEL[value] ?? value;
    case "institutionType":
      return INST_LABEL[value] ?? value;
    case "intake":
      return INTAKE_LABEL[value] ?? value;
    case "admissionMode":
      return ADMISSION_LABEL[value] ?? value;
    case "mode":
      return MODE_LABEL[value] ?? value;
    case "tuition":
      return TUITION_LABEL[value] ?? value;
    default:
      return value;
  }
}
