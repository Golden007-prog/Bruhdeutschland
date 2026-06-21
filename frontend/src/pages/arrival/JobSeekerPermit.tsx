import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Info, MapPin, Plane, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOBSEEKER_DOCS, JOBSEEKER_WINDOW } from "@/lib/seed/arrival";
import { JOBSEEKER_FALLBACKS, JOBSEEKER_FAILURE_SOURCES } from "@/lib/seed/jobSeekerFailure";
import { source } from "@/lib/sources";

const PATH = [
  "Graduate — keep proof of completion even before the official certificate is issued.",
  "Apply for the 18-month residence permit to seek qualified work, before your student permit expires.",
  "During the search you may work without restriction to support yourself.",
  "Once you have a qualifying job offer, switch to a work residence permit or an EU Blue Card.",
  "After a few years of qualified work you can apply for permanent settlement (Niederlassungserlaubnis).",
];

/** G44 — 18-month post-study job-seeker permit planner. */
export default function ArrivalJobSeekerPermit() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G44 · Ongoing"
        title="18-month post-study job-seeker permit"
        description="The reason many students choose Germany: after graduating you can stay up to 18 months to find work matching your degree, then convert to a work permit or Blue Card."
        category="visa"
      />

      <Disclaimer />

      <OfficialFactRow fact={JOBSEEKER_WINDOW} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={JOBSEEKER_DOCS} title="What you'll need to apply" storageKey="arrival-jobseeker" />
        <Card className="self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-category-visa" aria-hidden /> Study → work → settlement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {PATH.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Apply <strong>before</strong> your student permit lapses, and start job-hunting in your final
          semester — the 18 months are for searching, not for getting started.
        </AlertDescription>
      </Alert>

      {/* ── G9-01: the cliff edge — window runs out with no qualifying job ─────── */}
      <section aria-labelledby="failure-heading" className="space-y-3">
        <div>
          <h2 id="failure-heading" className="text-lg font-semibold tracking-tight">
            What if the 18 months run out and you have no qualifying job?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            This is the cliff edge the success path doesn't mention. The job-seeker permit{" "}
            <strong>cannot be extended</strong> — once it lapses without a qualifying job you must
            change status or leave. These are the honest options; confirm each for your case.
          </p>
        </div>

        <Alert variant="warning" className="text-sm">
          <TriangleAlert aria-hidden />
          <AlertTitle>Don't fall out of status</AlertTitle>
          <AlertDescription>
            Overstaying the permit damages future visa applications. Act before it expires — switching
            in-country or leaving in status both keep the door open. If your blocker is a{" "}
            <strong>regulated profession</strong> you can't yet practise, the fix is recognition, not
            more searching —{" "}
            <Link to="/arrival/recognition" className="font-medium underline">
              check professional recognition
            </Link>
            .
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {JOBSEEKER_FALLBACKS.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {f.location === "in_germany" ? (
                      <MapPin className="h-4 w-4 text-category-visa" aria-hidden />
                    ) : (
                      <Plane className="h-4 w-4 text-category-visa" aria-hidden />
                    )}
                    {f.title}
                  </CardTitle>
                  <span className="flex gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {f.location === "in_germany" ? "stay in Germany" : "from abroad"}
                    </Badge>
                    {f.needsVerification && (
                      <Badge variant="warning" className="gap-1">
                        <TriangleAlert className="h-3 w-3" aria-hidden /> Verify
                      </Badge>
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{f.when}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="space-y-2">
                  {f.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-3">
                  {f.href && (
                    <Link to={f.href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Open the tool that helps <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                  {f.source && <SourceLink source={f.source} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/career/job-search" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          German job-search toolkit <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/work" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Working as a student <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/campus/networking" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Build your network <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("jobSeekerPermit"), source("blueCard"), ...JOBSEEKER_FAILURE_SOURCES]} />
    </div>
  );
}
