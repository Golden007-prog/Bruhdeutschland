/**
 * In-progress exam autosave for resume-after-refresh (work-order §6/§9). The live exam form + answers
 * + position are written to localStorage as the candidate works, so an accidental refresh or tab close
 * doesn't lose the attempt. Keyed by examId (one in-progress attempt per exam). Cleared on submit.
 */
import { scopedKey } from "@/lib/persist/userScope";
import type { GeneratedExam } from "./schema";
import type { AnswerMap } from "./scoring";

const BASE = "deutschprep:exam:progress";
/** Per-user, per-exam key so an in-progress attempt never bleeds across accounts (data-isolation P0). */
const key = (examId: string): string => `${scopedKey(BASE)}:${examId}`;
let cleaned = false;

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

/** One-time: drop legacy un-scoped progress keys (`deutschprep:exam:progress:<examId>`, no user segment). */
function cleanLegacy(s: Storage): void {
  if (cleaned) return;
  cleaned = true;
  try {
    const legacy = /^deutschprep:exam:progress:[^:]+$/; // exactly one segment after the prefix = old format
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k && legacy.test(k)) s.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export function saveProgress(examId: string, p: ExamProgress): void {
  try {
    ls()?.setItem(key(examId), JSON.stringify(p));
  } catch {
    /* quota — ignore (form may be large) */
  }
}

export function loadProgress(examId: string): ExamProgress | null {
  const s = ls();
  if (!s) return null;
  cleanLegacy(s);
  try {
    const raw = s.getItem(key(examId));
    if (!raw) return null;
    return JSON.parse(raw) as ExamProgress;
  } catch {
    return null;
  }
}

export function clearProgress(examId: string): void {
  try {
    ls()?.removeItem(key(examId));
  } catch {
    /* ignore */
  }
}

/** Remove every in-progress exam for the current user (used by the data-reset control). */
export function clearAllProgress(): void {
  const s = ls();
  if (!s) return;
  try {
    const prefix = `${scopedKey(BASE)}:`;
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k && k.startsWith(prefix)) s.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
