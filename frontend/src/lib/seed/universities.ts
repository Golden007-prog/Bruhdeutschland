/**
 * Seed data for the Universities & Programs Explorer.
 *
 * These are REAL Master's programmes at German PUBLIC universities, used to demonstrate the
 * explorer — they are NOT a live admissions feed. Per CLAUDE.md §2, no exact admission figures
 * (IELTS/TOEFL bands, GPA cut-offs, deadlines, tuition, ECTS minimums) are asserted here as
 * authoritative: admission requirements are program-specific and revised yearly. Every `note`
 * is deliberately worded as indicative guidance ("typically ~", "verify on the programme page"),
 * and every entry carries a `homepage` link to the official university/programme page so the user
 * can confirm the current, binding requirements themselves.
 *
 * SINGLE SOURCE OF TRUTH: `lib/seed/programs.ts` (SEED_PROGRAMS) is canonical. Each entry below mirrors
 * a real SEED_PROGRAMS master row on the OVERLAPPING fields (university, programme name, city, field,
 * language) so the Universities explorer and the Matching page never present contradictory data. Only the
 * explorer-specific UX fields (the indicative `note`, the official `homepage` link, and the degree label)
 * are curated here. When SEED_PROGRAMS changes, keep these aligned — do not add a programme that isn't in
 * SEED_PROGRAMS, or the two pages diverge again.
 */
export type ProgramLanguage = "EN" | "DE";

export type ProgramDegree = "M.Sc." | "M.A." | "M.Eng.";

export interface UniversityProgram {
  /** Stable id for keys / comparison selection. */
  id: string;
  /** University name (public institution). */
  university: string;
  /** City the programme is based in. */
  city: string;
  /** Programme title. */
  program: string;
  /** Degree awarded. */
  degree: ProgramDegree;
  /** Language of instruction. */
  language: ProgramLanguage;
  /** Subject field, used for search/grouping (e.g. "Computer Science"). */
  field: string;
  /** Real official URL to the university or programme page — the source of truth to re-verify. */
  homepage: string;
  /**
   * Indicative requirement guidance only. NON-AUTHORITATIVE by design: any number here is a
   * rough "typically ~" hint, never an official cut-off. Always verify on the programme page.
   */
  note: string;
}

