import { source } from "@/lib/sources";
import type { FeatureCategoryKey, Source } from "@/lib/types";

/**
 * Overview-only seed data: the recurring "windows to watch" feed (Events page) and the long-range
 * preparation arc (Timeline page). Both are derived from docs/research/facts-pack-2026-06.md §1/§9
 * and src/lib/seed/process.ts. Every timing here is a *typical* window that varies by university,
 * program, year, and mission — so each item is rendered with a "timing varies — verify" note and a
 * link to the official source where it can be confirmed (CLAUDE.md §2/§3).
 */

/** A recurring window worth watching — not a single dated deadline (those live in SEED_EVENTS). */
export interface EventWatchItem {
  id: string;
  title: string;
  /** Human window/cadence, e.g. "~mid-July (WS) · ~mid-January (SS)". Rendered monospace. */
  timing: string;
  note: string;
  category: FeatureCategoryKey;
  source?: Source;
}

/**
 * Recurring intake/portal/scholarship/visa windows (facts-pack §9 + §1). All timings are typical
 * bars that change yearly and per program — verify each against its source.
 */
export const EVENT_WATCH: EventWatchItem[] = [
  {
    id: "ew-ws",
    title: "Winter-semester application window",
    timing: "Apps open ~early May · deadline ~15 Jul",
    note: "Semester starts ~October; decisions land Aug–Sep. Non-EU and Master's deadlines are frequently earlier (real examples: 31 May, 15 Apr, 15 Jun). Verify each program.",
    category: "documents",
    source: source("daadProcess"),
  },
  {
    id: "ew-ss",
    title: "Summer-semester application window",
    timing: "Apps open ~early Dec · deadline ~15 Jan",
    note: "Semester starts ~April; decisions land Feb–Mar. Fewer Master's programs admit for summer, and non-EU deadlines are often earlier. Verify each program.",
    category: "documents",
    source: source("daadProcess"),
  },
  {
    id: "ew-uniassist",
    title: "uni-assist / VPD processing time",
    timing: "~4–6 weeks · VPD valid 1 year",
    note: "uni-assist is used only when the target university is a member or requires it; otherwise you apply directly. The VPD must reach the university before its deadline — submit early.",
    category: "documents",
    source: source("uniAssistDeadlines"),
  },
  {
    id: "ew-aps",
    title: "APS certificate processing",
    timing: "~3–4 weeks (up to ~3 months at peak)",
    note: "Mandatory for applicants from India, China, and Vietnam, and gates both the application and the visa. Processing time is not officially published — confirm with your country's APS office.",
    category: "visa",
    source: source("aps"),
  },
  {
    id: "ew-visa",
    title: "Student-visa appointment & processing",
    timing: "Appointment lead time + several weeks–months",
    note: "Appointment availability varies widely by mission and can be months out. Book as early as you have an admission letter; the processing clock starts after the appointment.",
    category: "visa",
    source: source("autoVisaFaq"),
  },
  {
    id: "ew-daad",
    title: "DAAD scholarship rounds",
    timing: "Annual cycles, set per program",
    note: "Deadlines are defined per call in the DAAD funding database, not nationally. Eligibility typically needs a degree ≤ 6 years old. Check the database for your subject and country.",
    category: "finance",
    source: source("daadScholarships"),
  },
  {
    id: "ew-deutschlandstipendium",
    title: "Deutschlandstipendium application round",
    timing: "University-run, usually once per academic year",
    note: "Merit-based, open to all nationalities, awarded for at least two semesters. Application windows are set by each university — check your university's scholarship office.",
    category: "finance",
    source: source("deutschlandstipendium"),
  },
  {
    id: "ew-sperrkonto",
    title: "Blocked account / proof of financing",
    timing: "Before your visa appointment",
    note: "Proof of financing is a visa requirement, so arrange it before booking the appointment. The required amount is tied to the BAföG rate and changes yearly — verify the current figure.",
    category: "finance",
    source: source("studyFinance"),
  },
  {
    id: "ew-anmeldung",
    title: "Anmeldung (address registration)",
    timing: "Within 14 days of moving in",
    note: "Register at the local Bürgeramt with your passport and the landlord's Wohnungsgeberbestätigung. This statutory window is stable, but Bürgeramt appointment waits vary by city.",
    category: "campus",
    source: source("bundesmeldegesetz"),
  },
];

/** One phase of the long-range preparation arc (relative to the application deadline, "T"). */
export interface TimelinePhase {
  id: string;
  phase: string;
  /** Relative window label, e.g. "T-18 .. T-12 months". Rendered monospace. */
  window: string;
  items: string[];
}

/**
 * The typical 12–18 month preparation arc, anchored to the application deadline ("T"). Derived from
 * ROADMAP_STEPS (dependency order) and the facts-pack timeline (§1). Windows are illustrative — the
 * real calendar depends on your target intake; the relative ordering is what matters.
 */
export const PREP_TIMELINE: TimelinePhase[] = [
  {
    id: "tl-research",
    phase: "Research & self-assessment",
    window: "T-18 .. T-12 months",
    items: [
      "Parse your resume and convert your grade to the German scale (Modified Bavarian Formula).",
      "Total your ECTS and read your degree against German entrance requirements.",
      "Shortlist Master's programs at German public universities and record each one's deadline and requirements.",
    ],
  },
  {
    id: "tl-tests",
    phase: "Tests & early paperwork",
    window: "T-12 .. T-8 months",
    items: [
      "Decide whether you need IELTS/TOEFL (English-taught) or TestDaF/DSH (German-taught) and book the test.",
      "Start the APS certificate if you are from India, China, or Vietnam — it gates the application and the visa.",
      "Begin gathering certified copies of your degree and transcripts.",
    ],
  },
  {
    id: "tl-documents",
    phase: "Documents & applications",
    window: "T-8 .. T-3 months",
    items: [
      "Draft your Statement of Purpose, build a Europass CV, and request recommendation letters.",
      "Arrange certified translations for any document not already in German or English.",
      "Request a uni-assist VPD where a university requires it (allow 4–6 weeks).",
    ],
  },
  {
    id: "tl-submit",
    phase: "Submit & await decisions",
    window: "T-3 months .. T (deadline)",
    items: [
      "Submit via uni-assist or directly to each university before its deadline (often earlier for non-EU).",
      "Track each application thread and respond quickly to any document requests.",
      "Wait for admission decisions (Zulassung) — typically Aug–Sep for winter intake.",
    ],
  },
  {
    id: "tl-finance-visa",
    phase: "Finance & visa",
    window: "After admission .. ~2 months before departure",
    items: [
      "Open a blocked account (Sperrkonto) and arrange student health insurance.",
      "Apply for any scholarships you are eligible for.",
      "Book your visa appointment early and assemble admission, financing, insurance, and APS documents.",
    ],
  },
  {
    id: "tl-relocate",
    phase: "Relocate & settle in",
    window: "~1 month before .. first weeks in Germany",
    items: [
      "Secure accommodation and pack original certificates, visa, and financing confirmation.",
      "Fly out, then register your address (Anmeldung) within 14 days of moving in.",
      "Enrol (Immatrikulation), activate health insurance, and get your Deutschland-Semesterticket.",
    ],
  },
];
