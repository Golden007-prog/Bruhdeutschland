import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Coins, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { computeFundingPlan } from "@/lib/calc/fundingGap";
import { formatEur } from "@/lib/calc/costOfLiving";
import { cn } from "@/lib/utils";

function Num({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input id={id} type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
    </div>
  );
}

/** G32 — Funding-gap & affordability planner (deterministic). */
export default function FinanceFundingPlan() {
  const [savings, setSavings] = useState(0);
  const [family, setFamily] = useState(0);
  const [loan, setLoan] = useState(0);
  const [scholarshipMonthly, setScholarshipMonthly] = useState(0);
  const [workMonthly, setWorkMonthly] = useState(0);
  const [oneTime, setOneTime] = useState(15000);
  const [monthly, setMonthly] = useState(992);
  const [months, setMonths] = useState(24);

  const plan = useMemo(
    () => computeFundingPlan({ savings, family, loan, scholarshipMonthly, workMonthly }, { oneTime, monthly, months }),
    [savings, family, loan, scholarshipMonthly, workMonthly, oneTime, monthly, months],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G32 · Finance"
        title="Funding-gap & affordability planner"
        description="Stack everything you can mobilise — savings, family, loan, scholarship, expected work income — against the total cost, and see deterministically whether you're covered or short."
        category="finance"
      />

      <Disclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">What you can mobilise</h2>
          <div className="grid grid-cols-2 gap-3">
            <Num id="fp-savings" label="Savings (€)" value={savings} onChange={setSavings} />
            <Num id="fp-family" label="Family support (€)" value={family} onChange={setFamily} />
            <Num id="fp-loan" label="Loan (€)" value={loan} onChange={setLoan} />
            <Num id="fp-sch" label="Scholarship (€/mo)" value={scholarshipMonthly} onChange={setScholarshipMonthly} />
            <Num id="fp-work" label="Work income (€/mo)" value={workMonthly} onChange={setWorkMonthly} />
          </div>
          <h2 className="pt-2 text-sm font-semibold">What you need</h2>
          <div className="grid grid-cols-2 gap-3">
            <Num id="fp-onetime" label="One-time costs (€)" value={oneTime} onChange={setOneTime} />
            <Num id="fp-monthly" label="Living (€/mo)" value={monthly} onChange={setMonthly} />
            <Num id="fp-months" label="Months" value={months} onChange={setMonths} />
          </div>
          <p className="text-xs text-muted-foreground">Prefill totals from the <Link to="/start/budget" className="underline">journey budget</Link>.</p>
        </section>

        <section className="space-y-3">
          <div className={cn("rounded-lg border p-5 shadow-sm", plan.covered ? "border-emerald-300 bg-emerald-50/40" : "border-red-300 bg-red-50/40")}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {plan.covered ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <TriangleAlert className="h-4 w-4 text-red-600" aria-hidden />}
              {plan.covered ? "You're covered" : "Funding shortfall"}
            </p>
            <p className={cn("official-figure mt-1 text-3xl font-bold", plan.covered ? "text-emerald-700" : "text-red-700")}>
              {plan.covered ? `+${formatEur(plan.surplus)}` : `−${formatEur(plan.shortfall)}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{plan.covered ? "Buffer above the total need." : "You need to close this before the visa stage."}</p>
          </div>
          <dl className="rounded-lg border bg-card p-4 text-sm">
            <Row label="Lump sums (savings + family + loan)" value={formatEur(plan.lumpSum)} />
            <Row label={`Income over ${months} months`} value={formatEur(plan.incomeOverStay)} />
            <Row label="Total available" value={formatEur(plan.totalAvailable)} strong />
            <Row label="Total need" value={formatEur(plan.totalNeed)} strong />
          </dl>
          {!plan.covered && (
            <Alert variant="warning" className="text-sm">
              <AlertDescription>
                Close the gap with a <Link to="/finance/loans" className="underline">loan</Link>,{" "}
                <Link to="/finance/scholarships" className="underline">scholarships</Link>, or a{" "}
                <Link to="/finance/work" className="underline">student job</Link> — but remember the work-day limit.
              </AlertDescription>
            </Alert>
          )}
        </section>
      </div>

      <section className="flex flex-wrap gap-2">
        <Link to="/start/budget" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Journey budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/sperrkonto" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          <Coins className="h-3.5 w-3.5" aria-hidden /> Sperrkonto
        </Link>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between border-b py-1.5 last:border-0", strong && "font-semibold")}>
      <dt>{label}</dt>
      <dd className="official-figure">{value}</dd>
    </div>
  );
}