export const UNIVERSITY_PROGRAMS: UniversityProgram[] = [
  {
    // Mirrors SEED_PROGRAMS `tum-data-eng` (Data Engineering and Analytics, EN).
    id: "uni-tum-data-eng",
    university: "Technical University of Munich",
    city: "Munich",
    program: "Data Engineering and Analytics",
    degree: "M.Sc.",
    language: "EN",
    field: "Data Science",
    homepage: "https://www.tum.de/en/studies/degree-programs/detail/data-engineering-and-analytics-master-of-science-msc",
    note: "English-taught; typically expects a strong computer-science / quantitative bachelor plus English proof (e.g. IELTS in the ~6.5 range) and TUM's aptitude assessment — exact thresholds vary, verify on the programme page.",
  },
  {
    // Mirrors SEED_PROGRAMS `rwth-data-science` (Data Science, EN). (RWTH's "Software Systems Engineering"
    // is a real programme but isn't in SEED_PROGRAMS, so it's not listed here — keep the two sets aligned.)
    id: "uni-rwth-data-science",
    university: "RWTH Aachen University",
    city: "Aachen",
    program: "Data Science",
    degree: "M.Sc.",
    language: "EN",
    field: "Data Science",
    homepage: "https://www.rwth-aachen.de/cms/root/studium/Vor-dem-Studium/lidx/1/",
    note: "English-taught; typically wants a solid CS/quantitative foundation and an English-language certificate, with a subject-specific curriculum check — confirm the current admission rules on the official page.",
  },
  {
    // Mirrors SEED_PROGRAMS `freiburg-cs` (University of Freiburg, Computer Science, EN).
    id: "uni-freiburg-cs",
    university: "University of Freiburg",
    city: "Freiburg",
    program: "Computer Science",
    degree: "M.Sc.",
    language: "EN",
    field: "Computer Science",
    homepage: "https://www.uni-freiburg.de/en/studies",
    note: "English-taught; typically expects a CS bachelor and an English certificate, subject to a curriculum check. Strong in ML, robotics, and bioinformatics — verify the current rules per programme.",
  },
  {
    id: "uni-stuttgart-infotech",
    university: "University of Stuttgart",
    city: "Stuttgart",
    program: "Information Technology (INFOTECH)",
    degree: "M.Sc.",
    language: "EN",
    field: "Electrical & Computer Engineering",
    homepage: "https://www.uni-stuttgart.de/en/study/study-programs/Information-Technology-M.Sc-00001/",
    note: "English-taught; typically expects an electrical/computer-engineering background plus English proof — the precise score and prerequisite list are set per intake, verify on the programme page.",
  },
  {
    // Mirrors SEED_PROGRAMS `kit-optics` (Optics and Photonics, EN).
    id: "uni-kit-optics",
    university: "Karlsruhe Institute of Technology",
    city: "Karlsruhe",
    program: "Optics and Photonics",
    degree: "M.Sc.",
    language: "EN",
    field: "Physics",
    homepage: "https://www.kit.edu/studying.php",
    note: "English-taught; typically expects a physics/engineering bachelor with a matching curriculum and English proof. Requirements vary — confirm on the official KIT page.",
  },
  {
    // Mirrors SEED_PROGRAMS `lmu-data-science` (Data Science, EN).
    id: "uni-lmu-data-science",
    university: "LMU Munich",
    city: "Munich",
    program: "Data Science",
    degree: "M.Sc.",
    language: "EN",
    field: "Data Science",
    homepage: "https://www.lmu.de/en/study/all-degrees-and-programs/index.html",
    note: "English-taught; typically wants a statistics/maths/CS foundation, programming experience, and English proof. Exact prerequisites are programme-specific — verify on the official page.",
  },
  {
    // Mirrors SEED_PROGRAMS `darmstadt-dss` (Distributed Software Systems, EN).
    id: "uni-tu-darmstadt-dss",
    university: "Technical University of Darmstadt",
    city: "Darmstadt",
    program: "Distributed Software Systems",
    degree: "M.Sc.",
    language: "EN",
    field: "Computer Science",
    homepage: "https://www.tu-darmstadt.de/studieren/studierende_tu/studiengaenge/index.en.jsp",
    note: "English-taught; typically expects a CS bachelor and an English certificate, subject to an aptitude/curriculum assessment. Verify the current language and admission rules per programme.",
  },
  {
    // Mirrors SEED_PROGRAMS `mannheim-management` (Management, EN).
    id: "uni-mannheim-management",
    university: "University of Mannheim",
    city: "Mannheim",
    program: "Management",
    degree: "M.Sc.",
    language: "EN",
    field: "Management",
    homepage: "https://www.uni-mannheim.de/en/academics/programs/master/mannheim-master-in-management-mma/",
    note: "English-taught; business/management programmes are competitive and may consider GMAT/GRE alongside prior grades plus English proof. Indicative only — verify selection criteria on the programme page.",
  },
  {
    // Mirrors SEED_PROGRAMS `heidelberg-data-cs` (Data and Computer Science, EN).
    id: "uni-heidelberg-data-cs",
    university: "Heidelberg University",
    city: "Heidelberg",
    program: "Data and Computer Science",
    degree: "M.Sc.",
    language: "EN",
    field: "Computer Science",
    homepage: "https://www.uni-heidelberg.de/en/study/all-subjects",
    note: "English-taught; typically expects a quantitative bachelor with mathematics/programming prerequisites and English proof. The exact prerequisite list is programme-specific — verify on the official page.",
  },
  {
    // Mirrors SEED_PROGRAMS `dresden-cms` (Computational Modeling and Simulation, EN).
    id: "uni-tu-dresden-cms",
    university: "TU Dresden",
    city: "Dresden",
    program: "Computational Modeling and Simulation",
    degree: "M.Sc.",
    language: "EN",
    field: "Computational Engineering",
    homepage: "https://tu-dresden.de/studium/vor-dem-studium/studienangebot",
    note: "English-taught; typically requires a relevant engineering/science bachelor and English proof, with a subject-specific check. Requirements vary by intake — confirm on the official TU Dresden page.",
  },
];
