import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import type { ProcessStep } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Two-digit step reference: 0 -> "01". Order is real, so the numbering carries information. */
function ref(n: number): string {
  return String(n + 1).padStart(2, "0");
}

/**
 * A numbered, dependency-ordered process timeline (step-by-step preparation). Each step may carry a
 * duration hint, a deep-link to the tool that performs it, and an official source for any
 * requirement it cites. Ungrounded official references surface a "needs verification" flag.
 */
export function StepList({ steps, className }: { steps: ProcessStep[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-1", className)}>
      {steps.map((step, idx) => {
        const last = idx === steps.length - 1;
        return (
          <li key={step.id} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-5">
            {!last && (
              <span aria-hidden className="absolute left-[1rem] top-8 -ml-px h-full w-px bg-border" />
            )}
            <div className="z-[1] flex h-8 w-8 items-center justify-center rounded-full border bg-card text-[0.7rem] font-semibold text-primary">
              <span className="official-figure" aria-hidden>
                {ref(idx)}
              </span>
              <span className="sr-only">Step {idx + 1}:</span>
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="font-medium leading-snug">{step.title}</h3>
                {step.durationHint && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden />
                    <span className="official-figure">{step.durationHint}</span>
                  </span>
                )}
              </div>
              {step.detail && <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {step.needsVerification && (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Needs verification
                  </Badge>
                )}
                {step.source && <SourceLink source={step.source} />}
                {step.href && (
                  <Link
                    to={step.href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open tool <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
