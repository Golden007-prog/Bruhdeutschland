import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileUp, Loader2, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { IntakeFields } from "@/features/profile/IntakeFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { parsedProfileSchema, type ParsedProfileResult } from "@/features/ai/schemas";
import { useGenerate } from "@/features/ai/useGenerate";
import { toParsedProfile } from "@/lib/profile/profile";
import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile/types";
import { useProfile } from "@/lib/profile/useProfile";
import { extractTextFromFile, guessProfileFields } from "@/lib/resume/resume";
import type { ParsedProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const SAMPLE_TEXT = `Jane Doe — Backend Engineer
B.Tech Computer Science, IIT Delhi (2024) · CGPA 8.4/10
Experience: 1 yr backend (Python, Go, PostgreSQL)
Skills: REST APIs, microservices, CI/CD`;

type Mode = "intake" | "review" | "saved";

/** Map an AI extraction's free-form facts onto structured profile fields, without overwriting input. */
function applyAiFacts(draft: UserProfile, result: ParsedProfileResult): Partial<UserProfile> {
  const patch: Partial<UserProfile> = {};
  for (const f of result.facts) {
    const l = f.label.toLowerCase();
    if (l.includes("degree") && !draft.currentDegree) patch.currentDegree = f.value;
    else if ((l.includes("institution") || l.includes("university")) && !draft.institution)
      patch.institution = f.value;
    else if (l.includes("name") && !draft.name) patch.name = f.value;
    else if (l.includes("field") && !draft.targetField) patch.targetField = f.value;
  }
  return patch;
}

/** Feature 01 — Résumé & LinkedIn parsing: upload/paste → review extracted fields → save to profile. */
export default function ProfileParse() {
  const { profile, setProfile } = useProfile();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("intake");
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const ai = useGenerate<ParsedProfileResult>();
  const dropId = useRef("resume-file").current;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileError("");
    setExtracting(true);
    setFileName(file.name);
    try {
      const extracted = await extractTextFromFile(file);
      setText(extracted.trim());
      if (!extracted.trim()) {
        setFileError("No text found — this may be a scanned image. Paste the text instead.");
      }
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Could not read that file.");
      setFileName("");
    } finally {
      setExtracting(false);
    }
  }

  function extractAndReview() {
    const guess = guessProfileFields(text);
    // Seed from the existing profile, overlay non-empty guesses — never wipe prior fields.
    setDraft({
      ...DEFAULT_PROFILE,
      ...profile,
      name: guess.name || profile.name,
      currentDegree: guess.currentDegree || profile.currentDegree,
      institution: guess.institution || profile.institution,
      gradeValue: guess.gradeValue || profile.gradeValue,
      gradeScale: guess.gradeScale || profile.gradeScale,
      targetField: guess.targetField || profile.targetField,
    });
    setMode("review");
  }

  async function autofillWithAi() {
    const prompt = [
      "Extract a structured profile from this résumé / LinkedIn text for German Master's admissions.",
      "Return only facts present in the text — never invent degrees, dates, employers, grades, or jobs.",
      "facts: short label/value pairs (e.g. Name, Degree, Institution, Field).",
      "workExperiences: each job/internship in the text — title, employer, country, employmentType",
      "(full_time|part_time|internship|working_student|freelance|research|volunteer), startDate &",
      "endDate as 'YYYY-MM' when known (else empty), ongoing (true if current), domain, skills[], and",
      "relevantToTarget (true if it relates to the target field). Omit a field if the text doesn't say.",
      "skillGaps: skills a German Master's programme typically expects that this profile does not yet",
      "evidence, each with severity low/medium/high. Do not assert official requirements.",
      "",
      "Text:",
      text.trim(),
    ].join("\n");
    const result = await ai.generate(
      parsedProfileSchema,
      prompt,
      '{ facts: {label,value}[], workExperiences: {title,employer,country,employmentType,startDate,endDate,ongoing,domain,skills,relevantToTarget}[], skillGaps: {skill, severity: low|medium|high}[] }',
      0.3,
    );
    if (result) {
      setDraft((d) => {
        const next: UserProfile = { ...d, ...applyAiFacts(d, result) };
        // Only adopt parsed roles when the user hasn't entered any (never overwrite their edits).
        if (next.workExperiences.length === 0 && result.workExperiences.length > 0) {
          next.workExperiences = result.workExperiences.map((w, i) => ({
            id: `ai-we-${i}`,
            title: w.title,
            employer: w.employer,
            country: w.country,
            employmentType: w.employmentType,
            startDate: w.startDate,
            endDate: w.endDate,
            ongoing: w.ongoing,
            domain: w.domain,
            skills: w.skills,
            description: "",
            relevantToTarget: w.relevantToTarget,
          }));
        }
        return next;
      });
    }
  }

  function save() {
    setProfile(draft);
    setMode("saved");
  }

  function reset() {
    setText("");
    setFileName("");
    setFileError("");
    setDraft(DEFAULT_PROFILE);
    ai.reset();
    setMode("intake");
  }

  const preview: ParsedProfile = {
    ...toParsedProfile(draft),
    skillGaps: ai.result
      ? ai.result.skillGaps.map((g, i) => ({ id: `ai-gap-${i}`, skill: g.skill, severity: g.severity }))
      : [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 01 · Profile"
        title="Résumé & LinkedIn parsing"
        description="Upload a résumé (PDF/DOCX) or paste the text. We extract the facts a German admissions office cares about into an editable form — you confirm them before any grade is computed."
        category="profile"
        fileRef="§ 01"
      />

      <Alert variant="info">
        <ShieldCheck aria-hidden />
        <AlertTitle>Your data is treated as personal data (GDPR)</AlertTitle>
        <AlertDescription>
          Résumé and LinkedIn content is personal data. Parsing runs entirely in your browser —
          nothing is uploaded — and it is never written to logs in raw form. You can export or delete
          it any time from Settings.
        </AlertDescription>
      </Alert>

      {mode === "intake" && (
        <section className="rounded-lg border bg-card p-5 shadow-sm" aria-labelledby="intake-heading">
          <div className="mb-4 flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 id="intake-heading" className="text-sm font-medium">Provide your résumé</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label htmlFor="resume-text" className="eyebrow block">Paste résumé / LinkedIn text</label>
              <Textarea
                id="resume-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your résumé or the text from your LinkedIn profile here…"
                className="min-h-[160px] font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setText(SAMPLE_TEXT)}
                className="text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Use sample text
              </button>
            </div>

            {/* Real file drop + browse. */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void onFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 p-6 text-center transition-colors lg:w-60",
                dragOver && "border-primary bg-primary/5",
              )}
            >
              <FileUp className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Drop a PDF or DOCX</p>
              <input
                id={dropId}
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <label htmlFor={dropId} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
                Browse files
              </label>
              <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT · up to 8 MB</p>
              {extracting && (
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Reading {fileName}…
                </p>
              )}
              {fileName && !extracting && !fileError && (
                <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" aria-hidden /> {fileName}
                </p>
              )}
            </div>
          </div>

          {fileError && (
            <p className="mt-3 text-sm text-destructive" role="alert">{fileError}</p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            From LinkedIn? Open your profile → <span className="font-medium">More</span> →{" "}
            <span className="font-medium">Save to PDF</span>, then upload that file. We never scrape
            LinkedIn.
          </p>

          <div className="mt-4">
            <Button onClick={extractAndReview} disabled={text.trim().length === 0 || extracting}>
              <ScanLine aria-hidden /> Extract &amp; review
            </Button>
          </div>
        </section>
      )}

      {mode === "review" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Review extracted details</CardTitle>
                {ai.result && <AiGeneratedBadge />}
              </div>
              <p className="text-xs text-muted-foreground">
                We pre-filled what we could find — correct anything before saving. Your German grade is
                computed deterministically once you save; ECTS stays for the ECTS tool.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <IntakeFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} idPrefix="parse" />

              <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                <Button onClick={save}>
                  <CheckCircle2 aria-hidden /> Save to my profile
                </Button>
                <Button variant="outline" onClick={autofillWithAi} disabled={ai.loading} aria-busy={ai.loading}>
                  {ai.loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                  Auto-fill with AI
                </Button>
                <Button variant="ghost" onClick={reset}>Start over</Button>
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {ai.loading ? "Extracting your profile with AI." : ""}
              </p>
              {ai.noProvider && <NoProviderAlert />}
              {ai.error && <RetryAlert message={ai.error} onRetry={autofillWithAi} />}
            </CardContent>
          </Card>

          <section aria-labelledby="preview-heading" className="space-y-3">
            <h2 id="preview-heading" className="eyebrow">Live preview</h2>
            <ResumeAnalyzer profile={preview} />
          </section>
        </div>
      )}

      {mode === "saved" && (
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Saved to your profile</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Your details now personalize the dashboard, GPA evaluation, matching, and roadmap. Update
              them any time in Settings.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/" className={cn(buttonVariants({ size: "sm" }))}>Go to dashboard</Link>
              <Link to="/profile/evaluate" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Evaluate my GPA
              </Link>
              <Link to="/profile/matching" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Match programs
              </Link>
              <Button variant="ghost" size="sm" onClick={reset}>Parse another</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
