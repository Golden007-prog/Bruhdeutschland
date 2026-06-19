/**
 * In-progress exam autosave for resume-after-refresh (work-order §6/§9). The live exam form + answers
 * + position are written to localStorage as the candidate works, so an accidental refresh or tab close
 * doesn't lose the attempt. Keyed by examId (one in-progress attempt per exam). Cleared on submit.
 */
import type { GeneratedExam } from "./schema";
import type { AnswerMap } from "./scoring";

const PREFIX = "deutschprep:exam:progress:";

export interface ExamProgress {
  exam: GeneratedExam;
  answers: AnswerMap;
  openResponses: Record<string, string>;
  sectionIdx: number;
  timeLeft: number;
  startedAt: number;
  savedAt: number;
}

function ls(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function" &&
      typeof window.localStorage.setItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {
    /* sandboxed */
  }
  return null;
}

export function saveProgress(examId: string, p: ExamProgress): void {
  try {
    ls()?.setItem(PREFIX + examId, JSON.stringify(p));
  } catch {
    /* quota — ignore (form may be large) */
  }
}

export function loadProgress(examId: string): ExamProgress | null {
  try {
    const raw = ls()?.getItem(PREFIX + examId);
    if (!raw) return null;
    return JSON.parse(raw) as ExamProgress;
  } catch {
    return null;
  }
}

export function clearProgress(examId: string): void {
  try {
    ls()?.removeItem(PREFIX + examId);
  } catch {
    /* ignore */
  }
}
