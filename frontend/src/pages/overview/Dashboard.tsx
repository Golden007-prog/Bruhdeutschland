import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardCheck,
  Columns3,
  ListChecks,
  Map as MapIcon,
  ScanLine,
  UserCircle,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import {
  type CategoryCompletion,
  type Completion,
  type StatusMap,
  completion,
  completionByCategory,
  nextActions,
  profileCompleteness,
  readinessScore,
} from "@/lib/progress/progress";
import { isProfileStarted, toParsedProfile } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { ROADMAP_STEPS } from "@/lib/seed/process";
import type { FeatureCategoryKey, ProcessStep } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Shapes we only READ from the tracker/calendar stores (written by those pages). */
interface TrackedApp {
  id: string;
  stage: string;
}
interface UserDeadline {
  id: string;
  title: string;
  date: string;
}

const CATEGORY_ROUTE: Record<FeatureCategoryKey, string> = {
  profile: "/profile",
  documents: "/documents",
  language: "/language",
  finance: "/finance",
  visa: "/visa",
  campus: "/campus",
};

const QUICK_LINKS: { to: string; label: string; hint: string; icon: typeof MapIcon }[] = [
  { to: "/roadmap", label: "Roadmap", hint: "The full step-by-step plan", icon: MapIcon },
  { to: "/calendar", label: "Calendar", hint: "Deadlines on a month grid", icon: CalendarDays },
  { to: "/tracker", label: "Tracker", hint: "Your application Kanban", icon: Columns3 },
  { to: "/language/exams", label: "Mock exams", hint: "Timed practice tests", icon: ClipboardCheck },
];

const STAGE_LABELS: Record<string, string> = {
  researching: "Researching",
  applying: "Applying",
  submitted: "Submitted",
  decision: "Decision",
};

function daysUntil(iso: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(`${iso}T00:00:00`).getTime();
  return Math.ceil((target - today) / 86_400_000);
}

/** Application dashboard — every value traces to the user's real data or shows an honest empty state. */
export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [status] = useSyncedState<StatusMap>("roadmap:status", {});
  const [apps] = useSyncedState<TrackedApp[]>("tracker:apps", []);
  const [deadlines] = useSyncedState<UserDeadline[]>("calendar:deadlines", []);
  const started = isProfileStarted(profile);

  const overall = completion(status, ROADMAP_STEPS);
  const readiness = readinessScore(profile, status, ROADMAP_STEPS);
  const byCat = completionByCategory(status, ROADMAP_STEPS);
  const next = nextActions(status, ROADMAP_STEPS, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übersicht · Overview"
        title="Application dashboard"
        description="Your German Master's application at a glance — built from your own profile, roadmap, and deadlines. Nothing here is shown until it's real."
        fileRef={started && profile.name.trim() ? profile.name.trim() : undefined}
      />

      {!started ? (
        <OnboardingState />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ResumeAnalyzer profile={toParsedProfile(profile)} />
            <ReadinessCard overall={overall} readiness={readiness} profilePct={profileCompleteness(profile)} />
          </div>

          <CategoryProgress data={byCat} onSelect={(k) => navigate(CATEGORY_ROUTE[k])} />

          <div className="grid gap-6 lg:grid-cols-2">
            <NextActionsCard steps={next} caughtUp={overall.total > 0 && overall.done === overall.total} />
            <DeadlinesCard deadlines={deadlines} />
          </div>

          <PipelineCard apps={apps} />
        </>
      )}

      <QuickLinks />
    </div>
  );
}

