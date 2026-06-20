import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, Library } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KURSE } from "@/lib/pathway/kurs";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";

const CHOOSE: ChecklistItemDef[] = [
  { id: "kurs", label: "Confirm the right course (Kurs) for your target subject", hint: "T/M/W/G/S — see the streams below." },
  { id: "type", label: "Choose University-Studienkolleg (qualifies for all unis) vs FH-Studienkolleg (Fachhochschulen only)" },
  { id: "public", label: "Prefer a state (public) Studienkolleg — free; private ones charge tuition", hint: "Verify cost and recognition before paying." },
  { id: "apply-via-uni", label: "Apply through a TARGET UNIVERSITY / uni-assist, not to the Studienkolleg directly" },
  { id: "aufnahme", label: "Prepare for the entrance exam (Aufnahmeprüfung) — German B1–B2 + subject basics" },
  { id: "german", label: "Reach the required German level before the entrance exam" },
];

/** G06 — Studienkolleg finder & Kurs guide. Course streams from the grounded KURSE map. */
export default function ProfileStudienkolleg() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G06 · Foundations"
        title="Studienkolleg finder & course (Kurs) guide"
        description="If your school certificate isn't Abitur-equivalent, a one-year Studienkolleg confers your HZB via the Feststellungsprüfung (FSP). Here's the right course stream and how to actually get a place."
        category="profile"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          You apply to a Studienkolleg <strong>through a university</strong> (often via uni-assist), not by
          contacting the college directly. A <strong>University</strong>-Studienkolleg qualifies you for all
          institutions; an <strong>FH</strong>-Studienkolleg only for universities of applied sciences.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The course streams (Kurse)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(KURSE).map((k) => (
            <div key={k.code} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-semibold">
                <span className="official-figure mr-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{k.code}-Kurs</span>
                {k.name}
              </p>
              <p className="mt-1 text-muted-foreground">{k.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Checklist items={CHOOSE} title="Choosing & applying — what to check" storageKey="studienkolleg-checklist" />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Library className="h-4 w-4 text-category-profile" aria-hidden /> Finding a Studienkolleg
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          State Studienkollegs are attached to specific universities and serve defined regions. Browse the
          national overview, then apply via the partner university for your chosen Kurs.
        </p>
        <a href={source("studienkolleg").url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          Studienkollegs overview <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/recognition" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Check your recognition first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/german-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Reach the German level <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Guidance only. Courses, regions, entrance-exam rules, and FSP subjects are set per Studienkolleg and
        change — confirm with the specific college and partner university.
      </p>

      <SourceList sources={[source("studienkolleg"), source("uniAssist"), source("anabin")]} />
    </div>
  );
}
