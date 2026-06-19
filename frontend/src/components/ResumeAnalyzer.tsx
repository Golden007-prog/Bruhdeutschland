import { AlertTriangle, FileText, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { GroundedValue, ParsedProfile, SkillGap } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ResumeAnalyzerProps {
  profile: ParsedProfile;
  className?: string;
}

const SEVERITY: Record<SkillGap["severity"], { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-900" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-900" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
};

/** German grade formatting uses a comma decimal: 1.7 -> "1,7". */
function formatGrade(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Signature element: the converted German grade rendered as an official seal. A grounded value is
 * "stamped" (solid blue); an ungrounded one is "unstamped" (dashed amber) and flagged for
 * verification — the design encodes DeutschPrep's grounding thesis (CLAUDE.md §2).
 */
function GradeSeal({ grade, method }: { grade: GroundedValue<number>; method: string }) {
  const verified = grade.value !== null && !grade.needsVerification;
  const label = verified
    ? `German grade ${formatGrade(grade.value as number)}, computed via ${method}`
    : "German grade not yet verified";
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "stamp-seal flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full text-center",
        !verified && "stamp-seal--unverified",
      )}
    >
      <span className="eyebrow !text-[0.55rem] !tracking-[0.12em] opacity-80">Note</span>
      <span className="official-figure text-3xl font-bold leading-none">
        {verified ? formatGrade(grade.value as number) : "—"}
      </span>
      <span className="official-figure mt-0.5 text-[0.6rem] opacity-70">1,0–4,0</span>
    </div>
  );
}

function VerificationNote({ value }: { value: GroundedValue<unknown> }) {
  if (value.needsVerification) {
    return (
      <Badge variant="warning" className="gap-1">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Needs verification
      </Badge>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden />
      {value.sourceName ?? "Source on file"}
    </span>
  );
}

/**
 * Parsed-profile review: extracted facts, the deterministic German GPA seal, ECTS total, and
 * AI-reasoned skill gaps. Ungrounded official values surface a "needs verification" badge.
 */
export function ResumeAnalyzer({ profile, className }: ResumeAnalyzerProps) {
  const ects = profile.totalEcts;
  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", className)} aria-labelledby="resume-heading">
      <header className="mb-5 flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
        <div>
          <p className="eyebrow">Profilauswertung · Profile review</p>
          <h2 id="resume-heading" className="official-figure text-sm font-medium">
            {profile.fileName}
          </h2>
        </div>
      </header>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <GradeSeal grade={profile.germanGpa} method={profile.gpaMethod} />
        <div className="min-w-0 space-y-3">
          <div>
            <p className="eyebrow">Deutsche Note · German GPA</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="official-figure text-xl font-semibold">
                {profile.germanGpa.value !== null ? formatGrade(profile.germanGpa.value) : "—"}
              </span>
              {profile.germanGpa.needsVerification ? (
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  Needs verification
                </Badge>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden />
                  Deterministic
                </span>
              )}
            </div>
            {/* Method named once here — the value is computed, not a scraped source, so no duplicate label. */}
            <p className="mt-0.5 text-xs text-muted-foreground">{profile.gpaMethod}</p>
          </div>
          <div>
            <p className="eyebrow">ECTS total</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="official-figure text-xl font-semibold">
                {ects.value !== null ? ects.value : "—"}
              </span>
              <VerificationNote value={ects} />
            </div>
          </div>
        </div>
      </div>

      <hr className="my-5" />

      <div>
        <p className="eyebrow mb-2">Extracted facts</p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {profile.facts.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 border-b border-dashed py-1 text-sm">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="text-right font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Skill gaps</p>
          <span className="text-[0.68rem] text-muted-foreground">AI-reasoned · not official</span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {profile.skillGaps.map((gap) => {
            const sev = SEVERITY[gap.severity];
            return (
              <li key={gap.id}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    sev.className,
                  )}
                >
                  {gap.skill}
                  <span className="sr-only">— severity:</span>
                  <span className="opacity-70">{sev.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
