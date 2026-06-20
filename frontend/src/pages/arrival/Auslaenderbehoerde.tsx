import { Link } from "react-router-dom";
import { ArrowRight, Building2, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMIT_DOCS } from "@/lib/seed/arrival";
import { source } from "@/lib/sources";

const BOOKING = [
  "Find your city's Ausländerbehörde (or the “Migrationsamt” / international students' service some unis run).",
  "Use the online appointment portal — slots are scarce, so book the moment you have your Anmeldung.",
  "Some offices accept applications by post or email first, then invite you for biometrics — check yours.",
  "Prepare every document in the checklist; missing one usually means a second appointment weeks later.",
  "Bring exact-change or a card for the fee, and arrive early — appointments run tight.",
];

const TIPS = [
  "University international offices often pre-book group appointments for new students — ask yours first.",
  "Write your case number / Aktenzeichen on every email; offices handle huge volumes.",
  "Keep a folder (physical + scanned) of every document — you'll reuse it for renewals.",
];

/** G40 — Ausländerbehörde appointment + document tracker. */
export default function ArrivalAuslaenderbehoerde() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G40 · Arrival"
        title="Ausländerbehörde appointment & documents"
        description="The foreigners' authority issues and renews your residence permit. Its bottleneck is the appointment — track yours and walk in with exactly the right documents."
        category="visa"
      />

      <Disclaimer />

      <DeadlineReminder
        storageKey="abh-appointment"
        label="My Ausländerbehörde appointment"
        hint="Set the date once you've booked it, so it shows in your countdown."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-category-visa" aria-hidden /> Booking the appointment
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
        <Checklist items={PERMIT_DOCS} title="Documents to bring" storageKey="arrival-abh-docs" />
      </div>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          <ul className="ml-4 list-disc space-y-1">
            {TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/residence-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          The residence-permit conversion <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("auslaenderbehoerde"), source("bamf"), source("residencePermit")]} />
    </div>
  );
}
