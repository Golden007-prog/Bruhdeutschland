import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, Info, Languages, OctagonAlert, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

/**
 * G0-3 — Class-10 orientation landing ("what now?" for the honestly-blocked persona). The pathway engine
 * correctly returns `blocked` for a Class-10 certificate (pathway.ts) — there is no German university or
 * Studienkolleg entry on Class 10 alone. Instead of a dead-end red card, this page gives a short, concrete
 * runway: finish Class 12 → build German A1→B1 → re-run eligibility. No official numbers are asserted.
 */

interface Step {
  icon: typeof GraduationCap;
  title: string;
  detail: string;
  to?: { label: string; href: string };
}

const STEPS: Step[] = [
  {
    icon: GraduationCap,
    title: "Complete Class 12 (or an equivalent secondary-leaving certificate)",
    detail:
      "German higher-education entry (the HZB) requires a completed upper-secondary qualification. A Class-10 certificate isn't enough for a university — or for a Studienkolleg. Finishing Class 12 is the one prerequisite that unlocks every route.",
  },
  {
    icon: Languages,
    title: "Start German now — aim for A1 → B1 while you study",
    detail:
      "Every Bachelor and Studienkolleg route needs German, and the Studienkolleg entrance exam (Aufnahmeprüfung) expects around B1. Reaching B1 takes months, so the time spent finishing Class 12 is the perfect window to climb from scratch.",
    to: { label: "Open the German A1→C1 plan", href: "/language/german-plan" },
  },
  {
    icon: RefreshCw,
    title: "Once you have your Class-12 result, re-run eligibility",
    detail:
      "With a completed Class 12 the engine can route you properly — for India/Bangladesh school-leavers that's usually a Studienkolleg + FSP path (unless a direct-entry carve-out applies). Come back and run the quick-check then.",
    to: { label: "Re-run the eligibility check", href: "/start/eligibility" },
  },
];

export default function StartClassTenOrientation() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Finishing Class 10? Here's your runway"
        description="A Class-10 certificate can't yet open a German university — but you're not stuck, you're early. This is the short, finite path from where you are to a real German-admissions plan."
      />

      <Alert variant="warning" className="text-sm">
        <OctagonAlert aria-hidden />
        <AlertDescription>
          <strong>There is no Studienkolleg entry on Class 10 alone.</strong> Anyone telling you otherwise is
          mistaken — the foundation year itself needs a completed upper-secondary certificate first. Treat
          "finish Class 12" as step zero of every German plan.
        </AlertDescription>
      </Alert>

      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold">
                    <span className="official-figure mr-2 text-sm text-muted-foreground">{i + 1}.</span>
                    {s.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                  {s.to && (
                    <Link to={s.to.href} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      {s.to.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Want to look ahead? The <Link to="/profile/studienkolleg" className="font-medium underline">Studienkolleg
          route</Link> and the <Link to="/profile/pathway" className="font-medium underline">full pathway</Link> show
          where Class 12 leads — but don't apply to anything until that certificate is in hand.
        </AlertDescription>
      </Alert>

      <SourceList sources={[source("anabin"), source("studienkolleg")]} />
    </div>
  );
}
