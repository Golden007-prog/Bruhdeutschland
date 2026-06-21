import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import {
  COMMON_SCALES,
  convertToGermanGpa,
  formatGermanGrade,
  gradeTier,
  type GradeScale,
} from "@/lib/calc/gpa";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

/**
 * G1-1 — Grade-scenario simulator. The existing Profile evaluation converts the user's OWN entered grade;
 * this answers "what if I score X%?" A Class-12 student planning results, or a Bangladesh applicant
 * estimating a final CGPA, sweeps a % / CGPA and sees the German grade (deterministic, Modified Bavarian)
 * and an INDICATIVE, NON-BINDING competitiveness tier. Tiers are orientation only — binding cut-offs are
 * set by the university / anabin (CLAUDE.md golden rule #2). No official threshold is asserted.
 */

const SCALE_OPTIONS: { key: keyof typeof COMMON_SCALES; min: number; max: number; step: number; unit: string }[] = [
  { key: "percent", min: 40, max: 100, step: 1, unit: "%" },
  { key: "cgpa10", min: 4, max: 10, step: 0.1, unit: "/10" },
];

const TIER_CLS: Record<string, string> = {
  top: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
  competitive: "border-sky-200 bg-sky-50/60 text-sky-800",
  moderate: "border-amber-200 bg-amber-50/60 text-amber-800",
  limited: "border-orange-200 bg-orange-50/60 text-orange-800",
  below_pass: "border-red-200 bg-red-50/60 text-red-800",
};

export default function ProfileGradeSimulator() {
  const [scaleKey, setScaleKey] = useState<keyof typeof COMMON_SCALES>("percent");
  const opt = SCALE_OPTIONS.find((o) => o.key === scaleKey) ?? SCALE_OPTIONS[0];
  const scale: GradeScale = COMMON_SCALES[scaleKey];
  const [value, setValue] = useState<number>(opt.key === "percent" ? 75 : 8);

  const result = useMemo(() => {
    try {
      const conv = convertToGermanGpa(value, scale);
      return { conv, tier: gradeTier(conv.germanGrade), error: null as string | null };
    } catch (e) {
      return { conv: null, tier: null, error: e instanceof Error ? e.message : "Could not convert." };
    }
  }, [value, scale]);

  const onScaleChange = (key: keyof typeof COMMON_SCALES) => {
    const next = SCALE_OPTIONS.find((o) => o.key === key) ?? SCALE_OPTIONS[0];
    setScaleKey(key);
    setValue(next.key === "percent" ? 75 : 8); // sensible mid-point per scale
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile · Foundations"
        title="Grade simulator — what if I score X?"
        description="Sweep a final percentage or CGPA and watch the German grade and an indicative programme tier move with it. Useful before results are in — for planning, not predicting."
        category="profile"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The German grade is exact, deterministic arithmetic (Modified Bavarian Formula). The <strong>tier
          is indicative and non-binding</strong> — real admission cut-offs are set per programme, often per
          year, and decided by the university / anabin, never here.
        </AlertDescription>
      </Alert>

      <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {SCALE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => onScaleChange(o.key)}
              aria-pressed={scaleKey === o.key}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                scaleKey === o.key
                  ? "border-category-profile bg-category-profile/10 text-category-profile"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {COMMON_SCALES[o.key].name}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="grade-slider" className="flex items-center justify-between text-sm">
            <span className="font-medium">Your (hypothetical) result</span>
            <span className="official-figure text-lg font-bold text-category-profile">
              {opt.step < 1 ? value.toFixed(1) : value}
              {opt.unit}
            </span>
          </label>
          <input
            id="grade-slider"
            type="range"
            min={opt.min}
            max={opt.max}
            step={opt.step}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
          />
          <div className="flex justify-between text-[0.68rem] text-muted-foreground">
            <span className="official-figure">{opt.min}{opt.unit} (pass)</span>
            <span className="official-figure">{opt.max}{opt.unit} (best)</span>
          </div>
        </div>
      </section>

      {result.error ? (
        <p role="alert" className="text-sm text-red-700">{result.error}</p>
      ) : result.conv && result.tier ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" aria-hidden /> German grade (deterministic)
            </p>
            <p className="official-figure mt-1 text-4xl font-bold text-category-profile">
              {formatGermanGrade(result.conv.germanGrade)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              On the German 1,0 (best) – 4,0 (pass) band. Computed, not estimated.
            </p>
          </div>
          <div className={cn("rounded-lg border p-5", TIER_CLS[result.tier.tier])}>
            <p className="flex items-center justify-between gap-2 text-xs font-medium">
              Indicative tier
              <Badge variant="outline" className="text-[0.6rem]">non-binding</Badge>
            </p>
            <p className="mt-1 text-lg font-bold">{result.tier.label}</p>
            <p className="mt-1 text-sm">{result.tier.detail}</p>
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        This simulator helps you set expectations and a target — it is not an admission decision, prediction,
        or guarantee. Your binding German grade comes from uni-assist / your university, and each programme
        sets its own competition.
      </p>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/evaluate" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Convert your real grade <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/profile/matching" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find matching programmes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-1">Method</p>
        <SourceLink source={source("uniAssist")} />
      </div>
    </div>
  );
}
