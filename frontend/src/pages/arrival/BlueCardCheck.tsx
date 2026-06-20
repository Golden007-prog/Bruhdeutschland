import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Gauge, Info, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { checkBlueCard } from "@/lib/immigration/blueCard";
import { isShortageOccupation } from "@/lib/career/fields";
import { BLUE_CARD_THRESHOLD } from "@/lib/facts";
import { formatEur } from "@/lib/calc/costOfLiving";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";

/** Long-game §3 — EU Blue Card salary-threshold checker (deterministic, grounded 2026). */
export default function ArrivalBlueCardCheck() {
  const { profile } = useProfile();
  const [salary, setSalary] = useState(50000);
  const [field, setField] = useState(profile.targetField || profile.currentDegree || "");
  const [recentGraduate, setRecentGraduate] = useState(true);
  const [shortageOverride, setShortageOverride] = useState<boolean | null>(null);

  const detectedShortage = isShortageOccupation(field);
  const shortage = shortageOverride ?? detectedShortage;

  const result = useMemo(
    () => checkBlueCard({ grossSalary: salary, shortageOccupation: shortage, recentGraduate }),
    [salary, shortage, recentGraduate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Long game · Tool"
        title="EU Blue Card eligibility check"
        description="Enter an expected gross salary and your field. We compare it against the current 2026 thresholds — the lower one applies to shortage occupations, STEM, and recent graduates (within 3 years)."
        category="visa"
      />

      <Disclaimer />

      <OfficialFactRow fact={BLUE_CARD_THRESHOLD} />

      <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="bc-salary" className="text-sm font-medium">Expected annual gross salary (€)</label>
          <Input id="bc-salary" type="number" min={0} inputMode="numeric" value={salary} onChange={(e) => setSalary(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div className="space-y-1">
          <label htmlFor="bc-field" className="text-sm font-medium">Field / occupation</label>
          <Input id="bc-field" value={field} onChange={(e) => { setField(e.target.value); setShortageOverride(null); }} placeholder="Software Engineering" />
          <p className="text-xs text-muted-foreground">
            Detected: {detectedShortage ? "shortage occupation" : "not auto-detected as a shortage occupation"}.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recentGraduate} onChange={(e) => setRecentGraduate(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          I graduated within the last 3 years
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={shortage} onChange={(e) => setShortageOverride(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          Treat as a shortage occupation
        </label>
      </section>

      <section className={cn("rounded-lg border p-5 shadow-sm", result.eligible ? "border-emerald-300 bg-emerald-50/40" : result.borderline ? "border-amber-300 bg-amber-50/40" : "border-red-300 bg-red-50/40")}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {result.eligible ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <Gauge className="h-4 w-4" aria-hidden />}
          {result.thresholdKind === "reduced" ? "Reduced threshold applies" : "Standard threshold applies"}
          {result.reasons.length > 0 && <span className="font-normal">· {result.reasons.join(" + ")}</span>}
        </p>
        <p className={cn("official-figure mt-1 text-2xl font-bold", result.eligible ? "text-emerald-700" : result.borderline ? "text-amber-700" : "text-red-700")}>
          {result.eligible ? "Likely meets the Blue Card salary bar" : result.borderline ? "Just below — close" : "Below the threshold"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Threshold: <span className="official-figure">{formatEur(result.threshold)}</span>.{" "}
          {result.eligible ? "Your figure clears it (verify the live threshold + your contract)." : `You'd need about ${formatEur(result.gap)} more gross per year.`}
        </p>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The Blue Card is the <strong>fast track to permanent residence</strong> (21 months with B1, 27
          without). Salary isn't the only condition — you also need a recognised degree and a matching job.
          Confirm the current threshold and rules before relying on this.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/immigration-pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          The full immigration ladder <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/pr-citizenship" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          PR & citizenship timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {!result.eligible && (
          <Link to="/career/outcomes" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Higher-paying fields
          </Link>
        )}
      </section>
    </div>
  );
}
