import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, Route as RouteIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { IMMIGRATION_LADDER } from "@/lib/seed/immigration";
import { IMMIGRATION_FACTS } from "@/lib/facts";
import { isShortageOccupation } from "@/lib/career/fields";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";

const RANK: Record<string, number> = { "": 0, none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

/** Long-game §2 — the Study → Blue Card → PR → Citizenship ladder, personalised + grounded (2026). */
export default function ArrivalImmigrationPathway() {
  const { profile } = useProfile();
  const field = profile.targetField || profile.currentDegree;
  const shortage = isShortageOccupation(field);
  const hasB1 = RANK[profile.germanLevel] >= 3;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Long game · Ongoing"
        title="Study → Blue Card → PR → Citizenship"
        description="Why so many choose Germany: a clear ladder from student to citizen. Here it is end-to-end with the current 2026 rules — personalised to your field and German level, every figure sourced and flagged to verify."
        category="visa"
      />

      <Disclaimer />

      {(field || profile.germanLevel) && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            For your profile{field ? <> ({field})</> : null}:{" "}
            {shortage ? (
              <>your field looks like a <strong>shortage occupation</strong> → the <strong>lower</strong> Blue Card salary threshold likely applies.</>
            ) : (
              <>verify whether your field is a shortage occupation — it decides which Blue Card threshold applies.</>
            )}{" "}
            {hasB1 ? <>With <strong>B1+ German</strong> you qualify for the faster 21-month route to PR.</> : <>Reaching <strong>B1 German</strong> cuts the Blue Card PR wait from 27 to 21 months.</>}
          </AlertDescription>
        </Alert>
      )}

      {/* The ladder */}
      <ol className="relative space-y-4 border-l-2 border-dashed pl-6">
        {IMMIGRATION_LADDER.map((step, i) => (
          <li key={step.key} className="relative">
            <span className={cn("absolute -left-[1.95rem] mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-4 ring-background")} aria-hidden>
              {i + 1}
            </span>
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <RouteIcon className="h-4 w-4 text-category-visa" aria-hidden /> {step.title}
                </h2>
                <Badge variant="secondary" className="official-figure">{step.timing}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{step.phase}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              <a href={step.source.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary underline">
                {step.source.name} <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </li>
        ))}
      </ol>

      {/* The grounded numbers */}
      <section aria-labelledby="ladder-facts" className="space-y-3">
        <h2 id="ladder-facts" className="eyebrow">The current 2026 figures — verify each</h2>
        {IMMIGRATION_FACTS.map((fact) => (
          <OfficialFactRow key={fact.label} fact={fact} />
        ))}
      </section>

      <Alert variant="warning" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Note the law as it stands: citizenship is <strong>5 years</strong> (not 3 — the fast-track was
          repealed on 30 Oct 2025), dual citizenship is allowed. Immigration law changes often — treat
          everything here as guidance and confirm with the Ausländerbehörde / make-it-in-germany.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/blue-card-check" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Check Blue Card eligibility <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/pr-citizenship" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          PR & citizenship timeline <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/career/outcomes" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Is my field in demand? <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
