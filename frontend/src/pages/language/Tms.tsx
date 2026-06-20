import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, HeartPulse, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const SUBTESTS = [
  "Pattern/figure reasoning (Muster, Schlauchfiguren)",
  "Quantitative & basic-science problems (medical-natural-science understanding, quantitative problems)",
  "Memory & concentration (facts and figures, quantity estimation)",
  "Diagrams and text comprehension",
];

const PREP = [
  "Decide if it's worth it: TMS is taken once and a strong score can meaningfully improve your Medicine chances at participating universities.",
  "Practise the subtest TYPES heavily under timed conditions — TMS rewards trained pattern recognition and speed.",
  "Use the official preparation materials and book the single annual/biannual sitting well ahead.",
  "Pair a good TMS with the grade and language requirements — it complements, not replaces, them.",
];

/** G12 — TMS (medicine) prep guide. */
export default function LanguageTms() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G12 · Language"
        title="TMS — medical studies aptitude test"
        description="The Test für Medizinische Studiengänge is an optional aptitude test that many German medical faculties weight heavily. A strong score can lift an otherwise borderline Medicine application."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          TMS is <strong>not language</strong> and not subject knowledge — it's reasoning and concentration
          under time pressure, in German. You can usually sit it <strong>once</strong>, so prepare properly.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><HeartPulse className="h-4 w-4 text-category-language" aria-hidden /> The subtests</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SUBTESTS.map((s) => (
            <li key={s} className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{s}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">How to approach it</h2>
        <ol className="mt-3 space-y-2">
          {PREP.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <a href={source("tms").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          Official TMS site & materials <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Your Medicine pathway <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/dosv" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          How Medicine places are allocated <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. Whether and how much TMS counts is set per university — verify on the faculty's page.</p>

      <SourceList sources={[source("tms"), source("hochschulstart")]} />
    </div>
  );
}
