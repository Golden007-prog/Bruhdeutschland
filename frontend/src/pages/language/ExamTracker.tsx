import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Flame, Printer, Target, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EXAM_SPECS } from "@/data/exam-specs";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { onScopeChange } from "@/lib/persist/userScope";
import { getAttempts, hydrateAttemptsFromCloud, type AttemptRecord } from "@/lib/exam/attempts";
import {
  bestOverall,
  improvementPoints,
  latestSkillStats,
  predictedBand,
  questionTypeStats,
  scoreHistory,
  streakFromAttempts,
} from "@/lib/exam/analytics";
import { SCALE_DISCLAIMER } from "@/lib/exam/scale";

const SKILL_LABEL: Record<string, string> = {
  listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking",
  verbal: "Verbal", quantitative: "Quant", data_insights: "Data Insights", analytical_writing: "Writing",
};

const accColor = (acc: number) => `hsl(${Math.round(acc * 120)} 65% ${92 - acc * 12}%)`;

export default function LanguageExamTracker() {
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => getAttempts());
  const [targetBand, setTargetBand] = useSyncedState<string>("exam:targetBand", "");

  useEffect(() => {
    void hydrateAttemptsFromCloud().then(() => setAttempts(getAttempts()));
  }, []);

  // Re-read attempts when the signed-in user changes without a page reload, so a live account switch
  // never shows the previous user's in-memory attempts (qa-findings P2: stale data on account switch).
  useEffect(
    () =>
      onScopeChange(() => {
        setAttempts(getAttempts());
        void hydrateAttemptsFromCloud().then(() => setAttempts(getAttempts()));
      }),
    [],
  );

  const now = Date.now();
  const history = useMemo(() => scoreHistory(attempts), [attempts]);
  const typeStats = useMemo(() => questionTypeStats(attempts), [attempts]);
  const skills = useMemo(() => latestSkillStats(attempts), [attempts]);
  const improvements = useMemo(() => improvementPoints(attempts, now, 3), [attempts, now]);
  const prediction = useMemo(() => predictedBand(attempts), [attempts]);
  const streak = useMemo(() => streakFromAttempts(attempts), [attempts]);
  const best = bestOverall(attempts);
  const target = Number(targetBand);
  const gap = prediction.value != null && Number.isFinite(target) && target > 0 ? Math.max(0, target - prediction.value) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Fortschritt · Progress"
          title="Exam progress & analytics"
          description="Your mock-exam scores over time — per-skill and per-question-type accuracy, ranked weaknesses, a predicted band, and what to drill next. Real data only; estimates carry the standing disclaimer."
          category="language"
        />
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer aria-hidden /> Export / print
        </Button>
      </div>

      {attempts.length === 0 ? (
        <section className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium">No attempts yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Take a timed mock and your scores, weaknesses, and a personalised study plan will appear
            here — nothing is shown until there's real data to show.
          </p>
          <Link to="/language/exams" className={"mt-4 inline-flex"}>
            <Button>Go to the Mock Exam Centre</Button>
          </Link>
        </section>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={<TrendingUp className="h-4 w-4" aria-hidden />} label="Attempts" value={String(attempts.length)} sub="recorded on this device" />
            <SummaryCard icon={<Award className="h-4 w-4" aria-hidden />} label="Best overall" value={best != null ? `Band ${best}` : "—"} sub={best != null ? "across all attempts" : "no banded attempt yet"} />
            <SummaryCard icon={<Flame className="h-4 w-4" aria-hidden />} label="Streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} sub={`longest ${streak.longest}`} />
            <SummaryCard
              icon={<Target className="h-4 w-4" aria-hidden />}
              label="Predicted next"
              value={prediction.value != null ? `Band ${prediction.value}` : "—"}
              sub={prediction.value != null ? `${prediction.confidence} confidence` : "needs ≥2 attempts"}
            />
          </div>

          {/* Target band + gap */}
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="target" className="text-sm font-medium">Your target band</label>
              <input
                id="target"
                type="number"
                min={0}
                max={9}
                step={0.5}
                value={targetBand}
                onChange={(e) => setTargetBand(e.target.value)}
                placeholder="e.g. 7"
                className="h-9 w-24 rounded-md border bg-card px-2 text-sm"
              />
              {gap != null && (
                <span className="text-sm text-muted-foreground">
                  {gap === 0 ? (
                    <span className="text-emerald-700">On track — your projection meets your target.</span>
                  ) : (
                    <>Gap to target: <span className="official-figure font-semibold text-foreground">{gap}</span> band{gap === 0.5 ? "" : "s"}.</>
                  )}
                </span>
              )}
            </div>
          </section>

          {/* Score history */}
          <ChartCard title="Score history">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                {history.some((h) => h.overall != null) ? (
                  <Line type="monotone" dataKey="overall" name="Overall band" stroke="hsl(222 89% 55%)" strokeWidth={2} connectNulls />
                ) : (
                  <Line type="monotone" dataKey="percent" name="Objective %" stroke="hsl(222 89% 55%)" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Per-skill radar */}
            {skills.length >= 3 && (
              <ChartCard title="Per-skill (latest)">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skills.map((s) => ({ skill: SKILL_LABEL[s.skill] ?? s.skill, value: s.percent }))} outerRadius="75%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                    <Radar dataKey="value" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39%)" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Per-question-type accuracy (worst first) */}
            <ChartCard title="Accuracy by question type (worst first)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeStats.slice(0, 8).map((t) => ({ type: t.type.length > 22 ? t.type.slice(0, 21) + "…" : t.type, acc: Math.round(t.accuracy * 100) }))} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={130} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="acc" name="Accuracy %" fill="hsl(35 92% 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Weakness heatmap */}
          {typeStats.length > 0 && (
            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Weakness heatmap</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Accuracy by question type — redder is weaker.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {typeStats.map((t) => (
                  <span key={t.type} className="rounded-md border px-2 py-1 text-xs" style={{ backgroundColor: accColor(t.accuracy) }}>
                    {t.type} · <span className="official-figure font-semibold">{Math.round(t.accuracy * 100)}%</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Top improvement points + study plan */}
          {improvements.length > 0 && (
            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Top improvement points this week</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Ranked by low accuracy × how often the type appears × how recently you practised it.</p>
              <ol className="mt-3 space-y-2">
                {improvements.map((p, i) => (
                  <li key={p.type} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i + 1}. {p.type}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="official-figure">{Math.round(p.accuracy * 100)}%</span> accuracy over {p.count} item{p.count === 1 ? "" : "s"}
                        {p.recencyDays < 1 ? " · practised today" : ` · last seen ${Math.round(p.recencyDays)}d ago`}
                      </p>
                    </div>
                    <Link to="/language/exams" className="shrink-0">
                      <Button size="sm" variant="outline">Drill this</Button>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Pacing + attempt comparison */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Pacing — time used vs allotted">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pacingData(attempts)} margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip />
                  <Bar dataKey="usedMin" name="Used (min)" fill="hsl(222 89% 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="allottedMin" name="Allotted (min)" fill="hsl(214 32% 80%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <section className="rounded-lg border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">Attempt comparison</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-2">Attempt</th><th className="p-2">Exam</th><th className="p-2 text-right">Objective</th><th className="p-2 text-right">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.slice(0, 6).map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="p-2 text-muted-foreground">{new Date(a.finishedAt).toISOString().slice(0, 10)}</td>
                        <td className="p-2">{a.examTitle}</td>
                        <td className="p-2 text-right official-figure">{a.score.percent}%</td>
                        <td className="p-2 text-right official-figure">{a.score.overallBand ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <Alert variant="info" className="text-xs">
            <AlertDescription>{SCALE_DISCLAIMER}</AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}

function pacingData(attempts: AttemptRecord[]) {
  return [...attempts]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .slice(-8)
    .map((a) => {
      const spec = EXAM_SPECS[a.examId];
      const allottedMin = spec ? spec.sections.reduce((sum, s) => sum + s.timeMin, 0) : 0;
      return { date: new Date(a.finishedAt).toISOString().slice(5, 10), usedMin: Math.round(a.durationMs / 60000), allottedMin };
    });
}

function SummaryCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</p>
      <p className="official-figure mt-1 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}
