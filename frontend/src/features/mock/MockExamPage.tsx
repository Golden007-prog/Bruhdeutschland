import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, RefreshCw, Sparkles, WifiOff } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EXAM_SPECS } from "@/data/exam-specs";
import { generateExam, type GenMode, type GenProgress } from "@/lib/exam/generate";
import { anyProviderConfigured } from "@/lib/llm/registry";
import type { GeneratedExam } from "@/lib/exam/schema";
import { ExamRunner } from "./ExamRunner";
import { GenerationLoader } from "./GenerationLoader";

type Phase = "intro" | "generating" | "running";

/** In-memory cache of the last form per exam (for "Reuse last" without re-generating). */
const lastForms = new Map<string, GeneratedExam>();

/**
 * Reusable mock-exam page body (work-order §5B/§5C). Shows the official format (with provenance),
 * the provider status, and mode options; generates a fresh exam (or reuses the last / offline seed),
 * then hands off to the {@link ExamRunner}. The owning page supplies the PageHeader above this.
 */
export function MockExamPage({ examId }: { examId: string }) {
  const spec = EXAM_SPECS[examId];
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState<GenProgress | null>(null);
  const [exam, setExam] = useState<GeneratedExam | null>(null);
  const [error, setError] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const configured = anyProviderConfigured();

  async function generate(mode: GenMode) {
    setError("");
    setProgress(null);
    setPhase("generating");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const form = await generateExam(examId, { mode, signal: ctrl.signal, onProgress: setProgress });
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

  function reuseLast() {
    const form = lastForms.get(examId);
    if (form) {
      setExam(form);
      setPhase("running");
    }
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
    return <ExamRunner exam={exam} spec={spec} onRestart={() => setPhase("intro")} />;
  }

  // intro
  return (
    <div className="space-y-5">
      <Alert variant="info" className="text-xs">
        <Info aria-hidden />
        <AlertDescription>
          Practice items are AI-generated study aids — not the real test, and not score-equivalent.
          The official format below is sourced; verify requirements with the test owner.
        </AlertDescription>
      </Alert>

      {!configured && (
        <Alert variant="warning" className="text-xs">
          <WifiOff aria-hidden />
          <AlertDescription>
            No AI provider set, so exams use a bundled offline form. Add a free Google Gemini key in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> for a fresh, full-length exam every time.
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
            <li key={s.skill} className="flex flex-wrap items-baseline justify-between gap-2 p-3 text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="official-figure text-muted-foreground">
                {s.questions > 0 ? `${s.questions} Q` : `${s.openTasks ?? 0} task${(s.openTasks ?? 0) > 1 ? "s" : ""}`} · {s.timeMin} min
              </span>
              <span className="w-full text-xs text-muted-foreground sm:w-auto">{s.format}</span>
            </li>
          ))}
        </ul>
        <a href={spec.provenance.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {spec.provenance.source_name} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </section>

      {error && <Alert variant="danger" className="text-xs"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => generate("full")}>
          <Sparkles aria-hidden /> Generate full exam
        </Button>
        <Button variant="outline" onClick={() => generate("mini")}>Mini (≈half length)</Button>
        {lastForms.has(examId) && (
          <Button variant="ghost" onClick={reuseLast}>
            <RefreshCw aria-hidden /> Reuse last
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Generating uses your provider&apos;s free quota — &quot;Reuse last&quot; replays your previous form without spending it.
      </p>
    </div>
  );
}
