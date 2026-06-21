import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CalendarRange, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import { useProfile } from "@/lib/profile/useProfile";
import { summarizeEducation } from "@/lib/profile/education";
import { evaluatePathway } from "@/lib/pathway/pathway";
import {
  reverseTimeline,
  routeNeedsStudienkolleg,
  STUDIENKOLLEG_LEAD_MONTHS,
  type DatedMilestone,
  type IntakeSeason,
} from "@/lib/calc/reverseTimeline";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-10 rounded-md border bg-card px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const CAT_DOT: Record<DatedMilestone["category"], string> = {
  profile: "bg-category-profile",
  language: "bg-category-language",
  documents: "bg-category-documents",
  finance: "bg-category-finance",
  visa: "bg-category-visa",
  campus: "bg-category-campus",
};

const CAT_LINK: Partial<Record<DatedMilestone["category"], { to: string; label: string }>> = {
  language: { to: "/language/exams", label: "Mock exams" },
  documents: { to: "/documents", label: "Document prep" },
  finance: { to: "/start/budget", label: "Budget" },
  visa: { to: "/visa/checklist", label: "Visa checklist" },
  profile: { to: "/profile/matching", label: "Find programmes" },
  campus: { to: "/campus/pre-departure", label: "Pre-departure" },
};

const MONTH_LABEL = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

/** Gap G03 / G0-1 — Reverse timeline planner. Back-dates the journey's milestones from a chosen intake,
 *  and (G0-1) prepends the Studienkolleg → FSP arc for a school-leaver route. */
export default function StartTimelinePlanner() {
  const { profile } = useProfile();
  const thisYear = new Date().getFullYear();
  const [season, setSeason] = useState<IntakeSeason>(profile.targetIntake === "SS" ? "SS" : "WS");
  const [year, setYear] = useState<number>(() => {
    const parsed = Number(profile.targetIntakeYear);
    return Number.isFinite(parsed) && parsed >= thisYear ? parsed : thisYear + 1;
  });

  // G0-1: read the grounded pathway route so a Studienkolleg/Medicine school-leaver gets the longer arc.
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
  const isStudienkolleg = routeNeedsStudienkolleg(route);

  const milestones = useMemo(() => reverseTimeline(season, year, new Date(), route), [season, year, route]);
  const overdueCount = milestones.filter((m) => m.overdue).length;
  const years = [thisYear, thisYear + 1, thisYear + 2, thisYear + 3];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Reverse timeline — work back from your intake"
        description="Pick a target intake and we back-date every milestone so you know what to start by when. Offsets are anchored to the intake start; exact university deadlines vary and are flagged to verify."
      />

      <section className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="tl-season" className="text-xs font-medium text-muted-foreground">Intake</label>
          <select id="tl-season" className={selectClass} value={season} onChange={(e) => setSeason(e.target.value as IntakeSeason)}>
            <option value="WS">Winter (WS · starts October)</option>
            <option value="SS">Summer (SS · starts April)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="tl-year" className="text-xs font-medium text-muted-foreground">Year</label>
          <select id="tl-year" className={selectClass} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          Planning for <span className="font-medium text-foreground">{season === "WS" ? "Winter" : "Summer"} {year}</span> — intake starts {MONTH_LABEL(milestones.find((m) => m.key === "arrival")?.month ?? milestones[milestones.length - 1].month)}.
        </p>
      </section>

      {isStudienkolleg && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Your pathway routes through a <strong>Studienkolleg</strong>{route === "medicine" ? " (Medicine M-Kurs)" : ""}, so this
            timeline adds an entrance-exam → one-year Studienkolleg → <strong>FSP</strong> arc <em>before</em> the
            degree application — roughly <strong>{STUDIENKOLLEG_LEAD_MONTHS} extra months</strong> of lead. Exact
            durations and term dates vary by college; treat these as planning anchors and confirm with the college.
            <span className="mt-1 block"><SourceLink source={source("studienkolleg")} /></span>
          </AlertDescription>
        </Alert>
      )}

      {overdueCount > 0 && (
        <Alert variant="warning" className="text-sm">
          <AlertTriangle aria-hidden />
          <AlertDescription>
            <strong>{overdueCount}</strong> milestone{overdueCount === 1 ? "" : "s"} for this intake {overdueCount === 1 ? "is" : "are"} already in the past. Either start them <strong>immediately</strong> or pick a later intake.
          </AlertDescription>
        </Alert>
      )}

      <ol className="relative space-y-4 border-l-2 border-dashed pl-6">
        {milestones.map((m) => {
          const link = CAT_LINK[m.category];
          return (
            <li key={m.key} className="relative">
              <span className={cn("absolute -left-[1.95rem] mt-1 h-3 w-3 rounded-full ring-4 ring-background", CAT_DOT[m.category])} aria-hidden />
              <div className={cn("rounded-md border bg-card p-3 shadow-sm", m.overdue && "border-amber-300 bg-amber-50/40")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{m.label}</h2>
                  <span className="flex items-center gap-2">
                    {m.overdue && <Badge variant="outline" className="text-[0.6rem] text-amber-700">overdue</Badge>}
                    <Badge variant="secondary" className="official-figure">
                      <CalendarRange className="mr-1 h-3 w-3" aria-hidden /> {MONTH_LABEL(m.month)}
                    </Badge>
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{m.detail}</p>
                {link && (
                  <Link to={link.to} className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    {link.label} <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <Alert variant="info" className="text-xs">
        <Info aria-hidden />
        <AlertDescription>
          These dates are planning anchors, not official deadlines. Every programme sets its own
          application deadline (winter intakes are often around 15 July, summer around 15 January, but
          many differ) — confirm each on the programme's page and in your uni-assist account.
          <span className="mt-1 block"><SourceLink source={source("uniAssistDeadlines")} /></span>
        </AlertDescription>
      </Alert>
    </div>
  );
}
