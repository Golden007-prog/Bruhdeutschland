import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/** G27 — Enrolment (Immatrikulation) guide. */
export default function ArrivalEnrolment() {
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

      <OfficialFactRow fact={SEMESTERBEITRAG} />

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
