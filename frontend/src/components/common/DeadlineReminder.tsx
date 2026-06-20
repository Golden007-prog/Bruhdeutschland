import { CalendarClock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { formatDate, relativeLabel, severityFor } from "@/lib/calc/deadlines";
import type { DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEVERITY_CLS: Record<DeadlineSeverity, string> = {
  overdue: "bg-red-100 text-red-900",
  urgent: "bg-amber-100 text-amber-900",
  soon: "bg-sky-100 text-sky-900",
  info: "bg-emerald-100 text-emerald-900",
};

/**
 * A persisted personal deadline. The user sets a date; we compute the relative label + severity with
 * the deterministic deadline arithmetic (no model). Stored per-user (scoped) so it survives reloads and
 * never bleeds across accounts. Used for residence-permit renewal and the semester Rückmeldung (G46/G47).
 */
export function DeadlineReminder({
  storageKey,
  label,
  hint,
}: {
  storageKey: string;
  label: string;
  hint?: string;
}) {
  const [date, setDate] = useSyncedState<string>(`reminder:${storageKey}`, "");
  const inputId = `reminder-${storageKey}`;
  const sev = date ? severityFor(date) : null;

  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden /> {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Input
          id={inputId}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
        {date && sev && (
          <span className={cn("official-figure inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", SEVERITY_CLS[sev])}>
            {formatDate(date)} · {relativeLabel(date)}
          </span>
        )}
      </div>
    </div>
  );
}
