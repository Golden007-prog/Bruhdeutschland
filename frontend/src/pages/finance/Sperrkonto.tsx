import { Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { StepList } from "@/components/common/StepList";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SPERRKONTO_AMOUNT } from "@/lib/facts";
import { source } from "@/lib/sources";
import { BLOCKED_ACCOUNT_PROVIDERS } from "@/lib/seed/finance";
import type { ProcessStep } from "@/lib/types";

const OPEN_STEPS: ProcessStep[] = [
  {
    id: "sk-choose",
    title: "Choose a blocked-account provider",
    detail:
      "Pick a digital provider or a bank account that your German mission accepts as proof of financing. Compare opening fees, monthly fees, and how fast it can be set up.",
    durationHint: "1–2 days",
  },
  {
    id: "sk-open",
    title: "Open the account online and verify your identity",
    detail:
      "Apply with your passport and complete identity verification (often a video or photo ID check). You receive the blocked-account details once approved.",
    durationHint: "A few days",
  },
  {
    id: "sk-transfer",
    title: "Transfer the required amount",
    detail:
      "Send the full annual amount (or your mission's accepted equivalent) into the account. An international transfer can take several business days to arrive.",
    durationHint: "3–7 days",
    source: source("autoSperrkonto"),
    needsVerification: true,
  },
  {
    id: "sk-confirm",
    title: "Download your confirmation of financing",
    detail:
      "Once funded, the provider issues a confirmation document. This is the proof of financial resources you submit with your student-visa application.",
    durationHint: "Same day",
    source: source("studyFinance"),
    needsVerification: true,
  },
  {
    id: "sk-monthly",
    title: "After arrival: receive your monthly payout",
    detail:
      "The account unblocks a fixed monthly amount to your German current account once you have registered and enrolled. Set up a German bank account after your Anmeldung.",
    durationHint: "Each month",
  },
];

interface Alternative {
  title: string;
  detail: string;
}

const ALTERNATIVES: Alternative[] = [
  {
    title: "Scholarship award",
    detail:
      "A recognised scholarship (e.g. DAAD) that covers your living costs can serve as proof of financing instead of a blocked account. The award letter must state the amount and duration.",
  },
  {
    title: "Declaration of commitment (Verpflichtungserklärung)",
    detail:
      "A sponsor in Germany formally commits at the Ausländerbehörde to cover your costs. They must prove sufficient income; the missions assess these case by case.",
  },
  {
    title: "Parents' proof of income",
    detail:
      "Some missions accept evidence of your parents' income and assets in place of (or alongside) a blocked account. What is accepted varies widely by mission.",
  },
  {
    title: "Bank guarantee from a German bank",
    detail:
      "A guarantee (Bankbürgschaft) from a bank in Germany can be accepted as security for your living costs. This is less common and depends on the bank and the mission.",
  },
];

/** Feature 17 — Blocked account (Sperrkonto) guide. */
export default function FinanceSperrkonto() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 17 · Finance"
        title="Blocked account (Sperrkonto) guide"
        description="A blocked account is how most students prove they can cover their living costs for the first year — a core requirement for the student visa."
        category="finance"
        fileRef="§ 17"
      />

      <Disclaimer />

      <OfficialFactRow fact={SPERRKONTO_AMOUNT} />

      <section aria-labelledby="sk-what" className="space-y-3">
        <h2 id="sk-what" className="text-lg font-semibold tracking-tight">
          How a blocked account works
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          You deposit roughly a year of living costs into an account you cannot freely access. After
          you arrive and enrol, the account releases a fixed amount to you each month. The deposit
          confirms to the visa office that you can support yourself without working illegally. The
          required amount is tied to the German BAföG maintenance rate and is reviewed yearly, so
          confirm the current figure with your mission before you transfer money.
        </p>
      </section>

      <section aria-labelledby="sk-open" className="space-y-3">
        <h2 id="sk-open" className="text-lg font-semibold tracking-tight">
          Opening a blocked account
        </h2>
        <Card>
          <CardContent className="pt-6">
            <StepList steps={OPEN_STEPS} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="sk-alternatives" className="space-y-3">
        <h2 id="sk-alternatives" className="text-lg font-semibold tracking-tight">
          Alternatives to a blocked account
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A blocked account is the most common route, but it is not the only accepted proof of
          financing. Which alternatives your mission accepts varies — check the requirements for your
          specific German mission before relying on any of these.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ALTERNATIVES.map((alt) => (
            <Card key={alt.title}>
              <CardHeader>
                <CardTitle className="text-base">{alt.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{alt.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="sk-providers" className="space-y-3">
        <h2 id="sk-providers" className="text-lg font-semibold tracking-tight">
          Commonly used providers
        </h2>
        <Alert variant="warning">
          <Info aria-hidden />
          <AlertTitle>Not an endorsement</AlertTitle>
          <AlertDescription>
            These are providers students commonly encounter, listed neutrally and not exhaustively.
            DeutschPrep does not recommend any provider. Fees, processing times, and whether a given
            account is accepted by your mission all vary — verify directly with the provider and your
            German mission before paying.
          </AlertDescription>
        </Alert>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BLOCKED_ACCOUNT_PROVIDERS.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div className="min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Option
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <SourceList sources={[source("studyFinance"), source("autoSperrkonto")]} />
    </div>
  );
}
