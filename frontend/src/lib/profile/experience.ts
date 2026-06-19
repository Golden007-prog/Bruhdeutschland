/**
 * Deterministic work-experience computations (addendum §1). Pure + unit-tested — NEVER model-guessed,
 * and NEVER folded into the academic German GPA (which stays academic-only). Months are computed from
 * "YYYY-MM" dates; overlapping roles are unioned so concurrent jobs don't double-count. The caller
 * passes the current month ("YYYY-MM") so the functions are deterministic (no hidden clock).
 */
import type { EmploymentType, UserProfile, WorkExperience } from "./types";

/** A role counts toward "professional" totals unless it's volunteer work. */
const PROFESSIONAL: ReadonlySet<EmploymentType> = new Set([
  "full_time",
  "part_time",
  "internship",
  "working_student",
  "freelance",
  "research",
]);

/** Parse "YYYY-MM" into an absolute month index (year*12 + month-1), or null if malformed. */
export function monthIndex(ym: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec((ym ?? "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

interface Interval {
  start: number;
  end: number;
}

/** Build [start,end) month intervals for the roles matching `filter`, clamped to `now` for ongoing roles. */
function intervalsFor(
  exps: WorkExperience[],
  nowIdx: number,
  filter: (e: WorkExperience) => boolean,
): Interval[] {
  const out: Interval[] = [];
  for (const e of exps) {
    if (!filter(e)) continue;
    const start = monthIndex(e.startDate);
    if (start == null) continue;
    const end = e.ongoing ? nowIdx : monthIndex(e.endDate);
    if (end == null) continue;
    if (end > start) out.push({ start, end });
  }
  return out;
}

/** Total months covered by a set of intervals, merging overlaps (no double-counting concurrent roles). */
export function unionMonths(intervals: Interval[]): number {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;
  for (let i = 1; i < sorted.length; i++) {
    const iv = sorted[i];
    if (iv.start <= curEnd) {
      curEnd = Math.max(curEnd, iv.end);
    } else {
      total += curEnd - curStart;
      curStart = iv.start;
      curEnd = iv.end;
    }
  }
  total += curEnd - curStart;
  return total;
}

export interface ExperienceSummary {
  hasExperience: boolean;
  /** All non-volunteer roles, overlaps merged. */
  totalMonths: number;
  /** Roles flagged relevant to the target field. */
  relevantMonths: number;
  /** Full-time months AFTER graduation — the strict metric for EPOS-style rules. */
  postDegreeFullTimeMonths: number;
  /** Months since graduation, or null when graduation date isn't set. */
  monthsSinceGraduation: number | null;
  /** Months since graduation NOT covered by any role (a study/work gap), or null without a grad date. */
  gapMonths: number | null;
  /** True when currently in any ongoing role. */
  currentlyEmployed: boolean;
  /** Distinct domains across roles. */
  domains: string[];
  /** Distinct skills evidenced by roles. */
  skills: string[];
  roleCount: number;
}

/** Compute the full deterministic experience summary for a profile at month `nowYM` ("YYYY-MM"). */
export function summarizeExperience(profile: UserProfile, nowYM: string): ExperienceSummary {
  const exps = profile.workExperiences ?? [];
  const nowIdx = monthIndex(nowYM) ?? 0;
  const gradIdx = monthIndex(profile.graduationDate);

  const totalMonths = unionMonths(intervalsFor(exps, nowIdx, (e) => PROFESSIONAL.has(e.employmentType)));
  const relevantMonths = unionMonths(
    intervalsFor(exps, nowIdx, (e) => PROFESSIONAL.has(e.employmentType) && e.relevantToTarget),
  );
  // Post-degree full-time: full-time intervals clipped to start at/after graduation.
  const postDegreeFullTimeMonths = (() => {
    if (gradIdx == null) {
      return unionMonths(intervalsFor(exps, nowIdx, (e) => e.employmentType === "full_time"));
    }
    const clipped = intervalsFor(exps, nowIdx, (e) => e.employmentType === "full_time")
      .map((iv) => ({ start: Math.max(iv.start, gradIdx), end: iv.end }))
      .filter((iv) => iv.end > iv.start);
    return unionMonths(clipped);
  })();

  const monthsSinceGraduation = gradIdx != null ? Math.max(0, nowIdx - gradIdx) : null;
  const gapMonths =
    gradIdx != null
      ? Math.max(
          0,
          (monthsSinceGraduation ?? 0) -
            unionMonths(
              intervalsFor(exps, nowIdx, (e) => PROFESSIONAL.has(e.employmentType))
                .map((iv) => ({ start: Math.max(iv.start, gradIdx), end: iv.end }))
                .filter((iv) => iv.end > iv.start),
            ),
        )
      : null;

  const domains = [...new Set(exps.map((e) => e.domain.trim()).filter(Boolean))];
  const skills = [...new Set(exps.flatMap((e) => e.skills).map((s) => s.trim()).filter(Boolean))];

  return {
    hasExperience: exps.length > 0,
    totalMonths,
    relevantMonths,
    postDegreeFullTimeMonths,
    monthsSinceGraduation,
    gapMonths,
    currentlyEmployed: exps.some((e) => e.ongoing),
    domains,
    skills,
    roleCount: exps.length,
  };
}

/** Whole-number years from months (floor), for thresholds like "≥ 2 years". */
export function yearsFrom(months: number): number {
  return Math.floor(months / 12);
}

/** Human label like "2 yrs 3 mos", "1 yr", "5 mos", or "0" for none. */
export function formatYearsMonths(months: number): string {
  if (months <= 0) return "0";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} mo${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** The current month as "YYYY-MM" (UI helper; not used by the pure functions above). */
export function currentYM(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
