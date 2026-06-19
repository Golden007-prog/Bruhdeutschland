import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPin, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { programMatchesSchema, type ProgramMatchesResult } from "@/features/ai/schemas";
import { useGenerate } from "@/features/ai/useGenerate";
import { source } from "@/lib/sources";
import { MATCHED_PROGRAMS, type MatchedProgram, type ProgramLanguage } from "@/lib/seed/profile";
import { cn } from "@/lib/utils";

type AiProgram = ProgramMatchesResult["programs"][number];

/** A live-AI program suggestion. Fit is qualitative (a reason), not a score; requirements are not
 *  asserted — every threshold stays unverified with a link to DAAD (CLAUDE.md §2/§3). */
function AiProgramCard({ program }: { program: AiProgram }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{program.name}</CardTitle>
            <p className="mt-1 text-sm font-medium">{program.university}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden />
              {program.city}
            </p>
          </div>
          <Badge variant={program.language === "EN" ? "secondary" : "outline"}>
            {program.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="eyebrow mb-1">Why it fits</p>
          <p className="text-sm text-muted-foreground">{program.fitReason}</p>
        </div>

        <div className="mt-auto space-y-2 rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow !text-amber-700">Requirements</span>
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Needs verification
            </Badge>
          </div>
          <p className="text-[0.7rem] text-amber-800">
            Admission thresholds (grade, ECTS, test scores) are program-specific and change yearly —
            confirm this program exists and meets your plan on the official page.
          </p>
          <SourceLink source={source("daadRequirements")} />
        </div>
      </CardContent>
    </Card>
  );
}

type LanguageFilter = "all" | ProgramLanguage;

const LANGUAGE_LABEL: Record<ProgramLanguage, string> = {
  EN: "English-taught",
  DE: "German-taught",
};

const MIN_FIT_OPTIONS = [0, 70, 80, 90] as const;

function ProgramCard({ program }: { program: MatchedProgram }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{program.name}</CardTitle>
            <p className="mt-1 text-sm font-medium">{program.university}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden />
              {program.city}
            </p>
          </div>
          <Badge variant={program.language === "EN" ? "secondary" : "outline"}>
            {program.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="eyebrow">Fit (illustrative)</span>
            <span className="official-figure text-sm font-semibold">{program.fitPct}%</span>
          </div>
          <Progress
            value={program.fitPct}
            label={`Illustrative fit for ${program.name}: ${program.fitPct} percent`}
            className="h-1.5"
            indicatorClassName="bg-category-profile"
          />
        </div>

        <p className="text-xs text-muted-foreground">{program.field}</p>

        <div className="mt-auto space-y-2 rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow !text-amber-700">Requirements</span>
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Needs verification
            </Badge>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {program.requirements.map((req) => (
              <li
                key={req}
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-medium text-amber-900"
              >
                {req}
              </li>
            ))}
          </ul>
          <p className="text-[0.7rem] text-amber-800">
            Admission thresholds (grade, ECTS, test scores) are set per program and change yearly —
            confirm on the official page.
          </p>
          <SourceLink source={program.source} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Feature 03 — Course & university matching. Filterable shortlist of illustrative program matches. */
export default function ProfileMatching() {
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [minFit, setMinFit] = useState<number>(0);
  const [field, setField] = useState("");
  const ai = useGenerate<ProgramMatchesResult>();

  const results = useMemo(
    () =>
      MATCHED_PROGRAMS.filter(
        (p) => (language === "all" || p.language === language) && p.fitPct >= minFit,
      ).sort((a, b) => b.fitPct - a.fitPct),
    [language, minFit],
  );

  const matchWithAi = async () => {
    const prompt = [
      "Suggest about 5 Master's programs at German PUBLIC universities for this applicant.",
      "Each: name, university, city, language (EN or DE), and a one-sentence fitReason.",
      "Only real, plausible public-university programs. Do NOT state admission thresholds,",
      "grades, fees, or deadlines — those are verified separately.",
      "",
      `Applicant field / background / goal: ${field.trim() || "Computer Science Master's, English-taught preferred"}`,
    ].join("\n");
    await ai.generate(
      programMatchesSchema,
      prompt,
      "{ programs: { name, university, city, language: EN|DE, fitReason }[] (about 5) }",
      0.6,
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 03 · Profile"
        title="Course & university matching"
        description="A shortlist of Master's programs at German public universities that fit your background. Use it to plan — then verify each program's actual requirements before applying."
        category="profile"
        fileRef="§ 03"
      />

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertDescription>
          These matches are illustrative, generated from a demo profile. Program admission
          thresholds are program-specific and revised yearly, so every requirement below is flagged
          for verification with a link to the official source.
        </AlertDescription>
      </Alert>

      <section className="rounded-lg border bg-card p-4 shadow-sm" aria-labelledby="ai-match-heading">
        <h2 id="ai-match-heading" className="text-sm font-medium">
          Match with AI
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe your field, background, and goal — get a tailored shortlist. Requirements still
          need verifying against the official source.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="match-field" className="sr-only">
            Your field, background, and goal
          </label>
          <Input
            id="match-field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. CS bachelor, 1 yr backend, want a data-engineering Master's in English"
            disabled={ai.loading}
          />
          <Button onClick={matchWithAi} disabled={ai.loading} aria-busy={ai.loading} className="shrink-0">
            {ai.loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Matching…
              </>
            ) : (
              <>
                <Sparkles aria-hidden />
                Match with AI
              </>
            )}
          </Button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {ai.loading ? "Finding matching programs with AI." : ""}
        </p>
        {ai.noProvider && <NoProviderAlert className="mt-3" />}
        {ai.error && <RetryAlert className="mt-3" message={ai.error} onRetry={matchWithAi} />}
      </section>

      {ai.result && (
        <section aria-labelledby="ai-results-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="ai-results-heading" className="text-lg font-semibold tracking-tight">
              AI-matched programs
            </h2>
            <AiGeneratedBadge />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ai.result.programs.map((p, i) => (
              <AiProgramCard key={`${p.university}-${p.name}-${i}`} program={p} />
            ))}
          </div>
        </section>
      )}

      <section
        className="rounded-lg border bg-card p-4 shadow-sm"
        aria-labelledby="filter-heading"
      >
        <h2 id="filter-heading" className="sr-only">
          Filter programs
        </h2>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <fieldset>
            <legend className="eyebrow mb-1.5">Language</legend>
            <div className="flex flex-wrap gap-2">
              {(["all", "EN", "DE"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLanguage(opt)}
                  aria-pressed={language === opt}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    language === opt
                      ? "border-category-profile bg-category-profile/10 text-category-profile"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt === "all" ? "All" : LANGUAGE_LABEL[opt]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-1.5">Minimum fit</legend>
            <div className="flex flex-wrap gap-2">
              {MIN_FIT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMinFit(opt)}
                  aria-pressed={minFit === opt}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    minFit === opt
                      ? "border-category-profile bg-category-profile/10 text-category-profile"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt === 0 ? "Any" : `${opt}%+`}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="ml-auto text-xs text-muted-foreground" aria-live="polite">
            <span className="official-figure text-foreground">{results.length}</span> of{" "}
            <span className="official-figure">{MATCHED_PROGRAMS.length}</span> programs
          </p>
        </div>
      </section>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No programs match these filters. Try lowering the minimum fit or switching language.
        </p>
      )}
    </div>
  );
}
