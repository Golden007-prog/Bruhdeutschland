import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Landmark } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SourceList } from "@/components/common/SourceLink";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { SPERRKONTO_AMOUNT, SPERRKONTO_YEAR_EUR } from "@/lib/facts";
import { formatEur } from "@/lib/calc/costOfLiving";
import { source } from "@/lib/sources";

const REQUIRED = SPERRKONTO_YEAR_EUR; // single source of truth — see SPERRKONTO_AMOUNT fact below

const FACTORS = [
  { name: "Mission acceptance", detail: "The single most important check — your German embassy must accept the provider. Confirm on its page before opening." },
  { name: "Setup speed", detail: "Some open online in days with video-ID; others need posted documents. Speed matters for the visa." },
  { name: "Opening & monthly fees", detail: "A one-time setup fee plus a small monthly account fee — compare the all-in cost." },
  { name: "Payout & refund", detail: "How your monthly allowance is released, and how easily the balance is refunded if plans change." },
];

/** G30 — Sperrkonto provider comparison framework + funding-progress tracker. */
export default function FinanceSperrkontoProviders() {
  const [funded, setFunded] = useSyncedState<number>("sperrkonto:funded", 0);
  const [draft, setDraft] = useState(String(funded || ""));
  // Keep the field in sync when `funded` changes outside this input (cross-tab / cloud sync). While the
  // user types, only `draft` changes, so this never fights live editing (qa COR-9).
  useEffect(() => setDraft(funded ? String(funded) : ""), [funded]);

  const pct = Math.min(100, Math.round((funded / REQUIRED) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G30 · Finance"
        title="Sperrkonto provider comparison"
        description="The blocked account is a visa prerequisite. We won't rank specific brands by invented numbers — instead, compare providers on what matters and track your own funding toward the required amount."
        category="finance"
      />

      <Disclaimer />

      <OfficialFactRow fact={SPERRKONTO_AMOUNT} />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Landmark className="h-4 w-4 text-category-finance" aria-hidden /> Your funding progress</h2>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="spk-funded" className="text-xs font-medium text-muted-foreground">Funded so far (€)</label>
            <Input
              id="spk-funded"
              type="number"
              min={0}
              className="w-40"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => setFunded(Math.max(0, Number(draft) || 0))}
            />
          </div>
          <p className="official-figure text-sm text-muted-foreground">{formatEur(funded)} / {formatEur(REQUIRED)}</p>
        </div>
        <Progress value={pct} label={`Sperrkonto funded ${pct}%`} className="mt-3 h-2" />
        <p className="mt-1 text-xs text-muted-foreground">Target is the 2026 amount above — verify the current figure with your mission.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Compare providers on these</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FACTORS.map((f) => (
            <div key={f.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{f.name}</p>
              <p className="mt-1 text-muted-foreground">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Always confirm provider acceptance on your specific German mission's website — a cheaper account
          your embassy won't accept is worthless.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          What a Sperrkonto is <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/funding-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Funding plan <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("autoSperrkonto"), source("studyFinance")]} />
    </div>
  );
}
