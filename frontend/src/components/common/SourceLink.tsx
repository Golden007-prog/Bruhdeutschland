import { ExternalLink, ShieldCheck } from "lucide-react";

import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A citation link to an official source. Opens in a new tab with rel="noreferrer". */
export function SourceLink({ source, className }: { source: Source; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <ShieldCheck className="h-3 w-3" aria-hidden />
      <span>{source.name}</span>
      <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Compact "Sources" footer listing one or more citations. */
export function SourceList({ sources, className }: { sources: Source[]; className?: string }) {
  if (sources.length === 0) return null;
  return (
    <div className={cn("rounded-md border border-dashed bg-muted/30 p-3", className)}>
      <p className="eyebrow mb-2">Sources · Quellen</p>
      <ul className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.url}>
            <SourceLink source={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
