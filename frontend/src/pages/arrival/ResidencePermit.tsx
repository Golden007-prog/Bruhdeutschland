import { Link } from "react-router-dom";
import { ArrowRight, Stamp, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMIT_DOCS, PERMIT_VALIDITY } from "@/lib/seed/arrival";
import { source } from "@/lib/sources";

const STEPS = [
  "Register your address (Anmeldung) and enrol — both are prerequisites for the permit.",
  "Book the Ausländerbehörde appointment as early as possible; in big cities the wait can be weeks.",
  "Assemble the document set (right) and have your financial proof current (Sperrkonto/scholarship).",
  "Attend the appointment, pay the fee, and give biometrics for the electronic permit (eAT) card.",
  "Collect the eAT card when notified — your right to stay is now the residence permit, not the visa.",
];

/** G39 — Residence-permit (Aufenthaltstitel) conversion tracker. */
export default function ArrivalResidencePermit() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G39 · Arrival"
        title="Residence-permit (Aufenthaltstitel) conversion"
        description="Your entry visa is temporary. Before it expires you must convert it into a student residence permit at the Ausländerbehörde. Track the documents, the appointment, and the deadline so it never lapses."
        category="visa"
      />

      <Disclaimer />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          Apply <strong>before your entry (D) visa expires</strong>. If the appointment is later than the
          expiry, request a Fiktionsbescheinigung (interim certificate) so you stay in status while you wait.
        </AlertDescription>
      </Alert>

      <OfficialFactRow fact={PERMIT_VALIDITY} />

      <DeadlineReminder
        storageKey="visa-expiry"
        label="My entry visa expires on"
        hint="Set this and we'll show how long you have to start the conversion."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={PERMIT_DOCS} title="Documents for the residence permit" storageKey="arrival-permit-docs" />
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stamp className="h-4 w-4 text-category-visa" aria-hidden /> The conversion sequence
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

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/auslaenderbehoerde" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Ausländerbehörde appointment <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/renewals" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Track its renewal <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("residencePermit"), source("auslaenderbehoerde"), source("bamf")]} />
    </div>
  );
}
