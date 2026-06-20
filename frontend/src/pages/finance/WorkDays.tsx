import { useMemo, useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { computeWorkDayBudget, type WorkDayEntry } from "@/lib/calc/workDays";
import { WORK_LIMIT } from "@/lib/facts";
import { uid } from "@/lib/doc/export";

/** G33 — deterministic work-day limit tracker (140 full / 280 half days a year for non-EU students). */
export default function FinanceWorkDays() {
  const [entries, setEntries] = useSyncedState<WorkDayEntry[]>("work:days", []);
  const [month, setMonth] = useState("");
  const [full, setFull] = useState(0);
  const [half, setHalf] = useState(0);

  const budget = useMemo(() => computeWorkDayBudget(entries), [entries]);

  const add = () => {
    if (!month && full <= 0 && half <= 0) return;
    setEntries((prev) => [...prev, { id: uid("wd"), month: month || "—", fullDays: Math.max(0, full), halfDays: Math.max(0, half) }]);
    setMonth("");
    setFull(0);
    setHalf(0);
  };
  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G33 · Finance"
        title="Work-day limit tracker (140 / 280)"
        description="Non-EU students may work a limited number of days a year on a study permit. Log your days here and we tally them deterministically against the cap so you never breach your permit."
        category="finance"
      />

      <Disclaimer />

      <OfficialFactRow fact={WORK_LIMIT} />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Used this year</p>
            <p className="official-figure text-2xl font-bold">
              {budget.used} <span className="text-base font-normal text-muted-foreground">/ {budget.fullCap} full-day units</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{budget.totalFull} full + {budget.totalHalf} half days · {budget.remaining} units left</p>
          </div>
          {budget.exhausted && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-900">Limit reached</span>}
        </div>
        <Progress value={Math.min(100, budget.percent)} label={`Work-day budget ${budget.percent}% used`} className="mt-3 h-2" indicatorClassName={budget.exhausted ? "bg-red-500" : budget.percent > 80 ? "bg-amber-500" : undefined} />
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Log days</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="space-y-1">
            <label htmlFor="wd-month" className="text-xs font-medium text-muted-foreground">Month</label>
            <Input id="wd-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="wd-full" className="text-xs font-medium text-muted-foreground">Full days</label>
            <Input id="wd-full" type="number" min={0} className="w-24" value={full} onChange={(e) => setFull(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="space-y-1">
            <label htmlFor="wd-half" className="text-xs font-medium text-muted-foreground">Half days</label>
            <Input id="wd-half" type="number" min={0} className="w-24" value={half} onChange={(e) => setHalf(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="flex items-end">
            <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
          </div>
        </div>

        {entries.length > 0 && (
          <ul className="mt-4 space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 rounded-md border bg-card p-2.5 text-sm">
                <span className="official-figure">{e.month}</span>
                <span className="text-muted-foreground">{e.fullDays} full · {e.halfDays} half</span>
                <button type="button" onClick={() => remove(e.id)} aria-label={`Remove ${e.month} entry`} className="rounded text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          A half day is up to ~4 hours; 280 half days = 140 full days — the same budget two ways. University
          student-assistant (HiWi) jobs are generally unrestricted. Confirm your exact residence-permit
          conditions, which override the general rule.
        </AlertDescription>
      </Alert>
    </div>
  );
}
