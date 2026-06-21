import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileBadge, Info, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { offerLabel, openConditions } from "@/lib/offers/offerDeadlines";
import { formatDate } from "@/lib/calc/deadlines";
import type { ChecklistItemDef } from "@/lib/types";

const FIND: ChecklistItemDef[] = [
  { id: "deadline", label: "The enrolment / acceptance deadline", hint: "Usually weeks, not months — the single most time-critical item." },
  { id: "conditions", label: "Any conditions (bedingt / unter Vorbehalt)", hint: "e.g. final transcript, language certificate, or a missing document still due." },
  { id: "fee", label: "The semester contribution and payment details", hint: "You often must pay before you're enrolled." },
  { id: "docs", label: "Which original / certified documents to bring or send" },
  { id: "matrikel", label: "Enrolment instructions (in person vs online)" },
  { id: "insurance", label: "The health-insurance confirmation they require" },
  { id: "visa-use", label: "Whether it's a full Zulassung (for the visa) or a conditional admission" },
];

const TERMS: { de: string; en: string }[] = [
  { de: "Zulassungsbescheid", en: "Letter of admission — your offer." },
  { de: "Ablehnungsbescheid", en: "Rejection notice." },
  { de: "bedingte Zulassung", en: "Conditional admission — you must still meet a condition." },
  { de: "Immatrikulationsfrist", en: "Enrolment deadline." },
  { de: "Semesterbeitrag", en: "Semester contribution to pay." },
  { de: "fristgerecht", en: "On time / by the deadline." },
];

/** G25 — Admission-letter (Zulassungsbescheid) interpreter. A structured decoder, not an AI guess. */
export default function AdmissionLetterPage() {
  const [rawOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);
  const conditional = useMemo(() => offers.filter((o) => o.conditional && o.status !== "declined"), [offers]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G25 · Offers"
        title="Admission letter (Zulassungsbescheid) interpreter"
        description="German admission letters bury the things that matter — a short deadline, hidden conditions, a payment step. Here's exactly what to look for, and the terms to decode."
      />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          The enrolment deadline is the trap. It's often only 2–4 weeks after the letter and missing it can
          forfeit the place. Find it first and set the reminder below.
        </AlertDescription>
      </Alert>

      <DeadlineReminder storageKey="enrolment-deadline" label="My enrolment / acceptance deadline" hint="Copy it from your admission letter." />

      {conditional.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50/40 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <TriangleAlert className="h-4 w-4" aria-hidden /> Conditions still open on your offers
          </h2>
          <p className="mt-0.5 text-xs text-amber-800">
            A conditional admission isn't a clean place — and may not satisfy your visa. Track and clear each condition
            on the <Link to="/offers/compare" className="font-medium underline">offer board</Link>.
          </p>
          <ul className="mt-2 space-y-1.5">
            {conditional.map((o) => {
              const unmet = openConditions(o);
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{offerLabel(o)}</span>
                    <span className="text-muted-foreground">
                      {" · "}{unmet > 0 ? `${unmet} condition${unmet === 1 ? "" : "s"} to clear` : "all conditions met"}
                      {o.acceptBy ? ` · accept by ${formatDate(o.acceptBy)}` : ""}
                    </span>
                  </span>
                  <Link to="/offers/compare" className="text-xs font-medium text-primary underline">Manage</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Checklist items={FIND} title="What to find in your letter" storageKey="admission-letter-checklist" />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileBadge className="h-4 w-4" aria-hidden /> Key German terms
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {TERMS.map((t) => (
            <div key={t.de} className="text-sm">
              <dt className="font-medium">{t.de}</dt>
              <dd className="text-muted-foreground">{t.en}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          A full, unconditional <strong>Zulassungsbescheid</strong> is what your visa file needs. A
          conditional admission may not be enough for the visa — clarify with the university and your mission.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/offers/compare" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Compare your offers <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/enrolment" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Enrolment guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Guidance only. Your specific letter and university define the binding terms — read it carefully and
        ask the international office if anything is unclear.
      </p>
    </div>
  );
}
