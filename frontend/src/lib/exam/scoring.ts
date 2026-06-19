/**
 * Deterministic objective exam scoring + band mapping (work-order §5B). Listening/Reading-style
 * single-best-answer items are marked here in tested TypeScript — never by the model. Open tasks
 * (Writing/Speaking) are excluded from the objective score and handled by the AI rubric separately.
 */
import type { GeneratedExam, GeneratedSection } from "@/lib/exam/schema";
import { rawToBand } from "@/data/exam-specs";

export interface SectionScore {
  skill: string;
  title: string;
  correct: number;
  total: number;
  /** Indicative band for this section, if a raw→band table was supplied. */
  band?: number;
}

export interface ExamScore {
  sections: SectionScore[];
  correct: number;
  total: number;
  percent: number;
  /** Overall indicative band (average of section bands, rounded to nearest 0.5), if available. */
  overallBand?: number;
  /** True if the exam has open tasks the objective score doesn't cover. */
  hasOpenTasks: boolean;
}

/** Answers: question id → selected choice id. */
export type AnswerMap = Record<string, string>;

function scoreSection(section: GeneratedSection, answers: AnswerMap): SectionScore {
  let correct = 0;
  for (const q of section.objective) {
    if (answers[q.id] === q.answerId) correct += 1;
  }
  return { skill: section.skill, title: section.title, correct, total: section.objective.length };
}

/** Round to the nearest 0.5 (IELTS bands). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Score every objective question across an exam and, when a raw→band table is provided, attach an
 * indicative band per section (raw scaled to /40 first, since IELTS tables are defined on /40) and an
 * overall band (mean of section bands).
 */
export function scoreExam(
  exam: GeneratedExam,
  answers: AnswerMap,
  bandTable?: { minRaw: number; band: number }[],
): ExamScore {
  const sections: SectionScore[] = [];
  let correct = 0;
  let total = 0;
  let hasOpenTasks = false;

  for (const section of exam.sections) {
    if (section.open.length > 0) hasOpenTasks = true;
    if (section.objective.length === 0) continue;
    const s = scoreSection(section, answers);
    if (bandTable && s.total > 0) {
      // Scale to the /40 basis the band table assumes, then map.
      const scaledRaw = Math.round((s.correct / s.total) * 40);
      s.band = rawToBand(scaledRaw, bandTable);
    }
    sections.push(s);
    correct += s.correct;
    total += s.total;
  }

  const banded = sections.filter((s) => s.band !== undefined);
  const overallBand =
    banded.length > 0
      ? roundToHalf(banded.reduce((sum, s) => sum + (s.band ?? 0), 0) / banded.length)
      : undefined;

  return {
    sections,
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    overallBand,
    hasOpenTasks,
  };
}
