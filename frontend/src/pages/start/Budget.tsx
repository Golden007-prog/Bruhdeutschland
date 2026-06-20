import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Landmark, Wallet } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SourceList } from "@/components/common/SourceLink";
import { computeJourneyBudget } from "@/lib/calc/journeyBudget";
import { CITY_PROFILES, formatEur } from "@/lib/calc/costOfLiving";
import { apsStatusFor } from "@/lib/country/country";
import { useProfile } from "@/lib/profile/useProfile";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-10 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/** Grounded defaults — every official figure carries a verify flag (CLAUDE.md §2/§3). */
const DEFAULTS = {
  apsFee: 225, // India APS, illustrative — confirm with the APS office
  uniAssistFirst: 75,
  uniAssistAdditional: 30,
  translationPerDoc: 40,
  visaFee: 75,
  blockedAccount: 11904, // 2026 Sperrkonto
};

function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
      {hint && <p className="text-[0.68rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Gap G04 — Total-journey budget. Deterministic end-to-end cost (one-time + blocked account +
 *  recurring living), prefilled from the profile and grounded official figures, all adjustable. */
export default function StartBudget() {
  const { profile } = useProfile();
  const apsRequired = apsStatusFor(profile.homeCountry).status === "required";
  const defaultMonths = profile.targetLevel === "bachelor" ? 36 : profile.targetLevel === "medicine" ? 72 : 24;

  const [city, setCity] = useState(CITY_PROFILES[CITY_PROFILES.length - 1].city);
  const [applications, setApplications] = useState(3);
  const [translationDocs, setTranslationDocs] = useState(4);
  const [months, setMonths] = useState(defaultMonths);
  const [apsFee, setApsFee] = useState(apsRequired ? DEFAULTS.apsFee : 0);
  const [flights, setFlights] = useState(500);
  const [deposit, setDeposit] = useState(1500);
  const [misc, setMisc] = useState(200);

  const cityProfile = CITY_PROFILES.find((c) => c.city === city) ?? CITY_PROFILES[CITY_PROFILES.length - 1];
  const monthlyCost = cityProfile.rent + cityProfile.food + cityProfile.transport + cityProfile.insurance + cityProfile.other;

  const result = useMemo(
    () =>
      computeJourneyBudget({
        apsFee,
        applications,
        uniAssistFirst: DEFAULTS.uniAssistFirst,
        uniAssistAdditional: DEFAULTS.uniAssistAdditional,
        translationDocs,
        translationPerDoc: DEFAULTS.translationPerDoc,
        visaFee: DEFAULTS.visaFee,
        flights,
        deposit,
        misc,
        blockedAccount: DEFAULTS.blockedAccount,
        monthlyCost,
        months,
      }),
    [apsFee, applications, translationDocs, flights, deposit, misc, monthlyCost, months],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Total-journey budget — one-time + recurring"
        description="The real end-to-end cost of studying in Germany: one-time fees, the blocked account you must show, and monthly living over your stay. Official figures are grounded; everything is adjustable."
      />

      <Disclaimer />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Inputs */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Your numbers</h2>
          <div className="space-y-1">
            <label htmlFor="bud-city" className="text-xs font-medium text-muted-foreground">City (sets monthly living)</label>
            <select id="bud-city" className={selectClass} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITY_PROFILES.map((c) => (
                <option key={c.city} value={c.city}>{c.city}</option>
              ))}
            </select>
            <p className="text-[0.68rem] text-muted-foreground">≈ {formatEur(monthlyCost)}/month (illustrative baseline)</p>
          </div>
          <NumberField id="bud-apps" label="Programmes via uni-assist" value={applications} onChange={setApplications} hint={`€${DEFAULTS.uniAssistFirst} first + €${DEFAULTS.uniAssistAdditional} each extra`} />
          <NumberField id="bud-trans" label="Documents to translate" value={translationDocs} onChange={setTranslationDocs} hint={`≈ €${DEFAULTS.translationPerDoc} per certified document`} />
          <NumberField id="bud-months" label="Months in Germany" value={months} onChange={setMonths} hint="e.g. 24 for a Master's" />
          <NumberField id="bud-aps" label="APS certificate fee (€)" value={apsFee} onChange={setApsFee} hint={apsRequired ? "Required for your country — verify the fee" : "Not required for your country"} />
          <NumberField id="bud-flights" label="Flights to Germany (€)" value={flights} onChange={setFlights} />
          <NumberField id="bud-deposit" label="Rental deposit / Kaution (€)" value={deposit} onChange={setDeposit} hint="Often 1–3 months' cold rent" />
          <NumberField id="bud-misc" label="Other one-time costs (€)" value={misc} onChange={setMisc} hint="Apostille, courier, SIM, medical…" />
        </section>

        {/* Results */}
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" aria-hidden /> Upfront cash to mobilise
              </p>
              <p className="official-figure mt-1 text-2xl font-bold">{formatEur(result.upfrontCash)}</p>
              <p className="mt-1 text-xs text-muted-foreground">One-time costs + the {formatEur(result.blockedAccount)} blocked account you must show before the visa.</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Landmark className="h-4 w-4" aria-hidden /> True cost over {months} months
              </p>
              <p className="official-figure mt-1 text-2xl font-bold">{formatEur(result.trueCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">One-time costs + living. Excludes the blocked account — that money is your own and is released back to you monthly.</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold">One-time costs</h3>
            <dl className="divide-y text-sm">
              {result.oneTime.map((line) => (
                <div key={line.key} className="flex items-center justify-between py-1.5">
                  <dt className="flex items-center gap-2">
                    {line.label}
                    {line.grounded && <Badge variant="outline" className="text-[0.6rem]">grounded</Badge>}
                    {line.needsVerification && <Badge variant="outline" className="text-[0.6rem] text-amber-700">verify</Badge>}
                  </dt>
                  <dd className="official-figure">{formatEur(line.amount)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between py-1.5 font-semibold">
                <dt>One-time total</dt>
                <dd className="official-figure">{formatEur(result.oneTimeTotal)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold">Blocked account &amp; living</h3>
            <dl className="divide-y text-sm">
              <div className="flex items-center justify-between py-1.5">
                <dt className="flex items-center gap-2">Blocked account (Sperrkonto) <Badge variant="outline" className="text-[0.6rem] text-amber-700">verify · 2026</Badge></dt>
                <dd className="official-figure">{formatEur(result.blockedAccount)}</dd>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <dt>Living ({formatEur(result.recurringMonthly)}/mo × {months})</dt>
                <dd className="official-figure">{formatEur(result.recurringTotal)}</dd>
              </div>
            </dl>
          </div>

          <Alert variant="info" className="text-xs">
            <Info aria-hidden />
            <AlertDescription>
              The blocked account is the largest single number but it is <strong>not a cost</strong> — it's
              your own money, paid in once and released to you (~{formatEur(992)}/month) after you arrive.
              Plan to <em>mobilise</em> it, not spend it.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Link to="/finance/cost-of-living" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Detailed cost-of-living <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Sperrkonto guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link to="/finance/scholarships" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Reduce it with scholarships <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>

      <SourceList sources={[source("studyFinance"), source("uniAssist"), source("autoVisaFaq"), source("daadCosts")]} />
    </div>
  );
}
