import { Link } from "react-router-dom";
import { Plane, Home, PlaneTakeoff, ArrowLeftRight, ShieldPlus, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ARRIVAL_TASKS, PRE_DEPARTURE } from "@/lib/seed/checklists";

/**
 * What to compare when moving money to Germany (gap G7-04). Fields only — no rates or FX margins are
 * shipped, because those are live, provider-specific figures we won't invent (CLAUDE.md §2). The
 * student fills these in from each provider's current quote.
 */
const MONEY_TRANSFER_FIELDS = [
  "Up-front fee per transfer",
  "Exchange-rate margin vs. the mid-market rate (often the bigger hidden cost)",
  "Transfer speed (same-day vs. several days)",
  "Sending & receiving limits, and whether the Sperrkonto/your German account accepts it",
];

/**
 * Pre-departure checklist — two phases as tabs: what to pack/arrange before the flight, and the
 * tasks that begin the moment you land. Each list persists its checked state via a storageKey
 * (localStorage now, Supabase-synced when signed in).
 */
export default function CampusPreDeparture() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 27 · Campus"
        title="Pre-departure checklist"
        description="Everything to arrange and pack before you fly — documents, money, tech, and first-week essentials."
        category="campus"
      />

      <Alert variant="info">
        <Plane aria-hidden />
        <AlertDescription>
          Pack the &ldquo;Before you fly&rdquo; list in your carry-on, not checked luggage — your
          passport, admission letter, blocked-account confirmation, and certificates are irreplaceable
          and may be checked on arrival. The &ldquo;First weeks&rdquo; tasks are time-sensitive:
          address registration (Anmeldung) is due within 14 days, and enrolment plus health insurance
          gate almost everything else.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pack">
        <TabsList>
          <TabsTrigger value="pack">Before you fly</TabsTrigger>
          <TabsTrigger value="arrive">First weeks</TabsTrigger>
        </TabsList>

        <TabsContent value="pack" className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Start this two to three weeks out. The required items are non-negotiable for entry and
            enrolment; the optional ones simply make the first days easier.
          </p>
          <Checklist items={PRE_DEPARTURE} title="Pre-departure" storageKey="pre-departure" />
        </TabsContent>

        <TabsContent value="arrive" className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Work through these in roughly this order — Anmeldung and a bank account unlock the
            residence permit, enrolment, and your transit ticket.
          </p>
          <Checklist items={ARRIVAL_TASKS} title="After arrival" storageKey="arrival-tasks" />
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="h-3.5 w-3.5" aria-hidden />
            Tip: book a temporary address for your first nights so you can register early.
          </p>
        </TabsContent>
      </Tabs>

      {/* ── G7-04 — travel, flights & moving money ───────────────────────────── */}
      <section aria-labelledby="pd-travel" className="space-y-4">
        <div>
          <h2 id="pd-travel" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <PlaneTakeoff className="h-5 w-5 text-category-campus" aria-hidden />
            Flights, forex & moving money
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Two avoidable, expensive mistakes happen here — booking flights too early and losing money in
            the exchange. Sequence them against your visa.
          </p>
        </div>

        <Alert variant="warning">
          <PlaneTakeoff aria-hidden />
          <AlertDescription>
            <strong>Don't book non-refundable flights before your visa is approved.</strong> Processing
            and appointment waits are unpredictable; hold off, or book a refundable/changeable fare, until
            you have the visa in hand.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="h-4 w-4 text-category-finance" aria-hidden />
              Compare money-transfer options before you move funds
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Moving your Sperrkonto top-up and first months' money is a real cost. We ship no rates —
              get a live quote from each provider and compare them on these fields:
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {MONEY_TRANSFER_FIELDS.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-category-finance" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Also carry a small amount of euros in cash for your very first day, and confirm your bank
              cards work abroad. Get a German SIM/eSIM sorted for arrival.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── G7-03 — entry-gap insurance reminder (full detail on the insurance page) ── */}
      <Alert variant="info">
        <ShieldPlus aria-hidden />
        <AlertDescription>
          <p className="font-medium">Mind the health-insurance entry gap.</p>
          <p className="mt-1 text-muted-foreground">
            Statutory student insurance usually starts only at enrolment, so you need incoming/travel
            health cover for the window between landing and Immatrikulation — don't arrive uninsured.
          </p>
          <p className="mt-2">
            <Link
              to="/finance/health-insurance"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              How the entry gap works <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
