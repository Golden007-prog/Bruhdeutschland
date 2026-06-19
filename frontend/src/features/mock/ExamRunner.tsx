import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Loader2, Sparkles } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FigureView } from "./FigureView";
import { ListeningPlayer } from "./ListeningPlayer";
import { SpeakingTask } from "./SpeakingTask";
import { SplitExamLayout } from "./SplitExamLayout";
import { ReadingStimulus } from "./ReadingStimulus";
import { ItemReview, QuestionItem } from "./QuestionItem";
import type { ExamSpec } from "@/data/exam-specs";
import { rubricFor } from "@/data/band-descriptors";
import { buildRubricPrompt, RUBRIC_SCHEMA_HINT, type Difficulty } from "@/lib/exam/prompts";
import { generateAdaptiveStage } from "@/lib/exam/generate";
import { routeJSON } from "@/lib/llm/registry";
import { rubricFeedbackSchema, type Figure, type GeneratedExam, type GeneratedSection, type RubricFeedback } from "@/lib/exam/schema";
import { isAnswered, markItem, scoreExam, type AnswerMap, type AnswerValue, type ExamScore } from "@/lib/exam/scoring";
import { SCALE_DISCLAIMER } from "@/lib/exam/scale";
import { recordAttempt, type AttemptRubric } from "@/lib/exam/attempts";
import { clearProgress, saveProgress, type ExamProgress } from "@/lib/exam/examProgress";

type Phase = "run" | "scoring" | "review";

