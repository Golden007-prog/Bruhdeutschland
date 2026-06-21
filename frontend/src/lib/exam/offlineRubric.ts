/**
 * Deterministic OFFLINE fallback rubric for open (Writing/Speaking) tasks (gap G3-6). When no AI
 * provider is connected, the live AI rubric can't run and the candidate would otherwise hit a dead end
 * ("AI feedback wasn't available"). This builds a *self-assessment* rubric from the public band-descriptor
 * anchors (rubricFor) plus a couple of deterministic, length-based signals — so a student always gets a
 * descriptor to grade themselves against and a self-check checklist, with NO fabricated score.
 *
 * GROUNDING (CLAUDE.md §2/§4): this NEVER asserts a band or score for the candidate — the descriptors are
 * the official top-band anchors (already needs_verification in band-descriptors), and the only computed
 * numbers are objective facts about the response itself (word count vs the task target). Real scoring is
 * a certified human's job; this is a study aid.
 */
import { rubricFor } from "@/data/band-descriptors";

export interface OfflineCriterion {
  name: string;
  /** The official top-band descriptor to self-assess against. */
  descriptor: string;
}

export interface OfflineRubric {
  bandLabel: string;
  source_name: string;
  source_url: string;
  criteria: OfflineCriterion[];
  /** Deterministic self-check prompts the student ticks off (not scored). */
  checklist: string[];
  /** Objective facts about the response (word count vs target) — never a quality judgement. */
  lengthNote: string;
  /** True when the response clearly falls short of the task's minimum length. */
  belowTarget: boolean;
}

/** Count words in a response the same way the runner does (whitespace split of the trimmed text). */
export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Build an offline self-assessment rubric for one open task. `examId` + `skill` pick the descriptor
 * family (IELTS/TOEFL/generic); `response` + `minWords` drive only the objective length note.
 */
export function buildOfflineRubric(
  examId: string,
  skill: string,
  response: string,
  minWords?: number,
): OfflineRubric {
  const set = rubricFor(examId, skill);
  const words = wordCount(response);
  const belowTarget = minWords != null && words > 0 && words < minWords;
  const empty = words === 0;

  const lengthNote = empty
    ? "No response captured yet — write your answer, then self-assess against the descriptors below."
    : minWords != null
      ? `${words} words · task target ≥ ${minWords}.${belowTarget ? " You're below the target length — under-length answers are capped on the real test." : " Length target met."}`
      : `${words} words.`;

  const isSpeaking = skill === "speaking";
  const checklist = isSpeaking
    ? [
        "Did you answer every part of the question, not just the first?",
        "Did you speak in full sentences and develop your ideas (reasons, examples)?",
        "Did you use a range of tenses and connect ideas (because, however, for example)?",
        "Was your pace steady — neither rushed nor full of long pauses?",
      ]
    : [
        "Did you address every part of the task (all bullet points / both sides)?",
        "Is there a clear structure: introduction, developed body paragraphs, conclusion?",
        "Did you support each main idea with a specific reason or example?",
        "Did you vary sentence structure and check grammar, spelling, and linking words?",
        ...(minWords != null ? [`Did you reach the ${minWords}-word minimum?`] : []),
      ];

  return {
    bandLabel: set.bandLabel,
    source_name: set.source_name,
    source_url: set.source_url,
    criteria: set.criteria.map((c) => ({ name: c.name, descriptor: c.descriptor })),
    checklist,
    lengthNote,
    belowTarget,
  };
}
