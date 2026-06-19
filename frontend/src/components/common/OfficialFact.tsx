import { useCallback } from "react";
import { AlertTriangle, Clock, RefreshCw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import { FACTS_RETRIEVED_AT } from "@/lib/facts";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import type { OfficialFact } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders an official figure exactly per the grounding thesis (CLAUDE.md §2/§3):
 *  - grounded  → solid value + ShieldCheck + source citation
 *  - ungrounded → "unstamped" amber/dashed value + "Needs verification" badge + where to confirm
 * The value itself is always tabular monospace (`.official-figure`) — it reads as machine-precise.
 * Every fact with a source also gets a re-verify control (work order §7): these are seed values, never
 * presented as final — the user can open the official source and record that they re-checked it.
 */
export function OfficialFactRow({ fact, className }: { fact: OfficialFact; className?: string }) {
  const unverified = fact.needsVerification || fact.value == null || fact.value === "";
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        unverified ? "border-dashed border-amber-300 bg-amber-50/40" : "bg-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">{fact.label}</p>
        <p
          className={cn(
            "official-figure text-base font-semibold",
            unverified && "text-amber-700",
          )}
        >
          {fact.value && !unverified ? fact.value : fact.value || "—"}
        </p>
      </div>
      {fact.note && <p className="mt-1 text-xs text-muted-foreground">{fact.note}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {unverified ? (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            Needs verification
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Grounded
          </span>
        )}
        {fact.source && <SourceLink source={fact.source} />}
      </div>
      {fact.source && <FactRecheck fact={fact} />}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * "Re-verify" control. We can't truly auto-fetch an official German page from a static SPA (CORS), so
 * this opens the cited source for the user to confirm and records the date they did — honest about
 * what verification means here. The "last checked" date persists per fact (localStorage/Supabase).
 */
function FactRecheck({ fact }: { fact: OfficialFact }) {
  const [lastChecked, setLastChecked] = useSyncedState<string | null>(
    `fact-recheck:${slugify(fact.label)}`,
    null,
  );
  const seed = fact.retrievedAt ?? FACTS_RETRIEVED_AT;

  const recheck = useCallback(() => {
    if (fact.source) window.open(fact.source.url, "_blank", "noopener,noreferrer");
    setLastChecked(todayIso());
  }, [fact.source, setLastChecked]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[0.7rem] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" aria-hidden />
        {lastChecked ? `You checked the source on ${lastChecked}` : `Seed value · gathered ${seed}`}
      </span>
      <button
        type="button"
        onClick={recheck}
        className="inline-flex items-center gap-1 rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RefreshCw className="h-3 w-3" aria-hidden />
        Verify at source
      </button>
    </div>
  );
}

/** A grid of official facts. */
export function OfficialFactList({ facts, className }: { facts: OfficialFact[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {facts.map((f) => (
        <OfficialFactRow key={f.label} fact={f} />
      ))}
    </div>
  );
}
