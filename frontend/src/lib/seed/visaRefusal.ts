import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Visa-refusal & post-refusal (Remonstration / re-apply / legal action) seed data — gap G7-01.
 *
 * Grounding rules (CLAUDE.md §2/§3): the *procedure* and any *deadline* for challenging a refusal
 * are official, mission-specific, and politically volatile — so they are NOT asserted as fixed facts
 * here. Each procedural step that references an official rule carries `needsVerification: true` and a
 * SourceLink. No euro amount, court fee, or appeal window is hard-coded as fact.
 *
 * IMPORTANT current-law note (verified 2026-06-21): the German Federal Foreign Office (Auswärtiges
 * Amt) ABOLISHED the remonstration procedure (Remonstrationsverfahren / formal objection) for visa
 * refusals WORLDWIDE from 1 July 2025. Remonstration is only processed for rejection notices dated on
 * or before 30 June 2025. For refusals dated 1 July 2025 or later the routes are (1) submit a NEW
 * application with improved evidence, or (2) take legal action at the Administrative Court Berlin
 * (Verwaltungsgericht Berlin) — a fee-bearing lawsuit, not a free re-review. We therefore present
 * remonstration as the historical/legacy route (still relevant only for old refusals) and do not
 * state a one-month appeal window as a current fact. Verify with YOUR mission before relying on any
 * of this — missions publish their own current procedure.
 */

/* ── Sources (mission-specific; the canonical registry in lib/sources.ts is not edited here) ──────
 * These supplement source("autoVisa") / source("autoVisaFaq") with the refusal-specific official
 * entry points the page cites. They are official German-government domains. */

/** Auswärtiges Amt — what to do if a visa application is refused (rejection FAQ). */
export const SOURCE_VISA_REFUSAL: Source = {
  name: "Auswärtiges Amt — Visa rejected: what can I do?",
  url: "https://www.auswaertiges-amt.de/en/visa-service/-/231148",
};

/** A German mission's official notice that remonstration was abolished from 1 July 2025. */
export const SOURCE_REMONSTRATION: Source = {
  name: "German Mission — Remonstration procedure (abolished from 1 Jul 2025)",
  url: "https://jaunde.diplo.de/cm-en/service/remonstration-procedure/2444194",
};

/** Verwaltungsgericht Berlin — the court that hears visa-refusal lawsuits. */
export const SOURCE_VG_BERLIN: Source = {
  name: "Verwaltungsgericht Berlin — Administrative Court (visa lawsuits)",
  url: "https://www.berlin.de/gerichte/verwaltungsgericht/",
};

/* ── Refusal reason-codes → remedy ────────────────────────────────────────────── */

export interface RefusalReason {
  id: string;
  /** The refusal reason, in the plain terms a mission's notice tends to use. */
  reason: string;
  /** Why a mission refuses on this ground — what it signals to them. */
  why: string;
  /** The concrete fix to make before re-applying (or to evidence in a legal challenge). */
  remedy: string;
  /** In-app link to the tool that helps close this gap. */
  href?: string;
}

/**
 * The most common grounds a German national (student) visa is refused on, each paired with the
 * remedy a student can actually act on. These are practical guidance, not an official taxonomy —
 * a mission's own notice states the exact ground(s) it relied on. (CLAUDE.md §2: no fabricated
 * official fact — these are reasons-in-practice, and the remedies are process guidance.)
 */
