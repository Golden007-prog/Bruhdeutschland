/**
 * Official exam FORMAT facts with provenance (work-order §2 anti-hallucination rule). The model
 * generates practice *content*, but structural facts — section counts, timing, scoring scales — come
 * from here, never invented. Each spec carries `{ source_name, source_url, retrieved_at,
 * needs_verification }`. Figures are volatile (exams redesign) — treat as indicative and re-verify.
 *
 * ⚠️ TOEFL iBT was RESTRUCTURED on 21 Jan 2026 (work-order §0/§4). The live test (`toefl`) is now
 * multistage-adaptive with all-new task types on a 1–6 CEFR-aligned band scale (0–120 concordance
 * shown through ~2028). The retired format is kept as `toefl-legacy` so students can still practise
 * it and so old 0–120 scores can be interpreted. Everything TOEFL-2026 is `needs_verification`.
 */
import type { ExamLanguage, ExamSkill } from "@/lib/exam/schema";

export interface Provenance {
  source_name: string;
  source_url: string;
  /** ISO date the figure was last checked. */
  retrieved_at: string;
  /** True when the cited figure is volatile / mid-transition and must be re-verified before relying on it. */
  needs_verification?: boolean;
}

/** Which deterministic scoring model a spec uses (see lib/exam/scale.ts). */
export type ScaleKind = "ielts" | "toefl-2026" | "toefl-legacy" | "tdn" | "percent" | "raw";

export interface SectionSpec {
  skill: ExamSkill;
  label: string;
  /** Number of objective questions to generate (0 for open-only sections). */
  questions: number;
  /** Number of open tasks (Writing/Speaking). */
  openTasks?: number;
  timeMin: number;
  format: string;
  /** Authentic question-type names to draw from when generating. */
  questionTypes?: string[];
  /** Native accents to rotate through for Listening (work-order §3 human-voice requirement). */
  accents?: string[];
  /** True for multistage-adaptive sections (TOEFL-2026 Reading & Listening). */
  adaptive?: boolean;
}

export interface ExamSpec {
  id: string;
  title: string;
  language: ExamLanguage;
  scoreScale: string;
  /** Deterministic scoring model (defaults to "percent" when unset). */
  scale?: ScaleKind;
  /** True when results map to CEFR (TOEFL-2026, TestDaF, Goethe). */
  cefrAligned?: boolean;
  sections: SectionSpec[];
  /** Indicative raw→band/scaled conversion, where applicable (IELTS). */
  rawToBand?: { minRaw: number; band: number }[];
  bandLabel?: string;
  provenance: Provenance;
  /** TTS voice language hint for Listening. */
  ttsLang: string;
  /** Optional id of the variant this is a legacy form of (toefl-legacy → toefl). */
  legacyOf?: string;
}

const TODAY = "2026-06-20";

/** Indicative IELTS Academic raw(/40)→band table per section. Official conversion varies by form. */
export const IELTS_RAW_TO_BAND: { minRaw: number; band: number }[] = [
  { minRaw: 39, band: 9.0 },
  { minRaw: 37, band: 8.5 },
  { minRaw: 35, band: 8.0 },
  { minRaw: 33, band: 7.5 },
  { minRaw: 30, band: 7.0 },
  { minRaw: 27, band: 6.5 },
  { minRaw: 23, band: 6.0 },
  { minRaw: 19, band: 5.5 },
  { minRaw: 15, band: 5.0 },
  { minRaw: 13, band: 4.5 },
  { minRaw: 10, band: 4.0 },
  { minRaw: 8, band: 3.5 },
  { minRaw: 6, band: 3.0 },
  { minRaw: 4, band: 2.5 },
  { minRaw: 0, band: 0.0 },
];

