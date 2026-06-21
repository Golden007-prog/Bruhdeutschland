import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, ClipboardList, Info, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANMELDUNG_DOCS } from "@/lib/seed/arrival";
import { ANMELDUNG_WINDOW } from "@/lib/facts";
import { source } from "@/lib/sources";

const BOOKING = [
  "Search “Bürgeramt Termin <your city>” to find the official booking portal (e.g. service.berlin.de).",
  "Pick the service “Anmeldung einer Wohnung”. In big cities, refresh often — slots open in batches and go fast.",
  "If no slots appear, check neighbouring districts (you can usually register at any Bürgeramt in the city) or look for walk-in hours.",
  "Bring the printed/PDF appointment confirmation, your passport, and the Wohnungsgeberbestätigung.",
  "At the counter you receive the Meldebescheinigung — keep several copies; the bank, university, and Ausländerbehörde all want it.",
];

/** G8-06 — escalation when no slot exists before the 14-day window closes. Process guidance. */
const NO_SLOT = [
  "Keep proof you tried: screenshot the empty booking calendar with its date, and any “no appointments available” message. This is your evidence of good faith.",
  "Widen the net: refresh at off-peak times (early morning), and try Bürgerämter in neighbouring districts or towns — many cities let you register at any office, and a nearby smaller town may have slots.",
  "Use any walk-in (Spontantermine) hours, and check if your university's international office or a Studierendenwerk service runs Anmeldung help days.",
  "If the deadline passes purely because the city released no slots, register at the first available appointment and bring your proof — a documented, genuine attempt is treated very differently from simply not bothering.",
];

/** G42 — Anmeldung booking & document runbook (complements the conceptual /visa/anmeldung page). */
export default function ArrivalAnmeldungRunbook() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G42 · Arrival"
        title="Anmeldung — booking & document runbook"
        description="A practical, city-agnostic runbook for the single most important arrival step: booking the Bürgeramt slot and bringing exactly the right documents so you're done in one visit."
        category="visa"
      />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          The <strong>Wohnungsgeberbestätigung</strong> (your landlord's signed confirmation that you live
          there) is non-negotiable — without it you cannot register, full stop. Ask your landlord for it the
          day you get the keys.
        </AlertDescription>
      </Alert>

      <OfficialFactRow fact={ANMELDUNG_WINDOW} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={ANMELDUNG_DOCS} title="What to bring" storageKey="arrival-anmeldung-docs" />
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-category-visa" aria-hidden /> Booking, step by step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {BOOKING.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The Anmeldung unlocks the chain: <strong>address → bank account → residence permit → Rundfunkbeitrag</strong>.
          Do it first.
        </AlertDescription>
      </Alert>

      {/* ── G8-06: no slots before the 14-day window closes ───────────────────── */}
      <section aria-labelledby="noslot-heading" className="space-y-3 rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="noslot-heading" className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="h-4 w-4 text-category-visa" aria-hidden /> No slots before your 14 days
          are up?
        </h2>
        <p className="text-sm text-muted-foreground">
          In Berlin and Munich the city sometimes releases <strong>no appointments for weeks</strong> —
          a structural problem, not your fault. The 14-day window in the Bundesmeldegesetz is real, but
          it's measured against your honest effort: authorities very rarely penalise a newcomer who is
          demonstrably trying and registers as soon as a slot exists.
        </p>
        <ol className="space-y-2">
          {NO_SLOT.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/visa/anmeldung" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          What Anmeldung is (walkthrough) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/bank-account" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Next: bank account <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("bundesmeldegesetz"), source("makeItInGermany")]} />
    </div>
  );
}
