import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const PARTS = [
  { name: "German", detail: "Reading, listening, and writing at roughly B1–B2. The biggest filter for most applicants." },
  { name: "Mathematics", detail: "For the T-, M-, W-Kurs especially — school-level algebra, functions, basic calculus." },
  { name: "Subject basics", detail: "Sometimes a short test in the Kurs's focus (e.g. physics/chemistry for the T-Kurs)." },
];

const PREP = [
  "Get your German to a solid B1–B2 first — it's the part most people fail (see the A1→C1 plan).",
  "Brush up school maths in German: learn the vocabulary, not just the concepts.",
  "Ask the partner university for past entrance papers or the exact format — it varies by Studienkolleg.",
  "Apply early; the entrance exam is scheduled by the college and seats are limited.",
];

/** G07 — Studienkolleg entrance exam (Aufnahmeprüfung) prep guide. */
export default function LanguageAufnahmepruefung() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G07 · Language"
        title="Studienkolleg entrance exam (Aufnahmeprüfung)"
        description="To get a Studienkolleg place you sit an entrance exam — mostly German, plus maths and subject basics. Here's the shape of it and how to prepare."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The Aufnahmeprüfung is set by each <strong>Studienkolleg</strong>, so format and pass marks vary.
          Most expect German around <strong>B1–B2</strong> going in; the college then takes you toward C1.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">What it tests</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PARTS.map((p) => (
            <div key={p.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="mt-1 text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="h-4 w-4 text-category-language" aria-hidden /> How to prepare</h2>
        <ol className="mt-3 space-y-2">
          {PREP.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/studienkolleg" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find a Studienkolleg & Kurs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/german-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Reach B1–B2 first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/fsp" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Then the FSP <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. Confirm the exact format and dates with your target Studienkolleg.</p>

      <SourceList sources={[source("studienkolleg"), source("anabin")]} />
    </div>
  );
}
