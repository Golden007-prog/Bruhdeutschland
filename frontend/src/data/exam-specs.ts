/**
 * Official exam FORMAT facts with provenance (work-order §5A anti-hallucination rule). The model
 * generates practice *content*, but structural facts — section counts, timing, scoring scales — come
 * from here, never invented. Each spec carries `{ source_name, source_url, retrieved_at }`. Figures
 * are volatile (exams redesign); treat as indicative and re-verify against the cited source.
 */
import type { ExamLanguage, ExamSkill } from "@/lib/exam/schema";

export interface Provenance {
  source_name: string;
  source_url: string;
  /** ISO date the figure was last checked. */
  retrieved_at: string;
}

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
}

export interface ExamSpec {
  id: string;
  title: string;
  language: ExamLanguage;
  scoreScale: string;
  sections: SectionSpec[];
  /** Indicative raw→band/scaled conversion, where applicable. */
  rawToBand?: { minRaw: number; band: number }[];
  bandLabel?: string;
  provenance: Provenance;
  /** TTS voice language hint for Listening. */
  ttsLang: string;
}

const TODAY = "2026-06-19";

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
    bandLabel: "Band",
    rawToBand: IELTS_RAW_TO_BAND,
    sections: [
      { skill: "listening", label: "Listening", questions: 40, timeMin: 30, format: "4 parts × 10 questions; audio played once.", questionTypes: ["form/note/table completion", "multiple choice", "matching", "plan/map/diagram labelling", "sentence completion", "summary completion"] },
      { skill: "reading", label: "Reading", questions: 40, timeMin: 60, format: "3 academic passages (~700–900 words), 13–14 questions each.", questionTypes: ["matching headings", "True/False/Not Given", "Yes/No/Not Given", "matching information", "matching features", "matching sentence endings", "multiple choice", "summary/note/table/flow-chart completion", "short answer"] },
      { skill: "writing", label: "Writing", questions: 0, openTasks: 2, timeMin: 60, format: "Task 1 (≥150 words, describe a figure) + Task 2 (≥250-word essay)." },
      { skill: "speaking", label: "Speaking", questions: 0, openTasks: 3, timeMin: 14, format: "Part 1 familiar topics, Part 2 cue-card long turn, Part 3 discussion." },
    ],
    provenance: { source_name: "IELTS.org — Academic test format", source_url: "https://ielts.org/take-a-test/test-types/ielts-academic-test", retrieved_at: TODAY },
  },
  toefl: {
    id: "toefl",
    title: "TOEFL iBT",
    language: "en",
    ttsLang: "en-US",
    scoreScale: "1–6 per section (Jan-2026 redesign); 0–120 reported during transition",
    sections: [
      { skill: "reading", label: "Reading", questions: 20, timeMin: 30, format: "Academic passages with multiple-choice questions.", questionTypes: ["factual information", "inference", "vocabulary in context", "sentence simplification", "insert text"] },
      { skill: "listening", label: "Listening", questions: 16, timeMin: 29, format: "Lectures and conversations.", questionTypes: ["main idea", "detail", "function", "attitude", "organization"] },
      { skill: "writing", label: "Writing", questions: 0, openTasks: 2, timeMin: 30, format: "Integrated task + 'Writing for an Academic Discussion'." },
      { skill: "speaking", label: "Speaking", questions: 0, openTasks: 2, timeMin: 16, format: "Independent + integrated speaking tasks." },
    ],
    provenance: { source_name: "ETS — TOEFL iBT test content", source_url: "https://www.ets.org/toefl/test-takers/ibt/about/content.html", retrieved_at: TODAY },
  },
  testdaf: {
    id: "testdaf",
    title: "TestDaF",
    language: "de",
    ttsLang: "de-DE",
    scoreScale: "TDN 3–5 per section (~CEFR B2–C1)",
    sections: [
      { skill: "reading", label: "Lesen", questions: 20, timeMin: 55, format: "Drei Lesetexte mit Aufgaben.", questionTypes: ["Richtig/Falsch", "Multiple Choice", "Zuordnung"] },
      { skill: "listening", label: "Hören", questions: 16, timeMin: 40, format: "Gespräche und Vorträge.", questionTypes: ["Notizen", "Richtig/Falsch", "Multiple Choice"] },
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
    sections: [
      { skill: "reading", label: "Lesen", questions: 16, timeMin: 45, format: "Texte mit Aufgaben (CEFR A1–C2).", questionTypes: ["Richtig/Falsch", "Multiple Choice", "Zuordnung", "Lückentext"] },
      { skill: "listening", label: "Hören", questions: 12, timeMin: 35, format: "Hörtexte mit Aufgaben.", questionTypes: ["Richtig/Falsch", "Multiple Choice"] },
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