export const REFUSAL_REASONS: RefusalReason[] = [
  {
    id: "rf-finance",
    reason: "Insufficient proof of financial resources",
    why: "The mission is not convinced you can cover living costs for the stay without unauthorised work — the most common single ground.",
    remedy:
      "Open / top up the blocked account (Sperrkonto) to the full required amount, and add any scholarship or sponsor evidence. Re-confirm the current amount before re-applying — it changes yearly.",
    href: "/finance/sperrkonto",
  },
  {
    id: "rf-docs",
    reason: "Incomplete or missing documents",
    why: "A required document was absent, expired, uncertified, or untranslated. Missions reject on completeness before they assess the merits.",
    remedy:
      "Rebuild the document set against your mission's own current checklist; include certified copies and certified translations where asked. Re-check the list — it is mission-specific.",
    href: "/visa/checklist",
  },
  {
    id: "rf-purpose",
    reason: "Doubts about study purpose or genuine-student intent",
    why: "Your stated plan didn't read as a coherent, researched reason to study this programme in Germany.",
    remedy:
      "Strengthen a focused motivation letter that ties the programme to your background and goals; rehearse a consistent account of your plan. Avoid generic 'study abroad' framing.",
    href: "/visa/simulator",
  },
  {
    id: "rf-insurance",
    reason: "Invalid or insufficient health insurance",
    why: "The cover you showed didn't meet German standards for the entry period, or didn't span the required dates.",
    remedy:
      "Provide cover from a provider that explicitly meets German requirements and spans entry through to statutory student insurance at enrolment (mind the entry gap).",
    href: "/finance/health-insurance",
  },
  {
    id: "rf-ties",
    reason: "Doubts about your overall profile or return/onward intent",
    why: "Considered as a whole, the application left the officer unconvinced of its credibility — not any single factor.",
    remedy:
      "Address the specific concern stated in the notice with documents (employment, family, study record). Never invent ties — consistency across your whole application matters more than any one answer.",
  },
  {
    id: "rf-inconsistent",
    reason: "False, inconsistent, or contradictory information",
    why: "Details that didn't match across documents (or against shared Schengen records) undermine the whole application.",
    remedy:
      "Reconcile every date, name, and figure across documents before re-applying; have someone else proofread the full set. Disclose and explain any past visa issue transparently.",
  },
];

/* ── The three honest decisions after a refusal ──────────────────────────────── */

export interface RefusalRoute {
  id: string;
  title: string;
  /** One-line framing of when this route is the right one. */
  when: string;
  /** The concrete steps for this route. */
  steps: string[];
  /** Official procedure / deadline is mission-specific and changing — always flag + cite. */
  needsVerification: boolean;
  source?: Source;
}

/**
 * The three routes open to a refused applicant. Per current law (verified 2026-06-21) remonstration
 * is the LEGACY route — available only for refusals dated on/before 30 Jun 2025 — so it is presented
 * last and clearly time-bounded. Re-apply and legal action are the current routes. No appeal window
 * is asserted as a current fact: the page renders the procedure as needs-verification with a mission
 * source, exactly per the grounding rule.
 */
export const REFUSAL_ROUTES: RefusalRoute[] = [
  {
    id: "ro-reapply",
    title: "Re-apply with improved evidence",
    when: "Usually the fastest route when the refusal was about missing/weak documents or finances you can now fix.",
    steps: [
      "Read the refusal notice carefully — since the procedure change, notices give detailed reasons.",
      "Fix the specific ground(s): top up the Sperrkonto, complete the document set, strengthen the motivation letter.",
      "Submit a new application (a fee applies). There is no fixed re-application waiting period, but it does not re-open the old file — it is a fresh decision.",
      "If your intake is at risk, plan a deferral to the next intake in parallel (see below).",
    ],
    needsVerification: true,
    source: SOURCE_VISA_REFUSAL,
  },
  {
    id: "ro-legal",
    title: "Take legal action (lawsuit)",
    when: "When you believe the refusal was wrong in law and you can evidence it — this is a court case, not a free re-review.",
    steps: [
      "Legal challenges to visa refusals are heard by the Administrative Court Berlin (Verwaltungsgericht Berlin).",
      "Court fees apply and most applicants instruct a German immigration lawyer; proceedings can take many months.",
      "There IS a deadline to file a lawsuit, but it is set by law and your refusal notice — confirm it from the notice / a lawyer, do not assume it.",
    ],
    needsVerification: true,
    source: SOURCE_VG_BERLIN,
  },
  {
    id: "ro-remonstration",
    title: "Remonstration (formal objection) — legacy route only",
    when: "Only relevant if your refusal notice is dated on or before 30 June 2025 — the procedure was abolished worldwide from 1 July 2025.",
    steps: [
      "The Auswärtiges Amt abolished the remonstration (Remonstrationsverfahren / Widerspruch) procedure worldwide from 1 July 2025.",
      "Remonstrations are only still processed for rejection notices issued on or before 30 June 2025.",
      "If your notice predates the cut-off, the objection window and procedure are mission-specific — confirm them on your mission's page before relying on any deadline.",
    ],
    needsVerification: true,
    source: SOURCE_REMONSTRATION,
  },
];

/** Convenience: the sources this dataset cites, for a Sources footer. */
export const REFUSAL_SOURCES: Source[] = [
  SOURCE_VISA_REFUSAL,
  SOURCE_REMONSTRATION,
  SOURCE_VG_BERLIN,
  source("autoVisaFaq"),
];
