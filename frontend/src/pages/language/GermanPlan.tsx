import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CEFR_LEVELS } from "@/lib/seed/language";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

/** Approximate guided-learning hours per level (illustrative; varies widely by learner & intensity). */
const PLAN: Record<string, { hours: string; focus: string; target?: string }> = {
  A1: { hours: "~80–150 hrs", focus: "Pronunciation, present tense, everyday phrases, numbers & basics." },
  A2: { hours: "~150–250 hrs", focus: "Past tense, modal verbs, daily-life topics, simple connected speech." },
  B1: { hours: "~250–350 hrs", focus: "Independent everyday use, opinions, the threshold many B1 certificates test." },
  B2: { hours: "~350–500 hrs", focus: "Fluent discussion, abstract topics — a common bar for English-taught life and some programmes.", target: "Minimum for everyday study life" },
  C1: { hours: "~500–700 hrs", focus: "Academic German: lectures, papers, exams. Required by most German-taught degrees (via TestDaF/DSH).", target: "Target for German-taught degrees" },
  C2: { hours: "~700+ hrs", focus: "Near-native mastery — beyond what most programmes require.", target: "Beyond typical requirements" },
};

const LEVEL_ITEMS: ChecklistItemDef[] = CEFR_LEVELS.map((l) => ({
  id: l.level,
  label: `${l.level} — ${l.label}`,
  hint: l.summary,
}));

/** G09 — Structured German A1→C1 study plan (extends the static phrase cards to a trackable plan). */
export default function LanguageGermanPlan() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G09 · Language"
        title="German A1→C1 — structured study plan"
        description="A level-by-level plan from beginner to the C1 that most German-taught degrees need. Realistic hour ranges, what each level unlocks, and a checklist you tick off as you climb."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          German-taught Bachelor's, Medicine, and many Master's expect <strong>C1</strong> (proven via
          TestDaF or DSH). English-taught programmes don't — but everyday German still makes life far easier.
          Hour ranges are <strong>estimates</strong>; real time depends on intensity and your first language.
        </AlertDescription>
      </Alert>

      <ol className="space-y-3">
        {CEFR_LEVELS.map((l) => {
          const p = PLAN[l.level];
          return (
            <li key={l.level} className={cn("rounded-lg border bg-card p-4 shadow-sm", p?.target && "border-primary/40")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <span className="official-figure rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">{l.level}</span>
                  {l.label}
                </h2>
                <span className="text-xs text-muted-foreground">{p?.hours} <span className="opacity-70">· varies by learner</span></span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p?.focus}</p>
              {p?.target && (
                <p className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{p.target}</p>
              )}
            </li>
          );
        })}
      </ol>

      <Checklist items={LEVEL_ITEMS} title="Track your progress" storageKey="german-plan-progress" />

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
