/**
 * Client-side hybrid search over the curated programme set (ADR-0006). Lexical (FTS-style weighted
 * term scoring) + fuzzy (trigram similarity for typos/autocomplete), fused with Reciprocal Rank Fusion
 * — so a typo'd or partial query still ranks the right programmes. Plus the faceted filters and live
 * facet counts (OR within a facet, AND across facets). For tens–hundreds of programmes this runs in
 * <1ms; the Supabase `search_programs` RPC is the scale path for thousands.
 */
import type { EligibilityRollup } from "./eligibility";
import { eligibility } from "./eligibility";
import type { UserProfile } from "@/lib/profile/types";
import type {
  AdmissionMode,
  InstitutionType,
  Intake,
  Program,
  ProgramLanguage,
  StudyMode,
} from "./types";

export interface Filters {
  q?: string;
  language?: ProgramLanguage[];
  subjectGroup?: string[];
  degree?: string[];
  bundesland?: string[];
  city?: string[];
  institutionType?: InstitutionType[];
  university?: string[];
  intake?: Intake[];
  admissionMode?: AdmissionMode[];
  mode?: StudyMode[];
  tuition?: ("none" | "fees")[];
  tests?: string[];
  jointDouble?: boolean;
  deadlineSoon?: boolean;
  noTuition?: boolean;
  eligibility?: EligibilityRollup[];
  semestersMax?: number;
}

export type FacetKey =
  | "language"
  | "subjectGroup"
  | "degree"
  | "bundesland"
  | "city"
  | "institutionType"
  | "intake"
  | "admissionMode"
  | "mode"
  | "tuition";

export const FACET_KEYS: FacetKey[] = [
  "language",
  "subjectGroup",
  "degree",
  "bundesland",
  "city",
  "institutionType",
  "intake",
  "admissionMode",
  "mode",
  "tuition",
];

const FACET_OF: Record<FacetKey, (p: Program) => string[]> = {
  language: (p) => [p.languages],
  subjectGroup: (p) => [p.subjectGroup].filter(Boolean),
  degree: (p) => [p.degree].filter(Boolean),
  bundesland: (p) => [p.bundesland].filter(Boolean),
  city: (p) => [p.city].filter(Boolean),
  institutionType: (p) => [p.institutionType],
  intake: (p) => [p.intake],
  admissionMode: (p) => (p.admissionMode ? [p.admissionMode] : []),
  mode: (p) => [p.mode],
  tuition: (p) => [p.tuitionPerSemester ? "fees" : "none"],
};

const FACET_FILTER: Record<FacetKey, (f: Filters) => string[] | undefined> = {
  language: (f) => f.language,
  subjectGroup: (f) => f.subjectGroup,
  degree: (f) => f.degree,
  bundesland: (f) => f.bundesland,
  city: (f) => f.city,
  institutionType: (f) => f.institutionType,
  intake: (f) => f.intake,
  admissionMode: (f) => f.admissionMode,
  mode: (f) => f.mode,
  tuition: (f) => f.tuition,
};

function facetMatch(p: Program, key: FacetKey, selected?: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  return FACET_OF[key](p).some((v) => selected.includes(v));
}

/** Non-facet special filters (tests, joint-degree, no-tuition, duration). */
function specialMatch(p: Program, f: Filters): boolean {
  if (f.jointDouble && !p.jointDoubleDegree) return false;
  if (f.noTuition && p.tuitionPerSemester) return false;
  if (typeof f.semestersMax === "number" && (p.semesters ?? 99) > f.semestersMax) return false;
  if (f.tests && f.tests.length > 0) {
    const has = Object.keys(p.testsRequired ?? {});
    if (!f.tests.some((t) => has.includes(t))) return false;
  }
  return true;
}

// ── text search ───────────────────────────────────────────────────────────────
const tokenize = (s: string): string[] => (s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []);

export function lexicalScore(p: Program, q: string): number {
  const qt = tokenize(q);
  if (qt.length === 0) return 0;
  const name = p.name.toLowerCase();
  const uni = p.university.toLowerCase();
  const areas = p.areasOfStudy.join(" ").toLowerCase();
  const extra = `${p.subjectGroup} ${p.city} ${p.description ?? ""}`.toLowerCase();
  let score = 0;
  for (const t of qt) {
    if (name.includes(t)) score += 4;
    if (uni.includes(t)) score += 2;
    if (areas.includes(t)) score += 2;
    if (extra.includes(t)) score += 1;
  }
  return score;
}

function trigrams(s: string): Set<string> {
  const x = ` ${s.toLowerCase().trim()} `;
  const out = new Set<string>();
  for (let i = 0; i < x.length - 2; i += 1) out.add(x.slice(i, i + 3));
  return out;
}

