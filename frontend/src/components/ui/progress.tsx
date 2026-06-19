import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. Clamped defensively. */
  value: number;
  /** Accessible label for the progress bar. */
  label?: string;
  indicatorClassName?: string;
}

/** Accessible progress bar (role="progressbar" + aria-value*). No Radix dependency. */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, label, indicatorClassName, ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
