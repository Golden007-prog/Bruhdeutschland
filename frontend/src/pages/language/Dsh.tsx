import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const LEVELS = [
  { tag: "DSH-1", detail: "≈ B2. Often insufficient alone for full enrolment in most degree programmes." },
  { tag: "DSH-2", detail: "≈ C1. The level most programmes require for unrestricted admission." },
  { tag: "DSH-3", detail: "≈ C1+/C2. Above the usual requirement; needed for a few demanding programmes." },
];

const SECTIONS = [
  { name: "Reading & academic structures", detail: "Understand a long academic text and answer comprehension + grammar/structure tasks." },
  { name: "Listening comprehension", detail: "Follow a lecture-style talk, take notes, and answer questions." },
  { name: "Writing", detail: "Produce a structured academic text (often describing data or arguing a position)." },
  { name: "Oral exam", detail: "A short presentation + discussion, graded separately." },
];

/** G13 — DSH exam prep (the other C1 route alongside TestDaF; run by universities). */
export default function LanguageDsh() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G13 · Language"
        title="DSH — university German exam"
        description="The Deutsche Sprachprüfung für den Hochschulzugang is the university-run C1 German exam accepted alongside TestDaF. It's taken at (or just before) the university you'll study at."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          DSH is set and graded by each <strong>university</strong>, so the exact format varies slightly by
          institution — unlike TestDaF, which is standardised nationally. Most programmes accept either at
          C1; confirm which your university wants.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The DSH levels</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <div key={l.tag} className="rounded-md border bg-card p-3 text-sm">
              <p className="official-figure font-semibold">{l.tag}</p>
              <p className="mt-1 text-muted-foreground">{l.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BookOpenCheck className="h-4 w-4 text-category-language" aria-hidden /> The sections
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Prep tip: get to a solid C1 first (see the study plan), then drill the <strong>academic</strong>{" "}
          sub-skills DSH tests — note-taking from lectures and structured academic writing — with past papers
          from your target university.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/language/german-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Reach C1 first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/goethe-testdaf" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Compare with TestDaF <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("testdaf"), source("studyInGermany"), source("daadRequirements")]} />
    </div>
  );
}
