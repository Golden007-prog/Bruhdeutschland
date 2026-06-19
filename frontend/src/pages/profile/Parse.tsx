import { useState } from "react";
import { FileUp, Loader2, Lock, ScanLine, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockParsedProfile } from "@/lib/mockData";

const SAMPLE_TEXT = `Jane Doe — Backend Engineer
B.Tech Computer Science, IIT Delhi (2024)
Experience: 1 yr backend (Python, Go, PostgreSQL)
Skills: REST APIs, microservices, CI/CD`;

type ParseState = "idle" | "parsing" | "done";

/** Feature 01 — Resume & LinkedIn parsing. Demo intake: paste text → reveal the parsed profile. */
export default function ProfileParse() {
  const [text, setText] = useState("");
  const [state, setState] = useState<ParseState>("idle");

  const parse = () => {
    setState("parsing");
    // Demo only — no backend. Simulate the round-trip, then reveal the typed mock result.
    window.setTimeout(() => setState("done"), 650);
  };

  const reset = () => {
    setState("idle");
    setText("");
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
          <Button onClick={parse} disabled={text.trim().length === 0 || state === "parsing"}>
            {state === "parsing" ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Parsing…
              </>
            ) : (
              <>
                <ScanLine aria-hidden />
                Parse profile
              </>
            )}
          </Button>
          {state === "done" && (
            <Button variant="outline" onClick={reset}>
              Start over
            </Button>
          )}
        </div>
      </section>

      {state === "done" && (
        <section aria-labelledby="parsed-heading" className="space-y-3">
          <div>
            <p className="eyebrow">Ergebnis · Parsed result</p>
            <h2 id="parsed-heading" className="mt-1 text-lg font-semibold tracking-tight">
              Extracted profile
            </h2>
          </div>
          <ResumeAnalyzer profile={mockParsedProfile} />
          <p className="text-xs text-muted-foreground">
            Demo result shown from sample data. In the full product these facts come from your own
            document and feed directly into the GPA, ECTS, and matching tools.
          </p>
        </section>
      )}
    </div>
  );
}
