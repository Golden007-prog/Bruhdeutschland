import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Info, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { acceptedOffer, offerLabel, openConditions } from "@/lib/offers/offerDeadlines";
import { formatDate } from "@/lib/calc/deadlines";
import { ENROLMENT_DOCS } from "@/lib/seed/arrival";
import { SEMESTERBEITRAG } from "@/lib/facts";
import { source } from "@/lib/sources";

const STEPS = [
  "Accept your admission and note the enrolment deadline on the Zulassungsbescheid — it's separate from the application deadline.",
  "Pay the semester contribution (Semesterbeitrag) to the account on your admission letter and keep the receipt.",
  "Arrange statutory health insurance (or an exemption if privately insured) — the insurer sends an electronic confirmation to the university.",
  "Submit the enrolment documents in person or online by the deadline.",
  "Receive your Matrikelnummer, student ID, and enrolment certificate (Immatrikulationsbescheinigung).",
];

/** G27 — Enrolment (Immatrikulation) guide. Scopes to the accepted offer when there is one (G5-05). */
export default function ArrivalEnrolment() {
  const [rawOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);
  const accepted = useMemo(() => acceptedOffer(offers), [offers]);
  const unmet = accepted && accepted.conditional ? openConditions(accepted) : 0;
  // A captured Matrikelnummer / payment record, scoped per-user (kept here as the enrolment phase's record).
  const [matrikel, setMatrikel] = useSyncedState<string>("enrolment:matrikelnummer", "");
  const [paid, setPaid] = useSyncedState<string>("enrolment:semesterbeitrag-paid", "");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G27 · Arrival"
        title="Enrolment (Immatrikulation) guide"
        description="Admission is not enrolment. This turns your Zulassungsbescheid into an actual student place — the documents, the semester contribution, and the Matrikelnummer that unlocks everything else."
        category="campus"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          You usually enrol <strong>after you arrive and register your address</strong>, within the window the
          university sets. Miss it and the place can be withdrawn — diarise the enrolment deadline immediately.
        </AlertDescription>
      </Alert>

      {accepted ? (
        <section className="rounded-lg border border-emerald-300 bg-emerald-50/40 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <GraduationCap className="h-4 w-4" aria-hidden /> Enrolling at: {offerLabel(accepted)}
          </h2>
          <p className="mt-0.5 text-xs text-emerald-800">
            {[accepted.university, accepted.city].filter(Boolean).join(", ")}
            {accepted.acceptBy ? ` · acceptance deadline ${formatDate(accepted.acceptBy)}` : ""}
          </p>
          {unmet > 0 && (
            <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              This is a <strong>conditional</strong> admission with {unmet} condition{unmet === 1 ? "" : "s"} still open.
              You usually can't fully enrol until they're cleared — finish them on the{" "}
              <Link to="/offers/compare" className="font-medium underline">offer board</Link> and confirm with the
              international office what's needed before the deadline.
            </p>
          )}
        </section>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Accept an offer on the <Link to="/offers/compare" className="font-medium underline">offer board</Link> and
            this guide will scope to that university's deadline and details.
          </AlertDescription>
        </Alert>
      )}

      <OfficialFactRow fact={SEMESTERBEITRAG} />

      {/* G8-04 — the enrolment deadline the page warns about is now actually trackable. */}
      <DeadlineReminder
        storageKey="enrolment-deadline"
        label="My enrolment / acceptance deadline"
        hint="From your Zulassungsbescheid. Shared with the admission-letter interpreter and your reminders."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={ENROLMENT_DOCS} title="Enrolment documents" storageKey="arrival-enrolment" />
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-category-campus" aria-hidden /> The enrolment sequence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {STEPS.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Your enrolment record — the Matrikelnummer + the contribution you actually paid (G5-05). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your enrolment record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="enrol-matrikel" className="text-xs font-medium text-muted-foreground">Matrikelnummer (once enrolled)</label>
            <input
              id="enrol-matrikel"
              value={matrikel}
              onChange={(e) => setMatrikel(e.target.value)}
              placeholder="e.g. 01234567"
              className="flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="enrol-paid" className="text-xs font-medium text-muted-foreground">Semesterbeitrag paid (€)</label>
            <input
              id="enrol-paid"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 350"
              className="official-figure flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[0.68rem] text-muted-foreground">The exact amount is set per university — confirm yours.</p>
          </div>
        </CardContent>
      </Card>

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          Each semester you must <strong>re-register (Rückmeldung)</strong> by paying the contribution again, or you can
          be de-registered. Set that recurring deadline on the{" "}
          <Link to="/arrival/renewals" className="font-medium underline">renewals page</Link>.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/health-insurance" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Health-insurance selector <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/university-onboarding" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          First-weeks onboarding <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("enrolment"), source("studyInGermany"), source("daadCosts")]} />
    </div>
  );
}
