import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Clock, Flag, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MathText } from "./MathText";
import { FigureView } from "./FigureView";
import { ListeningPlayer } from "./ListeningPlayer";
import { SpeakingTask } from "./SpeakingTask";
import type { ExamSpec } from "@/data/exam-specs";
import { buildRubricPrompt, RUBRIC_SCHEMA_HINT } from "@/lib/exam/prompts";
import { resolveProvider } from "@/lib/llm/registry";
import { rubricFeedbackSchema, type GeneratedExam, type GeneratedSection, type ObjectiveQuestion, type RubricFeedback } from "@/lib/exam/schema";
import { scoreExam, type AnswerMap, type ExamScore } from "@/lib/exam/scoring";

type Phase = "run" | "scoring" | "review";

function clock(total: number): string {
  const s = Math.max(0, total);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function sectionTime(spec: ExamSpec, section: GeneratedSection): number {
  return (spec.sections.find((s) => s.skill === section.skill)?.timeMin ?? 30) * 60;
}

export function ExamRunner({ exam, spec, onRestart }: { exam: GeneratedExam; spec: ExamSpec; onRestart: () => void }) {
  const reduce = useReducedMotion();
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [openResponses, setOpenResponses] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("run");
  const [timeLeft, setTimeLeft] = useState(() => sectionTime(spec, exam.sections[0]));
  const [score, setScore] = useState<ExamScore | null>(null);
  const [rubrics, setRubrics] = useState<Record<string, RubricFeedback>>({});
  const [rubricNote, setRubricNote] = useState<string>("");
  const qRefs = useRef<Record<string, HTMLElement | null>>({});

  const section = exam.sections[sectionIdx];
  const lastSection = sectionIdx === exam.sections.length - 1;

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

  async function submit() {
    setPhase("scoring");
    const result = scoreExam(exam, answers, { bandTable: spec.rawToBand, scale: spec.scale });
    setScore(result);

    // Best-effort AI rubric for answered open tasks.
    const openTasks = exam.sections.flatMap((s) => s.open.map((t) => ({ section: s, task: t })));
    const answered = openTasks.filter(({ task }) => (openResponses[task.id] ?? "").trim().length > 20);
    if (answered.length === 0) {
      setPhase("review");
      return;
    }
    try {
      const provider = await resolveProvider();
      const criteria = spec.id === "ielts"
        ? ["Task Achievement/Response", "Coherence & Cohesion", "Lexical Resource", "Grammatical Range & Accuracy"]
        : ["Content", "Organization", "Language"];
      const results = await Promise.allSettled(
        answered.map(({ task }) =>
          provider.generateJSON(rubricFeedbackSchema, buildRubricPrompt(spec, task.prompt, openResponses[task.id], criteria), RUBRIC_SCHEMA_HINT, { temperature: 0.4 }),
        ),
      );
      const map: Record<string, RubricFeedback> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") map[answered[i].task.id] = r.value;
      });
      setRubrics(map);
      if (Object.keys(map).length === 0) setRubricNote("AI feedback wasn't available — your writing/speaking isn't auto-scored.");
    } catch {
      setRubricNote("Connect an AI provider (Settings) to get rubric feedback on Writing & Speaking.");
    }
    setPhase("review");
  }

  if (phase === "review" && score) {
    return <ReviewScreen exam={exam} spec={spec} answers={answers} openResponses={openResponses} score={score} rubrics={rubrics} rubricNote={rubricNote} onRestart={onRestart} />;
  }

  const objectiveCount = section.objective.length;
  const answeredInSection = section.objective.filter((q) => answers[q.id]).length;

  return (
    <div className="space-y-5">
      {exam.isSeed && (
        <Alert variant="warning" className="text-xs">
          <AlertDescription>Offline practice form (generated content unavailable). Add a free Gemini key in Settings for fresh exams every time.</AlertDescription>
        </Alert>
      )}

      {/* Sticky section header with timer */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card/95 p-3 backdrop-blur">
        <div>
          <p className="eyebrow">Section {sectionIdx + 1} / {exam.sections.length}</p>
          <h2 className="font-semibold">{section.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className={`inline-flex items-center gap-1.5 official-figure text-sm font-semibold ${timeLeft <= 30 ? "text-red-600" : ""}`} role="timer" aria-live={timeLeft <= 30 ? "assertive" : "off"}>
            <Clock className="h-4 w-4" aria-hidden /> {clock(timeLeft)}
          </p>
        </div>
      </div>

      {section.instructions && <p className="text-sm text-muted-foreground">{section.instructions}</p>}

      {/* Listening audio */}
      {section.skill === "listening" && section.passages.length > 0 && (
        <ListeningPlayer passages={section.passages} lang={spec.ttsLang} nonce={exam.nonce} />
      )}

      {/* Reading passages */}
      {section.skill === "reading" &&
        section.passages.map((p) => (
          <article key={p.id} className="rounded-md border bg-muted/20 p-4">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{p.body}</p>
          </article>
        ))}

      {/* Writing figure */}
      {section.figure && <FigureView figure={section.figure} />}

      {/* Objective questions */}
      {objectiveCount > 0 && (
        <>
          {/* Question palette */}
          <div className="flex flex-wrap gap-1.5" aria-label="Question navigator">
            {section.objective.map((q, i) => {
              const done = !!answers[q.id];
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
          <p className="official-figure text-xs text-muted-foreground">{answeredInSection}/{objectiveCount} answered in this section</p>

          <ol className="space-y-5">
            {section.objective.map((q, i) => (
              <li key={q.id} ref={(el) => { qRefs.current[q.id] = el; }} className="scroll-mt-24 rounded-md border bg-card p-4">
                <QuestionView
                  q={q}
                  index={i}
                  selected={typeof answers[q.id] === "string" ? (answers[q.id] as string) : undefined}
                  flagged={flagged.has(q.id)}
                  onSelect={(cid) => setAnswers((a) => ({ ...a, [q.id]: cid }))}
                  onFlag={() => toggleFlag(q.id)}
                />
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Writing / Speaking open tasks */}
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

      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={sectionIdx === 0} onClick={() => goSection(sectionIdx - 1)}>
          <ChevronLeft aria-hidden /> Previous
        </Button>
        {lastSection ? (
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

function QuestionView({ q, index, selected, flagged, onSelect, onFlag }: {
  q: ObjectiveQuestion;
  index: number;
  selected: string | undefined;
  flagged: boolean;
  onSelect: (choiceId: string) => void;
  onFlag: () => void;
}) {
  return (
    <fieldset>
      <div className="flex items-start justify-between gap-2">
        <legend className="font-medium">
          <span className="official-figure mr-2 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <MathText text={q.prompt} />
        </legend>
        <button type="button" onClick={onFlag} aria-pressed={flagged} aria-label={flagged ? "Unflag question" : "Flag for review"} className={`shrink-0 rounded p-1 ${flagged ? "text-amber-600" : "text-muted-foreground hover:text-foreground"}`}>
          <Flag className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="eyebrow mt-1 !tracking-[0.12em]">{q.typeLabel}</p>
      <div className="mt-3 space-y-2">
        {q.choices.map((c) => {
          const isSel = selected === c.id;
          return (
            <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted/50 ${isSel ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" name={q.id} className="h-4 w-4 accent-[hsl(var(--primary))]" checked={isSel} onChange={() => onSelect(c.id)} />
              <MathText text={c.text} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function WritingTask({ task, value, onChange }: { task: { id: string; typeLabel: string; prompt: string; guidance?: string; minWords?: number }; value: string; onChange: (v: string) => void }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const ok = !task.minWords || words >= task.minWords;
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="eyebrow">{task.typeLabel}</p>
      <p className="mt-1 font-medium">{task.prompt}</p>
      {task.guidance && <p className="mt-1 text-sm text-muted-foreground">{task.guidance}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        aria-label={`${task.typeLabel} response`}
        className="mt-3 w-full rounded-md border bg-card p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Write your response here…"
      />
      <p className={`official-figure mt-1 text-xs ${ok ? "text-muted-foreground" : "text-amber-700"}`}>
        {words} words{task.minWords ? ` · target ≥ ${task.minWords}` : ""}
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
            {score.correct}/{score.total} objective questions correct ({score.percent}%).
          </p>
          {score.hasOpenTasks && <p className="text-xs text-muted-foreground">Writing/Speaking estimated by AI rubric — only a certified examiner gives a real score.</p>}
        </div>
        <motion.div initial={reduce ? undefined : { scale: 0.8, opacity: 0 }} animate={reduce ? undefined : { scale: 1, opacity: 1 }} className="stamp-seal flex h-24 w-24 flex-col items-center justify-center rounded-full text-center">
          <span className="official-figure text-xl font-bold leading-none">{headline}</span>
          <span className="mt-0.5 text-[0.55rem] uppercase tracking-wide opacity-70">indicative</span>
        </motion.div>
      </div>

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

      {/* AI rubric feedback */}
      {Object.keys(rubrics).length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">Writing & Speaking feedback</h3>
          {exam.sections.flatMap((s) => s.open).map((t) => {
            const fb = rubrics[t.id];
            if (!fb) return null;
            return (
              <div key={t.id} className="rounded-md border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{t.typeLabel}</p>
                  <Badge variant="secondary">Estimated {fb.estimatedBand}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{fb.summary}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {fb.criteria.map((c) => (
                    <li key={c.name} className="flex justify-between gap-3 border-b border-dashed py-1">
                      <span>{c.name}</span>
                      <span className="official-figure">{c.score}/{c.max}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
      {rubricNote && <Alert variant="info" className="text-xs"><AlertDescription>{rubricNote}</AlertDescription></Alert>}

      {/* Objective review */}
      <section className="space-y-3">
        <h3 className="font-semibold">Answer review</h3>
        {exam.sections.map((section) =>
          section.objective.length === 0 ? null : (
            <div key={section.skill} className="space-y-2">
              <p className="eyebrow">{section.title}</p>
              {section.objective.map((q, i) => {
                const picked = answers[q.id];
                const correct = picked === q.answerId;
                return (
                  <div key={q.id} className={`rounded-md border p-3 ${correct ? "border-emerald-200" : "border-red-200"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {correct ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium"><span className="official-figure mr-1 text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><MathText text={q.prompt} /></p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Correct: <MathText text={q.choices.find((c) => c.id === q.answerId)?.text ?? ""} />
                          {picked && !correct && <> · You chose: <MathText text={q.choices.find((c) => c.id === picked)?.text ?? ""} /></>}
                          {!picked && <> · Not answered</>}
                        </p>
                        <p className="mt-1 text-xs text-foreground/80"><MathText text={q.explanation} /></p>
                        {q.sourceRef && <p className="mt-1 text-xs italic text-muted-foreground">Source: {q.sourceRef}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
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
