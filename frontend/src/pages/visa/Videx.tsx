import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, FileText, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";

const SECTIONS = [
  { name: "Personal data", detail: "Exactly as in your passport — names, date/place of birth, nationality. Mismatches cause rejections." },
  { name: "Passport details", detail: "Number, issue/expiry — your passport must stay valid well beyond your intended stay." },
  { name: "Purpose of stay", detail: 'Choose "Studium" (study) and the correct sub-purpose; this drives the document list.' },
  { name: "Duration & funding", detail: "Intended stay and how you'll finance it (Sperrkonto / scholarship / sponsor)." },
  { name: "Address in Germany", detail: "Your future or temporary address; use the university or a booked stay if unsure." },
];

const HAVE_OPEN: ChecklistItemDef[] = [
  { id: "passport", label: "Passport" },
  { id: "admission", label: "Admission letter (or applicant details)" },
  { id: "finance", label: "Sperrkonto / financing proof" },
  { id: "address", label: "An address in Germany (or temporary)" },
  { id: "insurance", label: "Health-insurance details" },
];

/** G35 — VIDEX visa-form walkthrough. */
export default function VisaVidex() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G35 · Visa"
        title="VIDEX visa-form walkthrough"
        description="Most national (D) visa applications start with the online VIDEX form. Fill it carefully — small inconsistencies with your passport or documents cause avoidable delays."
        category="visa"
      />

      <Disclaimer />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Fill VIDEX online, then print and sign it. Enter everything <strong>exactly</strong> as in your
          passport and documents — the mission cross-checks them.
        </AlertDescription>
      </Alert>

      <Checklist items={HAVE_OPEN} title="Have these open before you start" storageKey="videx-have-open" />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-category-visa" aria-hidden /> Section by section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
        <a href={source("autoVisa").url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          Official visa portal (find your mission's VIDEX link) <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/visa/checklist" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Visa document checklist <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/visa/appointment" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Track your appointment <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. The exact VIDEX flow and required fields are set by the Federal Foreign Office and your mission — follow their instructions.</p>

      <SourceList sources={[source("autoVisa"), source("autoVisaFaq")]} />
    </div>
  );
}