function trigramSim(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

export function fuzzyScore(p: Program, q: string): number {
  if (!q.trim()) return 0;
  return Math.max(
    trigramSim(q, p.name),
    trigramSim(q, p.university) * 0.6,
    ...p.areasOfStudy.map((a) => trigramSim(q, a) * 0.7),
  );
}

export interface Scored {
  program: Program;
  relevance: number; // 0–100 for display
}

/**
 * Rank by Reciprocal Rank Fusion of the lexical and fuzzy orderings. Returns programmes that match
 * either signal; without a query, relevance is 0 (callers sort by another key).
 */
export function rankByQuery(programs: Program[], q: string): Scored[] {
  if (!q.trim()) return programs.map((program) => ({ program, relevance: 0 }));
  const lex = [...programs].map((p) => ({ p, s: lexicalScore(p, q) }));
  const fuz = [...programs].map((p) => ({ p, s: fuzzyScore(p, q) }));
  const lexRank = [...lex].sort((a, b) => b.s - a.s);
  const fuzRank = [...fuz].sort((a, b) => b.s - a.s);
  const K = 60;
  const fused = new Map<string, number>();
  lexRank.forEach((e, i) => {
    if (e.s > 0) fused.set(e.p.id, (fused.get(e.p.id) ?? 0) + 1 / (K + i));
  });
  fuzRank.forEach((e, i) => {
    if (e.s > 0.18) fused.set(e.p.id, (fused.get(e.p.id) ?? 0) + 1 / (K + i));
  });
  const scored = programs
    .filter((p) => fused.has(p.id))
    .map((program) => ({ program, raw: fused.get(program.id) ?? 0 }));
  const max = Math.max(1e-9, ...scored.map((s) => s.raw));
  return scored
    .map((s) => ({ program: s.program, relevance: Math.round((s.raw / max) * 100) }))
    .sort((a, b) => b.relevance - a.relevance);
}

// ── filtering, facets, sort ─────────────────────────────────────────────────────
function passesFacets(p: Program, f: Filters, exclude?: FacetKey): boolean {
  for (const key of FACET_KEYS) {
    if (key === exclude) continue;
    if (!facetMatch(p, key, FACET_FILTER[key](f))) return false;
  }
  return true;
}

export function filterPrograms(programs: Program[], f: Filters, profile?: UserProfile): Program[] {
  return programs.filter((p) => {
    if (!passesFacets(p, f)) return false;
    if (!specialMatch(p, f)) return false;
    if (f.eligibility && f.eligibility.length > 0) {
      if (!profile) return false;
      if (!f.eligibility.includes(eligibility(profile, p).rollup)) return false;
    }
    return true;
  });
}

export type Facets = Record<FacetKey, { value: string; count: number }[]>;

/** Live counts per facet option: OR within a facet, AND across facets (excluding the facet's own selection). */
export function facetCounts(programs: Program[], f: Filters): Facets {
  const q = f.q ?? "";
  const textBase = q.trim() ? new Set(rankByQuery(programs, q).map((s) => s.program.id)) : null;
  const out = {} as Facets;
  for (const key of FACET_KEYS) {
    const base = programs.filter(
      (p) => (!textBase || textBase.has(p.id)) && passesFacets(p, f, key) && specialMatch(p, f),
    );
    const counts = new Map<string, number>();
    for (const p of base) for (const v of FACET_OF[key](p)) counts.set(v, (counts.get(v) ?? 0) + 1);
    out[key] = [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }
  return out;
}

export type SortKey = "relevance" | "deadline" | "tuition" | "duration" | "az";

export function sortScored(items: Scored[], sort: SortKey): Scored[] {
  const arr = [...items];
  switch (sort) {
    case "tuition":
      return arr.sort((a, b) => (a.program.tuitionPerSemester ?? 0) - (b.program.tuitionPerSemester ?? 0) || a.program.name.localeCompare(b.program.name));
    case "duration":
      return arr.sort((a, b) => (a.program.semesters ?? 99) - (b.program.semesters ?? 99) || a.program.name.localeCompare(b.program.name));
    case "az":
      return arr.sort((a, b) => a.program.university.localeCompare(b.program.university) || a.program.name.localeCompare(b.program.name));
    case "deadline":
      return arr.sort((a, b) => (a.program.applicationDeadline ?? "~").localeCompare(b.program.applicationDeadline ?? "~"));
    case "relevance":
    default:
      return arr.sort((a, b) => b.relevance - a.relevance);
  }
}

export interface SearchResult {
  results: Scored[];
  total: number;
  facets: Facets;
}

/** One call: filter → rank → facet-count, mirroring the eventual `search_programs` RPC contract. */
export function runSearch(programs: Program[], f: Filters, sort: SortKey, profile?: UserProfile): SearchResult {
  const filtered = filterPrograms(programs, f, profile);
  const ranked = rankByQuery(filtered, f.q ?? "");
  return {
    results: sortScored(ranked, f.q?.trim() ? sort : sort === "relevance" ? "az" : sort),
    total: ranked.length,
    facets: facetCounts(programs, f),
  };
}

/** Autocomplete suggestions over names, universities, cities, areas. */
export function autocomplete(programs: Program[], prefix: string, n = 6): string[] {
  const p = prefix.toLowerCase().trim();
  if (p.length < 2) return [];
  const pool = new Set<string>();
  for (const prog of programs) {
    pool.add(prog.name);
    pool.add(prog.university);
    if (prog.city) pool.add(prog.city);
    for (const a of prog.areasOfStudy) pool.add(a);
  }
  return [...pool]
    .filter((s) => s.toLowerCase().includes(p))
    .sort((a, b) => Number(b.toLowerCase().startsWith(p)) - Number(a.toLowerCase().startsWith(p)) || a.length - b.length)
    .slice(0, n);
}
