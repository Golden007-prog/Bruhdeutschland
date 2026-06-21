import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Check, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { CEFR_LEVELS } from "@/lib/seed/language";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

/**
 * G1-4 — Structured, TRACKABLE German A1→C1 plan (replaces the static level/hours text). Per-level
 * checkpoints, a weekly study-hours log, and a derived completion-date estimate. All progress persists
 * PER USER via useSyncedState (localStorage-first, Supabase-synced when signed in) and is namespaced under
 * `german-plan:*`, so it follows the per-user-storage rule. Hour ranges are estimates — clearly labelled.
 */

interface LevelPlan {
  level: string;
  label: string;
  focus: string;
  /** Cumulative guided-learning hours to REACH this level from zero (mid-range of the usual band). */
  cumulativeHours: number;
  /** Band shown to the user. */
  hoursBand: string;
  target?: string;
}

/** Mid-range cumulative hours per CEFR level (illustrative; varies widely by learner & intensity). */
const LEVEL_PLANS: Record<string, LevelPlan> = {
  A1: { level: "A1", label: "Breakthrough", focus: "Pronunciation, present tense, everyday phrases, numbers & basics.", cumulativeHours: 115, hoursBand: "~80–150 hrs" },
  A2: { level: "A2", label: "Waystage", focus: "Past tense, modal verbs, daily-life topics, simple connected speech.", cumulativeHours: 315, hoursBand: "~150–250 hrs" },
  B1: { level: "B1", label: "Threshold", focus: "Independent everyday use, opinions, the threshold many B1 certificates test.", cumulativeHours: 615, hoursBand: "~250–350 hrs" },
  B2: { level: "B2", label: "Vantage", focus: "Fluent discussion, abstract topics — a common bar for English-taught life and some programmes.", cumulativeHours: 1040, hoursBand: "~350–500 hrs", target: "Minimum for everyday study life" },
  C1: { level: "C1", label: "Effective operational proficiency", focus: "Academic German: lectures, papers, exams. Required by most German-taught degrees (via TestDaF/DSH).", cumulativeHours: 1640, hoursBand: "~500–700 hrs", target: "Target for German-taught degrees" },
  C2: { level: "C2", label: "Mastery", focus: "Near-native mastery — beyond what most programmes require.", cumulativeHours: 2340, hoursBand: "~700+ hrs", target: "Beyond typical requirements" },
};

