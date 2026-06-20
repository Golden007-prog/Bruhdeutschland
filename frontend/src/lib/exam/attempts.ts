/**
 * Mock-exam attempt persistence (work-order §8). Local-first: every completed attempt is stored in
 * localStorage so the tracker works signed-out and offline; when signed in it is ALSO written through
 * to Supabase (exam_attempts + answers + goals_streaks + an events row) for durability and
 * cross-device history. The dashboard reads {@link getAttempts} (local cache), which is hydrated from
 * the cloud on first load for a returning user. All scores are practice estimates.
 */
import { supabase } from "@/lib/supabase/client";
import { scopedKey } from "@/lib/persist/userScope";
import type { ExamScore } from "./scoring";

const KEY_BASE = "deutschprep:exam:attempts";
const LEGACY_KEY = "deutschprep:exam:attempts"; // old un-namespaced key (shared across accounts)
const CAP = 200;

/** Per-user storage key so two accounts on one browser never share exam history (data-isolation P0). */
const key = (): string => scopedKey(KEY_BASE);

export interface AttemptRubric {
  taskId: string;
  skill: string;
  typeLabel: string;
  bandLow: string;
  bandHigh: string;
  confidence: string;
}

/** A single stored attempt. `score.sections[].items` carry the per-question-type detail the tracker needs. */
export interface AttemptRecord {
  id: string;
  examId: string;
  examTitle: string;
  scale?: string;
  mode: string;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  score: ExamScore;
  rubrics?: AttemptRubric[];
  /** Which provider/model graded the open tasks (AI provenance), when any were AI-graded. */
  provider?: string;
  model?: string;
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

function readLocal(): AttemptRecord[] {
  const s = ls();
  if (!s) return [];
  try {
    // One-time: drop the legacy un-namespaced global key so it can't bleed across accounts.
    if (s.getItem(LEGACY_KEY) != null) s.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  try {
    const raw = s.getItem(key());
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: AttemptRecord[]): void {
  try {
    ls()?.setItem(key(), JSON.stringify(list.slice(0, CAP)));
  } catch {
    /* quota — ignore */
  }
}

/** All stored attempts, newest first. */
export function getAttempts(): AttemptRecord[] {
  return readLocal().sort((a, b) => b.finishedAt - a.finishedAt);
}

/** A short id without Date.now()/Math.random dependence issues (epoch + counter is fine here). */
function makeId(): string {
  return `att_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Local calendar-date key `YYYY-MM-DD` (NOT UTC). `finishedAt` is a local-epoch `Date.now()`, so a
 * session finished just after LOCAL midnight in IST/CET must bucket to that local day — `toISOString()`
 * would shift it to the previous UTC day (off-by-one streak). Mirrors `lib/calc/deadlines.ts`.
 */
export const dayStr = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Update a streak given the previous state and today's date string. Pure + tested.
 * Same-day re-practice keeps the streak; a consecutive day increments it; a gap resets to 1.
 */
export function computeStreak(
  prev: { current: number; longest: number; last?: string | null },
  today: string,
): { current: number; longest: number; last: string } {
  if (prev.last === today) {
    return { current: Math.max(1, prev.current), longest: Math.max(prev.longest, Math.max(1, prev.current)), last: today };
  }
  // Derive "yesterday" via LOCAL midnight (parse the local YYYY-MM-DD, step back one day), so the
  // consecutive-day check stays consistent with the local `dayStr` keys (no UTC off-by-one).
  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = dayStr(new Date(ty, tm - 1, td - 1).getTime());
  const current = prev.last === yesterday ? prev.current + 1 : 1;
  return { current, longest: Math.max(prev.longest, current), last: today };
}

/** Persist a completed attempt locally (always) and to Supabase (best-effort when signed in). */
export async function recordAttempt(rec: Omit<AttemptRecord, "id"> & { id?: string }): Promise<AttemptRecord> {
  const full: AttemptRecord = { ...rec, id: rec.id ?? makeId() };
  writeLocal([full, ...readLocal()]);
  void writeCloud(full);
  return full;
}

async function writeCloud(rec: AttemptRecord): Promise<void> {
  if (!supabase) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("exam_attempts")
      .insert({
        user_id: uid,
        exam_id: rec.examId,
        scale: rec.scale ?? null,
        mode: rec.mode,
        // Fold AI grader provenance into the score blob (no dedicated column exists) so it round-trips
        // through hydrateAttemptsFromCloud — keeps the attempt traceable to a model cross-device.
        score: rec.provider || rec.model ? { ...rec.score, provider: rec.provider, model: rec.model } : rec.score,
        rubric: rec.rubrics ?? null,
        sections: rec.score.sections,
        correct: rec.score.correct,
        total: rec.score.total,
        percent: rec.score.percent,
        overall_band: rec.score.overallBand ?? null,
        cefr: rec.score.cefr ?? null,
        concordance_120: rec.score.concordance120?.rep ?? null,
        started_at: new Date(rec.startedAt).toISOString(),
        submitted_at: new Date(rec.finishedAt).toISOString(),
        duration_ms: rec.durationMs,
      })
      .select("id")
      .single();
    if (error || !data) return;

    const attemptId = data.id as string;
    const rows = rec.score.sections.flatMap((s) =>
      s.items.map((it) => ({
        user_id: uid,
        attempt_id: attemptId,
        exam_id: rec.examId,
        skill: s.skill,
        question_id: it.id,
        question_type: it.typeLabel,
        response_type: it.responseType,
        earned: it.earned,
        possible: it.possible,
        is_correct: it.correct,
      })),
    );
    if (rows.length) await supabase.from("answers").insert(rows);

    await updateStreak(uid, rec);
    await supabase.from("events").insert({ user_id: uid, kind: "exam_attempt", detail: { exam_id: rec.examId, percent: rec.score.percent, band: rec.score.overallBand ?? null } });
  } catch {
    /* best-effort — local copy is the source for the tracker */
  }
}

async function updateStreak(uid: string, rec: AttemptRecord): Promise<void> {
  if (!supabase) return;
  const today = dayStr(rec.finishedAt);
  const { data: existing } = await supabase.from("goals_streaks").select("current_streak, longest_streak, last_practice_date, attempts_count").eq("user_id", uid).maybeSingle();
  const next = computeStreak(
    { current: existing?.current_streak ?? 0, longest: existing?.longest_streak ?? 0, last: existing?.last_practice_date ?? null },
    today,
  );
  await supabase.from("goals_streaks").upsert({
    user_id: uid,
    current_streak: next.current,
    longest_streak: next.longest,
    last_practice_date: next.last,
    attempts_count: (existing?.attempts_count ?? 0) + 1,
    updated_at: new Date(rec.finishedAt).toISOString(),
  });
}

/** Hydrate the local cache from Supabase for a returning user whose device has no local history yet. */
export async function hydrateAttemptsFromCloud(): Promise<void> {
  if (!supabase) return;
  if (readLocal().length > 0) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("id, exam_id, scale, mode, score, rubric, started_at, submitted_at, duration_ms")
      .order("submitted_at", { ascending: false })
      .limit(CAP);
    if (error || !data) return;
    const mapped: AttemptRecord[] = data
      .filter((r) => r.score)
      .map((r) => ({
        id: r.id as string,
        examId: r.exam_id as string,
        examTitle: (r.score as ExamScore & { title?: string }).title ?? (r.exam_id as string),
        scale: r.scale ?? undefined,
        mode: (r.mode as string) ?? "full",
        startedAt: r.started_at ? Date.parse(r.started_at as string) : 0,
        finishedAt: r.submitted_at ? Date.parse(r.submitted_at as string) : 0,
        durationMs: (r.duration_ms as number) ?? 0,
        score: r.score as ExamScore,
        rubrics: (r.rubric as AttemptRubric[]) ?? undefined,
        provider: (r.score as { provider?: string }).provider ?? undefined,
        model: (r.score as { model?: string }).model ?? undefined,
      }));
    if (mapped.length) writeLocal(mapped);
  } catch {
    /* ignore */
  }
}

export function clearAttempts(): void {
  writeLocal([]);
}
