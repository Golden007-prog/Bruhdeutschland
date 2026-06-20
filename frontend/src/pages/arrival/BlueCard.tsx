import { Link } from "react-router-dom";
import { ArrowRight, Award, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const PATH = [
  { stage: "Graduate & find qualified work", detail: "A job matching your degree (the 18-month job-seeker permit gives you time to find it)." },
  { stage: "EU Blue Card", detail: "For graduates with a qualifying job offer above the salary threshold. It's the fastest track to settlement and eases family reunion." },
  { stage: "Work residence permit", detail: "If the Blue Card thresholds don't fit, a standard work permit still leads toward settlement over more years." },
  { stage: "Permanent residence (Niederlassungserlaubnis)", detail: "After a qualifying period of skilled work and contributions — often much shorter on a Blue Card — you can settle permanently." },
];

/** G48 — EU Blue Card & permanent settlement planner. */
export default function ArrivalBlueCard() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G48 · Ongoing"
        title="EU Blue Card & permanent settlement"
        description="For many, studying is step one of staying. Here's the work-to-settlement endgame: how a qualified job becomes an EU Blue Card and, over time, permanent residence."
        category="campus"
      />

      <Disclaimer />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The <strong>EU Blue Card</strong> is the key accelerator: it has a salary threshold (lower for
          shortage occupations and recent graduates) and shortens the path to permanent residence
          considerably. Thresholds change yearly — verify the current figures.
        </AlertDescription>
      </Alert>

      <ol className="space-y-3">
        {PATH.map((p, i) => (
          <li key={p.stage} className="flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
            <div>
              <p className="flex items-center gap-1.5 font-semibold"><Award className="h-4 w-4 text-category-campus" aria-hidden /> {p.stage}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/job-seeker-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Post-study job-seeker permit <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/tax-id" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Starting work & tax <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only, not legal advice. Salary thresholds and qualifying periods are set in law and change — confirm current rules with the authorities.</p>

      <SourceList sources={[source("blueCard"), source("makeItInGermany"), source("bamf")]} />
    </div>
  );
}
