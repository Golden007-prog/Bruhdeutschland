import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { ProfessionalPanel } from "@/features/profile/ProfessionalPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GERMAN_GRADE_BAND } from "@/lib/facts";
import { source } from "@/lib/sources";
import {
  COMMON_SCALES,
  GPA_METHOD,
  convertToGermanGpa,
  formatGermanGrade,
  type GpaConversion,
  type GradeScale,
} from "@/lib/calc/gpa";

const SCALE_KEYS = Object.keys(COMMON_SCALES) as (keyof typeof COMMON_SCALES)[];
const CUSTOM = "custom" as const;
type ScaleChoice = (typeof SCALE_KEYS)[number] | typeof CUSTOM;

/**
 * The converted German grade, rendered as the dossier's signature stamp-seal. Mirrors the look in
 * ResumeAnalyzer's GradeSeal. A computed grade is always "stamped" (solid blue) — it is deterministic
 * arithmetic, not a scraped figure, so it is grounded by construction (CLAUDE.md golden rule 4).
 */
function GradeSeal({ conversion }: { conversion: GpaConversion | null }) {
  const grade = conversion?.germanGrade ?? null;
  const label =
    grade !== null
      ? `German grade ${formatGermanGrade(grade)}, computed via ${GPA_METHOD}`
      : "Enter a grade to compute the German equivalent";
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "stamp-seal flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full text-center",
        grade === null && "stamp-seal--unverified",
      )}
    >
      <span className="eyebrow !text-[0.55rem] !tracking-[0.12em] opacity-80">Note</span>
      <span className="official-figure text-4xl font-bold leading-none">
        {grade !== null ? formatGermanGrade(grade) : "—"}
      </span>
      <span className="official-figure mt-0.5 text-[0.6rem] opacity-70">1,0–4,0</span>
    </div>
  );
}

