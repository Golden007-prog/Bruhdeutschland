import { useState } from "react";
import { FileUp, Loader2, Lock, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { parsedProfileSchema, type ParsedProfileResult } from "@/features/ai/schemas";
import { useGenerate } from "@/features/ai/useGenerate";
import { mockParsedProfile } from "@/lib/mockData";
import type { ParsedProfile } from "@/lib/types";

const SAMPLE_TEXT = `Jane Doe — Backend Engineer
B.Tech Computer Science, IIT Delhi (2024)
Experience: 1 yr backend (Python, Go, PostgreSQL)
Skills: REST APIs, microservices, CI/CD`;

type ParseState = "idle" | "parsing" | "done";

/**
 * Map the AI's shallow extraction into the app's full {@link ParsedProfile}. The deterministic
 * official values (German GPA, total ECTS) are NOT produced by the model — they stay flagged for
 * verification until computed by the backend (CLAUDE.md §2/§4).
 */
function toParsedProfile(result: ParsedProfileResult): ParsedProfile {
  return {
    fileName: "Pasted resume / LinkedIn text",
    facts: result.facts,
    germanGpa: { value: null, needsVerification: true },
    gpaMethod: "Modified Bavarian Formula (computed by the backend, not the AI)",
    totalEcts: { value: null, needsVerification: true },
    skillGaps: result.skillGaps.map((g, i) => ({
      id: `ai-gap-${i}`,
      skill: g.skill,
      severity: g.severity,
    })),
  };
}

/** Feature 01 — Resume & LinkedIn parsing. Demo intake: paste text → reveal the parsed profile. */
export default function ProfileParse() {
  const [text, setText] = useState("");
  const [state, setState] = useState<ParseState>("idle");
  const ai = useGenerate<ParsedProfileResult>();
  const [aiProfile, setAiProfile] = useState<ParsedProfile | null>(null);

  const parse = () => {
    setState("parsing");
    // Demo only — no backend. Simulate the round-trip, then reveal the typed mock result.
    window.setTimeout(() => setState("done"), 650);
  };

  const parseWithAi = async () => {
    setAiProfile(null);
    const prompt = [
      "Extract a structured profile from this resume / LinkedIn text for German Master's admissions.",
      "Return only facts present in the text — never invent degrees, dates, employers, or grades.",
      "facts: short label/value pairs (e.g. Degree, Institution, Graduation, Experience).",
      "skillGaps: skills a German Master's programme typically expects that this profile does not",
      "yet evidence, each with a severity of low/medium/high. Do not assert official requirements.",
      "",
      "Resume / LinkedIn text:",
      text.trim(),
    ].join("\n");
    const result = await ai.generate(
      parsedProfileSchema,
      prompt,
      "{ facts: {label,value}[], skillGaps: {skill, severity: low|medium|high}[] }",
      0.3,
    );
    if (result) {
      setAiProfile(toParsedProfile(result));
      setState("done");
    }
  };

  const reset = () => {
    setState("idle");
    setText("");
    setAiProfile(null);
    ai.reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 01 · Profile"
        title="Resume & LinkedIn parsing"
        description="Paste your resume or LinkedIn export and we extract the facts a German admissions office cares about — degree, institution, graduation year, and experience — into a structured profile."
        category="profile"
        fileRef="§ 01"
      />

      <Alert variant="info">
        <ShieldCheck aria-hidden />
        <AlertTitle>Your data is treated as personal data (GDPR)</AlertTitle>
        <AlertDescription>
          Resume and LinkedIn content is personal data. It is encrypted at rest, never written to
          logs in raw form, and you can export or delete it at any time. This page runs entirely in
          your browser for the demo — nothing is uploaded.
        </AlertDescription>
      </Alert>

      <section
        className="rounded-lg border bg-card p-5 shadow-sm"
        aria-labelledby="intake-heading"
      >
        <div className="mb-4 flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 id="intake-heading" className="text-sm font-medium">
            Intake
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label htmlFor="resume-text" className="eyebrow block">
              Paste resume / LinkedIn text
            </label>
            <Textarea
              id="resume-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume or the text from your LinkedIn profile here…"
              className="min-h-[160px] font-mono text-xs"
              disabled={state === "parsing"}
            />
            <button
              type="button"
              onClick={() => setText(SAMPLE_TEXT)}
              className="text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={state === "parsing"}
            >
              Use sample text
            </button>
          </div>

          {/* Disabled file-drop affordance — upload is not part of the in-browser demo. */}
          <div
            aria-disabled="true"
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 p-6 text-center opacity-70 lg:w-56"
          >
            <FileUp className="h-6 w-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-muted-foreground">Drop a PDF / DOCX</p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              File upload coming soon
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={parseWithAi}
            disabled={text.trim().length === 0 || ai.loading || state === "parsing"}
            aria-busy={ai.loading}
          >
            {ai.loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Parsing with AI…
              </>
            ) : (
              <>
                <Sparkles aria-hidden />
                Parse with AI
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={parse}
            disabled={text.trim().length === 0 || state === "parsing" || ai.loading}
          >
            {state === "parsing" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Parsing…
              </>
            ) : (
              <>
                <ScanLine aria-hidden />
                Parse (demo)
              </>
            )}
          </Button>
          {(state === "done" || aiProfile) && (
            <Button variant="ghost" onClick={reset}>
              Start over
            </Button>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {ai.loading ? "Extracting your profile with AI." : ""}
        </p>
        {ai.noProvider && <NoProviderAlert className="mt-4" />}
        {ai.error && <RetryAlert className="mt-4" message={ai.error} onRetry={parseWithAi} />}
      </section>

      {state === "done" && (
        <section aria-labelledby="parsed-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Ergebnis · Parsed result</p>
              <h2 id="parsed-heading" className="mt-1 text-lg font-semibold tracking-tight">
                Extracted profile
              </h2>
            </div>
            {aiProfile && <AiGeneratedBadge />}
          </div>
          <ResumeAnalyzer profile={aiProfile ?? mockParsedProfile} />
          <p className="text-xs text-muted-foreground">
            {aiProfile
              ? "Extracted from your pasted text. The German GPA and ECTS total are computed deterministically by the backend — they stay flagged for verification here."
              : "Demo result shown from sample data. In the full product these facts come from your own document and feed directly into the GPA, ECTS, and matching tools."}
          </p>
        </section>
      )}
    </div>
  );
}