export const EXAM_SPECS: Record<string, ExamSpec> = {
  ielts: {
    id: "ielts",
    title: "IELTS Academic",
    language: "en",
    ttsLang: "en-GB",
    scoreScale: "Band 0–9 (half-bands)",
    scale: "ielts",
    bandLabel: "Band",
    rawToBand: IELTS_RAW_TO_BAND,
    sections: [
      { skill: "listening", label: "Listening", questions: 40, timeMin: 30, format: "4 parts × 10 questions; audio played ONCE. Varied native accents.", accents: ["British", "Australian", "New Zealand", "North American"], questionTypes: ["form/note/table/flow-chart/summary completion", "multiple choice", "matching", "plan/map/diagram labelling", "sentence completion"] },
      { skill: "reading", label: "Reading", questions: 40, timeMin: 60, format: "3 academic passages (~700–900 words), 13–14 questions each.", questionTypes: ["matching headings", "True/False/Not Given", "Yes/No/Not Given", "matching information", "matching features", "matching sentence endings", "multiple choice", "summary/note/table/flow-chart completion", "diagram-label completion", "short answer"] },
      { skill: "writing", label: "Writing", questions: 0, openTasks: 2, timeMin: 60, format: "Task 1 (≥150 words, describe a real figure) + Task 2 (≥250-word essay, weighted ~2×)." },
      { skill: "speaking", label: "Speaking", questions: 0, openTasks: 3, timeMin: 14, format: "Part 1 familiar topics · Part 2 cue-card long turn (1-min prep) · Part 3 discussion." },
    ],
    provenance: { source_name: "IELTS.org — Academic test format", source_url: "https://ielts.org/take-a-test/test-types/ielts-academic-test", retrieved_at: TODAY },
  },

  // ── TOEFL iBT — CURRENT 2026 redesign (multistage-adaptive, 1–6 CEFR-aligned). ────────────────
  toefl: {
    id: "toefl",
    title: "TOEFL iBT (2026)",
    language: "en",
    ttsLang: "en-US",
    scoreScale: "1–6 per skill · CEFR-aligned · 0–120 concordance (shown through ~2028)",
    scale: "toefl-2026",
    cefrAligned: true,
    bandLabel: "Band",
    sections: [
      { skill: "reading", label: "Reading", questions: 14, timeMin: 30, adaptive: true, format: "Multistage-adaptive (part-1 performance sets part-2 difficulty). Official ~50 items in ~30 min; this practice set is shorter. New 2026 task types.", questionTypes: ["Complete the Words (cloze)", "Read in Daily Life (ads/menus/forms, MCQ)", "Read an Academic Passage (~200 words, 5 Q)"] },
      { skill: "listening", label: "Listening", questions: 12, timeMin: 29, adaptive: true, format: "Multistage-adaptive. Official ~47 items in ~29 min; this practice set is shorter.", accents: ["North American", "British", "Australian"], questionTypes: ["Listen and Choose a Response", "Listen to a Conversation", "Listen to an Announcement", "Listen to an Academic Talk"] },
      { skill: "writing", label: "Writing", questions: 0, openTasks: 3, timeMin: 23, format: "Build a Sentence · Write an Email (7 min) · Write for an Academic Discussion (≥100 words, 10 min). Official ~12 items, ~23 min.", questionTypes: ["Build a Sentence", "Write an Email", "Write for an Academic Discussion"] },
      { skill: "speaking", label: "Speaking", questions: 0, openTasks: 2, timeMin: 8, format: "Listen and Repeat (7 sentences) · Take an Interview (4 questions, 45 s each). Official ~11 items, ~8 min.", questionTypes: ["Listen and Repeat", "Take an Interview"] },
    ],
    provenance: { source_name: "ETS — TOEFL iBT (Jan-2026 redesign overview)", source_url: "https://www.ets.org/toefl.html", retrieved_at: TODAY, needs_verification: true },
  },

  // ── TOEFL iBT — LEGACY format (retired 21 Jan 2026), kept for practice + score interpretation. ─
  "toefl-legacy": {
    id: "toefl-legacy",
    title: "TOEFL iBT (legacy 0–120)",
    language: "en",
    ttsLang: "en-US",
    scoreScale: "0–120 (legacy format, retired 21 Jan 2026)",
    scale: "toefl-legacy",
    legacyOf: "toefl",
    sections: [
      { skill: "reading", label: "Reading", questions: 20, timeMin: 35, format: "Academic passages, 0–30 scaled.", questionTypes: ["factual information", "negative factual", "inference", "rhetorical purpose", "vocabulary in context", "sentence simplification", "insert text", "prose summary"] },
      { skill: "listening", label: "Listening", questions: 16, timeMin: 36, format: "Lectures & conversations, 0–30 scaled.", accents: ["North American", "British", "Australian"], questionTypes: ["gist-content", "gist-purpose", "detail", "function", "attitude", "organization", "connecting content", "inference"] },
      { skill: "writing", label: "Writing", questions: 0, openTasks: 2, timeMin: 30, format: "Integrated task + Writing for an Academic Discussion, 0–30 scaled." },
      { skill: "speaking", label: "Speaking", questions: 0, openTasks: 2, timeMin: 16, format: "1 independent + 3 integrated tasks, 0–30 scaled." },
    ],
    provenance: { source_name: "ETS — TOEFL iBT legacy format (pre-2026)", source_url: "https://www.ets.org/toefl.html", retrieved_at: TODAY, needs_verification: true },
  },

  testdaf: {
    id: "testdaf",
    title: "TestDaF",
    language: "de",
    ttsLang: "de-DE",
    scoreScale: "TDN 3–5 per section (~CEFR B2–C1)",
    scale: "tdn",
    cefrAligned: true,
    sections: [
      { skill: "reading", label: "Lesen", questions: 20, timeMin: 55, format: "Drei Lesetexte mit Aufgaben.", questionTypes: ["Richtig/Falsch", "Multiple Choice", "Zuordnung"] },
      { skill: "listening", label: "Hören", questions: 16, timeMin: 40, format: "Gespräche und Vorträge.", accents: ["Deutsch (Standard)", "Österreichisch", "Schweizerdeutsch"], questionTypes: ["Notizen", "Richtig/Falsch", "Multiple Choice"] },
      { skill: "writing", label: "Schreiben", questions: 0, openTasks: 1, timeMin: 60, format: "Argumentativer Text mit Grafikbeschreibung." },
      { skill: "speaking", label: "Sprechen", questions: 0, openTasks: 3, timeMin: 35, format: "Mehrere mündliche Aufgaben." },
    ],
    provenance: { source_name: "TestDaF-Institut — digitaler TestDaF Aufbau", source_url: "https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/aufbau-des-digitalen-testdaf/", retrieved_at: TODAY },
  },
  goethe: {
    id: "goethe",
    title: "Goethe-Zertifikat",
    language: "de",
    ttsLang: "de-DE",
    scoreScale: "Pass ≈ 60% per module (verify per level)",
    scale: "percent",
    cefrAligned: true,
    sections: [
      { skill: "reading", label: "Lesen", questions: 16, timeMin: 45, format: "Texte mit Aufgaben (CEFR A1–C2).", questionTypes: ["Richtig/Falsch", "Multiple Choice", "Zuordnung", "Lückentext"] },
      { skill: "listening", label: "Hören", questions: 12, timeMin: 35, format: "Hörtexte mit Aufgaben.", accents: ["Deutsch (Standard)"], questionTypes: ["Richtig/Falsch", "Multiple Choice"] },
      { skill: "writing", label: "Schreiben", questions: 0, openTasks: 1, timeMin: 60, format: "Schriftliche Mitteilung / Stellungnahme." },
      { skill: "speaking", label: "Sprechen", questions: 0, openTasks: 2, timeMin: 15, format: "Präsentation + Dialog." },
    ],
    provenance: { source_name: "Goethe-Institut — Prüfungen", source_url: "https://www.goethe.de/en/spr/kup/prf.html", retrieved_at: TODAY },
  },
  gre: {
    id: "gre",
    title: "GRE General",
    language: "en",
    ttsLang: "en-US",
    scoreScale: "Verbal 130–170 · Quant 130–170 · Writing 0–6",
    scale: "raw",
    sections: [
      { skill: "verbal", label: "Verbal Reasoning", questions: 20, timeMin: 41, format: "Text completion, sentence equivalence, reading comprehension.", questionTypes: ["text completion", "sentence equivalence", "reading comprehension"] },
      { skill: "quantitative", label: "Quantitative Reasoning", questions: 20, timeMin: 47, format: "Problem solving and quantitative comparison.", questionTypes: ["quantitative comparison", "problem solving", "numeric entry"] },
      { skill: "analytical_writing", label: "Analytical Writing", questions: 0, openTasks: 1, timeMin: 30, format: "Analyze an Issue essay." },
    ],
    provenance: { source_name: "ETS — GRE test structure", source_url: "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html", retrieved_at: TODAY },
  },
  gmat: {
    id: "gmat",
    title: "GMAT Focus Edition",
    language: "en",
    ttsLang: "en-US",
    scoreScale: "Total 205–805 · sections 60–90",
    scale: "raw",
    sections: [
      { skill: "quantitative", label: "Quantitative Reasoning", questions: 21, timeMin: 45, format: "Problem solving (no calculator).", questionTypes: ["problem solving"] },
      { skill: "verbal", label: "Verbal Reasoning", questions: 23, timeMin: 45, format: "Critical reasoning and reading comprehension.", questionTypes: ["critical reasoning", "reading comprehension"] },
      { skill: "data_insights", label: "Data Insights", questions: 20, timeMin: 45, format: "Data sufficiency, two-part analysis, table/graph interpretation.", questionTypes: ["data sufficiency", "two-part analysis", "multi-source reasoning", "graphics interpretation"] },
    ],
    provenance: { source_name: "GMAC — GMAT exam structure", source_url: "https://www.mba.com/exams/gmat-exam/about/exam-structure", retrieved_at: TODAY },
  },
};

/** Map a raw score to an indicative band via a descending threshold table. */
export function rawToBand(raw: number, table: { minRaw: number; band: number }[]): number {
  for (const row of table) {
    if (raw >= row.minRaw) return row.band;
  }
  return 0;
}
