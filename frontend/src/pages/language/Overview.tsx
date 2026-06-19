import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Languages,
  Layers,
  ListChecks,
  Mic,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactList } from "@/components/common/OfficialFact";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IELTS_TYPICAL, TESTDAF_TYPICAL, TOEFL_TYPICAL } from "@/lib/facts";

interface ToolCard {
  to: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  tag: string;
}

const TOOLS: ToolCard[] = [
  {
    to: "/language/german",
    title: "German A1–B2 course",
    blurb: "Level-by-level can-do goals with spoken example phrases (text-to-speech).",
    icon: Languages,
    tag: "Course",
  },
  {
    to: "/language/flashcards",
    title: "Spaced-repetition flashcards",
    blurb: "Drill admission and arrival vocabulary with an Again / Good / Easy schedule.",
    icon: Layers,
    tag: "Vocab",
  },
  {
    to: "/language/ielts-toefl",
    title: "IELTS & TOEFL",
    blurb: "Formats, target bands, and the Jan-2026 TOEFL rescale — for English-taught programs.",
    icon: BookOpen,
    tag: "English",
  },
  {
    to: "/language/gre-gmat",
    title: "GRE / GMAT checker",
    blurb: "Most programs don't require them — check yours before you book a test.",
    icon: ClipboardCheck,
    tag: "Optional",
  },
  {
    to: "/language/goethe-testdaf",
    title: "Goethe & TestDaF",
    blurb: "Compare TestDaF, DSH, Goethe, and telc to pick the right German certificate.",
    icon: GraduationCap,
    tag: "German",
  },
];

export default function LanguageOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich C · Language & Test"
        title="Language & Test Prep"
        description="Reach the German or English level your program requires, and rehearse every admission test with timed mocks."
        category="language"
      />

      {/* English-taught vs German-taught decision */}
      <section aria-labelledby="decision-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-category-language" aria-hidden />
          <h2 id="decision-heading" className="text-lg font-semibold">
            First decision: English-taught or German-taught?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          The language your program is taught in decides which tests you need. Pick the track that
          matches your shortlist — many students prepare for both while deciding.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">English-taught Master's</CardTitle>
                <Badge variant="secondary">English proof</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Growing number of international Master's programs. You typically prove English with
                IELTS Academic or TOEFL iBT (some accept Duolingo or a medium-of-instruction letter).
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Plan for IELTS or TOEFL.</li>
                <li>Basic German (A1–A2) still helps with daily life and the visa.</li>
                <li>Check whether a German certificate is required for the residence permit.</li>
              </ul>
              <Link
                to="/language/ielts-toefl"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Prepare English tests <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">German-taught Master's</CardTitle>
                <Badge variant="secondary">German proof</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Taught entirely in German. Programs usually expect a recognised certificate at a
                C1-ish level — TestDaF, DSH, Goethe C1, or telc C1 Hochschule.
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Work up the CEFR ladder to a confident B2/C1.</li>
                <li>Pick one accepted certificate and prepare its exact sections.</li>
                <li>An English test may still be required for some courses.</li>
              </ul>
              <Link
                to="/language/goethe-testdaf"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Compare German certificates <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Typical bars */}
      <section aria-labelledby="bars-heading" className="space-y-3">
        <h2 id="bars-heading" className="text-lg font-semibold">
          Typical bars — not guarantees
        </h2>
        <Alert variant="warning">
          <ListChecks aria-hidden />
          <AlertTitle>Thresholds are set per program</AlertTitle>
          <AlertDescription>
            The figures below are common reference points, not admission promises. Every program
            publishes its own minimum — always confirm the exact requirement on the specific program
            page before you commit to a test date.
          </AlertDescription>
        </Alert>
        <OfficialFactList facts={[IELTS_TYPICAL, TOEFL_TYPICAL, TESTDAF_TYPICAL]} />
      </section>

      {/* Tools */}
      <section aria-labelledby="tools-heading" className="space-y-3">
        <h2 id="tools-heading" className="text-lg font-semibold">
          Tools in this section
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex flex-col rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-category-language focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-category-language">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="eyebrow">{tool.tag}</span>
                </div>
                <h3 className="mt-3 font-semibold">{tool.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{tool.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                  Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mock exam centre callout */}
      <section aria-labelledby="mock-heading">
        <Card className="border-category-language/40">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-category-language">
                <Mic className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="mock-heading" className="font-semibold">
                  Mock exam centre
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Timed practice for IELTS, TOEFL, TestDaF, Goethe, GRE, and GMAT. Study aids — they
                  do not predict your real score.
                </p>
              </div>
            </div>
            <Link
              to="/language/exams"
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Open mock exams <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