/** Feature 02 — Profile evaluation. A real, deterministic GPA → German grade converter. */
export default function ProfileEvaluate() {
  const [gradeText, setGradeText] = useState("");
  const [choice, setChoice] = useState<ScaleChoice>("percent");
  const [customBest, setCustomBest] = useState("100");
  const [customMinPass, setCustomMinPass] = useState("50");

  const activeScale: GradeScale = useMemo(() => {
    if (choice === CUSTOM) {
      return {
        best: Number(customBest),
        minPass: Number(customMinPass),
        name: "Custom scale",
      };
    }
    return COMMON_SCALES[choice];
  }, [choice, customBest, customMinPass]);

  const { conversion, error } = useMemo<{
    conversion: GpaConversion | null;
    error: string | null;
  }>(() => {
    const trimmed = gradeText.trim();
    if (trimmed === "") return { conversion: null, error: null };
    const grade = Number(trimmed);
    if (!Number.isFinite(grade)) {
      return { conversion: null, error: "Enter a numeric grade." };
    }
    try {
      return { conversion: convertToGermanGpa(grade, activeScale), error: null };
    } catch (e) {
      return {
        conversion: null,
        error: e instanceof Error ? e.message : "Could not convert this grade.",
      };
    }
  }, [gradeText, activeScale]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 02 · Profile"
        title="Profile evaluation — GPA → German grade"
        description="Convert your grade to the German 1,0–4,0 scale with the Modified Bavarian Formula. The conversion is pure arithmetic — computed here, not estimated by a model — so the result is stamped, not flagged."
        category="profile"
        fileRef="§ 02"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Inputs ─────────────────────────────────────────────── */}
        <section className="rounded-lg border bg-card p-5 shadow-sm" aria-labelledby="convert-heading">
          <h2 id="convert-heading" className="mb-4 text-sm font-medium">
            Your grade
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="source-grade" className="eyebrow block">
                Source grade
              </label>
              <Input
                id="source-grade"
                inputMode="decimal"
                value={gradeText}
                onChange={(e) => setGradeText(e.target.value)}
                placeholder="e.g. 82 or 8.4"
                aria-describedby={error ? "grade-error" : undefined}
                aria-invalid={Boolean(error)}
                className="official-figure"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="eyebrow mb-1">Grading scale</legend>
              <div className="flex flex-wrap gap-2">
                {SCALE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChoice(key)}
                    aria-pressed={choice === key}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      choice === key
                        ? "border-category-profile bg-category-profile/10 text-category-profile"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {COMMON_SCALES[key].name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setChoice(CUSTOM)}
                  aria-pressed={choice === CUSTOM}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    choice === CUSTOM
                      ? "border-category-profile bg-category-profile/10 text-category-profile"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  Custom…
                </button>
              </div>
            </fieldset>

            {choice === CUSTOM && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <label htmlFor="custom-best" className="eyebrow block">
                    Best grade (Nmax)
                  </label>
                  <Input
                    id="custom-best"
                    inputMode="decimal"
                    value={customBest}
                    onChange={(e) => setCustomBest(e.target.value)}
                    className="official-figure"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="custom-minpass" className="eyebrow block">
                    Lowest pass (Nmin)
                  </label>
                  <Input
                    id="custom-minpass"
                    inputMode="decimal"
                    value={customMinPass}
                    onChange={(e) => setCustomMinPass(e.target.value)}
                    className="official-figure"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Active scale:{" "}
              <span className="official-figure text-foreground">
                best {activeScale.best} · pass {activeScale.minPass}
              </span>
            </p>

            {error && (
              <p id="grade-error" role="alert" className="flex items-center gap-1.5 text-sm text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {error}
              </p>
            )}
          </div>
        </section>

        {/* ── Result ─────────────────────────────────────────────── */}
        <section className="rounded-lg border bg-card p-5 shadow-sm" aria-labelledby="result-heading">
          <h2 id="result-heading" className="mb-4 text-sm font-medium">
            German grade
          </h2>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <GradeSeal conversion={conversion} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                {conversion ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Deterministic · grounded
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Awaiting a grade…</span>
                )}
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 border-b border-dashed py-1">
                  <dt className="text-muted-foreground">Raw formula output</dt>
                  <dd className="official-figure font-medium">
                    {conversion ? conversion.raw.toFixed(4) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-dashed py-1">
                  <dt className="text-muted-foreground">Clamped to 1,0–4,0</dt>
                  <dd>
                    {conversion ? (
                      conversion.clamped ? (
                        <Badge variant="warning">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-dashed py-1">
                  <dt className="text-muted-foreground">Passing</dt>
                  <dd>
                    {conversion ? (
                      conversion.isPassing ? (
                        <Badge variant="success">Pass</Badge>
                      ) : (
                        <Badge variant="warning">Below pass</Badge>
                      )
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-1">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd className="text-right text-xs font-medium">{GPA_METHOD}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>

      {/* ── Explanation + grounded grade band ──────────────────── */}
      <section className="space-y-4" aria-labelledby="formula-heading">
        <div>
          <p className="eyebrow">Methode · Method</p>
          <h2 id="formula-heading" className="mt-1 text-lg font-semibold tracking-tight">
            The Modified Bavarian Formula
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
          <div className="space-y-3 rounded-lg border bg-card p-5 text-sm shadow-sm">
            <p className="text-muted-foreground">
              German universities and uni-assist convert foreign grades with the KMK-stipulated
              Modified Bavarian Formula. It maps your grade linearly onto the German band, where 1,0
              is the best mark and 4,0 the lowest pass:
            </p>
            <pre className="official-figure overflow-x-auto rounded-md bg-muted/50 p-3 text-xs">
              x = 1 + 3 × (Nmax − Nd) / (Nmax − Nmin)
            </pre>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <span className="official-figure text-foreground">Nmax</span> — best achievable grade
                in your system
              </li>
              <li>
                <span className="official-figure text-foreground">Nmin</span> — lowest passing grade
                in your system
              </li>
              <li>
                <span className="official-figure text-foreground">Nd</span> — the grade you achieved
              </li>
            </ul>
            <p className="text-muted-foreground">
              The result is pure arithmetic. It runs no model inference and reads no live data, so it
              is shown stamped rather than flagged for verification. Your final reported grade still
              comes from uni-assist or your university — this is your reliable estimate.
            </p>
            <SourceLink source={source("uniAssist")} />
          </div>
          <div className="space-y-3">
            <OfficialFactRow fact={GERMAN_GRADE_BAND} />
          </div>
        </div>
      </section>

      {/* Professional profile — a separate dimension that never alters the academic grade (addendum §2). */}
      <ProfessionalPanel />
    </div>
  );
}
