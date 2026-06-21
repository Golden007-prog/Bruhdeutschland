/**
 * Deterministic reverse-timeline planner (gap analysis G03; route-aware per gap G0-1). Given a target
 * intake (winter/summer + year), it back-dates the journey's milestones from the intake start so a
 * student knows what to begin by when. Anchored on the intake START month (WS ≈ October, SS ≈ April)
 * and month-offsets, NOT on exact university deadlines — those vary per programme and must be verified,
 * so the UI flags them.
 *
 * G0-1: a school-leaver routed to a Studienkolleg (and a school-leaver Medicine applicant) needs an
 * Aufnahmeprüfung → one-year Studienkolleg → FSP arc BEFORE "apply" — roughly 12–14 months of extra
 * lead the direct-admission arc hides. We back-date that whole pre-arc from a SECOND anchor (the
 * Studienkolleg-year start, ~14 months before the degree intake) so direct routes stay untouched.
 * Durations vary by college and are flagged `needsVerification` in the UI.
 */
import type { PathwayRoute } from "@/lib/pathway/pathway";

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

/**
 * How many months the Studienkolleg pre-arc adds AHEAD of the degree intake (G0-1). A school-leaver
 * reaches B1, sits the Aufnahmeprüfung, completes a one-year (2-semester) Studienkolleg, then passes
 * the FSP — only THEN do the standard "research → apply → admission" milestones begin against the
 * degree intake. ~14 months is the typical lead (entrance-exam prep + the Kolleg year + FSP); it
 * varies by college and is flagged `needsVerification` in the UI.
 */
export const STUDIENKOLLEG_LEAD_MONTHS = 14;

/**
 * The Studienkolleg pre-arc, offset from the STUDIENKOLLEG-YEAR start (not the degree intake). These
 * sit ahead of the standard arc for `studienkolleg` and school-leaver `medicine` routes. Durations are
 * indicative and vary by college — the UI flags them to verify.
 */
export const STUDIENKOLLEG_MILESTONES: TimelineMilestone[] = [
  { key: "sk-german-b1", label: "Reach German B1 for the entrance exam", detail: "The Studienkolleg Aufnahmeprüfung expects ~B1; the college then takes you toward C1. Start German early — this is the longest single dependency on the school-leaver route.", monthsBefore: 8, category: "language" },
  { key: "sk-apply", label: "Apply to the Studienkolleg (via a university)", detail: "You apply THROUGH a target university / via uni-assist, NOT to the Studienkolleg directly. Note each college's deadline and required entrance-exam date.", monthsBefore: 5, category: "documents" },
  { key: "sk-aufnahme", label: "Sit the Aufnahmeprüfung (entrance exam)", detail: "Pass the entrance exam to be admitted to the right course (Kurs). Places are competitive — have more than one college in mind.", monthsBefore: 3, category: "profile" },
  { key: "sk-start", label: "Begin the one-year Studienkolleg", detail: "Complete the two-semester foundation course in your stream (T/M/W/G/S). Durations and term dates vary by college — verify.", monthsBefore: 0, category: "campus" },
  { key: "sk-fsp", label: "Pass the Feststellungsprüfung (FSP)", detail: "The FSP (3 written subjects + ≥1 oral, including German) confers your HZB. Passing it is what lets the degree application below begin.", monthsBefore: -10, category: "profile" },
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

/** Routes whose school-leaver path runs through a Studienkolleg → FSP arc before the degree intake. */
export function routeNeedsStudienkolleg(route: PathwayRoute | undefined): boolean {
  return route === "studienkolleg" || route === "medicine";
}

/**
 * Back-date every milestone from the intake start. `now` defaults to the current date; milestones whose
 * target month is in the past are marked overdue so the UI can say "start this immediately".
 *
 * Pass a Studienkolleg/Medicine `route` (G0-1) to PREPEND the Aufnahmeprüfung → Studienkolleg-year → FSP
 * arc, anchored ~14 months ahead of the degree intake. Direct routes (`master`, `direct_bachelor`, …)
 * and an omitted route produce the unchanged direct-admission arc.
 */
export function reverseTimeline(
  season: IntakeSeason,
  year: number,
  now: Date = new Date(),
  route?: PathwayRoute,
): DatedMilestone[] {
  const startIdx = intakeStartMonthIndex(season);
  const nowYM = ym(now);

  const dateAt = (m: TimelineMilestone, offsetMonths: number): DatedMilestone => {
    // First of the anchor month, minus the milestone offset; JS Date rolls negative months into prior years.
    const d = new Date(year, startIdx - m.monthsBefore - offsetMonths, 1);
    const month = ym(d);
    const monthsFromNow = monthDiff(nowYM, month);
    return { ...m, month, monthsFromNow, overdue: monthsFromNow < 0 };
  };

  const direct = TIMELINE_MILESTONES.map((m) => dateAt(m, 0));
  if (!routeNeedsStudienkolleg(route)) return direct;

  // The Studienkolleg pre-arc is offset a further STUDIENKOLLEG_LEAD_MONTHS ahead of the degree intake,
  // so it lands entirely before "research". Keeps everything in one back-dated, ordered list.
  const preArc = STUDIENKOLLEG_MILESTONES.map((m) => dateAt(m, STUDIENKOLLEG_LEAD_MONTHS));
  return [...preArc, ...direct];
}
