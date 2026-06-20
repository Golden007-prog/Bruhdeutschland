/**
 * Deterministic reverse-timeline planner (gap analysis G03). Given a target intake (winter/summer +
 * year), it back-dates the journey's milestones from the intake start so a student knows what to begin
 * by when. Anchored on the intake START month (WS ≈ October, SS ≈ April) and month-offsets, NOT on
 * exact university deadlines — those vary per programme and must be verified, so the UI flags them.
 */

export type IntakeSeason = "WS" | "SS";

export interface TimelineMilestone {
  key: string;
  label: string;
  detail: string;
  /** Whole months before the intake START that this should be underway/done. */
  monthsBefore: number;
  /** Feature category for colour/links. */
  category: "profile" | "language" | "documents" | "finance" | "visa" | "campus";
}

export interface DatedMilestone extends TimelineMilestone {
  /** "YYYY-MM" target month. */
  month: string;
  /** Whole months from `now` (negative = already passed). */
  monthsFromNow: number;
  /** True when the target month is already in the past relative to `now`. */
  overdue: boolean;
}

/** The canonical journey milestones, in back-dated order (largest offset first). */
export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  { key: "research", label: "Research & shortlist programmes", detail: "Identify programmes you're eligible for and that fit your goal; note each one's exact deadline and requirements.", monthsBefore: 14, category: "profile" },
  { key: "language-start", label: "Start serious language / test prep", detail: "Begin the climb to the required level (German B2–C1, or IELTS/TOEFL) — it takes months, so start early.", monthsBefore: 12, category: "language" },
  { key: "aps", label: "Begin APS certificate (if required)", detail: "If your country requires the APS, start it now — it can take several weeks and gates both application and visa.", monthsBefore: 9, category: "visa" },
  { key: "tests", label: "Sit language / standardized tests", detail: "Take TestDaF/DSH/Goethe or IELTS/TOEFL (and GRE/TestAS if needed) with time to retake before deadlines.", monthsBefore: 8, category: "language" },
  { key: "documents", label: "Prepare documents", detail: "Draft the SOP, request LORs, get certified translations and certified copies, build the Europass CV.", monthsBefore: 6, category: "documents" },
  { key: "apply", label: "Submit applications", detail: "Apply via uni-assist / the university portal. Exact deadlines vary (WS often ~15 Jul, SS often ~15 Jan) — verify each.", monthsBefore: 4, category: "documents" },
  { key: "admission", label: "Receive admission & decide", detail: "Compare offers, accept a seat by its deadline, and request your admission letter for the visa file.", monthsBefore: 2, category: "profile" },
  { key: "finance-visa", label: "Open Sperrkonto & apply for the visa", detail: "Fund the blocked account, gather the visa file, and book the visa appointment as early as you can.", monthsBefore: 2, category: "visa" },
  { key: "arrival", label: "Fly, register (Anmeldung) & enrol", detail: "Arrive, register your address within 14 days, open a bank account, enrol, and convert your visa to a residence permit.", monthsBefore: 0, category: "campus" },
];

/** Intake start month index (0–11): WS → October (9), SS → April (3). */
export function intakeStartMonthIndex(season: IntakeSeason): number {
  return season === "WS" ? 9 : 3;
}

/** Intake start as "YYYY-MM". */
export function intakeStartMonth(season: IntakeSeason, year: number): string {
  const m = intakeStartMonthIndex(season) + 1;
  return `${year}-${String(m).padStart(2, "0")}`;
}

function ym(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Whole-month difference between two "YYYY-MM" anchors (b − a). */
export function monthDiff(aYM: string, bYM: string): number {
  const [ay, am] = aYM.split("-").map(Number);
  const [by, bm] = bYM.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/**
 * Back-date every milestone from the intake start. `now` defaults to the current date; milestones whose
 * target month is in the past are marked overdue so the UI can say "start this immediately".
 */
export function reverseTimeline(season: IntakeSeason, year: number, now: Date = new Date()): DatedMilestone[] {
  const startIdx = intakeStartMonthIndex(season);
  const nowYM = ym(now);
  return TIMELINE_MILESTONES.map((m) => {
    // First of the intake-start month, minus the offset; JS Date rolls negative months into prior years.
    const d = new Date(year, startIdx - m.monthsBefore, 1);
    const month = ym(d);
    const monthsFromNow = monthDiff(nowYM, month);
    return { ...m, month, monthsFromNow, overdue: monthsFromNow < 0 };
  });
}
