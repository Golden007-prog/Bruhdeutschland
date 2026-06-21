import { Link } from "react-router-dom";
import { ArrowRight, CalendarX2, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VISA_PROCESSING } from "@/lib/facts";
import { source } from "@/lib/sources";

const STEPS = [
  "Check your German mission's appointment system the moment you have (or are close to) your admission — waits can run months.",
  "Book the earliest slot you can; you can usually keep preparing documents until the date.",
  "Open and fund your Sperrkonto early — the financial proof is the slowest piece for many applicants.",
  "Assemble the full document set (see the visa checklist) and make the copies the mission asks for.",
  "Attend the appointment; then track the processing time below until you have a decision.",
];

/**
 * No-slot fallback tactics (gap G7-02). Practical guidance, not official policy — missions set their
 * own booking rules, so each tactic is framed as "try this / confirm with your mission", and no
 * service-level or wait-time guarantee is invented (CLAUDE.md §2).
 */
const NO_SLOT_TACTICS = [
  "Check at the exact times your mission releases slots, and check daily — at high-volume posts cancellations and new batches appear without notice. Set a calendar nudge.",
  "Confirm whether your country routes appointments through an external provider (e.g. VFS/iDATA/TLS) or the mission directly — sometimes one channel has slots when the other shows none.",
  "Keep dated screenshots of the empty calendar each time you try — this proof-of-attempt can support a deferral request or, later, a legal challenge.",
  "Email the mission's visa section explaining your intake deadline and that no slots are available; some posts hold an escalation or expedite channel for time-critical cases.",
  "Check whether you may apply at another German mission you are legally allowed to use (e.g. your place of ordinary residence) — rules are mission-specific, so confirm eligibility first.",
];

/** G34 — Visa appointment tracker. */
export default function VisaAppointment() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G34 · Visa"
        title="Visa appointment tracker"
        description="At many missions the appointment wait — not the paperwork — is the bottleneck. Track your booked slot and the dates around it so the visa never derails your start."
        category="visa"
      />

      <Disclaimer />

      <OfficialFactRow fact={VISA_PROCESSING} />

      <div className="grid gap-4 sm:grid-cols-2">
        <DeadlineReminder storageKey="visa-appointment" label="My visa appointment" hint="Set it once booked." />
        <DeadlineReminder storageKey="visa-docs-ready" label="Documents-ready target" hint="Aim to be complete well before the appointment." />
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Getting the timing right</h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Appointment systems and waits are mission-specific and change constantly — book early and check
          your mission's page often.
        </AlertDescription>
      </Alert>

      {/* ── G7-02 — what to do when there is nothing to book ──────────────────── */}
      <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarX2 className="h-4 w-4 text-category-visa" aria-hidden />
          No slots available? Don't just keep waiting
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          At high-volume missions the calendar can show no appointments for months. These are practical
          tactics, not guarantees — every mission sets its own booking rules, so confirm what applies to
          you before relying on any of them.
        </p>
        <ul className="mt-3 space-y-2">
          {NO_SLOT_TACTICS.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-md border bg-card p-3">
          <p className="text-sm font-medium">What if I can't get a slot before my intake?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your university whether your admission can be deferred to the next intake, then re-plan
            your milestones from that date so the visa step isn't rushed. Keep your proof-of-attempt in
            case you later need to challenge a refusal.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/start/timeline-planner"
              className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
              Re-plan from a new intake <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              to="/visa/refusal"
              className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
              If a visa is refused <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/visa/checklist" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Visa document checklist <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Open a Sperrkonto <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-1">Source · Quelle</p>
        <a href={source("autoVisaFaq").url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
          {source("autoVisaFaq").name}
        </a>
      </div>
    </div>
  );
}
