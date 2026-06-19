import { Banknote, IdCard, KeyRound, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { StepList } from "@/components/common/StepList";
import { Checklist } from "@/components/common/Checklist";
import { SourceLink } from "@/components/common/SourceLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ANMELDUNG_DAYS, ANMELDUNG_WINDOW } from "@/lib/facts";
import { ANMELDUNG_DOCS, ANMELDUNG_STEPS } from "@/lib/seed/visa";
import { source } from "@/lib/sources";

interface Unlock {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const UNLOCKS: Unlock[] = [
  {
    icon: Banknote,
    label: "German bank account",
    detail: "Most banks need your Meldebescheinigung before they will open a current account.",
  },
  {
    icon: IdCard,
    label: "Residence permit",
    detail: "The Ausländerbehörde requires proof of a registered address to issue your permit.",
  },
  {
    icon: KeyRound,
    label: "Enrolment & SIM contracts",
    detail: "Universities, mobile contracts, and many services ask for your registered address.",
  },
  {
    icon: Mail,
    label: "Tax ID (Steuer-ID)",
    detail: "Your tax identification number is sent to your registered address automatically.",
  },
];

/** Anmeldung walkthrough — registering your address at the Bürgeramt and why it matters. */
export default function VisaAnmeldung() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 26 · Visa"
        title="Anmeldung (address registration)"
        description="Walk through registering your address at the Bürgeramt after you arrive — the step that unlocks everything else."
        category="visa"
        fileRef="§ 26"
      />

      <Disclaimer />

      <OfficialFactRow fact={ANMELDUNG_WINDOW} />

      <Card>
        <CardHeader>
          <CardTitle>Why Anmeldung unlocks everything else</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Registering your address (Anmeldung) records you in the local population register and
            produces a <strong className="text-foreground">Meldebescheinigung</strong> — the
            confirmation almost every other step depends on. Do it within{" "}
            <span className="official-figure font-medium text-foreground">{ANMELDUNG_DAYS} days</span>{" "}
            of moving in.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {UNLOCKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex items-start gap-3 rounded-md border p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-card text-category-visa">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to register, step by step</CardTitle>
        </CardHeader>
        <CardContent>
          <StepList steps={ANMELDUNG_STEPS} />
        </CardContent>
      </Card>

      <Checklist items={ANMELDUNG_DOCS} title="What to bring to the Bürgeramt" storageKey="anmeldung-docs" />

      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Anmeldung is a legal obligation under Germany&apos;s Federal Registration Act
          (Bundesmeldegesetz). The {ANMELDUNG_DAYS}-day window is fixed nationally, but Bürgeramt
          appointment waits vary by city — book your Termin as soon as you have a move-in date.
        </p>
        <p className="mt-2">
          <SourceLink source={source("bundesmeldegesetz")} />
        </p>
      </div>
    </div>
  );
}
