import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, FlaskConical, Target } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { source } from "@/lib/sources";
import type { SourceKey } from "@/lib/sources";
import { useProfile } from "@/lib/profile/useProfile";
import { isProfileStarted } from "@/lib/profile/profile";
import { recommendedTests, type TestRec } from "@/lib/intake/derive";

interface ExamCard {
  id: string;
  title: string;
  blurb: string;
  /** Test owner / language family shown as a tag. */
  tag: string;
  sourceKey: SourceKey;
  runnerHref: string;
}

/** Map a recommendation (from the pathway/profile engine) to the mock routes that practise it. */
const REC_ROUTES: { match: RegExp; examIds: string[] }[] = [
  { match: /ielts|toefl|english/i, examIds: ["ielts", "toefl"] },
  { match: /testdaf|dsh|german to c1|german/i, examIds: ["testdaf", "goethe"] },
  { match: /testas/i, examIds: ["testas"] },
  { match: /tms/i, examIds: ["tms"] },
  { match: /gre|gmat/i, examIds: ["gre", "gmat"] },
];

function examIdsForRec(rec: TestRec): string[] {
  return REC_ROUTES.filter((r) => r.match.test(rec.test) || r.match.test(rec.reason)).flatMap((r) => r.examIds);
}

const REC_TONE: Record<TestRec["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50/50",
  info: "border-sky-200 bg-sky-50/50",
  warn: "border-amber-300 bg-amber-50/60",
};

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
  {
    id: "testas",
    title: "TestAS — Core module",
    blurb: "Study-aptitude reasoning many Bachelor/foundation programmes expect from international applicants — timed, auto-scored.",
    tag: "Aptitude",
    sourceKey: "testas",
    runnerHref: "/language/exams/testas",
  },
  {
    id: "tms",
    title: "TMS — Medizin",
    blurb: "Reasoning & concentration subtests (in German) that many medical faculties weight heavily.",
    tag: "Medicine",
    sourceKey: "tms",
    runnerHref: "/language/exams/tms",
  },
];

const EXAM_BY_ID = new Map(EXAMS.map((e) => [e.id, e]));

export default function LanguageExamsHub() {
  const { profile } = useProfile();
  const hasProfile = isProfileStarted(profile);
  // Pathway-driven "which tests YOU need" (gap G3-1): the deterministic recommender keys off target
  // level + medium of instruction + which certificates you already hold.
  const recs = useMemo(() => recommendedTests(profile), [profile]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstests · Mock exams"
        title="Mock exam centre"
        description="Timed practice exams for every test you might need: IELTS, TOEFL, TestDaF, Goethe, GRE, GMAT, TestAS, and TMS."
        category="language"
      />

      {/* Your tests — personalised from the pathway/profile engine (G3-1) */}
      <section aria-labelledby="your-tests-heading" className="rounded-lg border border-category-language/40 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="your-tests-heading" className="flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4 text-category-language" aria-hidden /> Which tests do you need?
          </h2>
          <Link to="/profile/pathway" className="text-xs text-primary hover:underline">Your pathway ↗</Link>
        </div>
        {hasProfile && recs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recs.map((rec, i) => {
              const ids = examIdsForRec(rec);
              return (
                <li key={i} className={`rounded-md border p-3 text-sm ${REC_TONE[rec.tone]}`}>
                  <p className="font-medium">{rec.test}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rec.reason}</p>
                  {ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ids.map((id) => {
                        const card = EXAM_BY_ID.get(id);
                        if (!card) return null;
                        return (
                          <Link key={id} to={card.runnerHref} className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 text-xs font-medium hover:bg-muted">
                            Practise {card.title.split(" — ")[0]} <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {hasProfile
              ? "No specific admission tests were derived from your profile — confirm each programme's exact requirement on its page."
              : (
                <>
                  Add your target level and language in your{" "}
                  <Link to="/settings" className="font-medium underline">profile</Link> and we&apos;ll list the exact
                  tests your route needs (e.g. TestAS for a Bachelor route, IELTS/TOEFL for an English Master&apos;s).
                </>
              )}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/language/exam-progress" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-xs hover:bg-muted">
            Progress & readiness gate <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link to="/language/test-centers" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-xs hover:bg-muted">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Test centres & booking dates
          </Link>
        </div>
      </section>

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
