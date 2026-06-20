import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";

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
