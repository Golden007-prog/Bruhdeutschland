import { Link } from "react-router-dom";
import { ArrowRight, Info, Receipt } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";

const SETUP: ChecklistItemDef[] = [
  { id: "tax-id", label: "Tax ID (Steuer-Identifikationsnummer)", hint: "Arrives by post after your Anmeldung; give it to your employer." },
  { id: "bank", label: "German bank account for salary" },
  { id: "social", label: "Social-insurance number (Sozialversicherungsnummer)", hint: "Your employer or health insurer can help you get it." },
  { id: "contract", label: "Signed work contract (check the working-hours limit)" },
  { id: "health", label: "Confirm health-insurance status as a working student" },
];

const KNOW = [
  { name: "Tax class (Steuerklasse)", detail: "Single students are usually class I. It sets how much wage tax is withheld; you may get some back via a tax return." },
  { name: "Werkstudent privilege", detail: "As a working student you're often exempt from some social contributions if you work within the hour limits during term." },
  { name: "Mini-job vs Werkstudent", detail: "A mini-job (low monthly cap) has simpler taxation; a Werkstudent role can pay more but has its own rules." },
  { name: "Work-day limit still applies", detail: "Non-EU students remain bound by the 140-full / 280-half-day annual limit — track it." },
];

/** G49 — Tax-ID & first-job onboarding. */
export default function ArrivalTaxId() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G49 · Ongoing"
        title="Tax-ID & first-job onboarding"
        description="Your first German job means a tax ID, a tax class, and social-contribution rules. Here's what to set up and what to expect on your payslip — so the admin doesn't slow down your start."
        category="campus"
      />

      <Disclaimer />

      <Checklist items={SETUP} title="Set these up" storageKey="arrival-taxid-setup" />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4 text-category-campus" aria-hidden /> What to understand</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {KNOW.map((k) => (
            <div key={k.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{k.name}</p>
              <p className="mt-1 text-muted-foreground">{k.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Tax rules are individual. For anything beyond the basics, a Lohnsteuerhilfeverein or tax adviser is
          worth it — and a simple annual tax return often refunds over-withheld wage tax.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/work-days" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Work-day limit tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/work" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Werkstudent rules <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("daadSideJobs"), source("makeItInGermany")]} />
    </div>
  );
}
