import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { GenProgress } from "@/lib/exam/generate";

const TIPS = [
  "Tip: in IELTS Listening, the audio plays only once — read the questions first.",
  "Tip: for Reading, skim for structure, then scan for the specific detail.",
  "Tip: 'Not Given' means the text neither confirms nor contradicts the statement.",
  "Tip: in Writing Task 1, report the main trends — don't list every number.",
  "Tip: in Speaking Part 2, use your 1 minute to jot keywords, not full sentences.",
  "Tip: for GRE/GMAT quant, estimate first to rule out impossible answers.",
];

/**
 * Progressive generation loader (work-order §5E). Shows exactly what is being built per section,
 * a determinate progress bar, and rotating study tips. Announces progress via an aria-live region.
 * Never a dead spinner.
 */
export function GenerationLoader({ progress, examTitle }: { progress: GenProgress | null; examTitle: string }) {
  const reduce = useReducedMotion();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const pct = progress ? Math.round((progress.step / progress.total) * 100) : 5;

  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <motion.span
          animate={reduce ? undefined : { rotate: 360 }}
          transition={reduce ? undefined : { repeat: Infinity, ease: "linear", duration: 1.2 }}
          className="text-primary"
        >
          <Loader2 className="h-5 w-5" aria-hidden />
        </motion.span>
        <div>
          <p className="eyebrow">Generating · {examTitle}</p>
          <p aria-live="polite" className="mt-0.5 font-medium">
            {progress?.label ?? "Starting generation…"}
          </p>
        </div>
      </div>

      <Progress
        value={pct}
        label={`Generation ${pct}% complete`}
        className="mt-4 h-2"
        indicatorClassName="bg-category-language"
      />
      <p className="official-figure mt-1 text-xs text-muted-foreground">
        Step {progress?.step ?? 0} / {progress?.total ?? "…"}
      </p>

      {/* Skeleton of the exam layout */}
      <div className="mt-6 space-y-3" aria-hidden>
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>

      <motion.p
        key={tip}
        initial={reduce ? undefined : { opacity: 0, y: 4 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        className="mt-6 text-sm text-muted-foreground"
      >
        {TIPS[tip]}
      </motion.p>
    </div>
  );
}
