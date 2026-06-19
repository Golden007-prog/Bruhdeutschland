import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExamSectionDef, OfficialFact, Source } from "@/lib/types";
import { source } from "@/lib/sources";
import { IELTS_TYPICAL, TOEFL_TYPICAL } from "@/lib/facts";

/**
 * Structural format facts (sections / durations / scoring) follow each test owner's official format
 * page, cited via the SourceLink on each card. Program-specific target scores are the grounded facts
 * from lib/facts.ts and render with their verification treatment.
 */
const IELTS_SECTIONS: ExamSectionDef[] = [
  {
    name: "Listening",
    durationMin: 30,
    format: "4 recorded sections, 40 questions (note/form/sentence completion, matching, MCQ).",
    scoring: "Reported on the Band 0–9 scale.",
  },
  {
    name: "Reading",
    durationMin: 60,
    format: "3 academic passages, 40 questions (T/F/Not Given, matching headings, summary completion).",
    scoring: "Band 0–9.",
  },
  {
    name: "Writing",
    durationMin: 60,
    format: "Task 1 (describe a chart/graph/process, 150+ words) + Task 2 (essay, 250+ words).",
    scoring: "Band 0–9 (task achievement, coherence, lexis, grammar).",
  },
  {
    name: "Speaking",
    durationMin: 14,
    format: "Examiner interview: intro, cue-card long turn, two-way discussion (11–14 min).",
    scoring: "Band 0–9; overall is the average of the four, rounded to the nearest half-band.",
  },
];

const TOEFL_SECTIONS: ExamSectionDef[] = [
  {
    name: "Reading",
    durationMin: 30,
    format: "Academic passages with multiple-choice questions.",
    scoring: "Section score; contributes to the total.",
  },
  {
    name: "Listening",
    durationMin: 29,
    format: "Lectures and conversations with comprehension questions.",
    scoring: "Section score; contributes to the total.",
  },
  {
    name: "Speaking",
    durationMin: 16,
    format: "Independent and integrated tasks (speak in response to prompts/passages).",
    scoring: "Rated by raters + automated scoring.",
  },
  {
    name: "Writing",
    durationMin: 30,
    format: "Integrated task + a discussion (Writing for an Academic Discussion) task.",
    scoring: "Section score; contributes to the total.",
  },
];

function FormatTable({ sections, caption }: { sections: ExamSectionDef[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-left">
            <th scope="col" className="py-2 pr-3 font-medium">
              Section
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Time
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Format
            </th>
            <th scope="col" className="py-2 font-medium">
              Scoring
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.name} className="border-b align-top last:border-0">
              <th scope="row" className="py-2 pr-3 text-left font-medium">
                {s.name}
              </th>
              <td className="py-2 pr-3">
                <span className="official-figure whitespace-nowrap">~{s.durationMin} min</span>
              </td>
              <td className="py-2 pr-3 text-muted-foreground">{s.format}</td>
              <td className="py-2 text-muted-foreground">{s.scoring}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExamBlock({
  title,
  scaleNote,
  sections,
  fact,
  examSource,
  runnerHref,
  runnerLabel,
}: {
  title: string;
  scaleNote: string;
  sections: ExamSectionDef[];
  fact: OfficialFact;
  examSource: Source;
  runnerHref: string;
  runnerLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <SourceLink source={examSource} />
        </div>
        <p className="text-sm text-muted-foreground">{scaleNote}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormatTable sections={sections} caption={`${title} section format`} />
        <OfficialFactRow fact={fact} />
        <Link
          to={runnerHref}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {runnerLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function LanguageIeltsToefl() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 14 · Language"
        title="IELTS & TOEFL preparation"
        description="Understand the formats, target the right band/score, and practice with timed section mocks."
        category="language"
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Target scores are program-specific</AlertTitle>
        <AlertDescription>
          The bands below are common reference points, not admission promises. Confirm the exact
          minimum on each program page — and note whether per-section minimums also apply.
        </AlertDescription>
      </Alert>

      <ExamBlock
        title="IELTS Academic"
        scaleNote="Four sections, reported on the Band 0–9 scale; the overall band is the average of the four, rounded to the nearest half-band."
        sections={IELTS_SECTIONS}
        fact={IELTS_TYPICAL}
        examSource={source("ielts")}
        runnerHref="/language/exams/ielts"
        runnerLabel="Open IELTS practice exam"
      />

      <ExamBlock
        title="TOEFL iBT"
        scaleNote="Four sections covering Reading, Listening, Speaking, and Writing."
        sections={TOEFL_SECTIONS}
        fact={TOEFL_TYPICAL}
        examSource={source("toefl")}
        runnerHref="/language/exams/toefl"
        runnerLabel="Open TOEFL practice exam"
      />

      <Alert variant="warning">
        <Info aria-hidden />
        <AlertTitle>TOEFL scoring change — January 2026</AlertTitle>
        <AlertDescription>
          From January 2026, TOEFL iBT moved to a <span className="official-figure">1–6</span> scale,
          reported alongside the legacy <span className="official-figure">0–120</span> scale during
          the transition. If a program states a 0–120 minimum, check how it maps to the new scale and
          confirm with the admissions office. Verify the current scoring on the official ETS page.
        </AlertDescription>
      </Alert>
    </div>
  );
}
