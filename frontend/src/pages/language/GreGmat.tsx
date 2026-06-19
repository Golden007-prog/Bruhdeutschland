import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, HelpCircle, Info, XCircle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { source } from "@/lib/sources";

type RequiredAnswer = "" | "yes" | "no" | "unsure";

interface ScoreRow {
  exam: string;
  range: string;
  detail: string;
  sourceKey: "gre" | "gmat";
  runnerHref: string;
}

const SCORE_ROWS: ScoreRow[] = [
  {
    exam: "GRE General",
    range: "130–170 per section · AWA 0–6",
    detail:
      "Verbal Reasoning and Quantitative Reasoning each scored 130–170 in 1-point steps; Analytical Writing 0–6 in half-point steps.",
    sourceKey: "gre",
    runnerHref: "/language/exams/gre",
  },
  {
    exam: "GMAT Focus Edition",
    range: "205–805 (total)",
    detail:
      "Total score on the 205–805 scale across Quantitative, Verbal, and Data Insights sections.",
    sourceKey: "gmat",
    runnerHref: "/language/exams/gmat",
  },
];

export default function LanguageGreGmat() {
  const [field, setField] = useState("");
  const [asksFor, setAsksFor] = useState<RequiredAnswer>("");

  const showGuidance = asksFor !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 15 · Language"
        title="GRE / GMAT requirement checker"
        description="Find out whether your target programs require GRE or GMAT, and what scores are competitive."
        category="language"
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Most German public-university Master's do not require GRE or GMAT</AlertTitle>
        <AlertDescription>
          Unlike many US programs, the majority of German Master's admit on your degree, grades, and
          motivation — not a standardised aptitude test. GRE/GMAT tends to surface only for selected,
          competitive, or business/management programs. Always read the specific program's admission
          requirements before booking a test.
        </AlertDescription>
      </Alert>

      {/* Self-check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick self-check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="program-field" className="text-sm font-medium">
                Program field (optional)
              </label>
              <input
                id="program-field"
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="e.g. Management, Data Science"
                className="h-9 w-full rounded-md border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="asks-for" className="text-sm font-medium">
                Does your program ask for GRE / GMAT?
              </label>
              <select
                id="asks-for"
                value={asksFor}
                onChange={(e) => setAsksFor(e.target.value as RequiredAnswer)}
                className="h-9 w-full rounded-md border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select…</option>
                <option value="yes">Yes — the program page lists it</option>
                <option value="no">No — it isn't mentioned</option>
                <option value="unsure">I'm not sure yet</option>
              </select>
            </div>
          </div>

          {showGuidance && (
            <div role="status" aria-live="polite">
              {asksFor === "yes" && (
                <Alert variant="warning">
                  <CheckCircle2 aria-hidden />
                  <AlertTitle>
                    Plan for the test{field.trim() ? ` for ${field.trim()}` : ""}
                  </AlertTitle>
                  <AlertDescription>
                    Find the exact exam, minimum score, and section requirements on the program page,
                    then book early — scores can take a couple of weeks to be reported. Use the score
                    ranges below as orientation only.
                  </AlertDescription>
                </Alert>
              )}
              {asksFor === "no" && (
                <Alert variant="success">
                  <CheckCircle2 aria-hidden />
                  <AlertTitle>Likely not needed — but double-check</AlertTitle>
                  <AlertDescription>
                    If the program page doesn't mention GRE/GMAT, you almost certainly don't need it.
                    Re-read the "Admission requirements" section once more to be sure, then invest the
                    time in your SOP and language proof instead.
                  </AlertDescription>
                </Alert>
              )}
              {asksFor === "unsure" && (
                <Alert variant="info">
                  <HelpCircle aria-hidden />
                  <AlertTitle>Check the program's admission requirements</AlertTitle>
                  <AlertDescription>
                    Open the official program page and look under "Admission requirements" /
                    "Zulassungsvoraussetzungen". If neither GRE nor GMAT is listed, you don't need it.
                    When in doubt, email the program coordinator.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {!showGuidance && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" aria-hidden />
              Answer the question above for tailored guidance.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Score ranges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score ranges (orientation only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SCORE_ROWS.map((row) => (
            <div key={row.exam} className="rounded-md border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-medium">{row.exam}</p>
                <p className="official-figure text-base font-semibold">{row.range}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <SourceLink source={source(row.sourceKey)} />
                <Link
                  to={row.runnerHref}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Practice {row.exam} <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Competitive scores are set per program — a "good" score for one course may be below the
            bar for another. These scales describe the tests, not any program's minimum.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
