import { useEffect, useState } from "react";

import { SEED_PROGRAMS } from "@/lib/seed/programs";
import { supabase } from "@/lib/supabase/client";
import type { Program } from "./types";

interface ProgramRow {
  id: string;
  source: string;
  source_url: string;
  retrieved_at: string;
  name: string;
  degree: string | null;
  course_type: string;
  university: string;
  institution_type: string | null;
  city: string | null;
  bundesland: string | null;
  lat: number | null;
  lng: number | null;
  languages: string;
  language_level_en: string | null;
  language_level_de: string | null;
  subject_group: string | null;
  areas_of_study: string[] | null;
  mode: string | null;
  semesters: number | null;
  intake: string;
  application_deadline: string | null;
  tuition_per_semester: number | null;
  semester_contribution: number | null;
  admission_mode: string | null;
  joint_double_degree: boolean | null;
  scholarships: string[] | null;
  tests_required: Record<string, string> | null;
  needs_verification: boolean;
  description: string | null;
}

const COLUMNS =
  "id,source,source_url,retrieved_at,name,degree,course_type,university,institution_type,city,bundesland,lat,lng,languages,language_level_en,language_level_de,subject_group,areas_of_study,mode,semesters,intake,application_deadline,tuition_per_semester,semester_contribution,admission_mode,joint_double_degree,scholarships,tests_required,needs_verification,description";

function mapRow(r: ProgramRow): Program {
  return {
    id: r.id,
    source: r.source,
    sourceUrl: r.source_url,
    retrievedAt: r.retrieved_at,
    name: r.name,
    degree: r.degree ?? "",
    courseType: r.course_type,
    university: r.university,
    institutionType: (r.institution_type as Program["institutionType"]) ?? "uni",
    city: r.city ?? "",
    bundesland: r.bundesland ?? "",
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
    languages: (r.languages as Program["languages"]) ?? "en",
    languageLevelEn: r.language_level_en ?? undefined,
    languageLevelDe: r.language_level_de ?? undefined,
    subjectGroup: r.subject_group ?? "",
    areasOfStudy: r.areas_of_study ?? [],
    mode: (r.mode as Program["mode"]) ?? "full_time",
    semesters: r.semesters ?? undefined,
    intake: (r.intake as Program["intake"]) ?? "winter",
    applicationDeadline: r.application_deadline ?? undefined,
    tuitionPerSemester: r.tuition_per_semester,
    semesterContribution: r.semester_contribution ?? undefined,
    admissionMode: (r.admission_mode as Program["admissionMode"]) ?? undefined,
    jointDoubleDegree: r.joint_double_degree ?? false,
    scholarships: r.scholarships ?? [],
    testsRequired: r.tests_required ?? {},
    needsVerification: r.needs_verification,
    description: r.description ?? undefined,
  };
}

export interface ProgramData {
  programs: Program[];
  loading: boolean;
  /** Where the data came from — for honest "live from Supabase" vs "bundled" labelling. */
  source: "supabase" | "seed";
}

/**
 * Loads REAL programmes from Supabase `programs` (public read); falls back to the committed curated
 * seed when Supabase is unconfigured, errors, or is empty. Never fabricates programmes (ADR-0006).
 */
export function useProgramData(): ProgramData {
  const [programs, setPrograms] = useState<Program[]>(SEED_PROGRAMS);
  const [loading, setLoading] = useState<boolean>(Boolean(supabase));
  const [source, setSource] = useState<"supabase" | "seed">("seed");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    void supabase
      .from("programs")
      .select(COLUMNS)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data && data.length > 0) {
          setPrograms((data as unknown as ProgramRow[]).map(mapRow));
          setSource("supabase");
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { programs, loading, source };
}
