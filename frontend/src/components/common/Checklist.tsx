import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { SourceLink } from "@/components/common/SourceLink";
import type { ChecklistItemDef, Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChecklistProps {
  items: ChecklistItemDef[];
  /** Optional title shown above the list. */
  title?: string;
  /** Optional per-item source map keyed by item id. */
  sources?: Record<string, Source>;
  className?: string;
}

/**
 * Interactive document-gathering checklist. Check state lives in component state only (no
 * localStorage, per the Phase-3 no-storage rule). Required vs optional is shown explicitly, and a
 * progress bar tracks required items so "ready to submit" is unambiguous.
 */
export function Checklist({ items, title, sources, className }: ChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const requiredIds = useMemo(() => items.filter((i) => !i.optional).map((i) => i.id), [items]);
  const doneRequired = requiredIds.filter((id) => checked[id]).length;
  const pct = requiredIds.length ? Math.round((doneRequired / requiredIds.length) * 100) : 100;

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
          <p className="eyebrow mt-0.5">Required documents · Unterlagen</p>
        </div>
        <p className="official-figure text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{doneRequired}</span>/{requiredIds.length}
        </p>
      </div>
      <Progress value={pct} label={`Documents gathered: ${pct}%`} className="mb-4 h-1.5" />
      <ul className="space-y-1">
        {items.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <li key={item.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 transition-colors hover:bg-muted/50",
                  isChecked && "opacity-70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    isChecked ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  {isChecked && <Check className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn("text-sm font-medium", isChecked && "line-through")}>
                    {item.label}
                    {item.optional && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-normal text-muted-foreground">
                        optional
                      </span>
                    )}
                  </span>
                  {item.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>}
                  {sources?.[item.id] && (
                    <span className="mt-1 block">
                      <SourceLink source={sources[item.id]} />
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
