import { AlertTriangle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceLink } from "@/components/common/SourceLink";
import type { OfficialFact } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders an official figure exactly per the grounding thesis (CLAUDE.md §2/§3):
 *  - grounded  → solid value + ShieldCheck + source citation
 *  - ungrounded → "unstamped" amber/dashed value + "Needs verification" badge + where to confirm
 * The value itself is always tabular monospace (`.official-figure`) — it reads as machine-precise.
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
