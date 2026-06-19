import { Check, CircleDashed, Clock, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import type { ApplicationStage, ApplicationStageState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_META: Record<
  ApplicationStageState,
  { label: string; icon: typeof Check; badge: "secondary" | "default" | "warning" | "success" }
> = {
  not_started: { label: "Not started", icon: CircleDashed, badge: "secondary" },
  in_progress: { label: "In progress", icon: Clock, badge: "default" },
  submitted: { label: "Submitted", icon: Send, badge: "warning" },
  complete: { label: "Complete", icon: Check, badge: "success" },
};

const ORDER: ApplicationStageState[] = ["not_started", "in_progress", "submitted", "complete"];

/**
 * Process-polling board mirroring the backend ApplicationState FSM. Each stage shows its current
 * state with an icon + label, plus an overall "stages complete" count. This is a read-only
 * snapshot of where each application thread stands.
 */
export function StatusBoard({ stages, className }: { stages: ApplicationStage[]; className?: string }) {
  const complete = stages.filter((s) => s.state === "complete").length;
  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)} aria-label="Application status board">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Bearbeitungsstand · Status</p>
          <h3 className="mt-0.5 font-semibold tracking-tight">Application pipeline</h3>
        </div>
        <p className="official-figure text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{complete}</span>/{stages.length} complete
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {stages.map((stage) => {
          const meta = STATE_META[stage.state];
          const accent = CATEGORY_ACCENT[stage.category];
          const Icon = meta.icon;
          const stepIndex = ORDER.indexOf(stage.state);
          return (
            <li key={stage.id} className="relative overflow-hidden rounded-md border bg-card p-3">
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", accent.bar)} />
              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="min-w-0">
                  <p className="eyebrow !tracking-[0.12em]">{CATEGORY_LABELS[stage.category]}</p>
                  <h4 className="mt-0.5 font-medium leading-snug">{stage.title}</h4>
                  {stage.detail && <p className="mt-0.5 text-sm text-muted-foreground">{stage.detail}</p>}
                </div>
                <Badge variant={meta.badge} className="shrink-0 gap-1">
                  <Icon className="h-3 w-3" aria-hidden />
                  {meta.label}
                </Badge>
              </div>
              {/* Four-segment FSM progress: not_started → in_progress → submitted → complete */}
              <div className="mt-3 flex gap-1 pl-2" aria-hidden>
                {ORDER.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? accent.indicator : "bg-muted")}
                  />
                ))}
              </div>
              {stage.updatedHint && (
                <p className="mt-2 pl-2 text-xs text-muted-foreground">Updated {stage.updatedHint}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
