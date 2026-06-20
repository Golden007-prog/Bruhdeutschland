import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck, ExternalLink, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const MODULES = [
  { name: "Core module (Kerntest)", detail: "Reasoning and problem-solving common to all subjects — patterns, quantitative problems, matrices, and text comprehension. Everyone sits this." },
  { name: "Subject module", detail: "Pick the one matching your field: Humanities/Culture/Social Sciences, Engineering, Mathematics/CS/Natural Sciences, or Economics." },
  { name: "Language screening", detail: "A short on-screen language check (German or English version) before the test proper." },
];

const PREP = [
  "Decide German or English version — match it to the language your programme is taught in.",
  "Practise the question TYPES under time pressure; TestAS rewards speed and pattern recognition, not memorised facts.",
  "Use the official practice materials to learn each module's format before exam day.",
  "Book a test date well before your application deadlines — sittings are scheduled periodically.",
];

/** G11 — TestAS prep guide (the mock centre has no TestAS; this orients the prep). */
export default function LanguageTestAs() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G11 · Language"
        title="TestAS — Test for Academic Studies"
        description="A standardised aptitude test many German universities expect from international Bachelor applicants (and some foundation routes). It measures study aptitude, not subject knowledge."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          TestAS results are reported as a <strong>standard score</strong> (percentile-based). There's no
          fixed pass mark — universities weigh it alongside your grades. Confirm whether your specific
          programme requires or recommends it.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">What's in it</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{m.name}</p>
              <p className="mt-1 text-muted-foreground">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardCheck className="h-4 w-4 text-category-language" aria-hidden /> How to prepare
        </h2>
        <ol className="mt-3 space-y-2">
          {PREP.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <a href={source("testas").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          Official TestAS site & practice <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Is TestAS on my pathway? <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/exams" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Mock exam centre <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("testas"), source("daadRequirements")]} />
    </div>
  );
}
