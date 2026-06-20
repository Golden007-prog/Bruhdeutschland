/**
 * Deterministic tracker analytics (work-order §8). Every dashboard widget is computed here from the
 * stored {@link AttemptRecord}s — no fabricated metrics; an empty input yields empty results so the UI
 * shows honest empty states. Pure + unit-tested.
 */
import { computeStreak, dayStr, type AttemptRecord } from "./attempts";

const DAY_MS = 86_400_000;
/** Local "MM-DD" label for the trend line — local-date based, matching the streak's day-bucketing. */
const monthDayLabel = (ms: number): string => dayStr(ms).slice(5);

export interface TypeStat {
  type: string;
  earned: number;
  possible: number;
  count: number;
  accuracy: number; // 0..1
  lastSeen: number;
}

/** Aggregate per-question-TYPE accuracy across all attempts, worst accuracy first. */
export function questionTypeStats(attempts: AttemptRecord[]): TypeStat[] {
  const map = new Map<string, TypeStat>();
  for (const a of attempts) {
    for (const s of a.score.sections) {
      for (const it of s.items) {
        const cur = map.get(it.typeLabel) ?? { type: it.typeLabel, earned: 0, possible: 0, count: 0, accuracy: 0, lastSeen: 0 };
        cur.earned += it.earned;
        cur.possible += it.possible;
        cur.count += 1;
        cur.lastSeen = Math.max(cur.lastSeen, a.finishedAt);
        map.set(it.typeLabel, cur);
      }
    }
  }
  return [...map.values()]
    .map((t) => ({ ...t, accuracy: t.possible > 0 ? t.earned / t.possible : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export interface HistoryPoint {
  t: number;
  date: string;
  overall: number | null;
  percent: number;
  examId: string;
}

/** Overall band + percent over time (oldest → newest), for the trend line. */
export function scoreHistory(attempts: AttemptRecord[]): HistoryPoint[] {
  return [...attempts]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((a) => ({ t: a.finishedAt, date: monthDayLabel(a.finishedAt), overall: a.score.overallBand ?? null, percent: a.score.percent, examId: a.examId }));
}

export interface SkillStat {
  skill: string;
  band?: number;
  percent: number;
}

/** Latest band/percent per skill (from the most recent attempt that exercised each), for the radar. */
export function latestSkillStats(attempts: AttemptRecord[]): SkillStat[] {
  const byTime = [...attempts].sort((a, b) => b.finishedAt - a.finishedAt);
  const seen = new Map<string, SkillStat>();
  for (const a of byTime) {
    for (const s of a.score.sections) {
      if (!seen.has(s.skill)) seen.set(s.skill, { skill: s.skill, band: s.band, percent: s.percent });
    }
  }
  return [...seen.values()];
}

export interface ImprovementPoint {
  type: string;
  accuracy: number;
  count: number;
  recencyDays: number;
  priority: number;
}

/**
 * Ranked improvement points: (low accuracy) × (practice frequency) × (recency). Higher priority =
 * a high-frequency type you're weak on and have practised recently — the best place to focus next.
 */
export function improvementPoints(attempts: AttemptRecord[], now: number, topN = 3): ImprovementPoint[] {
  return questionTypeStats(attempts)
    .filter((t) => t.possible >= 2)
    .map((t) => {
      const recencyDays = Math.max(0, (now - t.lastSeen) / DAY_MS);
      const recencyWeight = 1 / (1 + recencyDays / 7);
      const priority = (1 - t.accuracy) * Math.log2(2 + t.count) * recencyWeight;
      return { type: t.type, accuracy: t.accuracy, count: t.count, recencyDays, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, topN);
}

/** Best overall band achieved, if any attempt produced one. */
export function bestOverall(attempts: AttemptRecord[]): number | undefined {
  const bands = attempts.map((a) => a.score.overallBand).filter((b): b is number => b != null);
  return bands.length ? Math.max(...bands) : undefined;
}

export interface Prediction {
  value?: number;
  confidence: "low" | "medium" | "high";
}

/** Project the next overall band from a linear trend over recent attempts (clamped to 0–9). */
export function predictedBand(attempts: AttemptRecord[]): Prediction {
  const hist = scoreHistory(attempts).map((h) => h.overall).filter((b): b is number => b != null);
  if (hist.length === 0) return { confidence: "low" };
  if (hist.length === 1) return { value: hist[0], confidence: "low" };
  const recent = hist.slice(-5);
  const n = recent.length;
  const xs = recent.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = recent.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (recent[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den ? num / den : 0;
  const next = meanY + slope * (n - meanX); // predict x = n (one step past the last index n-1)
  const value = Math.max(0, Math.min(9, Math.round(next * 2) / 2));
  const confidence = n >= 4 ? "high" : "medium";
  return { value, confidence };
}

/** Current + longest daily practice streak, folded over the unique attempt days. */
export function streakFromAttempts(attempts: AttemptRecord[]): { current: number; longest: number } {
  const days = [...new Set(attempts.map((a) => dayStr(a.finishedAt)))].sort();
  let state: { current: number; longest: number; last: string | null } = { current: 0, longest: 0, last: null };
  for (const d of days) state = computeStreak(state, d);
  return { current: state.current, longest: state.longest };
}
