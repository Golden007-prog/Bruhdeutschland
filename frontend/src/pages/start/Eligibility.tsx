import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Info, OctagonAlert, Route } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SourceLink } from "@/components/common/SourceLink";
import { evaluatePathway, type PathwayNote } from "@/lib/pathway/pathway";
import type { HighestQualification, TargetLevel } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const TONE: Record<PathwayNote["tone"], { cls: string; Icon: typeof Info }> = {
  info: { cls: "border-sky-200 bg-sky-50/50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-100", Icon: Info },
  ok: { cls: "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100", Icon: CheckCircle2 },
  warn: { cls: "border-amber-200 bg-amber-50/50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100", Icon: AlertTriangle },
  block: { cls: "border-red-200 bg-red-50/50 text-red-900 dark:bg-red-950/30 dark:text-red-100", Icon: OctagonAlert },
};

const QUALS: { value: HighestQualification; label: string }[] = [
  { value: "class10", label: "Class 10 / secondary (≈ 10 years)" },
  { value: "class12", label: "Class 12 / higher-secondary (≈ 12 years)" },
  { value: "some_bachelor", label: "Started a Bachelor's (1–2 years done)" },
  { value: "bachelor", label: "Completed a Bachelor's degree" },
  { value: "master", label: "Completed a Master's degree" },
];

const LEVELS: { value: TargetLevel; label: string }[] = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "medicine", label: "Medicine (Humanmedizin)" },
  { value: "phd", label: "PhD / doctorate" },
];

const selectClass = cn(
  "flex h-10 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/** Gap G01 — Instant eligibility quick-check. A no-signup, four-question read of the correct German
 *  route, computed deterministically by the same pathway engine the full app uses. */
export default function StartEligibility() {
  const [country, setCountry] = useState("India");
  const [qualification, setQualification] = useState<HighestQualification>("");
  const [level, setLevel] = useState<TargetLevel>("");
  const [field, setField] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const ready = Boolean(country.trim() && qualification && level);
  const result = useMemo(
    () =>
      ready
        ? evaluatePathway({ country, highestQualification: qualification, targetLevel: level, targetSubject: field })
        : null,
    [ready, country, qualification, level, field],
  );

  const show = submitted && result;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Am I eligible? — 30-second check"
        description="Four questions, no signup. We route you to the correct German path — direct Bachelor, Studienkolleg, Master, or Medicine — using the same deterministic engine as the full planner. Every official rule is flagged to verify."
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="qc-country" className="text-xs font-medium text-muted-foreground">
              Country you studied in
            </label>
            <Input id="qc-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qc-qual" className="text-xs font-medium text-muted-foreground">
              Highest qualification
            </label>
            <select id="qc-qual" className={selectClass} value={qualification} onChange={(e) => setQualification(e.target.value as HighestQualification)}>
              <option value="">Select…</option>
              {QUALS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qc-level" className="text-xs font-medium text-muted-foreground">
              What you want to study in Germany
            </label>
            <select id="qc-level" className={selectClass} value={level} onChange={(e) => setLevel(e.target.value as TargetLevel)}>
              <option value="">Select…</option>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qc-field" className="text-xs font-medium text-muted-foreground">
              Subject / field (optional)
            </label>
            <Input id="qc-field" value={field} onChange={(e) => setField(e.target.value)} placeholder="Computer Science" />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!ready}
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm",
                "disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <Route className="h-4 w-4" aria-hidden /> Check my route
            </button>
          </div>
        </form>
      </section>

      {show && (
        <>
          <section className={cn("rounded-lg border p-5 shadow-sm", result.route === "blocked" ? "border-red-300 bg-red-50/40 dark:bg-red-950/20" : "bg-card")}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Route className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight">{result.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
              </div>
            </div>
            {result.kurs && (
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">Studienkolleg {result.kurs.name}</Badge>
                <span className="text-muted-foreground">{result.kurs.desc}</span>
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-3 font-semibold">Your next steps</h3>
            <ol className="space-y-2">
              {result.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          {result.notes.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold">What to know (verify each)</h3>
              {result.notes.map((n, i) => {
                const { cls, Icon } = TONE[n.tone];
                return (
                  <div key={i} className={cn("rounded-md border p-3 text-sm", cls)}>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden /> {n.label}
                      {n.needsVerification && <Badge variant="outline" className="ml-1 text-[0.6rem]">needs verification</Badge>}
                    </p>
                    <p className="mt-1">{n.detail}</p>
                    {n.source && (
                      <a href={n.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline">
                        {n.source.name} <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          <section className="flex flex-wrap gap-2">
            <Link to="/start/timeline-planner" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Plan the timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link to="/start/budget" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Estimate the budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link to="/profile/parse" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Build my full profile <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </section>

          <div className="rounded-md border border-dashed bg-muted/30 p-3">
            <p className="eyebrow mb-2">Sources · Quellen</p>
            <ul className="space-y-1.5">
              {result.sources.map((s) => (
                <li key={s.url}><SourceLink source={s} /></li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!show && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            This is an orientation tool. It computes your <strong>route</strong> deterministically, but the
            binding recognition of your certificates is always the <strong>anabin/ZAB category</strong> and
            the specific university — verify before acting.
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Guidance only, not legal advice. German admission rules vary by university and change yearly.
      </p>
    </div>
  );
}