const PLAN_LEVELS = CEFR_LEVELS.map((l) => LEVEL_PLANS[l.level]).filter(Boolean);
const TARGET_OPTIONS = ["B1", "B2", "C1"] as const;

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function LanguageGermanPlan() {
  // Per-user persisted progress (namespaced; follows the per-user-storage rule).
  const [doneLevels, setDoneLevels] = useSyncedState<Record<string, boolean>>("german-plan:done", {});
  const [currentLevel, setCurrentLevel] = useSyncedState<string>("german-plan:current", "");
  const [targetLevel, setTargetLevel] = useSyncedState<string>("german-plan:target", "C1");
  const [hoursPerWeek, setHoursPerWeek] = useSyncedState<number>("german-plan:hoursPerWeek", 8);

  const doneCount = PLAN_LEVELS.filter((p) => doneLevels[p.level]).length;
  const pct = PLAN_LEVELS.length ? Math.round((doneCount / PLAN_LEVELS.length) * 100) : 0;

  // Completion estimate: remaining hours = target's cumulative − the hours already implied by your
  // current level (or completed levels). Deterministic; flagged as an estimate.
  const estimate = useMemo(() => {
    const target = LEVEL_PLANS[targetLevel];
    if (!target) return null;
    // Hours "banked" = the highest cumulative among (current level, last completed level).
    const completedHours = PLAN_LEVELS.filter((p) => doneLevels[p.level]).reduce((max, p) => Math.max(max, p.cumulativeHours), 0);
    const currentHours = currentLevel ? (LEVEL_PLANS[currentLevel]?.cumulativeHours ?? 0) : 0;
    const banked = Math.max(completedHours, currentHours);
    const remaining = Math.max(0, target.cumulativeHours - banked);
    if (hoursPerWeek <= 0) return { remaining, weeks: null as number | null, date: null as Date | null, reached: remaining === 0 };
    const weeks = Math.ceil(remaining / hoursPerWeek);
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    return { remaining, weeks, date, reached: remaining === 0 };
  }, [targetLevel, currentLevel, doneLevels, hoursPerWeek]);

  const toggleDone = (level: string) => setDoneLevels((prev) => ({ ...prev, [level]: !prev[level] }));

  const selectClass = cn(
    "h-9 rounded-md border bg-card px-2 text-sm shadow-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G09 · Language"
        title="German A1→C1 — structured study plan"
        description="A level-by-level plan from beginner to the C1 most German-taught degrees need — now trackable: tick levels off, log your weekly hours, and get an estimated completion date. Progress saves to your account."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          German-taught Bachelor's, Medicine, and many Master's expect <strong>C1</strong> (proven via
          TestDaF or DSH). Hour ranges and the completion date are <strong>estimates</strong> — real time
          depends on intensity, consistency and your first language.
        </AlertDescription>
      </Alert>

      {/* Tracker controls + completion estimate */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label htmlFor="gp-current" className="text-xs font-medium text-muted-foreground">Current level</label>
              <select id="gp-current" className={selectClass} value={currentLevel} onChange={(e) => setCurrentLevel(e.target.value)}>
                <option value="">Not started</option>
                {PLAN_LEVELS.map((p) => <option key={p.level} value={p.level}>{p.level}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="gp-target" className="text-xs font-medium text-muted-foreground">Target level</label>
              <select id="gp-target" className={selectClass} value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)}>
                {TARGET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="gp-hours" className="text-xs font-medium text-muted-foreground">Study hours / week</label>
              <Input id="gp-hours" type="number" min={0} inputMode="numeric" value={Number.isFinite(hoursPerWeek) ? hoursPerWeek : 0} onChange={(e) => setHoursPerWeek(Math.max(0, Number(e.target.value) || 0))} className="w-24" />
            </div>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-4 w-4" aria-hidden /> Estimated to reach {targetLevel}
            </p>
            {estimate?.reached ? (
              <p className="official-figure mt-1 text-2xl font-bold text-emerald-700">Reached</p>
            ) : estimate?.date ? (
              <>
                <p className="official-figure mt-1 text-2xl font-bold">{fmtDate(estimate.date)}</p>
                <p className="text-xs text-muted-foreground">≈ {estimate.weeks} weeks · {estimate.remaining} hrs left</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Set hours/week for a date</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Levels completed</span>
            <span className="official-figure"><span className="font-semibold text-foreground">{doneCount}</span>/{PLAN_LEVELS.length}</span>
          </div>
          <Progress value={pct} label={`German plan ${pct}% complete`} className="h-1.5" />
        </div>
      </section>

      {/* Level checkpoints */}
      <ol className="space-y-3">
        {PLAN_LEVELS.map((p) => {
          const done = !!doneLevels[p.level];
          const isCurrent = currentLevel === p.level;
          return (
            <li key={p.level} className={cn("rounded-lg border bg-card p-4 shadow-sm", p.target && "border-primary/40", isCurrent && "ring-2 ring-primary/30")}>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone(p.level)}
                  aria-pressed={done}
                  aria-label={`Mark ${p.level} ${done ? "not done" : "done"}`}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    done ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  {done && <Check className="h-4 w-4" aria-hidden />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <span className="official-figure rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">{p.level}</span>
                      {p.label}
                      {isCurrent && <Badge variant="secondary" className="text-[0.6rem]">you are here</Badge>}
                    </h2>
                    <span className="text-xs text-muted-foreground">{p.hoursBand} <span className="opacity-70">· varies</span></span>
                  </div>
                  <p className={cn("mt-1 text-sm text-muted-foreground", done && "line-through opacity-70")}>{p.focus}</p>
                  {p.target && (
                    <p className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{p.target}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="flex flex-wrap gap-2">
        <Link to="/language/german" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Practise A1–B2 phrases (+TTS) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/flashcards" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          SRS flashcards <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/goethe-testdaf" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Certify C1 (TestDaF / DSH) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("goethe"), source("testdaf"), source("telc")]} />
    </div>
  );
}
