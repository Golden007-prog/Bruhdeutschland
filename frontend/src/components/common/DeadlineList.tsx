import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import { formatDate, relativeLabel, severityFor, sortByDate } from "@/lib/calc/deadlines";
import type { DeadlineEvent, DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  DeadlineSeverity,
  { label: string; badge: "secondary" | "warning" | "success" | "default"; dot: string }
> = {
  info: { label: "Upcoming", badge: "secondary", dot: "bg-muted-foreground" },
  soon: { label: "Soon", badge: "default", dot: "bg-primary" },
  urgent: { label: "Urgent", badge: "warning", dot: "bg-amber-500" },
  overdue: { label: "Overdue", badge: "warning", dot: "bg-red-500" },
};

export interface DeadlineListProps {
  events: DeadlineEvent[];
  /** Reference date for severity (defaults to now). Injectable for deterministic tests. */
  now?: Date;
  /** Compact rows (used in dashboard widgets). */
  dense?: boolean;
  className?: string;
}

/**
 * A date-ordered list of deadlines/events with computed severity (overdue / urgent / soon /
 * upcoming). Powers both the deadline-alert panel and the event-watch feed. Severity is conveyed by
 * an icon + text label, never color alone.
 */
export function DeadlineList({ events, now, dense, className }: DeadlineListProps) {
  if (events.length === 0) {
    return (
      <p className={cn("rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground", className)}>
        Nothing scheduled. Deadlines you track will appear here, soonest first.
      </p>
    );
  }
  return (
    <ul className={cn("space-y-2", className)}>
      {sortByDate(events).map((e) => {
        const sev = severityFor(e.date, now);
        const meta = SEVERITY_META[sev];
        const accent = CATEGORY_ACCENT[e.category];
        return (
          <li
            key={e.id}
            className={cn(
              "flex items-start gap-3 rounded-md border bg-card p-3",
              (sev === "overdue" || sev === "urgent") && "border-amber-300",
            )}
          >
            <span aria-hidden className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-[2px]", accent.bar)} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className={cn("font-medium leading-snug", dense && "text-sm")}>{e.title}</h3>
                <Badge variant={meta.badge} className="gap-1">
                  {(sev === "overdue" || sev === "urgent") && <AlertTriangle className="h-3 w-3" aria-hidden />}
                  {meta.label}
                </Badge>
              </div>
              {!dense && e.note && <p className="mt-0.5 text-sm text-muted-foreground">{e.note}</p>}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" aria-hidden />
                  <time dateTime={e.date} className="official-figure">
                    {formatDate(e.date)}
                  </time>
                  <span>· {relativeLabel(e.date, now)}</span>
                </span>
                <span className="eyebrow !tracking-[0.12em]">{CATEGORY_LABELS[e.category]}</span>
                {e.needsVerification && (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden /> date varies — verify
                  </span>
                )}
                {e.source && <SourceLink source={e.source} />}
                {e.href && (
                  <Link to={e.href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    Details <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
