/**
 * Deterministic objective exam scoring + band mapping (work-order §4/§7). Every objective item —
 * single, multi, text/gap-fill, matching, ordering — is marked here in tested TypeScript, never by
 * the model. Open tasks (Writing/Speaking) are excluded from the objective score and handled by the
 * AI rubric separately. Band/scale derivation lives in scale.ts; this module calls into it.
 */
import type { GeneratedExam, GeneratedSection, ObjectiveQuestion } from "@/lib/exam/schema";
import { rawToBand, type ScaleKind } from "@/data/exam-specs";
import {
  accuracyToBand1to6,
  averageBand,
  band1to6To120,
  bandToCefr,
  legacy120ToBand1to6,
  legacySectionScaled,
  roundToHalf,
  type Concordance120,
} from "./scale";

export { roundToHalf };

/** A possible answer value, by response type: choiceId | choiceIds | typed text | pairId→choiceId | token order. */
export type AnswerValue = string | string[] | Record<string, string>;
/** Answers: question id → the response in its item-type shape. */
export type AnswerMap = Record<string, AnswerValue>;

/** Per-item marking outcome, used for the tracker's per-question-type analytics. */
export interface ItemResult {
  id: string;
  typeLabel: string;
  responseType: NonNullable<ObjectiveQuestion["responseType"]>;
  earned: number;
  possible: number;
  correct: boolean;
}

export interface SectionScore {
  skill: string;
  title: string;
  /** Marks earned (a matching item can be worth several marks). */
  correct: number;
  /** Total marks available. */
  total: number;
  percent: number;
  /** Indicative band for this section, if the spec's scale supports one. */
  band?: number;
  items: ItemResult[];
}

export interface ExamScore {
  sections: SectionScore[];
  correct: number;
  total: number;
  percent: number;
  /** Overall indicative band (mean of section bands, rounded to nearest 0.5), if available. */
  overallBand?: number;
  /**
   * Skill names that actually contributed to {@link overallBand}. For IELTS-style exams the band is
   * the mean of the objectively-marked sections (Listening + Reading) only — Writing/Speaking carry
   * no objective items and are scored by the AI rubric, not folded into this number. The UI uses this
   * to label the band honestly ("Listening + Reading only") instead of implying a full four-skill band.
   */
  bandedSkills: string[];
  /** CEFR level for the overall band (TOEFL-2026 / CEFR-aligned scales). */
  cefr?: string;
  /** 0–120 concordance for the overall band (TOEFL transition aid). */
  concordance120?: Concordance120;
  /** True if the exam has open tasks the objective score doesn't cover. */
  hasOpenTasks: boolean;
}

export interface ScoreConfig {
  /** IELTS-style raw(/40)→band table. */
  bandTable?: { minRaw: number; band: number }[];
  /** Scoring model; selects how section bands + overall are derived. */
  scale?: ScaleKind;
}

const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");

/** True when an item has a non-empty answer (drives the question palette + "answered" counts). */
export function isAnswered(q: ObjectiveQuestion, a: AnswerValue | undefined): boolean {
  const rt = q.responseType ?? "single";
  if (rt === "single" || rt === "text") return typeof a === "string" && a.trim() !== "";
  if (rt === "multi" || rt === "ordering") return Array.isArray(a) && a.length > 0;
  if (rt === "matching") return !!a && typeof a === "object" && !Array.isArray(a) && Object.keys(a).length > 0;
  return a != null;
}

/** Mark one objective item deterministically; returns marks earned and available. */
export function markItem(q: ObjectiveQuestion, a: AnswerValue | undefined): { earned: number; possible: number } {
  const rt = q.responseType ?? "single";
  switch (rt) {
    case "single":
      return { earned: typeof a === "string" && !!q.answerId && a === q.answerId ? 1 : 0, possible: 1 };
    case "multi": {
      const want = new Set(q.answerIds ?? []);
      const got = new Set(Array.isArray(a) ? a : []);
      const ok = want.size > 0 && want.size === got.size && [...want].every((x) => got.has(x));
      return { earned: ok ? 1 : 0, possible: 1 };
    }
    case "text": {
      const accept = (q.acceptable ?? []).map(norm);
      const got = typeof a === "string" ? norm(a) : "";
      return { earned: got !== "" && accept.includes(got) ? 1 : 0, possible: 1 };
    }
    case "matching": {
      const pairs = q.pairs ?? [];
      const map = a && typeof a === "object" && !Array.isArray(a) ? (a as Record<string, string>) : {};
      let earned = 0;
      for (const p of pairs) if (map[p.id] === p.answerId) earned += 1;
      return { earned, possible: Math.max(1, pairs.length) };
    }
    case "ordering": {
      const order = q.order ?? [];
      const got = Array.isArray(a) ? a : [];
      const ok = order.length > 0 && got.length === order.length && order.every((id, i) => got[i] === id);
      return { earned: ok ? 1 : 0, possible: 1 };
    }
    default:
      return { earned: 0, possible: 1 };
  }
}

