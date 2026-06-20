import { Info, Radio } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RUNDFUNK_FEE } from "@/lib/seed/arrival";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";

const UTILITIES: ChecklistItemDef[] = [
  { id: "rundfunk", label: "Register for the Rundfunkbeitrag", hint: "One fee per dwelling; register at rundfunkbeitrag.de after your Anmeldung." },
  { id: "liability", label: "Private liability insurance (Haftpflichtversicherung)", hint: "Not mandatory but near-universal in Germany — very cheap, covers accidental damage." },
  { id: "electricity", label: "Electricity contract (Strom)", hint: "If not included in rent — you usually choose a provider yourself.", optional: true },
  { id: "internet", label: "Home internet / mobile (Handyvertrag)", optional: true },
  { id: "household", label: "Household / contents insurance", optional: true },
];

/** G43 — Rundfunkbeitrag & utilities setup. */
export default function ArrivalRundfunkbeitrag() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G43 · Arrival"
        title="Rundfunkbeitrag & utilities setup"
        description="The bills that blindside new arrivals — starting with the mandatory broadcasting fee charged to every household, plus the utilities and insurance everyone sets up in the first month."
        category="finance"
      />

      <Alert variant="warning" className="text-sm">
        <Radio aria-hidden />
        <AlertDescription>
          The <strong>Rundfunkbeitrag is mandatory and per dwelling</strong>, not per person or per TV — you
          owe it even without a television. You'll get a letter after registering your address; flatmates
          share a single fee, so coordinate who registers.
        </AlertDescription>
      </Alert>

      <OfficialFactRow fact={RUNDFUNK_FEE} />

      <Checklist items={UTILITIES} title="Set-up checklist" storageKey="arrival-utilities" />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Students on certain benefits (e.g. BAföG) can apply for an exemption (Befreiung) — most
          international students don't qualify, but check if you receive German state support.
        </AlertDescription>
      </Alert>

      <SourceList sources={[source("rundfunkbeitrag"), source("makeItInGermany")]} />
    </div>
  );
}
