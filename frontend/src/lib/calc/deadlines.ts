/**
 * Deterministic deadline arithmetic (CLAUDE.md golden rule 4). Mirrors the backend
 * `DeadlineTracker`: date ordering + days-until, no model involvement. The *dates themselves* are
 * often official and volatile (intake deadlines change yearly) — those carry `needsVerification`.
 */

import type { DeadlineEvent, DeadlineSeverity } from "@/lib/types";

/** Parse a YYYY-MM-DD string as a local calendar date (avoids UTC off-by-one). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Local midnight of a date (so day-diffs ignore the time component). */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from `now` until `iso` (negative = already passed). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const ms = atMidnight(parseISODate(iso)).getTime() - atMidnight(now).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Severity buckets driving the alert treatment:
 *   overdue (<0) · urgent (0–6) · soon (7–29) · info (30+).
 */
export function severityFor(iso: string, now: Date = new Date()): DeadlineSeverity {
  const d = daysUntil(iso, now);
  if (d < 0) return "overdue";
  if (d <= 6) return "urgent";
  if (d <= 29) return "soon";
  return "info";
}

/** Human-readable relative label, e.g. "in 12 days", "today", "3 days ago". */
export function relativeLabel(iso: string, now: Date = new Date()): string {
  const d = daysUntil(iso, now);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d > 1) return `in ${d} days`;
  return `${Math.abs(d)} days ago`;
}

/** Format a YYYY-MM-DD as "15 Jul 2026". */
export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Sort events ascending by date (soonest first). Returns a new array. */
export function sortByDate<T extends { date: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => parseISODate(a.date).getTime() - parseISODate(b.date).getTime());
}

/** Events at the given severity or worse (used by the alert panel). */
export function alertable(events: DeadlineEvent[], now: Date = new Date()): DeadlineEvent[] {
  const rank: Record<DeadlineSeverity, number> = { info: 0, soon: 1, urgent: 2, overdue: 3 };
  return sortByDate(events).filter((e) => rank[severityFor(e.date, now)] >= rank.soon);
}
