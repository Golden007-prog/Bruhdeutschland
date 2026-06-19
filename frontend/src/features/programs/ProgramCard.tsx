import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  CircleHelp,
  Columns3,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { CriterionStatus, Eligibility } from "@/lib/programs/eligibility";
import { ROLLUP_META } from "@/lib/programs/eligibility";
import type { Program } from "@/lib/programs/types";
import { LANG_LABEL } from "./labels";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<CriterionStatus, { Icon: typeof CheckCircle2; cls: string }> = {
  meets: { Icon: CheckCircle2, cls: "text-emerald-600" },
  maybe: { Icon: CircleDot, cls: "text-amber-600" },
  doesnt_meet: { Icon: XCircle, cls: "text-red-600" },
  unknown: { Icon: CircleHelp, cls: "text-muted-foreground" },
};

export function ProgramCard({
  program: p,
  relevance,
  hasQuery,
  eligibility,
  shortlisted,
  inCompare,
  compareDisabled,
  onShortlist,
  onCompare,
  onTrack,
}: {
  program: Program;
  relevance: number;
  hasQuery: boolean;
  eligibility?: Eligibility;
  shortlisted: boolean;
  inCompare: boolean;
  compareDisabled: boolean;
  onShortlist: () => void;
  onCompare: () => void;
  onTrack: () => void;
}) {
  const tuition = p.tuitionPerSemester ? `€${p.tuitionPerSemester}/sem` : "No tuition";
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug tracking-tight">
            {p.name} <span className="text-sm font-normal text-muted-foreground">· {p.degree}</span>
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" aria-hidden /> {p.university}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden /> {p.city}, {p.bundesland}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onShortlist}
          aria-pressed={shortlisted}
          aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {shortlisted ? <BookmarkCheck className="h-5 w-5 text-primary" aria-hidden /> : <Bookmark className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{LANG_LABEL[p.languages] ?? p.languages}</Badge>
        <Badge variant={p.tuitionPerSemester ? "warning" : "success"}>{tuition}</Badge>
        <Badge variant="secondary">{p.intake === "both" ? "Winter & Summer" : p.intake}</Badge>
        {p.semesters && <Badge variant="secondary">{p.semesters} sem</Badge>}
      </div>

      {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}

      {hasQuery && (
        <p className="mt-2 text-xs text-muted-foreground">
          Relevance <span className="official-figure font-medium text-foreground">{relevance}%</span> — how well it matches your search (not an admission chance).
        </p>
      )}

      {eligibility && (
        <div className="mt-3">
          <details className="rounded-md border bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium">Eligibility</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLLUP_META[eligibility.rollup].className)}>
                {ROLLUP_META[eligibility.rollup].label}
              </span>
            </summary>
            <ul className="space-y-1.5 px-3 pb-3 text-xs">
              {eligibility.criteria.map((c) => {
                const { Icon, cls } = STATUS_ICON[c.status];
                return (
                  <li key={c.key} className="flex items-start gap-2">
                    <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} aria-hidden />
                    <span className="min-w-0">
                      <span className="font-medium">{c.label}:</span> {c.detail}{" "}
                      {c.gapHref && <Link to={c.gapHref} className="text-primary hover:underline">Fix →</Link>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        {p.needsVerification && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Requirements need verification
          </span>
        )}
        <a
          href={p.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Official page <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        <span className="text-[0.65rem] text-muted-foreground">{p.source} · {p.retrievedAt}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCompare}
          disabled={!inCompare && compareDisabled}
          aria-pressed={inCompare}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inCompare ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted",
          )}
        >
          <Columns3 className="h-3.5 w-3.5" aria-hidden /> {inCompare ? "Comparing" : "Compare"}
        </button>
        <button
          type="button"
          onClick={onTrack}
          className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add to tracker
        </button>
        <Link
          to="/calendar"
          className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Deadline
        </Link>
      </div>
    </article>
  );
}
