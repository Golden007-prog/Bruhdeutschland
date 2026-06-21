import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SourceList } from "@/components/common/SourceLink";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import { uniAssistCost } from "@/lib/calc/journeyBudget";
import { formatEur } from "@/lib/calc/costOfLiving";
import type { TotalNeed } from "@/lib/calc/totalNeed";
import { APS_INDIA_FEE_EUR, UNIASSIST_ADDITIONAL_EUR, UNIASSIST_FIRST_EUR } from "@/lib/facts";
import { apsStatusFor } from "@/lib/country/country";
import { source } from "@/lib/sources";

const DEFAULTS = { uniAssistFirst: UNIASSIST_FIRST_EUR, uniAssistAdditional: UNIASSIST_ADDITIONAL_EUR, apsFee: APS_INDIA_FEE_EUR };

function Num({ id, label, value, onChange, hint }: { id: string; label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
      {hint && <p className="text-[0.68rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** G18 — Application-cost estimator: uni-assist + APS across the whole shortlist. */
export default function FinanceApplicationCosts() {
  const { profile } = useProfile();
  const apsRequired = apsStatusFor(profile.homeCountry).status === "required";
  const [shortlist] = useSyncedState<string[]>("programs:shortlist", []);

  const [applications, setApplications] = useState(Math.max(1, shortlist.length || 3));
  const [apsFee, setApsFee] = useState(apsRequired ? DEFAULTS.apsFee : 0);
  // The reconciled journey total (G6-05), if the budget page has computed it — shown read-only so this
  // application-phase bill is seen as part of one coherent total, not a contradicting island.
  const [journeyNeed] = useSyncedState<TotalNeed | null>("finance:totalNeed", null);

  const uniAssist = useMemo(() => uniAssistCost(applications, DEFAULTS.uniAssistFirst, DEFAULTS.uniAssistAdditional), [applications]);
  const total = uniAssist + apsFee;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G18 · Finance"
        title="Application-cost estimator"
        description="Before you apply, see the application phase's bill in one number: the uni-assist fees across your whole shortlist plus the one-time APS, if your country needs it."
        category="finance"
      />

      <Disclaimer />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Your numbers</h2>
          <Num id="ac-apps" label="Programmes via uni-assist" value={applications} onChange={setApplications} hint={`€${DEFAULTS.uniAssistFirst} first + €${DEFAULTS.uniAssistAdditional} each extra`} />
          <Num id="ac-aps" label="APS certificate fee (€)" value={apsFee} onChange={setApsFee} hint={apsRequired ? "Required for your country — verify the fee" : "Not required for your country"} />
          {shortlist.length > 0 && (
            <p className="text-xs text-muted-foreground">Prefilled from your <Link to="/profile/shortlist" className="underline">shortlist</Link> ({shortlist.length} programmes).</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Coins className="h-4 w-4" aria-hidden /> Application-phase total</p>
            <p className="official-figure mt-1 text-3xl font-bold">{formatEur(total)}</p>
          </div>
          <dl className="rounded-lg border bg-card p-4 text-sm">
            <div className="flex items-center justify-between py-1.5">
              <dt className="flex items-center gap-2">uni-assist ({applications} programme{applications === 1 ? "" : "s"}) <Badge variant="outline" className="text-xs text-amber-700">verify</Badge></dt>
              <dd className="official-figure">{formatEur(uniAssist)}</dd>
            </div>
            <div className="flex items-center justify-between border-t py-1.5">
              <dt className="flex items-center gap-2">APS certificate {apsRequired && <Badge variant="outline" className="text-xs text-amber-700">verify</Badge>}</dt>
              <dd className="official-figure">{formatEur(apsFee)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Some universities accept direct applications (free or with their own portal fee) instead of
          uni-assist — that can lower this. uni-assist's exact fees are set per cycle; verify before paying.
        </AlertDescription>
      </Alert>

      {journeyNeed && (
        <div className="rounded-lg border bg-card p-4 text-sm shadow-sm">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">This sits inside your reconciled <Link to="/start/budget" className="underline">journey total need</Link></span>
            <span className="official-figure font-semibold">{formatEur(journeyNeed.total)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            One figure across the budget and the <Link to="/finance/funding-plan" className="underline">funding-gap planner</Link>,
            so they can't silently disagree.
          </p>
        </div>
      )}

      <section className="flex flex-wrap gap-2">
        <Link to="/start/budget" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Full journey budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/uni-assist" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Uni-assist walkthrough <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("uniAssist"), source("aps")]} />
    </div>
  );
}
