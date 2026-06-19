import type { Source } from "@/lib/types";
import { source } from "@/lib/sources";

/**
 * Illustrative program matches for the Course & University Matching demo.
 *
 * These are plausible Master's programs at German PUBLIC universities used to show how matching
 * works — they are NOT a live admissions feed. Crucially, every program's admission threshold is
 * program-specific and changes yearly, so each card renders requirements as `needsVerification`
 * with a link to confirm against DAAD / the program page (CLAUDE.md §2). No grades, GPA cut-offs,
 * or test scores are asserted here.
 */
export type ProgramLanguage = "EN" | "DE";

export interface MatchedProgram {
  id: string;
  name: string;
  university: string;
  city: string;
  field: string;
  language: ProgramLanguage;
  /** Illustrative fit score (0–100) from the demo matcher — not an admission probability. */
  fitPct: number;
  /** Short, program-specific requirement chips. All are unverified by design. */
  requirements: string[];
  /** Where to confirm the requirements above. */
  source: Source;
}

export const MATCHED_PROGRAMS: MatchedProgram[] = [
  {
    id: "mp-tum-de",
    name: "M.Sc. Data Engineering and Analytics",
    university: "Technical University of Munich (TUM)",
    city: "Munich",
    field: "Computer Science / Data",
    language: "EN",
    fitPct: 92,
    requirements: ["Bachelor in CS or related", "English proficiency", "Aptitude assessment"],
    source: source("daadRequirements"),
  },
  {
    id: "mp-rwth-cs",
    name: "M.Sc. Software Systems Engineering",
    university: "RWTH Aachen University",
    city: "Aachen",
    field: "Computer Science",
    language: "EN",
    fitPct: 87,
    requirements: ["Strong CS foundation", "English proficiency", "Curriculum match check"],
    source: source("daadRequirements"),
  },
  {
    id: "mp-tub-ict",
    name: "M.Sc. Computer Science (Informatik)",
    university: "Technische Universität Berlin",
    city: "Berlin",
    field: "Computer Science",
    language: "DE",
    fitPct: 81,
    requirements: ["German proficiency (DSH/TestDaF)", "Min. ECTS in core CS", "Subject-specific check"],
    source: source("daad"),
  },
  {
    id: "mp-uhd-scico",
    name: "M.Sc. Scientific Computing",
    university: "Heidelberg University",
    city: "Heidelberg",
    field: "Computational Science",
    language: "EN",
    fitPct: 78,
    requirements: ["Quantitative background", "Mathematics prerequisites", "English proficiency"],
    source: source("daadRequirements"),
  },
  {
    id: "mp-kit-iss",
    name: "M.Sc. Information Systems Engineering & Management",
    university: "Karlsruhe Institute of Technology (KIT)",
    city: "Karlsruhe",
    field: "Information Systems",
    language: "DE",
    fitPct: 74,
    requirements: ["German proficiency", "Economics/IT mix", "Letter of motivation"],
    source: source("daad"),
  },
  {
    id: "mp-lmu-ml",
    name: "M.Sc. Data Science",
    university: "LMU Munich",
    city: "Munich",
    field: "Statistics / Machine Learning",
    language: "EN",
    fitPct: 70,
    requirements: ["Statistics foundation", "Programming experience", "English proficiency"],
    source: source("daadRequirements"),
  },
];
