import { Check, Flag, GripVertical, X } from "lucide-react";

import { MathText } from "./MathText";
import type { ObjectiveQuestion } from "@/lib/exam/schema";
import { markItem, type AnswerValue } from "@/lib/exam/scoring";
import { cn } from "@/lib/utils";

/**
 * Renders one objective item for every authentic response type (work-order §3): single MCQ /
 * True-False-Not-Given, multi-select, text gap-fill / "Complete the Words", matching
 * (headings/features/info), and ordering / "Build a Sentence". All marking stays deterministic
 * (scoring.ts) — this component only collects the answer in its item-type shape.
 */
export function QuestionItem({
  q,
  index,
  answer,
  flagged,
  onAnswer,
  onFlag,
}: {
  q: ObjectiveQuestion;
  index: number;
  answer: AnswerValue | undefined;
  flagged: boolean;
  onAnswer: (v: AnswerValue) => void;
  onFlag: () => void;
}) {
  const rt = q.responseType ?? "single";
  return (
    <fieldset>
      <div className="flex items-start justify-between gap-2">
        <legend className="font-medium">
          <span className="official-figure mr-2 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <MathText text={q.prompt} />
        </legend>
        <button
          type="button"
          onClick={onFlag}
          aria-pressed={flagged}
          aria-label={flagged ? "Unflag question" : "Flag for review"}
          className={cn("shrink-0 rounded p-1", flagged ? "text-amber-600" : "text-muted-foreground hover:text-foreground")}
        >
          <Flag className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="eyebrow mt-1 !tracking-[0.12em]">{q.typeLabel}</p>

      <div className="mt-3">
        {rt === "single" && <SingleChoice q={q} selected={typeof answer === "string" ? answer : undefined} onSelect={onAnswer} />}
        {rt === "multi" && <MultiChoice q={q} selected={Array.isArray(answer) ? answer : []} onChange={onAnswer} />}
        {rt === "text" && <TextEntry q={q} value={typeof answer === "string" ? answer : ""} onChange={onAnswer} />}
        {rt === "matching" && <Matching q={q} value={answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}} onChange={onAnswer} />}
        {rt === "ordering" && <Ordering q={q} value={Array.isArray(answer) ? answer : []} onChange={onAnswer} />}
      </div>
    </fieldset>
  );
}

