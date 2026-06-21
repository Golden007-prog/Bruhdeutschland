import { Link } from "react-router-dom";
import { ArrowRight, Info, Landmark, RefreshCcw, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BANK_DOCS } from "@/lib/seed/arrival";
import { source } from "@/lib/sources";

/** Common rejection / deadlock causes → a workaround. Practical guidance, not bank policy (G8-02). */
const REJECTIONS = [
  {
    cause: "“We need your Anmeldung first” — but you need a bank to pay rent",
    fix: "Break the circle with an address-free online/neobank account that opens on your passport (often before Anmeldung) and issues a German IBAN. Use it to pay the deposit/rent, register your address, then — if you prefer — open a traditional account later.",
  },
  {
    cause: "No Schufa / no credit history yet",
    fix: "A basic current account (Girokonto / Basiskonto) does not require a Schufa score — you're entitled to a basic payment account. Overdrafts and some premium cards do; skip those at first and add them once you have a history.",
  },
  {
    cause: "Neobank KYC / video-ID verification rejected",
    fix: "Video-ID can fail on lighting, a glare-covered passport page, or a name-format mismatch. Retry in good light with the original document, ensure the name matches your passport exactly, or switch to a provider that offers in-branch (PostIdent) verification.",
  },
  {
    cause: "Your Sperrkonto provider's own current account is offered",
    fix: "Several blocked-account providers bundle a current account that opens before arrival. It's a valid bridge to receive your monthly Sperrkonto release while you sort a long-term account.",
  },
];

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

      {/* ── G8-02: the Anmeldung ↔ bank ↔ address deadlock ────────────────────── */}
      <section aria-labelledby="rejection-heading" className="space-y-3">
        <div>
          <h2 id="rejection-heading" className="text-lg font-semibold tracking-tight">
            When the bank says no — breaking the circular dependency
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The classic trap: the bank wants your Anmeldung, the Anmeldung wants an address, and the
            landlord wants a deposit you can't pay without a bank. Here's how to break it.
          </p>
        </div>

        <Alert variant="warning" className="text-sm">
          <RefreshCcw aria-hidden />
          <AlertTitle>Open an address-free account first</AlertTitle>
          <AlertDescription>
            An online/neobank account that opens on your passport and issues a{" "}
            <strong>German IBAN</strong> is the usual way out — it lets you pay rent and register your
            address, after which any traditional bank will open an account for you.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 sm:grid-cols-2">
          {REJECTIONS.map((r) => (
            <div key={r.cause} className="rounded-lg border bg-card p-4 text-sm shadow-sm">
              <p className="flex items-start gap-2 font-medium">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                {r.cause}
              </p>
              <p className="mt-2 text-muted-foreground">{r.fix}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Acceptance rules and which documents a bank accepts vary by bank — confirm with the specific
          provider. We don't reproduce any bank's policy here.
        </p>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Sperrkonto guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/anmeldung-runbook" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Do Anmeldung first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/visa/accommodation" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          No address yet? <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Banks set their own requirements and fees — confirm with the specific bank before opening an account.
      </p>

      <SourceList sources={[source("bankAccount"), source("makeItInGermany")]} />
    </div>
  );
}
