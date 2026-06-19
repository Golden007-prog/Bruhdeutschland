import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, ClipboardCheck, FolderCheck, Map, ScanLine, UserCircle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DeadlineList } from "@/components/common/DeadlineList";
import { StatusBoard } from "@/components/common/StatusBoard";
import { FeatureModuleGrid } from "@/components/FeatureModuleGrid";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { RoadmapTracker } from "@/components/RoadmapTracker";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { alertable } from "@/lib/calc/deadlines";
import type { FeatureCategoryKey } from "@/lib/types";
import { mockFeatureModules, mockRoadmapItems } from "@/lib/mockData";
import { isProfileStarted, toParsedProfile } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { SEED_EVENTS } from "@/lib/seed/events";
import { APPLICATION_STAGES } from "@/lib/seed/process";

/** Each category module routes to its area overview page. */
const CATEGORY_ROUTE: Record<FeatureCategoryKey, string> = {
  profile: "/profile",
  documents: "/documents",
  language: "/language",
  finance: "/finance",
  visa: "/visa",
  campus: "/campus",
};

const QUICK_LINKS: { to: string; label: string; hint: string; icon: typeof Map }[] = [
  { to: "/roadmap", label: "Roadmap", hint: "The full step-by-step plan", icon: Map },
  { to: "/deadlines", label: "Deadlines", hint: "Every date that matters", icon: BellRing },
  { to: "/documents-checklist", label: "Document gathering", hint: "Application · visa · arrival", icon: FolderCheck },
  { to: "/language/exams", label: "Mock exams", hint: "Timed practice tests", icon: ClipboardCheck },
];

/** Application dashboard — the home view composing the whole copilot at a glance. */
export default function Dashboard() {
  const navigate = useNavigate();
  const alerts = alertable(SEED_EVENTS);
  const { profile } = useProfile();
  const started = isProfileStarted(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übersicht · Overview"
        title="Application dashboard"
        description="Your German Master's application at a glance — profile, roadmap, deadlines, and progress across all six areas."
        fileRef={started && profile.name.trim() ? profile.name.trim() : undefined}
      />

      {/* Profile review (signature seal) + roadmap, side by side on large screens. */}
      <div className="grid gap-6 lg:grid-cols-2">
        {started ? (
          <ResumeAnalyzer profile={toParsedProfile(profile)} />
        ) : (
          <ProfileSetupCard />
        )}
        <RoadmapTracker items={mockRoadmapItems} />
      </div>

      {/* Quick links into the most-used tools. */}
      <section aria-labelledby="quicklinks-heading">
        <h2 id="quicklinks-heading" className="sr-only">
          Quick links
        </h2>
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
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Alerts: deadlines that need attention now. */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Fristen · Alerts</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Needs attention</h2>
            </div>
            <Link
              to="/deadlines"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              All deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {alerts.length > 0 ? (
            <DeadlineList events={alerts} dense />
          ) : (
            <p className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Nothing urgent right now. Upcoming dates are tracked on the deadlines page.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Compact process-polling board. */}
      <StatusBoard stages={APPLICATION_STAGES} />

      {/* The six feature areas. */}
      <FeatureModuleGrid
        modules={mockFeatureModules}
        onSelect={(key) => navigate(CATEGORY_ROUTE[key])}
      />
    </div>
  );
}

/**
 * Shown in place of the profile review until the user has entered intake details — an honest empty
 * state with a primary action, never a fabricated sample presented as the user's own data.
 */
function ProfileSetupCard() {
  return (
    <section
      className="flex flex-col justify-center rounded-lg border border-dashed bg-muted/30 p-6"
      aria-labelledby="profile-setup-heading"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <UserCircle className="h-5 w-5" aria-hidden />
      </span>
      <h2 id="profile-setup-heading" className="mt-3 text-lg font-semibold tracking-tight">
        Set up your profile
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your degree, grade, and target field and DeutschPrep computes your German grade
        (deterministically) and personalizes this dashboard. Nothing here is real until it's yours.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/onboarding" className={cn(buttonVariants())}>
          <UserCircle aria-hidden /> Set up your profile
        </Link>
        <Link to="/profile/parse" className={cn(buttonVariants({ variant: "outline" }))}>
          <ScanLine aria-hidden /> Parse a resume
        </Link>
      </div>
      <Link to="/welcome" className="mt-3 inline-block text-sm text-primary hover:underline">
        New here? See how DeutschPrep works →
      </Link>
    </section>
  );
}
