import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Info, OctagonAlert, Route } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import { formatGermanGrade } from "@/lib/calc/gpa";
import { deriveGermanGpa } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { summarizeEducation } from "@/lib/profile/education";
import { evaluatePathway, type PathwayNote } from "@/lib/pathway/pathway";
import { recommendedTests } from "@/lib/intake/derive";
import { cn } from "@/lib/utils";

const TONE: Record<PathwayNote["tone"], { cls: string; Icon: typeof Info }> = {
  info: { cls: "border-sky-200 bg-sky-50/50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-100", Icon: Info },
  ok: { cls: "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100", Icon: CheckCircle2 },
  warn: { cls: "border-amber-200 bg-amber-50/50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100", Icon: AlertTriangle },
  block: { cls: "border-red-200 bg-red-50/50 text-red-900 dark:bg-red-950/30 dark:text-red-100", Icon: OctagonAlert },
};

/** Study-pathway page (addendum) — routes the user by level + qualification + country into the right route. */
export default function ProfilePathway() {
  const { profile } = useProfile();
  const education = summarizeEducation(profile);
  const result = evaluatePathway({
    country: profile.homeCountry,
    highestQualification: profile.highestQualification,
    targetLevel: profile.targetLevel,
    targetSubject: profile.targetField || profile.currentDegree,
    education,
  });

  const hzbLevel = profile.targetLevel === "bachelor" || profile.targetLevel === "studienkolleg" || profile.targetLevel === "medicine";
  const hzb = hzbLevel ? deriveGermanGpa(profile) : null;
  const needsSetup = !profile.targetLevel || !profile.highestQualification;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pfad · Pathway"
        title="Your German study pathway"
        description="Bachelor, Master, Medicine or Studienkolleg follow different German routes. This reads your level, qualification, and country and shows the honest next steps — every official rule is flagged to verify."
        category="profile"
      />

      {needsSetup && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Set your <strong>study level</strong> and <strong>highest qualification</strong> in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> for an accurate route.
          </AlertDescription>
        </Alert>
      )}

      {/* Route headline */}
      <section className={cn("rounded-lg border p-5 shadow-sm", result.route === "blocked" ? "border-red-300 bg-red-50/40 dark:bg-red-950/20" : "bg-card")}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-category-profile/10 text-category-profile">
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

      {/* Education-path context (non-linear paths) — shows what was captured, never a computed penalty. */}
      {education.isNonLinear && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 dark:bg-amber-950/20">
          <h3 className="text-sm font-semibold">Your education path</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {education.bachelorEntryType === "lateral" && <Badge variant="outline">lateral entry</Badge>}
            {!education.hasClass12 && <Badge variant="outline">no class 12</Badge>}
            {education.degreeCompleted && <Badge variant="outline">degree completed</Badge>}
            {education.degreeOngoing && <Badge variant="outline">degree ongoing{education.currentSemester ? ` · sem ${education.currentSemester}` : ""}</Badge>}
            {education.totalYears > 0 && <Badge variant="outline" className="official-figure">~{education.totalYears} yrs total</Badge>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Shown as context, not a penalty. Recognition of a non-standard path is decided by anabin / uni-assist
            and the university — we route you to the official check rather than guess a yes/no.
          </p>
        </section>
      )}

      {/* Indicative HZB grade for school-leaver routes */}
      {hzbLevel && (
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Indicative HZB grade</h3>
          {hzb ? (
            <p className="mt-1 text-sm">
              Your entered grade converts to an indicative German grade{" "}
              <span className="official-figure font-semibold">{formatGermanGrade(hzb.germanGrade)}</span>{" "}
              (Modified Bavarian Formula). This is <strong>indicative only</strong> — the binding recognition is the{" "}
              <strong>anabin/ZAB category</strong> and your university's VPD.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Add your Class-12 (or degree) grade + scale in{" "}
              <Link to="/settings" className="font-medium text-primary underline">Settings</Link> for an indicative German grade. The binding value is anabin/VPD.
            </p>
          )}
        </section>
      )}

      {/* Steps */}
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

      {/* Grounded notes */}
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

      {/* Recommended tests — derived from your level + medium of instruction + test status */}
      {(() => {
        const recs = recommendedTests(profile);
        if (recs.length === 0) return null;
        return (
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Recommended tests for your pathway</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {recs.map((r, i) => (
                <li key={i} className={cn("rounded-md border p-2.5", r.tone === "ok" ? "border-emerald-200 bg-emerald-50/40" : r.tone === "warn" ? "border-amber-200 bg-amber-50/40" : "border-dashed")}>
                  <span className="font-medium">{r.test}</span> — <span className="text-muted-foreground">{r.reason}</span>
                </li>
              ))}
            </ul>
            <Link to="/language/exams" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Practise in the Mock Exam Centre <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </section>
        );
      })()}

      {/* Quick links to relevant tools */}
      <section className="flex flex-wrap gap-2">
        {result.route === "master" && (
          <Link to="/profile/matching" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Match Master's programmes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
        <Link to="/profile/evaluate" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Evaluate your grade <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/goethe-testdaf" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          German C1 prep <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {/* Sources */}
      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-2">Sources · Quellen</p>
        <ul className="space-y-1.5">
          {result.sources.map((s) => (
            <li key={s.url}><SourceLink source={s} /></li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Guidance only, not legal advice. German admission rules vary by university and change yearly —
        confirm every figure against anabin, DAAD, and the specific university before acting.
      </p>
    </div>
  );
}
