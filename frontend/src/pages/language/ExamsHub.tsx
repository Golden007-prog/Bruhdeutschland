import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { source } from "@/lib/sources";
import type { SourceKey } from "@/lib/sources";

interface ExamCard {
  id: string;
  title: string;
  blurb: string;
  /** Test owner / language family shown as a tag. */
  tag: string;
  sourceKey: SourceKey;
  runnerHref: string;
}

const EXAMS: ExamCard[] = [
  {
    id: "ielts",
    title: "IELTS Academic",
    blurb: "Practice English Listening, Reading, and Writing question types on the Band 0–9 scale.",
    tag: "English",
    sourceKey: "ielts",
    runnerHref: "/language/exams/ielts",
  },
  {
    id: "toefl",
    title: "TOEFL iBT",
    blurb: "Academic Reading, Listening, Speaking, and Writing tasks (note the Jan-2026 rescale).",
    tag: "English",
    sourceKey: "toefl",
    runnerHref: "/language/exams/toefl",
  },
  {
    id: "testdaf",
    title: "TestDaF",
    blurb: "German for academic purposes across all four skills, reported on the TestDaF level scale.",
    tag: "German",
    sourceKey: "testdaf",
    runnerHref: "/language/exams/testdaf",
  },
  {
    id: "goethe",
    title: "Goethe-Zertifikat",
    blurb: "CEFR-aligned German modules (Reading, Listening, Writing, Speaking).",
    tag: "German",
    sourceKey: "goethe",
    runnerHref: "/language/exams/goethe",
  },
  {
    id: "gre",
    title: "GRE General",
    blurb: "Verbal and Quantitative Reasoning practice for programs that ask for it.",
    tag: "Aptitude",
    sourceKey: "gre",
    runnerHref: "/language/exams/gre",
  },
  {
    id: "gmat",
    title: "GMAT Focus",
    blurb: "Quantitative, Verbal, and Data Insights practice for management programs.",
    tag: "Aptitude",
    sourceKey: "gmat",
    runnerHref: "/language/exams/gmat",
  },
];

export default function LanguageExamsHub() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstests · Mock exams"
        title="Mock exam centre"
        description="Timed practice exams for every test you might need: IELTS, TOEFL, TestDaF, Goethe, GRE, and GMAT."
        category="language"
      />

      <Alert variant="warning">
        <FlaskConical aria-hidden />
        <AlertTitle>Practice items are study aids — not the real test</AlertTitle>
        <AlertDescription>
          These question sets are original practice material modelled on each exam's question types.
          They do not reproduce real exam content and do not predict your official score. Always
          confirm the current format and scoring on the test owner's official page.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS.map((exam) => (
          <article
            key={exam.id}
            className="flex flex-col rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-category-language">
                <FlaskConical className="h-5 w-5" aria-hidden />
              </span>
              <Badge variant="secondary">{exam.tag}</Badge>
            </div>
            <h2 className="mt-3 font-semibold">{exam.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{exam.blurb}</p>
            <div className="mt-3">
              <SourceLink source={source(exam.sourceKey)} />
            </div>
            <Link
              to={exam.runnerHref}
              aria-label={`Start the ${exam.title} practice exam`}
              className="mt-3 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Start practice exam <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