function clock(total: number): string {
  const s = Math.max(0, total);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function sectionTime(spec: ExamSpec, section: GeneratedSection): number {
  return (spec.sections.find((s) => s.skill === section.skill)?.timeMin ?? 30) * 60;
}

/** A compact text description of a Task-1 figure so the rubric can judge description accuracy. */
function figureToText(figure?: Figure): string | undefined {
  if (!figure) return undefined;
  const series = figure.series
    .map((s) => `${s.name}: ${s.points.map((p) => `${p.label}=${p.value}`).join(", ")}`)
    .join(" | ");
  return `Chart "${figure.title}" (${figure.chartType}${figure.yLabel ? `, ${figure.yLabel}` : ""}). Data — ${series}`;
}

/** Local objective accuracy of a section (for adaptive difficulty routing). */
function sectionAccuracy(section: GeneratedSection, answers: AnswerMap): number {
  let earned = 0;
  let possible = 0;
  for (const q of section.objective) {
    const m = markItem(q, answers[q.id]);
    earned += m.earned;
    possible += m.possible;
  }
  return possible > 0 ? earned / possible : 0.5;
}

export function ExamRunner({ exam: initialExam, spec, mode = "full", resume, onRestart }: { exam: GeneratedExam; spec: ExamSpec; mode?: string; resume?: ExamProgress; onRestart: () => void }) {
  const reduce = useReducedMotion();
  const startedAtRef = useRef<number>(resume?.startedAt ?? Date.now());
  const [exam, setExam] = useState<GeneratedExam>(resume?.exam ?? initialExam);
  const [sectionIdx, setSectionIdx] = useState(resume?.sectionIdx ?? 0);
  const [answers, setAnswers] = useState<AnswerMap>(resume?.answers ?? {});
  const [openResponses, setOpenResponses] = useState<Record<string, string>>(resume?.openResponses ?? {});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("run");
  const [timeLeft, setTimeLeft] = useState(
    () => resume?.timeLeft ?? sectionTime(spec, (resume?.exam ?? initialExam).sections[resume?.sectionIdx ?? 0]),
  );
  const [score, setScore] = useState<ExamScore | null>(null);
  const [rubrics, setRubrics] = useState<Record<string, RubricFeedback>>({});
  const [rubricNote, setRubricNote] = useState<string>("");
  const [adapted, setAdapted] = useState<Set<string>>(new Set());
  const [adapting, setAdapting] = useState(false);
  const qRefs = useRef<Record<string, HTMLElement | null>>({});
  const timeLeftRef = useRef(timeLeft);

  const adaptiveSkills = new Set(spec.sections.filter((s) => s.adaptive).map((s) => s.skill));
  const section = exam.sections[sectionIdx];
  const lastSection = sectionIdx === exam.sections.length - 1;
  const isAdaptiveSection = adaptiveSkills.has(section.skill) && !exam.isSeed;
  const needsAdaptStage = isAdaptiveSection && !adapted.has(section.skill);

  // Per-section countdown; auto-advances when it hits zero.
  useEffect(() => {
    if (phase !== "run") return;
    if (timeLeft <= 0) {
      if (lastSection) void submit();
      else goSection(sectionIdx + 1);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, sectionIdx]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Autosave the in-progress attempt for resume-after-refresh (on answer/section changes, not every tick).
  useEffect(() => {
    if (phase !== "run") return;
    saveProgress(exam.examId, {
      exam,
      answers,
      openResponses,
      sectionIdx,
      timeLeft: timeLeftRef.current,
      startedAt: startedAtRef.current,
      savedAt: Date.now(),
    });
  }, [answers, openResponses, sectionIdx, exam, phase]);

  function goSection(idx: number) {
    setSectionIdx(idx);
    setTimeLeft(sectionTime(spec, exam.sections[idx]));
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function toggleFlag(id: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  /** Generate the adapted Stage-2 block at a difficulty derived from Stage-1 accuracy. */
  async function adaptStage() {
    setAdapting(true);
    const pct = sectionAccuracy(section, answers);
    const difficulty: Difficulty = pct < 0.5 ? "easier" : pct > 0.8 ? "harder" : "standard";
    try {
      const stage2 = await generateAdaptiveStage(exam.examId, section.skill, difficulty);
      setExam((prev) => ({
        ...prev,
        sections: prev.sections.map((sec, i) =>
          i === sectionIdx ? { ...sec, objective: [...sec.objective, ...stage2.objective] } : sec,
        ),
      }));
    } catch {
      // No provider / generation failed — continue with Stage 1 only.
    }
    setAdapted((prev) => new Set(prev).add(section.skill));
    setAdapting(false);
  }

  function persist(result: ExamScore, rubricMap: Record<string, RubricFeedback>) {
    const rubricsArr: AttemptRubric[] = exam.sections
      .flatMap((s) => s.open.map((t) => ({ skill: s.skill, task: t })))
      .filter(({ task }) => rubricMap[task.id])
      .map(({ skill, task }) => {
        const fb = rubricMap[task.id];
        return { taskId: task.id, skill, typeLabel: task.typeLabel, bandLow: fb.bandLow, bandHigh: fb.bandHigh, confidence: fb.confidence };
      });
    const finishedAt = Date.now();
    void recordAttempt({
      examId: exam.examId,
      examTitle: exam.title,
      scale: spec.scale,
      mode,
      startedAt: startedAtRef.current,
      finishedAt,
      durationMs: finishedAt - startedAtRef.current,
      score: result,
      rubrics: rubricsArr,
    });
    clearProgress(exam.examId);
  }

  async function submit() {
    setPhase("scoring");
    const result = scoreExam(exam, answers, { bandTable: spec.rawToBand, scale: spec.scale });
    setScore(result);

    // Best-effort AI rubric (with descriptor evidence + range) for answered open tasks.
    const openTasks = exam.sections.flatMap((s) => s.open.map((t) => ({ section: s, task: t })));
    const answered = openTasks.filter(({ task }) => (openResponses[task.id] ?? "").trim().length > 20);
    if (answered.length === 0) {
      persist(result, {});
      setPhase("review");
      return;
    }
    let map: Record<string, RubricFeedback> = {};
    try {
      // Route through the ModelRouter (grade kind → Claude-first with Gemini failover).
      const results = await Promise.allSettled(
        answered.map(({ section: sec, task }) => {
          const rubric = rubricFor(spec.id, sec.skill);
          return routeJSON(
            rubricFeedbackSchema,
            buildRubricPrompt(spec.title, task.prompt, openResponses[task.id], rubric.criteria, {
              stimulus: figureToText(sec.figure),
              minWords: task.minWords,
            }),
            RUBRIC_SCHEMA_HINT,
            { temperature: 0.2 },
            "grade",
          ).then((r) => r.result);
        }),
      );
      const m: Record<string, RubricFeedback> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") m[answered[i].task.id] = r.value;
      });
      map = m;
      setRubrics(m);
      if (Object.keys(m).length === 0) setRubricNote("AI feedback wasn't available — your writing/speaking isn't auto-scored.");
    } catch {
      setRubricNote("Connect an AI provider (Settings) to get rubric feedback on Writing & Speaking.");
    }
    persist(result, map);
    setPhase("review");
  }

  if (phase === "review" && score) {
    return <ReviewScreen exam={exam} spec={spec} answers={answers} openResponses={openResponses} score={score} rubrics={rubrics} rubricNote={rubricNote} onRestart={onRestart} />;
  }

  const objectiveCount = section.objective.length;
  const answeredInSection = section.objective.filter((q) => isAnswered(q, answers[q.id])).length;

  return (
    <div className="space-y-5">
      {exam.isSeed && (
        <Alert variant="warning" className="text-xs">
          <AlertDescription>Offline practice form (generated content unavailable). Add a free Gemini key in Settings for fresh, adaptive exams every time.</AlertDescription>
        </Alert>
      )}

      {/* Sticky section header with timer */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card/95 p-3 backdrop-blur">
        <div>
          <p className="eyebrow">Section {sectionIdx + 1} / {exam.sections.length}{isAdaptiveSection && <> · <span className="text-primary">adaptive</span></>}</p>
          <h2 className="font-semibold">{section.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className={`inline-flex items-center gap-1.5 official-figure text-sm font-semibold ${timeLeft <= 30 ? "text-red-600" : ""}`} role="timer" aria-live={timeLeft <= 30 ? "assertive" : "off"}>
            <Clock className="h-4 w-4" aria-hidden /> {clock(timeLeft)}
          </p>
        </div>
      </div>

      {isAdaptiveSection && (
        <Alert variant="info" className="text-xs">
          <Sparkles aria-hidden />
          <AlertDescription>
            Multistage-adaptive section — your Stage-1 answers set the difficulty of the Stage-2 items.
          </AlertDescription>
        </Alert>
      )}

      {section.instructions && <p className="text-sm text-muted-foreground">{section.instructions}</p>}

      {/* Split exam layout: stimulus pinned left, questions/essay scroll right (real IELTS/TOEFL). */}
      {(() => {
        const stimulus =
          section.skill === "listening" && section.passages.length > 0 ? (
            <ListeningPlayer passages={section.passages} lang={spec.ttsLang} nonce={exam.nonce} />
          ) : section.skill === "reading" && section.passages.length > 0 ? (
            <ReadingStimulus passages={section.passages} nonce={exam.nonce} />
          ) : section.figure ? (
            <FigureView figure={section.figure} />
          ) : null;
        const stimulusLabel =
          section.skill === "listening" ? "Audio" : section.skill === "reading" ? "Reading passage" : "Figure";

        const work = (
          <div className="space-y-5">
            {objectiveCount > 0 && (
              <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-2 pt-1 backdrop-blur">
                <div className="flex flex-wrap gap-1.5" aria-label="Question navigator">
                  {section.objective.map((q, i) => {
                    const done = isAnswered(q, answers[q.id]);
                    const flag = flagged.has(q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => qRefs.current[q.id]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })}
                        className={`relative h-7 w-7 rounded text-xs official-figure ${done ? "bg-primary text-primary-foreground" : "border bg-card"} ${flag ? "ring-2 ring-amber-400" : ""}`}
                        aria-label={`Question ${i + 1}${done ? ", answered" : ""}${flag ? ", flagged" : ""}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <p className="official-figure mt-1 text-xs text-muted-foreground">{answeredInSection}/{objectiveCount} answered in this section</p>
              </div>
            )}

            {objectiveCount > 0 && (
              <ol className="space-y-5">
                {section.objective.map((q, i) => (
                  <li key={q.id} ref={(el) => { qRefs.current[q.id] = el; }} className="scroll-mt-24 rounded-md border bg-card p-4">
                    <QuestionItem q={q} index={i} answer={answers[q.id]} flagged={flagged.has(q.id)} onAnswer={(v) => setAnswer(q.id, v)} onFlag={() => toggleFlag(q.id)} />
                  </li>
                ))}
              </ol>
            )}

            {section.open.length > 0 && (
              <div className="space-y-5">
                {section.open.map((t) =>
                  section.skill === "speaking" ? (
                    <div key={t.id} className="rounded-md border bg-card p-4">
                      <SpeakingTask task={t} lang={spec.ttsLang} value={openResponses[t.id] ?? ""} onChange={(v) => setOpenResponses((o) => ({ ...o, [t.id]: v }))} />
                    </div>
                  ) : (
                    <WritingTask key={t.id} task={t} value={openResponses[t.id] ?? ""} onChange={(v) => setOpenResponses((o) => ({ ...o, [t.id]: v }))} />
                  ),
                )}
              </div>
            )}
          </div>
        );

        return stimulus ? (
          <SplitExamLayout stimulus={stimulus} work={work} stimulusLabel={stimulusLabel} workLabel="Questions" />
        ) : (
          work
        );
      })()}

      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={sectionIdx === 0} onClick={() => goSection(sectionIdx - 1)}>
          <ChevronLeft aria-hidden /> Previous
        </Button>
        {needsAdaptStage ? (
          <Button size="sm" onClick={() => void adaptStage()} disabled={adapting}>
            {adapting ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {adapting ? "Adapting difficulty…" : "Continue — adapt difficulty"}
          </Button>
        ) : lastSection ? (
          <Button size="sm" onClick={() => void submit()}>Submit exam</Button>
        ) : (
          <Button size="sm" onClick={() => goSection(sectionIdx + 1)}>
            Next section <ChevronRight aria-hidden />
          </Button>
        )}
      </div>

      {phase === "scoring" && (
        <p aria-live="polite" className="text-center text-sm text-muted-foreground">Scoring your answers…</p>
      )}
    </div>
  );
}

function WritingTask({ task, value, onChange }: { task: { id: string; typeLabel: string; prompt: string; guidance?: string; minWords?: number }; value: string; onChange: (v: string) => void }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const ok = !task.minWords || words >= task.minWords;
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="eyebrow">{task.typeLabel}</p>
      <p className="mt-1 whitespace-pre-line font-medium">{task.prompt}</p>
      {task.guidance && <p className="mt-1 text-sm text-muted-foreground">{task.guidance}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        rows={8}
        aria-label={`${task.typeLabel} response`}
        className="mt-3 w-full rounded-md border bg-card p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Write your response here…"
      />
      <p className={`official-figure mt-1 text-xs ${ok ? "text-muted-foreground" : "text-amber-700"}`}>
        {words} words{task.minWords ? ` · target ≥ ${task.minWords}` : ""} · paste disabled, like the real test
      </p>
    </div>
  );
}

function ReviewScreen({ exam, spec, answers, openResponses, score, rubrics, rubricNote, onRestart }: {
  exam: GeneratedExam;
  spec: ExamSpec;
  answers: AnswerMap;
  openResponses: Record<string, string>;
  score: ExamScore;
  rubrics: Record<string, RubricFeedback>;
  rubricNote: string;
  onRestart: () => void;
}) {
  const reduce = useReducedMotion();
  const headline = score.overallBand !== undefined ? `${spec.bandLabel ?? "Band"} ${score.overallBand}` : `${score.percent}%`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <p className="eyebrow">Result · {exam.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score.correct}/{score.total} objective marks ({score.percent}%).
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {score.cefr && <Badge variant="secondary">CEFR {score.cefr}</Badge>}
            {score.concordance120 && <Badge variant="secondary">≈ {score.concordance120.rep}/120</Badge>}
          </div>
          {score.hasOpenTasks && <p className="mt-1 text-xs text-muted-foreground">Writing/Speaking estimated by AI rubric — only a certified examiner gives a real score.</p>}
        </div>
        <motion.div initial={reduce ? undefined : { scale: 0.8, opacity: 0 }} animate={reduce ? undefined : { scale: 1, opacity: 1 }} className="stamp-seal flex h-24 w-24 flex-col items-center justify-center rounded-full text-center">
          <span className="official-figure text-xl font-bold leading-none">{headline}</span>
          <span className="mt-0.5 text-[0.55rem] uppercase tracking-wide opacity-70">indicative</span>
        </motion.div>
      </div>

      <Alert variant="info" className="text-xs">
        <AlertDescription>{SCALE_DISCLAIMER}</AlertDescription>
      </Alert>

      {/* Per-section bands */}
      {score.sections.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {score.sections.map((s) => (
            <div key={s.title} className="rounded-md border bg-card p-3">
              <p className="eyebrow">{s.title}</p>
              <p className="official-figure mt-1 text-lg font-semibold">{s.band !== undefined ? `${spec.bandLabel ?? "Band"} ${s.band}` : `${s.correct}/${s.total}`}</p>
              <Progress value={s.total ? (s.correct / s.total) * 100 : 0} label={`${s.title} ${s.correct}/${s.total}`} className="mt-2 h-1.5" indicatorClassName="bg-category-language" />
            </div>
          ))}
        </div>
      )}

      {/* AI rubric feedback with descriptor evidence + range */}
      {Object.keys(rubrics).length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Writing & Speaking feedback</h3>
          {exam.sections.flatMap((s) => s.open).map((t) => {
            const fb = rubrics[t.id];
            if (!fb) return null;
            return (
              <div key={t.id} className="rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{t.typeLabel}</p>
                  <Badge variant="secondary">Estimated {fb.bandLow}–{fb.bandHigh} · {fb.confidence} confidence</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{fb.summary}</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {fb.criteria.map((c) => (
                    <li key={c.name} className="rounded-md border border-dashed p-2">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{c.name}</span>
                        <span className="official-figure">{c.score}/{c.max}</span>
                      </div>
                      {c.evidence && <p className="mt-0.5 text-xs italic text-muted-foreground">Evidence: {c.evidence}</p>}
                      <p className="mt-0.5 text-xs text-foreground/80">{c.comment}</p>
                    </li>
                  ))}
                </ul>
                {fb.improvements.length > 0 && (
                  <div className="mt-2">
                    <p className="eyebrow">To improve</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {fb.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
      {rubricNote && <Alert variant="info" className="text-xs"><AlertDescription>{rubricNote}</AlertDescription></Alert>}

      {/* Objective review (all item types) */}
      <section className="space-y-3">
        <h3 className="font-semibold">Answer review</h3>
        {exam.sections.map((sec) =>
          sec.objective.length === 0 ? null : (
            <div key={sec.skill} className="space-y-2">
              <p className="eyebrow">{sec.title}</p>
              {sec.objective.map((q, i) => (
                <ItemReview key={q.id} q={q} index={i} answer={answers[q.id]} />
              ))}
            </div>
          ),
        )}
      </section>

      {/* Transcripts revealed at review */}
      {exam.sections.some((s) => s.skill === "listening" && s.passages.length > 0) && (
        <section className="space-y-2">
          <h3 className="font-semibold">Listening transcripts</h3>
          {exam.sections.filter((s) => s.skill === "listening").flatMap((s) => s.passages).map((p) => (
            <details key={p.id} className="rounded-md border bg-card p-3 text-sm">
              <summary className="cursor-pointer font-medium">{p.title}</summary>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.body}</p>
            </details>
          ))}
        </section>
      )}

      {/* Your written responses */}
      {Object.keys(openResponses).length > 0 && (
        <section className="space-y-2">
          <h3 className="font-semibold">Your responses</h3>
          {exam.sections.flatMap((s) => s.open).map((t) => openResponses[t.id] ? (
            <div key={t.id} className="rounded-md border bg-card p-3 text-sm">
              <p className="eyebrow">{t.typeLabel}</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{openResponses[t.id]}</p>
            </div>
          ) : null)}
        </section>
      )}

      <Button onClick={onRestart}>Generate a new exam</Button>
    </div>
  );
}
