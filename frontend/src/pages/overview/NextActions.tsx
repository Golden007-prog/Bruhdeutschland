import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FileText, GraduationCap, Landmark, Plane, Route as RouteIcon, ScanLine, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import { isProfileStarted } from "@/lib/profile/profile";
import { evaluatePathway } from "@/lib/pathway/pathway";
import { recommendedTests } from "@/lib/intake/derive";
import type { GermanLevel } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const RANK: Record<GermanLevel, number> = { "": 0, none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

interface Action { id: string; title: string; why: string; to: string; icon: LucideIcon; done: boolean }

/** G50 — "You are here → next 3 actions". A deterministic, phase-ordered recommendation engine. */
export default function NextActionsPage() {
  const { profile } = useProfile();
  const [shortlist] = useSyncedState<string[]>("programs:shortlist", []);
  const [apps] = useSyncedState<{ id: string }[]>("tracker:apps", []);

  const started = isProfileStarted(profile);
  const hasLevelQual = Boolean(profile.targetLevel && profile.highestQualification);
  const route = useMemo(
    () => evaluatePathway({ country: profile.homeCountry, highestQualification: profile.highestQualification, targetLevel: profile.targetLevel, targetSubject: profile.targetField || profile.currentDegree }).route,
    [profile],
  );
  const germanReady = RANK[profile.germanLevel] >= 4;
  const testCount = recommendedTests(profile).length;

  const candidates: Action[] = [
    { id: "profile", title: "Build your profile", why: "Everything downstream personalises off it — parse a résumé or fill the intake.", to: "/profile/parse", icon: ScanLine, done: started },
    { id: "level", title: "Set your study level & qualification", why: "Needed to compute your correct German route.", to: "/settings", icon: GraduationCap, done: hasLevelQual },
    { id: "pathway", title: "Confirm your pathway", why: "See the honest route — direct, Studienkolleg, Master, or Medicine — and its next steps.", to: "/profile/pathway", icon: RouteIcon, done: hasLevelQual && route !== "blocked" && route !== "unknown" && (started || shortlist.length > 0) },
    { id: "german", title: "Build your German toward C1", why: "German-taught programmes need ~C1; start the structured plan now.", to: "/language/german-plan", icon: BookOpen, done: germanReady },
    { id: "shortlist", title: "Shortlist programmes", why: "Find and bookmark programmes that fit, then balance them into reach/match/safety.", to: "/profile/matching", icon: Target, done: shortlist.length > 0 },
    { id: "tests", title: testCount > 0 ? "Prepare your required tests" : "Check which tests you need", why: "Practise the language/aptitude tests your pathway expects in the mock centre.", to: "/language/exams", icon: ClipboardCheck, done: false },
    { id: "documents", title: "Draft your documents", why: "Start the SOP, request recommendation letters, and prepare translations.", to: "/documents", icon: FileText, done: false },
    { id: "apply", title: "Track your applications", why: "Move shortlisted programmes into the tracker and watch their deadlines.", to: "/tracker", icon: CheckCircle2, done: apps.length > 0 },
    { id: "finance", title: "Plan your finances", why: "Size the total budget and the blocked account, and check you're covered.", to: "/finance/funding-plan", icon: Landmark, done: false },
    { id: "visa", title: "Prepare the visa", why: "Work the visa checklist and book the appointment early.", to: "/visa/checklist", icon: Plane, done: false },
  ];

  const next = candidates.filter((a) => !a.done).slice(0, 3);
  const doneCount = candidates.filter((a) => a.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G50 · Overview"
        title="You are here — your next 3 actions"
        description="No more staring at 100 features wondering what to do. This reads your profile and pathway and surfaces the most useful thing to do next."
      />

      {!started && (
        <Alert variant="info" className="text-sm">
          <AlertDescription>
            Start by building your profile — the recommendations sharpen as soon as you do.
          </AlertDescription>
        </Alert>
      )}

      <ol className="space-y-3">
        {next.map((a, i) => {
          const Icon = a.icon;
          return (
            <li key={a.id}>
              <Link to={a.to} className="group flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", i === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {i === 0 && <span className="rounded bg-primary px-1.5 py-0.5 text-[0.6rem] font-medium text-primary-foreground">DO THIS NEXT</span>}
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.why}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>

      {next.length === 0 && (
        <Alert variant="success" className="text-sm">
          <CheckCircle2 aria-hidden />
          <AlertDescription>You've actioned the tracked milestones — keep working your tracker and deadlines.</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">{doneCount} of {candidates.length} milestones underway · this is guidance from your profile, not a fixed sequence.</p>
    </div>
  );
}
