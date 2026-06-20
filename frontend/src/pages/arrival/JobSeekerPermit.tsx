import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOBSEEKER_DOCS, JOBSEEKER_WINDOW } from "@/lib/seed/arrival";
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

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/work" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Working as a student <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/campus/networking" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Build your network <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("jobSeekerPermit"), source("blueCard"), source("makeItInGermany")]} />
    </div>
  );
}
