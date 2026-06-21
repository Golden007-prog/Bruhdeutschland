import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, History, Info, RefreshCw, Sparkles, WifiOff } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExamRunner } from "@/features/mock/ExamRunner";
import { GenerationLoader } from "@/features/mock/GenerationLoader";
import type { ExamSpec } from "@/data/exam-specs";
import { generateExamFromSpec, type GenMode, type GenProgress } from "@/lib/exam/generate";
import { anyProviderConfigured } from "@/lib/llm/registry";
import type { GeneratedExam } from "@/lib/exam/schema";
import { clearProgress, loadProgress, type ExamProgress } from "@/lib/exam/examProgress";

type Phase = "intro" | "generating" | "running";

/** In-memory cache of the last form per exam (for "Reuse last" without re-generating). */
const lastForms = new Map<string, GeneratedExam>();

/**
 * Reusable mock-exam page body for an aptitude test (TestAS / TMS) whose spec lives OUTSIDE the global
 * EXAM_SPECS registry (gaps G3-3 / G3-4). It mirrors the language {@link MockExamPage} — official format
 * with provenance, provider status, generation modes, resume — but is driven entirely by the `spec` +
 * `seed` props and reuses the same {@link ExamRunner} + deterministic scoring. The owning page supplies
 * the PageHeader above this.
 */
export function AptitudeMockPage({ spec, seed }: { spec: ExamSpec; seed: GeneratedExam }) {
  const examId = spec.id;
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState<GenProgress | null>(null);
  const [exam, setExam] = useState<GeneratedExam | null>(null);
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<GenMode>("full");
  const [activeResume, setActiveResume] = useState<ExamProgress | null>(null);
  const [savedProgress, setSavedProgress] = useState<ExamProgress | null>(() => loadProgress(examId));
  const abortRef = useRef<AbortController | null>(null);
  const configured = anyProviderConfigured();

  async function generate(m: GenMode) {
    setError("");
    setProgress(null);
    setMode(m);
    setActiveResume(null);
    clearProgress(examId);
    setSavedProgress(null);
    setPhase("generating");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = await generateExamFromSpec(spec, seed, { mode: m, signal: ctrl.signal, onProgress: setProgress });
      lastForms.set(examId, form);
      setExam(form);
      setPhase("running");
    } catch (err) {
      if (ctrl.signal.aborted) {
        setPhase("intro");
        return;
      }
      setError(err instanceof Error ? err.message : "Generation failed. Try again, or use the offline form.");
      setPhase("intro");
    }
  }

  /** Start the bundled offline form directly (no provider needed). */
  function startOffline() {
    const form = JSON.parse(JSON.stringify(seed)) as GeneratedExam;
    clearProgress(examId);
    setSavedProgress(null);
    setActiveResume(null);
    setMode("full");
    setExam(form);
    setPhase("running");
  }

  function reuseLast() {
    const form = lastForms.get(examId);
    if (form) {
      setActiveResume(null);
      setExam(form);
      setPhase("running");
    }
  }

  function resumeExam() {
    const p = loadProgress(examId);
    if (!p) {
      setSavedProgress(null);
      return;
    }
    setActiveResume(p);
    setExam(p.exam);
    setPhase("running");
  }

  function backToIntro() {
    setActiveResume(null);
    setSavedProgress(loadProgress(examId));
    setPhase("intro");
  }

  function cancel() {
    abortRef.current?.abort();
    setPhase("intro");
  }

  if (phase === "generating") {
    return (
      <div className="space-y-4">
        <GenerationLoader progress={progress} examTitle={spec.title} />
        <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
      </div>
    );
  }

  if (phase === "running" && exam) {
    return <ExamRunner exam={exam} spec={spec} mode={mode} resume={activeResume ?? undefined} onRestart={backToIntro} />;
  }

  // intro
  return (
    <div className="space-y-5">
      <Alert variant="info" className="text-xs">
        <Info aria-hidden />
        <AlertDescription>
          Practice items are study aids — not the real test, and not score-equivalent. {spec.title} reports a
          standardised / percentile score with no fixed pass mark; this mock only gives an objective raw
          score so you can drill the question types under time pressure. The format below is sourced — verify
          requirements with the test owner.
        </AlertDescription>
      </Alert>

      {!configured && (
        <Alert variant="warning" className="text-xs">
          <WifiOff aria-hidden />
          <AlertDescription>
            No AI provider set, so this mock uses a bundled offline form. Add a free Google Gemini key in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> for freshly generated items every time.
          </AlertDescription>
        </Alert>
      )}

      {/* Official format */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{spec.title} — format</h2>
          <span className="official-figure text-xs text-muted-foreground">{spec.scoreScale}</span>
        </div>
        <ul className="mt-3 divide-y rounded-md border">
          {spec.sections.map((s) => (
            <li key={s.label} className="flex flex-wrap items-baseline justify-between gap-2 p-3 text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="official-figure text-muted-foreground">{s.questions} Q · {s.timeMin} min</span>
              <span className="w-full text-xs text-muted-foreground sm:w-auto">{s.format}</span>
            </li>
          ))}
        </ul>
        <a href={spec.provenance.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {spec.provenance.source_name} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {spec.provenance.needs_verification && (
          <p className="mt-2 text-xs text-amber-700">Format & dates change — re-verify on the official site before you rely on them.</p>
        )}
      </section>

      {savedProgress && (
        <Alert variant="info" className="text-xs">
          <History aria-hidden />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>You have an unfinished {spec.title} attempt saved on this device.</span>
            <Button size="sm" variant="outline" onClick={resumeExam}>Resume</Button>
            <button
              type="button"
              onClick={() => { clearProgress(examId); setSavedProgress(null); }}
              className="text-muted-foreground underline"
            >
              Discard
            </button>
          </AlertDescription>
        </Alert>
      )}

      {error && <Alert variant="danger" className="text-xs"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {configured ? (
          <>
            <Button onClick={() => generate("full")}>
              <Sparkles aria-hidden /> Generate full mock
            </Button>
            <Button variant="outline" onClick={() => generate("mini")}>Mini (≈half length)</Button>
          </>
        ) : (
          <Button onClick={startOffline}>Start offline mock</Button>
        )}
        {lastForms.has(examId) && (
          <Button variant="ghost" onClick={reuseLast}>
            <RefreshCw aria-hidden /> Reuse last
          </Button>
        )}
      </div>
      {configured && (
        <p className="text-xs text-muted-foreground">
          Generating uses your provider&apos;s free quota — &quot;Reuse last&quot; replays your previous form without spending it.
        </p>
      )}
    </div>
  );
}
