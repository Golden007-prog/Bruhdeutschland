import { Link } from "react-router-dom";
import { ArrowRight, Info, Landmark } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BANK_DOCS } from "@/lib/seed/arrival";
import { source } from "@/lib/sources";

const TYPES = [
  { name: "Girokonto (current account)", detail: "The everyday account for rent (SEPA direct debit), salary, and card payments. You generally need one for your residence permit and for receiving your Sperrkonto payouts." },
  { name: "Student current account", detail: "Many banks waive fees for students up to a certain age. Bring your enrolment certificate to qualify." },
  { name: "Online / neobank account", detail: "Fast to open with a passport and sometimes before Anmeldung — but check it issues a German IBAN and accepts your Sperrkonto/landlord direct debits." },
];

const ORDER = [
  "Register your address (Anmeldung) — most traditional banks require the Meldebescheinigung first.",
  "Choose an account type and book an appointment (or open online with video ID).",
  "Open the account and link it to your Sperrkonto provider so your monthly allowance is released to it.",
  "Set up direct debits for rent, insurance, and the Rundfunkbeitrag once your IBAN is active.",
];

/** G38 — German bank account guide. */
export default function ArrivalBankAccount() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G38 · Arrival"
        title="Opening a German bank account"
        description="The account that unblocks your Sperrkonto payouts, your rent, and your salary. Here's which type to open, what to bring, and the order to do it in."
        category="finance"
      />

      <Disclaimer />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          A German <strong>IBAN current account (Girokonto)</strong> is what landlords, employers, and your
          blocked-account provider expect. Open it early — several other steps wait on it.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={BANK_DOCS} title="What to bring" storageKey="arrival-bank" />
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-category-finance" aria-hidden /> The order to do it in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {ORDER.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Which account?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <div key={t.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-muted-foreground">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Sperrkonto guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/anmeldung-runbook" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Do Anmeldung first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Banks set their own requirements and fees — confirm with the specific bank before opening an account.
      </p>

      <SourceList sources={[source("bankAccount"), source("makeItInGermany")]} />
    </div>
  );
}