/** Honest first-run state: complete your profile, then generate a roadmap. No invented numbers. */
function OnboardingState() {
  const steps: { to: string; label: string; hint: string; icon: typeof UserCircle }[] = [
    { to: "/onboarding", label: "Set up your profile", hint: "Degree, grade, target field", icon: UserCircle },
    { to: "/profile/parse", label: "Or parse a résumé", hint: "PDF / DOCX → reviewed fields", icon: ScanLine },
    { to: "/roadmap", label: "Generate your roadmap", hint: "The step-by-step plan", icon: MapIcon },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileSetupCard />
      <Card>
        <CardContent className="p-5">
          <p className="eyebrow">Erste Schritte · Getting started</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Three steps to your dashboard</h2>
          <ul className="mt-4 space-y-2">
            {steps.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-tight">{label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSetupCard() {
  return (
    <section className="flex flex-col justify-center rounded-lg border border-dashed bg-muted/30 p-6" aria-labelledby="profile-setup-heading">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <UserCircle className="h-5 w-5" aria-hidden />
      </span>
      <h2 id="profile-setup-heading" className="mt-3 text-lg font-semibold tracking-tight">Set up your profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your degree, grade, and target field and DeutschPrep computes your German grade
        (deterministically) and personalizes this dashboard. Nothing here is real until it's yours.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/onboarding" className={cn(buttonVariants())}>
          <UserCircle aria-hidden /> Set up your profile
        </Link>
        <Link to="/profile/parse" className={cn(buttonVariants({ variant: "outline" }))}>
          <ScanLine aria-hidden /> Parse a résumé
        </Link>
      </div>
      <Link to="/welcome" className="mt-3 inline-block text-sm text-primary hover:underline">
        New here? See how DeutschPrep works →
      </Link>
    </section>
  );
}

function ReadinessCard({ overall, readiness, profilePct }: { overall: Completion; readiness: number; profilePct: number }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm" aria-labelledby="readiness-heading">
      <p className="eyebrow">Bereitschaft · Readiness</p>
      <h2 id="readiness-heading" className="mt-0.5 text-lg font-semibold tracking-tight">How ready you are</h2>
      <div className="mt-4 flex items-end gap-3">
        <span className="official-figure text-4xl font-bold leading-none">{readiness}</span>
        <span className="mb-1 text-sm text-muted-foreground">/ 100 readiness</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Computed from your profile completeness ({profilePct}%) and roadmap progress ({overall.pct}%).
      </p>
      <div className="mt-4 space-y-3">
        <Bar label="Roadmap progress" pct={overall.pct} caption={`${overall.done}/${overall.total} steps done`} />
        <Bar label="Profile completeness" pct={profilePct} />
      </div>
      <Link to="/roadmap" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        Advance your roadmap <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}

function Bar({ label, pct, caption }: { label: string; pct: number; caption?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-3">
        <p className="text-xs font-medium">{label}</p>
        <p className="official-figure text-xs text-muted-foreground">{caption ?? `${pct}%`}</p>
      </div>
      <Progress value={pct} label={`${label}: ${pct}%`} className="h-1.5" />
    </div>
  );
}

function CategoryProgress({ data, onSelect }: { data: CategoryCompletion[]; onSelect: (k: FeatureCategoryKey) => void }) {
  return (
    <section aria-labelledby="catprog-heading">
      <div className="mb-3">
        <p className="eyebrow">Fortschritt · Progress by area</p>
        <h2 id="catprog-heading" className="mt-0.5 text-lg font-semibold tracking-tight">Where you stand in each area</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map(({ key, completion: c }) => {
          const accent = CATEGORY_ACCENT[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="group relative overflow-hidden rounded-lg border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", accent.bar)} />
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-sm font-medium">{CATEGORY_LABELS[key]}</p>
                <span className="official-figure text-xs text-muted-foreground">{c.done}/{c.total}</span>
              </div>
              <div className="mt-3">
                <Progress value={c.pct} label={`${CATEGORY_LABELS[key]}: ${c.pct}%`} className="h-1.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function NextActionsCard({ steps, caughtUp }: { steps: ProcessStep[]; caughtUp: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="eyebrow">Nächste Schritte · Next actions</p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Do these next</h2>
        {caughtUp || steps.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up on the roadmap. 🎉
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.id}>
                <Link
                  to={s.href ?? "/roadmap"}
                  className="group flex items-center gap-3 rounded-md border bg-card p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ListChecks className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{s.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DeadlinesCard({ deadlines }: { deadlines: UserDeadline[] }) {
  const upcoming = [...deadlines]
    .filter((d) => d.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Fristen · Deadlines</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Upcoming</h2>
          </div>
          <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Calendar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No deadlines yet. <Link to="/calendar" className="text-primary hover:underline">Add one on the calendar</Link>.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.map((d) => {
              const days = daysUntil(d.date);
              return (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border bg-card p-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <BellRing className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium">{d.title}</span>
                  </div>
                  <span className={cn("official-figure shrink-0 text-xs", days < 0 ? "text-muted-foreground" : days <= 14 ? "text-amber-700" : "text-muted-foreground")}>
                    {days < 0 ? "past" : days === 0 ? "today" : `${days}d`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineCard({ apps }: { apps: TrackedApp[] }) {
  const stages = ["researching", "applying", "submitted", "decision"];
  const counts = Object.fromEntries(stages.map((s) => [s, apps.filter((a) => a.stage === s).length]));
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Bewerbungen · Application pipeline</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Your programmes</h2>
          </div>
          <Link to="/tracker" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {apps.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No programmes tracked yet. <Link to="/tracker" className="text-primary hover:underline">Add your first programme</Link>.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stages.map((s) => (
              <div key={s} className="rounded-md border bg-card p-3 text-center">
                <p className="official-figure text-2xl font-bold">{counts[s]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_LABELS[s]}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLinks() {
  return (
    <section aria-labelledby="quicklinks-heading">
      <h2 id="quicklinks-heading" className="sr-only">Quick links</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map(({ to, label, hint, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-tight">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{hint}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
