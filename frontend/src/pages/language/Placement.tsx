import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Gauge, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/** One representative can-do statement per level; checked from A1 up, the first gap caps your estimate. */
const RUNGS: { level: string; canDo: string }[] = [
  { level: "A1", canDo: "I can introduce myself and handle very basic phrases (greetings, numbers, ordering a coffee)." },
  { level: "A2", canDo: "I can manage routine everyday exchanges — shopping, simple directions, talking about my day in the past." },
  { level: "B1", canDo: "I can hold a conversation on familiar topics, explain opinions, and cope with most situations while travelling." },
  { level: "B2", canDo: "I can discuss abstract topics fluently, follow most TV/news, and write clear, detailed text." },
  { level: "C1", canDo: "I can follow lectures and academic texts, and express myself fluently and precisely for academic/professional use." },
];

/** G10 — German placement self-check. Deterministic estimate from contiguous can-do checks. */
export default function LanguagePlacement() {
  const [checked, setChecked] = useState<boolean[]>(() => RUNGS.map(() => false));

  // Estimate = highest level reachable contiguously from A1; first unchecked rung stops the climb.
  const estimate = useMemo(() => {
    let reached = -1;
    for (let i = 0; i < checked.length; i++) {
      if (checked[i]) reached = i;
      else break;
    }
    return reached;
  }, [checked]);

  const toggle = (i: number) => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const level = estimate >= 0 ? RUNGS[estimate].level : "below A1";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G10 · Language"
        title="German level — quick self-check"
        description="Tick the highest things you can genuinely do, from the top down. We estimate your CEFR level so your study plan starts in the right place — it's a self-estimate, not a certificate."
        category="language"
      />

      <ol className="space-y-2">
        {RUNGS.map((r, i) => (
          <li key={r.level}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={checked[i]}
              className={cn(
                "flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked[i] ? "border-emerald-300 bg-emerald-50/50" : "bg-card hover:bg-muted/50",
              )}
            >
              <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", checked[i] ? "border-emerald-500 bg-emerald-500 text-white" : "bg-card")}>
                {checked[i] && <Check className="h-3.5 w-3.5" aria-hidden />}
              </span>
              <span>
                <span className="official-figure mr-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{r.level}</span>
                {r.canDo}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Gauge className="h-4 w-4" aria-hidden /> Your estimated level</p>
        <p className="official-figure mt-1 text-3xl font-bold">{level}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {estimate >= 4
            ? "You're around the C1 many German-taught degrees require — confirm with a real TestDaF/DSH."
            : estimate >= 0
              ? "Start your plan from here and climb toward C1 for German-taught study."
              : "Start from A1 — everyone does. The plan takes you up step by step."}
        </p>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          This is a rough self-estimate. Be honest — overstating your level just means harder classes later.
          A certified placement test or a TestDaF/DSH gives the real number.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/language/german-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Start the A1→C1 plan <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/goethe-testdaf" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Certify your level <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
