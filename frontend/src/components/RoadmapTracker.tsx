import { AlertTriangle, Check, Clock, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import type { RoadmapItem, RoadmapItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface RoadmapTrackerProps {
  items: RoadmapItem[];
  className?: string;
}

interface StatusMeta {
  label: string;
  icon: typeof Check;
  /** Badge variant + marker treatment. Status is always conveyed by icon + text, not color alone. */
  badge: "success" | "default" | "secondary";
  marker: string;
}

const STATUS: Record<RoadmapItemStatus, StatusMeta> = {
  done: { label: "Done", icon: Check, badge: "success", marker: "bg-primary text-primary-foreground border-primary" },
  active: { label: "Active", icon: Clock, badge: "default", marker: "bg-background text-primary border-primary" },
  locked: { label: "Locked", icon: Lock, badge: "secondary", marker: "bg-muted text-muted-foreground border-border border-dashed" },
};

/** Two-digit file reference, e.g. 1 -> "01". The roadmap is a real ordered sequence. */
function ref(n: number): string {
  return String(n + 1).padStart(2, "0");
}

/** Parse a YYYY-MM-DD string as a local calendar date (avoids UTC off-by-one). */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Human-readable deadline, e.g. "2026-07-15" -> "15 Jul 2026". */
function formatDeadline(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** True when the deadline has already passed (compared at local midnight). */
function isOverdue(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseISODate(iso).getTime() < today.getTime();
}

/**
 * Vertical, dependency-ordered roadmap timeline. Each `RoadmapItem` is a numbered dossier entry
 * with a category accent spine, status (locked / active / done), an optional deadline, and a
 * "needs verification" flag for any ungrounded official value (CLAUDE.md §2).
 */
export function RoadmapTracker({ items, className }: RoadmapTrackerProps) {
  const done = items.filter((i) => i.status === "done").length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)} aria-labelledby="roadmap-heading">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Aktenplan · Roadmap</p>
          <h2 id="roadmap-heading" className="mt-1 text-lg font-semibold tracking-tight">
            Your application plan
          </h2>
        </div>
        <div className="text-right">
          <p className="official-figure text-2xl font-semibold leading-none">
            {done}
            <span className="text-muted-foreground">/{items.length}</span>
          </p>
          <p className="eyebrow mt-1">Steps done</p>
        </div>
      </header>

      <Progress value={pct} label={`Roadmap progress: ${pct}% complete`} className="mb-6 h-1.5" />

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          No roadmap yet. Add a profile to generate your personalized plan.
        </p>
      ) : (
        <ol className="relative space-y-1">
          {items.map((item, idx) => {
            const meta = STATUS[item.status];
            const accent = CATEGORY_ACCENT[item.category];
            const Icon = meta.icon;
            const last = idx === items.length - 1;
            const overdue = !!item.deadline && item.status !== "done" && isOverdue(item.deadline);
            return (
              <li
                key={item.id}
                aria-current={item.status === "active" ? "step" : undefined}
                className="relative grid grid-cols-[2.25rem_1fr] gap-3 pb-4"
              >
                {/* Spine connector */}
                {!last && <span aria-hidden className="absolute left-[1.125rem] top-9 -ml-px h-full w-px bg-border" />}

                {/* Numbered marker */}
                <div
                  className={cn(
                    "z-[1] flex h-9 w-9 items-center justify-center rounded-full border text-[0.7rem]",
                    meta.marker,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{meta.label}:</span>
                </div>

                <div className="min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span aria-hidden className={cn("h-2.5 w-2.5 rounded-[2px]", accent.bar)} />
                    <span className="official-figure text-xs text-muted-foreground">{ref(idx)}</span>
                    {/* Category color is carried by the swatch; the label stays muted for AA contrast. */}
                    <span className="eyebrow">{CATEGORY_LABELS[item.category]}</span>
                  </div>

                  <h3 className="mt-1 font-medium leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                    {item.deadline && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          overdue ? "font-medium text-red-700" : "text-muted-foreground",
                        )}
                      >
                        <Clock className="h-3 w-3" aria-hidden />
                        {overdue ? "Overdue" : "Due"}{" "}
                        <time dateTime={item.deadline} className="official-figure">
                          {formatDeadline(item.deadline)}
                        </time>
                      </span>
                    )}
                    {item.needsVerification && (
                      <Badge variant="warning" className="gap-1">
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Needs verification
                      </Badge>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
