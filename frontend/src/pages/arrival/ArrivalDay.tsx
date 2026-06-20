import { Link } from "react-router-dom";
import { ArrowRight, Backpack, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChecklistItemDef } from "@/lib/types";

const DAY_ONE: ChecklistItemDef[] = [
  { id: "docs", label: "Keep passport, visa, admission letter & insurance in your carry-on", hint: "Never in checked luggage." },
  { id: "cash", label: "Have some euros in cash for the first day", hint: "Not everywhere takes cards; small shops are often cash-only." },
  { id: "sim", label: "Get a SIM / eSIM for data", hint: "Prepaid SIMs are easy; an eSIM works the moment you land." },
  { id: "transport", label: "Plan airport → accommodation transport", hint: "Know the train/bus or book a transfer in advance." },
  { id: "stay", label: "Confirm your temporary accommodation & check-in time" },
];

const FIRST_DAYS: ChecklistItemDef[] = [
  { id: "anmeldung", label: "Book your Anmeldung appointment", hint: "Slots vanish fast in big cities — book the moment you have an address." },
  { id: "bank", label: "Start opening a bank account" },
  { id: "enrol", label: "Check your enrolment deadline and start the paperwork" },
  { id: "abh", label: "Note when to book the Ausländerbehörde for your residence permit", optional: true },
  { id: "transit", label: "Sort local transport / activate your Semesterticket", optional: true },
];

/** G37 — Arrival-day & first-72-hours planner. */
export default function ArrivalArrivalDay() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G37 · Arrival"
        title="Arrival-day & first-72-hours planner"
        description="The pre-departure list gets you on the plane; this gets you through landing and the first few days — in the right order, so nothing critical waits."
        category="campus"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The golden rule: <strong>get an address, then book the Anmeldung</strong>. Almost everything else
          (bank, residence permit, Rundfunkbeitrag) waits on those two.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={DAY_ONE} title={`Landing day`} storageKey="arrival-day-one" />
        <Checklist items={FIRST_DAYS} title="First few days" storageKey="arrival-first-days" />
      </div>

      <section className="flex flex-wrap gap-2">
        <Link to="/campus/pre-departure" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          <Backpack className="h-3.5 w-3.5" aria-hidden /> Pre-departure checklist
        </Link>
        <Link to="/arrival/anmeldung-runbook" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Anmeldung runbook <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Full arrival hub <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
