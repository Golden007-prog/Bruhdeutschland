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
    id: "uni-tum-data-eng",
    university: "Technical University of Munich (TUM)",
    city: "Munich",
    program: "Data Engineering and Analytics",
    degree: "M.Sc.",
    language: "EN",
    field: "Data Science",
    homepage: "https://www.tum.de/en/studies/degree-programs/detail/data-engineering-and-analytics-master-of-science-msc",
    note: "English-taught; typically expects a strong computer-science / quantitative bachelor plus English proof (e.g. IELTS in the ~6.5 range) and TUM's aptitude assessment — exact thresholds vary, verify on the programme page.",
  },
  {
    id: "uni-rwth-sse",
    university: "RWTH Aachen University",
    city: "Aachen",
    program: "Software Systems Engineering",
    degree: "M.Sc.",
    language: "EN",
    field: "Computer Science",
    homepage: "https://www.rwth-aachen.de/cms/root/studium/vor-dem-studium/studiengaenge/liste-studiengaenge/~bnfd/software-systems-engineering-m-sc/",
    note: "English-taught; typically wants a solid CS foundation and an English-language certificate, with a subject-specific curriculum check — confirm the current admission rules on the official page.",
  },
  {
    id: "uni-tu-berlin-cs",
    university: "Technische Universität Berlin",
    city: "Berlin",
    program: "Computer Science (Informatik)",
    degree: "M.Sc.",
    language: "DE",
    field: "Computer Science",
    homepage: "https://www.tu.berlin/en/studying/study-programs/all-programs-from-a-to-z",
    note: "German-taught; typically requires proof of German (e.g. DSH/TestDaF) and sufficient ECTS in core CS subjects. Language and credit minimums change — verify per programme.",
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
    id: "uni-kit-mecheng",
    university: "Karlsruhe Institute of Technology (KIT)",
    city: "Karlsruhe",
    program: "Mechanical Engineering (Maschinenbau)",
    degree: "M.Sc.",
    language: "DE",
    field: "Mechanical Engineering",
    homepage: "https://www.kit.edu/studies/master-degree-programs.php",
    note: "Primarily German-taught; typically requires German proficiency and an engineering bachelor with a matching curriculum. Requirements vary — confirm on the official KIT page.",
  },
  {
    id: "uni-lmu-data-science",
    university: "Ludwig-Maximilians-Universität München (LMU Munich)",
    city: "Munich",
    program: "Data Science",
    degree: "M.Sc.",
    language: "EN",
    field: "Data Science",
    homepage: "https://www.lmu.de/en/study/all-degrees-and-programs/index.html",
    note: "English-taught; typically wants a statistics/maths/CS foundation, programming experience, and English proof. Exact prerequisites are programme-specific — verify on the official page.",
  },
  {
    id: "uni-tu-darmstadt-cs",
    university: "Technical University of Darmstadt (TU Darmstadt)",
    city: "Darmstadt",
    program: "Computer Science (Informatik)",
    degree: "M.Sc.",
    language: "EN",
    field: "Computer Science",
    homepage: "https://www.tu-darmstadt.de/studieren/studierende_tu/studiengaenge/index.en.jsp",
    note: "Offered with English-taught options; typically expects a CS bachelor and an English certificate, subject to an aptitude/curriculum assessment. Verify the current language and admission rules per programme.",
  },
  {
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
    id: "uni-heidelberg-scico",
    university: "Heidelberg University",
    city: "Heidelberg",
    program: "Scientific Computing",
    degree: "M.Sc.",
    language: "EN",
    field: "Computational Science",
    homepage: "https://www.uni-heidelberg.de/en/study/all-subjects",
    note: "English-taught; typically expects a quantitative bachelor with mathematics/programming prerequisites and English proof. The exact prerequisite list is programme-specific — verify on the official page.",
  },
  {
    id: "uni-tu-dresden-mecheng",
    university: "Technische Universität Dresden (TU Dresden)",
    city: "Dresden",
    program: "Advanced Computational and Civil Engineering Structural Studies (ACCESS)",
    degree: "M.Sc.",
    language: "EN",
    field: "Civil / Computational Engineering",
    homepage: "https://tu-dresden.de/studium/vor-dem-studium/studienangebot",
    note: "English-taught; typically requires a relevant engineering bachelor and English proof, with a subject-specific check. Requirements vary by intake — confirm on the official TU Dresden page.",
  },
];