function scoreSection(section: GeneratedSection, answers: AnswerMap): SectionScore {
  let correct = 0;
  let total = 0;
  const items: ItemResult[] = [];
  for (const q of section.objective) {
    const { earned, possible } = markItem(q, answers[q.id]);
    correct += earned;
    total += possible;
    items.push({
      id: q.id,
      typeLabel: q.typeLabel,
      responseType: q.responseType ?? "single",
      earned,
      possible,
      correct: possible > 0 && earned === possible,
    });
  }
  return {
    skill: section.skill,
    title: section.title,
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    items,
  };
}

/**
 * Derive a section band, per the spec's scale. For IELTS/table scales the band is mapped from the raw
 * correct/total RATIO scaled to /40 directly — NOT from the integer-percent intermediate, which
 * double-rounds and distorts the band on the short practice sections this app generates (e.g. mini-mode
 * 4–16 items). `percent` (already rounded) is kept only for the TOEFL-2026 accuracy curve.
 */
function sectionBand(correct: number, total: number, percent: number, config: ScoreConfig): number | undefined {
  const tableBand = (table: { minRaw: number; band: number }[]): number =>
    rawToBand(total > 0 ? Math.round((correct / total) * 40) : 0, table);
  switch (config.scale) {
    case "toefl-2026":
      return accuracyToBand1to6(percent);
    case "ielts":
      return config.bandTable ? tableBand(config.bandTable) : undefined;
    case "toefl-legacy":
      // 0–30 scaled per section → interpret an overall 0–120 below; no per-section band here.
      return undefined;
    default:
      return config.bandTable ? tableBand(config.bandTable) : undefined;
  }
}

/**
 * Score every objective item across an exam and attach indicative bands per the spec's scale:
 *  - IELTS: raw→band table, overall = mean of section bands (half-band rounded)
 *  - TOEFL-2026: accuracy→1–6 per section, overall mean + CEFR + 0–120 concordance
 *  - TOEFL-legacy: 0–30 scaled R/L → estimated overall 0–120 → 1–6 concordance
 *  - others: percentage only (bands omitted)
 */
export function scoreExam(exam: GeneratedExam, answers: AnswerMap, config: ScoreConfig = {}): ExamScore {
  const sections: SectionScore[] = [];
  let correct = 0;
  let total = 0;
  let hasOpenTasks = false;

  for (const section of exam.sections) {
    if (section.open.length > 0) hasOpenTasks = true;
    if (section.objective.length === 0) continue;
    const s = scoreSection(section, answers);
    s.band = sectionBand(s.correct, s.total, s.percent, config);
    sections.push(s);
    correct += s.correct;
    total += s.total;
  }

  const bandedSections = sections.filter((s) => s.band !== undefined);
  const banded = bandedSections.map((s) => s.band as number);
  const bandedSkills = bandedSections.map((s) => s.skill);
  let overallBand = averageBand(banded);
  let cefr: string | undefined;
  let concordance120: Concordance120 | undefined;

  if (config.scale === "toefl-2026" && overallBand !== undefined) {
    cefr = bandToCefr(overallBand);
    concordance120 = band1to6To120(overallBand);
  } else if (config.scale === "toefl-legacy" && sections.length > 0) {
    // Estimate an overall 0–120 from scaled objective sections, then concord to the 1–6 band.
    const scaled = sections.map((s) => legacySectionScaled(s.percent, 30));
    const est120 = Math.round((scaled.reduce((a, b) => a + b, 0) / (scaled.length * 30)) * 120);
    overallBand = legacy120ToBand1to6(est120);
    cefr = bandToCefr(overallBand);
    concordance120 = { min: est120, max: est120, rep: est120 };
  }

  return {
    sections,
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    overallBand,
    bandedSkills,
    cefr,
    concordance120,
    hasOpenTasks,
  };
}