function SingleChoice({ q, selected, onSelect }: { q: ObjectiveQuestion; selected?: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {q.choices.map((c) => {
        const isSel = selected === c.id;
        return (
          <label key={c.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted/50", isSel && "border-primary bg-primary/5")}>
            <input type="radio" name={q.id} className="h-4 w-4 accent-[hsl(var(--primary))]" checked={isSel} onChange={() => onSelect(c.id)} />
            <MathText text={c.text} />
          </label>
        );
      })}
    </div>
  );
}

function MultiChoice({ q, selected, onChange }: { q: ObjectiveQuestion; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Select all that apply.</p>
      {q.choices.map((c) => {
        const isSel = selected.includes(c.id);
        return (
          <label key={c.id} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted/50", isSel && "border-primary bg-primary/5")}>
            <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={isSel} onChange={() => toggle(c.id)} />
            <MathText text={c.text} />
          </label>
        );
      })}
    </div>
  );
}

function TextEntry({ q, value, onChange }: { q: ObjectiveQuestion; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Answer for ${q.typeLabel}`}
      placeholder="Type your answer…"
      className="w-full max-w-sm rounded-md border bg-card p-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function Matching({ q, value, onChange }: { q: ObjectiveQuestion; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <div className="space-y-2">
      {(q.pairs ?? []).map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
          <span className="min-w-0 flex-1"><MathText text={p.leftText} /></span>
          <label className="sr-only" htmlFor={`${q.id}-${p.id}`}>Match for {p.leftText}</label>
          <select
            id={`${q.id}-${p.id}`}
            value={value[p.id] ?? ""}
            onChange={(e) => onChange({ ...value, [p.id]: e.target.value })}
            className="h-9 max-w-[60%] rounded-md border bg-card px-2 text-sm"
          >
            <option value="">— choose —</option>
            {q.choices.map((c) => (
              <option key={c.id} value={c.id}>{c.text}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function Ordering({ q, value, onChange }: { q: ObjectiveQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const tokens = q.tokens ?? [];
  const placed = value;
  const remaining = tokens.filter((t) => !placed.includes(t.id));
  const label = (id: string) => tokens.find((t) => t.id === id)?.text ?? id;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tap words in order to build the sentence; tap a placed word to remove it.</p>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-dashed bg-muted/20 p-2">
        {placed.length === 0 && <span className="text-xs text-muted-foreground">Your sentence appears here…</span>}
        {placed.map((id, i) => (
          <button
            key={`${id}-${i}`}
            type="button"
            onClick={() => onChange(placed.filter((_, j) => j !== i))}
            className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary/10 px-2 py-1 text-sm text-primary"
          >
            <GripVertical className="h-3 w-3 opacity-50" aria-hidden /> {label(id)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {remaining.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange([...placed, t.id])}
            className="rounded-md border bg-card px-2 py-1 text-sm hover:bg-muted"
          >
            {t.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Review rendering for one item: shows the user's answer vs the correct answer, by type. */
export function ItemReview({ q, index, answer }: { q: ObjectiveQuestion; index: number; answer: AnswerValue | undefined }) {
  const rt = q.responseType ?? "single";
  const { earned, possible } = markItem(q, answer);
  const correct = possible > 0 && earned === possible;
  const partial = earned > 0 && earned < possible;
  const choiceText = (id: string) => q.choices.find((c) => c.id === id)?.text ?? id;

  return (
    <div className={cn("rounded-md border p-3", correct ? "border-emerald-200" : partial ? "border-amber-200" : "border-red-200")}>
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
          {correct ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium">
            <span className="official-figure mr-1 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
            <MathText text={q.prompt} />
            {possible > 1 && <span className="official-figure ml-2 text-xs text-muted-foreground">{earned}/{possible}</span>}
          </p>

          {rt === "single" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Correct: <MathText text={choiceText(q.answerId ?? "")} />
              {typeof answer === "string" && answer && answer !== q.answerId && <> · You chose: <MathText text={choiceText(answer)} /></>}
              {!answer && <> · Not answered</>}
            </p>
          )}

          {rt === "multi" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Correct: {(q.answerIds ?? []).map(choiceText).join(", ")}
              {Array.isArray(answer) && answer.length > 0 && <> · You chose: {answer.map(choiceText).join(", ")}</>}
            </p>
          )}

          {rt === "text" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Accepted: {(q.acceptable ?? []).join(" / ")}
              {typeof answer === "string" && answer && <> · You wrote: “{answer}”</>}
              {!answer && <> · Not answered</>}
            </p>
          )}

          {rt === "matching" && (
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {(q.pairs ?? []).map((p) => {
                const got = answer && typeof answer === "object" && !Array.isArray(answer) ? (answer as Record<string, string>)[p.id] : undefined;
                const ok = got === p.answerId;
                return (
                  <li key={p.id}>
                    <span className={ok ? "text-emerald-700" : "text-red-600"}>{ok ? "✓" : "✗"}</span> {p.leftText} → {choiceText(p.answerId)}
                    {!ok && got && <> (you: {choiceText(got)})</>}
                  </li>
                );
              })}
            </ul>
          )}

          {rt === "ordering" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Correct order: {(q.order ?? []).map((id) => q.tokens?.find((t) => t.id === id)?.text ?? id).join(" ")}
              {Array.isArray(answer) && answer.length > 0 && <> · You wrote: {answer.map((id) => q.tokens?.find((t) => t.id === id)?.text ?? id).join(" ")}</>}
            </p>
          )}

          <p className="mt-1 text-xs text-foreground/80"><MathText text={q.explanation} /></p>
          {q.sourceRef && <p className="mt-1 text-xs italic text-muted-foreground">Source: {q.sourceRef}</p>}
        </div>
      </div>
    </div>
  );
}
