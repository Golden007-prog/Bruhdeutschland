import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gauge, Info, Minus, OctagonAlert, Plus, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/lib/profile/useProfile";
import { summarizeEducation } from "@/lib/profile/education";
import { evaluatePathway } from "@/lib/pathway/pathway";
import { computeFeasibility, type FeasibilityBand } from "@/lib/calc/feasibility";
import { cn } from "@/lib/utils";

const BAND_META: Record<FeasibilityBand, { label: string; cls: string }> = {
  strong: { label: "Strong — clear, realistic path", cls: "text-emerald-700" },
  workable: { label: "Workable — doable with focus", cls: "text-sky-700" },
  challenging: { label: "Challenging — real obstacles to plan around", cls: "text-amber-700" },
  blocked: { label: "Not yet eligible", cls: "text-red-700" },
};

/** Gap G02 — Reality check. A transparent feasibility heuristic + end-to-end years estimate. */
export default function StartFeasibility() {
  const { profile } = useProfile();
  const [englishTaught, setEnglishTaught] = useState(profile.mediumOfInstruction !== "other");

  const route = useMemo(
    () =>
      evaluatePathway({
        country: profile.homeCountry,
        highestQualification: profile.highestQualification,
        targetLevel: profile.targetLevel,
        targetSubject: profile.targetField || profile.currentDegree,
        education: summarizeEducation(profile),
      }).route,
    [profile],
  );

  const result = useMemo(
    () =>
      computeFeasibility({
        route,
        targetLevel: profile.targetLevel,
        highestQualification: profile.highestQualification,
        germanLevel: profile.germanLevel,
        englishTaught,
      }),
    [route, profile, englishTaught],
  );

  const needsSetup = !profile.targetLevel || !profile.highestQualification;
  const meta = BAND_META[result.band];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Reality check — feasibility & years to finish"
        description="A blunt, explainable read on how realistic your plan is and roughly how long it takes end-to-end. Every factor that moves the score is shown. This is a heuristic for orientation — not an admission prediction."
      />

      {needsSetup && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Set your <strong>study level</strong> and <strong>highest qualification</strong> in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> (or run the{" "}
            <Link to="/start/eligibility" className="font-medium underline">eligibility check</Link>) for an accurate read.
          </AlertDescription>
        </Alert>
      )}

      {/* Score + years */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Gauge className="h-4 w-4" aria-hidden /> Feasibility (heuristic)
          </p>
          <p className={cn("official-figure mt-1 text-3xl font-bold", meta.cls)}>{result.score}<span className="text-base font-normal text-muted-foreground">/100</span></p>
          <Progress value={result.score} label={`Feasibility ${result.score} of 100`} className="mt-2 h-1.5" />
          <p className={cn("mt-2 text-sm font-medium", meta.cls)}>{meta.label}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Estimated time, start of prep → graduated</p>
          {result.band === "blocked" ? (
            <p className="mt-1 text-sm text-muted-foreground">Not applicable until you're eligible.</p>
          ) : (
            <>
              <p className="official-figure mt-1 text-3xl font-bold">{result.estYearsMin}–{result.estYearsMax} <span className="text-base font-normal text-muted-foreground">years</span></p>
              <p className="mt-2 text-sm text-muted-foreground">Includes preparation (language, tests, applications){route === "studienkolleg" ? ", the Studienkolleg year," : ""} and the degree itself.</p>
            </>
          )}
        </div>
      </section>

      {/* Toggle */}
      {result.band !== "blocked" && (
        <label className="flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
          <input type="checkbox" checked={englishTaught} onChange={(e) => setEnglishTaught(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          My target programme is taught in English
        </label>
      )}

      {/* Factors */}
      <section>
        <h3 className="mb-3 font-semibold">What moves your score</h3>
        <ul className="space-y-2">
          {result.factors.map((f, i) => {
            const positive = f.delta > 0;
            const negative = f.delta < 0;
            const Icon = negative ? Minus : positive ? Plus : Info;
            return (
              <li key={i} className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
                <span className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  negative ? "bg-amber-100 text-amber-700" : positive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                )}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {f.label}
                    {f.delta !== 0 && <Badge variant="outline" className="official-figure text-[0.6rem]">{f.delta > 0 ? "+" : ""}{f.delta}</Badge>}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{f.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Caveats */}
      {result.caveats.length > 0 && (
        <section className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-amber-900">
            {result.band === "blocked" ? <OctagonAlert className="h-4 w-4" aria-hidden /> : <TriangleAlert className="h-4 w-4" aria-hidden />}
            Plan around these
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.caveats.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-900">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap gap-2">
        <Link to="/start/timeline-planner" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Plan the timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          See your full pathway <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        This score is a transparent heuristic for orientation only — it is not an admission decision,
        prediction, or guarantee. Actual outcomes depend on your grades, the specific programme, and the
        year's competition.
      </p>
    </div>
  );
}
