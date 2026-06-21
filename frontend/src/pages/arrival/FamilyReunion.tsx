import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CheckCircle2, Info, Languages, TriangleAlert, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { FAMILY_DOCS } from "@/lib/seed/arrival";
import {
  A1_EXEMPTIONS,
  checkSufficiency,
  FAMILY_REUNION_SOURCES,
  SOURCE_FR_SPOUSE,
} from "@/lib/seed/familyReunion";
import { formatEur } from "@/lib/calc/costOfLiving";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";
import { source } from "@/lib/sources";

const QUALIFY = [
  "Your spouse / registered partner, and minor (under-18) children, are the usual eligible family members.",
  "You generally need to show adequate housing for the larger household and enough income/means to support them without state help.",
  "A spouse may need basic German (A1) before joining — exemptions exist (e.g. for certain qualifications); verify for your case.",
  "Family members get a residence permit tied to yours; a spouse can usually work without restriction.",
];

/** G45 — Family reunion (Familiennachzug) guide. Personalised by the profile's dependents field. */
export default function ArrivalFamilyReunion() {
  const { profile } = useProfile();
  const hasDependents = profile.dependents === "spouse" || profile.dependents === "spouse_children";

  // G9-04: deterministic income-sufficiency self-check. Both numbers are the USER's own — we ship
  // no official threshold (it's volatile + case-specific); the math (income ≥ need) runs in code.
  const [netIncome, setNetIncome] = useSyncedState<number>("family:netIncome", 0);
  const [monthlyNeed, setMonthlyNeed] = useSyncedState<number>("family:monthlyNeed", 0);
  const sufficiency = useMemo(() => checkSufficiency({ netIncome, monthlyNeed }), [netIncome, monthlyNeed]);
  const hasEntered = netIncome > 0 && monthlyNeed > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G45 · Ongoing"
        title="Bringing your family (Familiennachzug)"
        description="If a spouse or children join you in Germany, the family-reunion route has its own visa, income and housing expectations, and documents. Here's how to plan it."
        category="visa"
      />

      <Disclaimer />

      {hasDependents ? (
        <Alert variant="info" className="text-sm">
          <Users aria-hidden />
          <AlertDescription>
            Your profile lists <strong>{profile.dependents === "spouse_children" ? "a spouse and children" : "a spouse"}</strong> —
            this route applies to you. Factor their costs into your budget and start the housing/income proof early.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Planning to bring family later? Set your dependents in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> and the budget and finance
            tools will account for them.
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Who qualifies & what's expected</h2>
        <ul className="mt-2 space-y-2">
          {QUALIFY.map((q) => (
            <li key={q} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── G9-04: income-sufficiency self-check (deterministic, no shipped threshold) ── */}
      <section aria-labelledby="suff-heading" className="space-y-3">
        <div>
          <h2 id="suff-heading" className="text-lg font-semibold tracking-tight">
            Income-sufficiency self-check
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The decision usually turns on whether you can support the larger household{" "}
            <strong>without public funds</strong>. We don't ship the official figure — it changes and is
            case-specific — so enter your own numbers and we'll do the comparison.
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="fr-income" className="text-sm font-medium">Your net monthly income (€)</label>
            <Input id="fr-income" type="number" min={0} inputMode="numeric" value={netIncome || ""} onChange={(e) => setNetIncome(Math.max(0, Number(e.target.value) || 0))} placeholder="e.g. 2200" />
          </div>
          <div className="space-y-1">
            <label htmlFor="fr-need" className="text-sm font-medium">Household's monthly need incl. rent (€)</label>
            <Input id="fr-need" type="number" min={0} inputMode="numeric" value={monthlyNeed || ""} onChange={(e) => setMonthlyNeed(Math.max(0, Number(e.target.value) || 0))} placeholder="e.g. 1900" />
            <p className="text-xs text-muted-foreground">
              Estimate from a <Link to="/finance/cost-of-living" className="underline">cost-of-living</Link> figure for the larger family.
            </p>
          </div>
        </div>

        {hasEntered && (
          <section className={cn("rounded-lg border p-5 shadow-sm", sufficiency.covered ? "border-emerald-300 bg-emerald-50/40" : "border-amber-300 bg-amber-50/40")}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {sufficiency.covered ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <TriangleAlert className="h-4 w-4 text-amber-600" aria-hidden />}
              {sufficiency.covered ? "Income covers the estimated need" : "Income is short of the estimated need"}
            </p>
            <p className={cn("official-figure mt-1 text-2xl font-bold", sufficiency.covered ? "text-emerald-700" : "text-amber-700")}>
              {sufficiency.covered ? `+${formatEur(sufficiency.surplus)} / month surplus` : `${formatEur(sufficiency.surplus)} / month short`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This is a structural self-check only. The binding minimum (and how housing size factors in)
              is set by the authority and changes — confirm it for your household. <SourceLink source={SOURCE_FR_SPOUSE} />
            </p>
          </section>
        )}

        <Alert variant="warning" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            The official income/means and adequate-housing thresholds for family reunion are{" "}
            <strong>not shipped here</strong> because they change and depend on your household — verify
            the current figures before relying on this self-check.
          </AlertDescription>
        </Alert>
      </section>

      {/* ── G9-04: A1-before-arrival exemptions ───────────────────────────────── */}
      <section aria-labelledby="a1-heading" className="space-y-3">
        <div>
          <h2 id="a1-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Languages className="h-5 w-5 text-category-visa" aria-hidden /> Who is exempt from the A1-before-arrival German rule
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A joining spouse often needs basic German (A1) before arriving — but several categories are
            commonly exempt. Eligibility is decided per case, so confirm yours.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {A1_EXEMPTIONS.map((e) => (
            <div key={e.id} className="rounded-lg border bg-card p-4 text-sm shadow-sm">
              <p className="flex items-start gap-2 font-medium">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {e.category}
              </p>
              <p className="mt-1.5 text-muted-foreground">{e.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          These exemption categories are grounded but applied case-by-case — verify your situation with
          the mission / Ausländerbehörde. <SourceLink source={SOURCE_FR_SPOUSE} />
        </p>
      </section>

      <Checklist items={FAMILY_DOCS} title="Family-reunion documents" storageKey="arrival-family" />

      <section className="flex flex-wrap gap-2">
        <Link to="/start/budget" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Re-check your budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/visa/accommodation" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find larger housing <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[...FAMILY_REUNION_SOURCES, source("bamf")]} />
    </div>
  );
}
