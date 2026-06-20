/**
 * Deterministic education-timeline derivation (non-linear-paths addendum §1, CLAUDE.md golden rule 4).
 * Turns the captured path + stages into the facts the pathway engine and eligibility need — total years,
 * has-class-12, degree-completed/ongoing, lateral-entry, current semester, and the QUALIFYING credential.
 * Pure + unit-tested. It never decides recognition (that's anabin/uni-assist) — it only summarises facts.
 */
import type {
  DegreeEntryType,
  EducationPathType,
  EducationStage,
  HighestQualification,
  UserProfile,
} from "./types";

export type QualifyingCredential = "degree" | "diploma" | "class12" | "class10" | "none";

export interface EducationSummary {
  pathType: EducationPathType;
  /** Whole years of formal education we can sum from dated stages (0 when unknown). */
  totalYears: number;
  hasClass12: boolean;
  degreeCompleted: boolean;
  degreeOngoing: boolean;
  /** Years of the (latest) degree stage, when datable. */
  yearsOfDegree: number;
  /** True when the applicant holds a higher credential (diploma/degree) but NO class 12 — the key case. */
  missingClass12: boolean;
  /** Entry type of the degree stage (lateral entry is the non-linear signal). */
  bachelorEntryType?: DegreeEntryType;
  /** Current semester of an ongoing degree (e.g. 3 for a lateral sem-3 student). */
  currentSemester?: number;
  /** The credential a German admission would actually assess. */
  qualifyingCredential: QualifyingCredential;
  /** True when the path is anything other than the linear 10→12→Bachelor default. */
  isNonLinear: boolean;
}

const DEGREE_LEVELS = new Set(["bachelor", "master", "integrated"]);

function yearsOf(stage: EducationStage): number {
  const a = Number(stage.startYear);
  const b = Number(stage.endYear);
  if (Number.isFinite(a) && Number.isFinite(b) && b >= a && a > 1900) return b - a;
  return 0;
}

/** Map the legacy single highestQualification to a coarse summary when no structured stages exist. */
function fromHighestQualification(q: HighestQualification, pathType: EducationPathType): EducationSummary {
  const degreeCompleted = q === "bachelor" || q === "master";
  const degreeOngoing = q === "some_bachelor";
  // Without stages we assume a linear schooling chain UNLESS the path type says otherwise.
  const nonLinearNoClass12 = pathType === "diploma_lateral" || pathType === "diploma_only";
  const hasClass12 = !nonLinearNoClass12 && q !== "class10" && q !== "";
  const qualifyingCredential: QualifyingCredential =
    degreeCompleted ? "degree" : pathType === "diploma_only" ? "diploma" : hasClass12 ? "class12" : q === "class10" ? "class10" : "none";
  return {
    pathType,
    totalYears: 0,
    hasClass12,
    degreeCompleted,
    degreeOngoing,
    yearsOfDegree: 0,
    missingClass12: nonLinearNoClass12 && (degreeCompleted || degreeOngoing || pathType === "diploma_only"),
    qualifyingCredential,
    isNonLinear: pathType !== "" && pathType !== "regular",
  };
}

/** Summarise a profile's education history deterministically. */
export function summarizeEducation(p: UserProfile): EducationSummary {
  const pathType = p.educationPathType ?? "";
  const stages = p.educationStages ?? [];

  if (stages.length === 0) return fromHighestQualification(p.highestQualification, pathType);

  const hasClass12 = stages.some((s) => s.level === "class12");
  const degreeStages = stages.filter((s) => DEGREE_LEVELS.has(s.level));
  const completedDegree = degreeStages.find((s) => s.status === "completed");
  const ongoingDegree = degreeStages.find((s) => s.status === "ongoing");
  const latestDegree = completedDegree ?? ongoingDegree;
  const hasDiploma = stages.some((s) => s.level === "diploma");

  const totalYears = stages.reduce((sum, s) => sum + yearsOf(s), 0);
  const degreeCompleted = !!completedDegree;
  const degreeOngoing = !completedDegree && !!ongoingDegree;

  const currentSemRaw = Number(ongoingDegree?.currentSemester);
  const currentSemester = Number.isFinite(currentSemRaw) && currentSemRaw > 0 ? currentSemRaw : undefined;

  const qualifyingCredential: QualifyingCredential = degreeCompleted
    ? "degree"
    : hasDiploma && !degreeOngoing
      ? "diploma"
      : hasClass12
        ? "class12"
        : stages.some((s) => s.level === "class10")
          ? "class10"
          : "none";

  const missingClass12 = !hasClass12 && (degreeCompleted || degreeOngoing || hasDiploma);

  return {
    pathType: pathType || (missingClass12 && hasDiploma ? "diploma_lateral" : "regular"),
    totalYears,
    hasClass12,
    degreeCompleted,
    degreeOngoing,
    yearsOfDegree: latestDegree ? yearsOf(latestDegree) : 0,
    missingClass12,
    bachelorEntryType: latestDegree?.entryType,
    currentSemester,
    qualifyingCredential,
    isNonLinear: missingClass12 || (pathType !== "" && pathType !== "regular"),
  };
}

/** A fresh, empty stage with a stable id. */
export function newEducationStage(level: EducationStage["level"]): EducationStage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `edu-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    level,
    status: "completed",
    startYear: "",
    endYear: "",
    institution: "",
    board: "",
    entryType: DEGREE_LEVELS.has(level) ? "regular" : undefined,
    currentSemester: undefined,
  };
}
