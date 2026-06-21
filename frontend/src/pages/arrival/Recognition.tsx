import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, Languages, ShieldAlert, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RECOGNITION_SOURCES,
  RECOGNITION_STEPS,
  REGULATED_PROFESSIONS,
  SOURCE_RECOGNITION_FINDER,
  type RecognitionStep,
} from "@/lib/seed/recognition";

/** G8-01 — Professional recognition / Approbation for regulated professions. */
export default function ArrivalRecognition() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G8-01 · Arrival & ongoing"
        title="Professional recognition (Approbation & regulated professions)"
        description="For some careers, a German degree and a job offer are still not enough to work. Regulated professions — medicine, nursing, pharmacy, law, teaching, chamber engineering — need a state licence first. Here's how recognition works and why it gates your plans."
        category="visa"
      />

      <Disclaimer />

      <Alert variant="warning" className="text-sm">
        <ShieldAlert aria-hidden />
        <AlertTitle>A job offer is not permission to practise</AlertTitle>
        <AlertDescription>
          If your profession is <strong>regulated</strong>, you can finish your degree, clear the EU
          Blue Card salary check, sign a contract — and still be <strong>legally unable to work</strong>{" "}
          until a state authority recognises your qualification and issues the licence. Recognition can
          add many months and gates your income and Blue Card planning, so start it early.
        </AlertDescription>
      </Alert>

      {/* ── Academic vs professional recognition ──────────────────────────────── */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <BadgeCheck className="h-4 w-4 text-category-visa" aria-hidden /> Two different "recognitions"
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Academic recognition</p>
            <p className="mt-1 text-muted-foreground">
              Is your <strong>degree</strong> equivalent? Decided via anabin / the ZAB Statement of
              Comparability. Needed for study and many unregulated jobs.
            </p>
            <Link to="/profile/recognition" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Academic recognition (anabin / HZB) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <div className="rounded-md border border-amber-300 bg-amber-50/40 p-3 text-sm">
            <p className="font-medium">Professional licence</p>
            <p className="mt-1 text-muted-foreground">
              May you <strong>practise the regulated profession</strong>? A separate state decision —
              Approbation / Berufserlaubnis / chamber admission. Clearing the academic side does{" "}
              <strong>not</strong> grant it.
            </p>
          </div>
        </div>
      </section>

      {/* ── Regulated professions ─────────────────────────────────────────────── */}
      <section aria-labelledby="regulated-heading" className="space-y-3">
        <div>
          <h2 id="regulated-heading" className="text-lg font-semibold tracking-tight">
            Is your profession regulated?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            These professions are regulated in Germany — a state licence gates practice. The recognising
            authority differs by profession <em>and</em> federal state (there are 1,500+ competent
            bodies), so we name the <em>class</em> of authority and send you to the official finder for
            yours. Every profession-specific detail below needs verifying for your case.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {REGULATED_PROFESSIONS.map((p) => (
            <Card key={p.id} className="relative overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-category-visa" />
              <CardHeader className="pl-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant="warning" className="gap-1">
                    <TriangleAlert className="h-3 w-3" aria-hidden /> Verify for your Land
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pl-6 text-sm">
                <p>
                  <span className="font-medium">Licence:</span>{" "}
                  <span className="text-muted-foreground">{p.licence}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-muted-foreground">{p.authorityClass}</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-muted-foreground">{p.languageBar}</span>
                </p>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">{p.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert variant="info" className="text-sm">
          <BadgeCheck aria-hidden />
          <AlertDescription>
            Don't see your job? Many roles (much of engineering, IT, business, science) are{" "}
            <strong>not regulated</strong> — you can be hired on your recognised degree. The official
            Recognition Finder confirms whether yours is regulated and who decides.{" "}
            <SourceLink source={SOURCE_RECOGNITION_FINDER} />
          </AlertDescription>
        </Alert>
      </section>

      {/* ── The procedure ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="steps-heading" className="space-y-3">
        <h2 id="steps-heading" className="text-lg font-semibold tracking-tight">
          The recognition procedure
        </h2>
        <div className="space-y-4">
          {RECOGNITION_STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── Cross-links ───────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap gap-2">
        <Link to="/career/outcomes" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Where your field leads <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/job-seeker-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Post-study job-seeker permit <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/blue-card-check" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Blue Card salary check <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={RECOGNITION_SOURCES} />
    </div>
  );
}

/** One recognition step, with a needs-verification flag on the official, case-specific parts. */
function StepCard({ step, index }: { step: RecognitionStep; index: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            {step.title}
          </CardTitle>
          {step.needsVerification && (
            <Badge variant="warning" className="gap-1">
              <TriangleAlert className="h-3 w-3" aria-hidden /> Varies — verify
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{step.detail}</p>
        {step.href && (
          <Link to={step.href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Open the tool that helps <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
        {step.source && <SourceLink source={step.source} />}
      </CardContent>
    </Card>
  );
}
