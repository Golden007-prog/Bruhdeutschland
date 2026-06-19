import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Clock, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { MockExamDef } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "intro" | "running" | "results";

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * A self-contained practice-exam engine. Practice items are clearly labelled "practice — not the
 * official test"; the format/section info is the official-grounded part (with sources shown by the
 * page), while the questions themselves are generated study aids. Includes a countdown timer that
 * auto-submits at zero, keyboard-operable choices, and a scored review with explanations.
 */
export function MockExamRunner({ exam, className }: { exam: MockExamDef; className?: string }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMin * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = exam.questions.length;
  const correctCount = useMemo(
    () => exam.questions.filter((q) => answers[q.id] === q.answerId).length,
    [exam.questions, answers],
  );
  const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
  const passed = scorePct >= exam.passPct;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stopTimer();
    setPhase("results");
  }, [stopTimer]);

  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, stopTimer]);

  // Auto-submit when the clock hits zero.
  useEffect(() => {
    if (phase === "running" && secondsLeft === 0) finish();
  }, [phase, secondsLeft, finish]);

  const start = () => {
    stopTimer(); // defensive: never leave a stray interval running before re-arming
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(exam.durationMin * 60);
    setPhase("running");
  };
  const reset = () => {
    stopTimer();
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(exam.durationMin * 60);
    setPhase("intro");
  };

  if (phase === "intro") {
    return (
      <section className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
        <p className="eyebrow">Übungstest · Practice exam</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{exam.title}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Questions" value={String(total)} />
          <Stat label="Time" value={`${exam.durationMin} min`} />
          <Stat label="Practice pass" value={`${exam.passPct}%`} />
        </div>
        {exam.sections && exam.sections.length > 0 && (
          <div className="mt-5">
            <p className="eyebrow mb-2">Official format</p>
            <ul className="divide-y rounded-md border">
              {exam.sections.map((s) => (
                <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-2 p-3 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="official-figure text-muted-foreground">{s.durationMin} min</span>
                  <span className="w-full text-xs text-muted-foreground sm:w-auto">{s.format}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          Practice questions are study aids, not real exam items. Score thresholds and formats are
          program-specific — confirm requirements with the official source.
        </div>
        <Button className="mt-5" onClick={start}>
          Start practice
        </Button>
      </section>
    );
  }

  if (phase === "running") {
    const q = exam.questions[current];
    const answeredCount = Object.keys(answers).length;
    const low = secondsLeft <= 30;
    return (
      <section className={cn("rounded-lg border bg-card p-6 shadow-sm", className)} aria-label={`${exam.title} in progress`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="official-figure text-sm text-muted-foreground">
            Question <span className="font-semibold text-foreground">{current + 1}</span> / {total}
          </p>
          <p
            className={cn("inline-flex items-center gap-1.5 official-figure text-sm font-semibold", low ? "text-red-600" : "text-foreground")}
            role="timer"
            aria-live={low ? "assertive" : "off"}
          >
            <Clock className="h-4 w-4" aria-hidden />
            {formatClock(secondsLeft)}
          </p>
        </div>
        <Progress value={(answeredCount / total) * 100} label={`${answeredCount} of ${total} answered`} className="mt-3 h-1.5" />

        <div className="mt-5">
          {q.section && <p className="eyebrow mb-1">{q.section}</p>}
          {q.passage && (
            <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed text-foreground/90">
              {q.passage}
            </div>
          )}
          <fieldset>
            <legend className="text-base font-medium leading-snug">{q.prompt}</legend>
            <div className="mt-3 space-y-2">
              {q.choices.map((choice) => {
                const selected = answers[q.id] === choice.id;
                return (
                  <label
                    key={choice.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50",
                      selected && "border-primary bg-primary/5",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={selected}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: choice.id }))}
                    />
                    <span>{choice.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <Separator className="my-5" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
            Previous
          </Button>
          {current < total - 1 ? (
            <Button size="sm" onClick={() => setCurrent((c) => c + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={finish}>
              Submit ({answeredCount}/{total})
            </Button>
          )}
        </div>
      </section>
    );
  }

  // results
  return (
    <section className={cn("rounded-lg border bg-card p-6 shadow-sm", className)} aria-label={`${exam.title} results`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Ergebnis · Result</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{exam.title}</h2>
        </div>
        <div
          className={cn(
            "stamp-seal flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full text-center",
            !passed && "stamp-seal--unverified",
          )}
          role="img"
          aria-label={`Score ${scorePct} percent, ${passed ? "above" : "below"} the ${exam.passPct} percent practice threshold`}
        >
          <span className="official-figure text-2xl font-bold leading-none">{scorePct}%</span>
          <span className="mt-0.5 text-[0.6rem] uppercase tracking-wide opacity-70">{passed ? "Pass" : "Retry"}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Correct" value={`${correctCount}/${total}`} />
        <Stat label="Score" value={`${scorePct}%`} />
        <Stat label="Practice pass" value={`${exam.passPct}%`} />
      </div>

      <div className="mt-6 space-y-3">
        <p className="eyebrow">Review</p>
        {exam.questions.map((q, i) => {
          const picked = answers[q.id];
          const isCorrect = picked === q.answerId;
          return (
            <div key={q.id} className={cn("rounded-md border p-4", isCorrect ? "border-emerald-200" : "border-red-200")}>
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                  )}
                >
                  {isCorrect ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span className="official-figure mr-1 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    {q.prompt}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Correct: {q.choices.find((c) => c.id === q.answerId)?.text}
                    {picked && !isCorrect && (
                      <>
                        {" · "}You chose: {q.choices.find((c) => c.id === picked)?.text}
                      </>
                    )}
                    {!picked && <> · Not answered</>}
                  </p>
                  {q.explanation && <p className="mt-1 text-xs text-foreground/80">{q.explanation}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button className="mt-6 gap-2" variant="outline" onClick={reset}>
        <RotateCcw aria-hidden /> Try again
      </Button>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="eyebrow">{label}</p>
      <p className="official-figure mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
