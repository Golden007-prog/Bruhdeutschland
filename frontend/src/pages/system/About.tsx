import { Link } from "react-router-dom";
import { ArrowRight, Binary, FileJson, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** A small worked example of the two grounding treatments: stamped seal vs. dashed unstamped. */
function GroundingSpecimen() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-md border bg-card p-4">
        <p className="eyebrow mb-3">Grounded · gestempelt</p>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "stamp-seal flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              "official-figure",
            )}
            aria-hidden
          >
            1.0
          </span>
          <div className="min-w-0 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Stable & sourced</p>
            <p>Shown as a solid stamp with a citation — e.g. the German grade scale or ECTS/year.</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-4">
        <p className="eyebrow mb-3 text-amber-700">Needs verification · ungeprüft</p>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "stamp-seal stamp-seal--unverified flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              "official-figure",
            )}
            aria-hidden
          >
            €?
          </span>
          <div className="min-w-0 text-sm text-amber-800">
            <p className="font-medium">Volatile or ungrounded</p>
            <p>Dashed and amber, with a link to confirm — e.g. fees, deadlines, language thresholds.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** About & methodology — how DeutschPrep grounds facts, computes math, and what it does not do. */
export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Info · Methodik"
        title="About DeutschPrep"
        description="How DeutschPrep grounds official facts, computes deterministic values, and what it does not do."
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        DeutschPrep is an AI copilot for applying to Master&apos;s programmes at German public
        universities. It plans, drafts, and organises — but it is built so that nothing it shows as an
        official German fact is invented. Three principles make that concrete.
      </p>

      <section aria-labelledby="about-grounding" className="space-y-3">
        <h2 id="about-grounding" className="eyebrow">
          1 · Grounded vs. needs verification
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
              Every official figure is either grounded or flagged
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              A value is shown as <span className="font-medium text-emerald-700">grounded</span> only
              when it is stable and backed by an official source — the German grade scale, ECTS per
              year, or the 14-day Anmeldung window. Anything that changes yearly, by federal state, or
              by programme — fees, blocked-account amounts, deadlines, language thresholds — is rendered{" "}
              <span className="font-medium text-amber-700">needs verification</span>, with a link to
              where you confirm the current value. We never print a guessed official number.
            </p>
            <GroundingSpecimen />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="about-deterministic" className="space-y-3">
        <h2 id="about-deterministic" className="eyebrow">
          2 · Deterministic compute for the math
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Binary className="h-4 w-4 text-primary" aria-hidden />
              The model plans and writes; tested code computes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Numbers that must be correct are never &ldquo;computed by the model.&rdquo; They run in
              tested, deterministic code:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">GPA conversion</span> via the Modified
                Bavarian Formula
              </li>
              <li>
                <span className="font-medium text-foreground">ECTS</span> totals
              </li>
              <li>
                <span className="font-medium text-foreground">Cost-of-living</span> budgets
              </li>
              <li>
                <span className="font-medium text-foreground">Deadline</span> arithmetic and urgency
              </li>
            </ul>
            <p>That is why deterministic values render in tabular monospace — they read as machine-precise.</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="about-structured" className="space-y-3">
        <h2 id="about-structured" className="eyebrow">
          3 · Structured outputs &amp; the advisory policy
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="h-4 w-4 text-primary" aria-hidden />
              Validated schemas, with a standing disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Every model output that feeds the app is validated against a strict schema — no free-form
              text is parsed downstream. And any visa, finance, or immigration guidance carries a
              standing advisory notice, because those decisions have legal and financial consequences.
            </p>
            <Disclaimer />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section aria-labelledby="about-next" className="space-y-2">
        <h2 id="about-next" className="eyebrow">
          See it in practice
        </h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/sources" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            The source registry <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link to="/deadlines" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Deadlines &amp; alerts <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          DeutschPrep is guidance only — not legal, financial, or immigration advice. Always verify
          official requirements against the cited sources before acting.
        </p>
      </section>
    </div>
  );
}
