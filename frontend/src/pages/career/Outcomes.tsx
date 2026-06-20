import { Link } from "react-router-dom";
import { ArrowRight, Info, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CAREER_FIELDS, isShortageOccupation, type Demand } from "@/lib/career/fields";
import { BLUE_CARD_SHORTAGE_EUR, BLUE_CARD_STANDARD_EUR, BLUE_CARD_THRESHOLD } from "@/lib/facts";
import { useProfile } from "@/lib/profile/useProfile";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

const DEMAND_META: Record<Demand, { label: string; cls: string }> = {
  very_high: { label: "Very high demand", cls: "bg-emerald-100 text-emerald-900" },
  high: { label: "High demand", cls: "bg-sky-100 text-sky-900" },
  moderate: { label: "Moderate demand", cls: "bg-muted text-muted-foreground" },
};

/** Long-game §6 — career outcomes & job market. Qualitative + grounded; no fabricated salaries. */
export default function CareerOutcomes() {
  const { profile } = useProfile();
  const userField = (profile.targetField || profile.currentDegree || "").toLowerCase();
  const userIsShortage = isShortageOccupation(profile.targetField || profile.currentDegree);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="§ Outcomes"
        title="Career outcomes & job market"
        description="Where each field actually leads in Germany — typical roles, demand, and shortage-occupation status — and which EU Blue Card salary threshold it maps to. We don't invent salary numbers; the only salary anchor is the official Blue Card threshold."
        category="profile"
      />

      {(profile.targetField || profile.currentDegree) && (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Your field ({profile.targetField || profile.currentDegree}) {userIsShortage ? <>looks like a <strong>shortage occupation</strong> → strong demand + the lower Blue Card threshold.</> : <>isn't auto-flagged as a shortage occupation — check the official in-demand list to confirm.</>}
          </AlertDescription>
        </Alert>
      )}

      <OfficialFactRow fact={BLUE_CARD_THRESHOLD} />

      <div className="grid gap-3 md:grid-cols-2">
        {CAREER_FIELDS.map((f) => {
          const meta = DEMAND_META[f.demand];
          const highlight = userField && (userField.includes(f.key) || userField.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(userField));
          return (
            <div key={f.key} className={cn("rounded-lg border bg-card p-4 shadow-sm", highlight && "border-primary/50 ring-1 ring-primary/20")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{f.name}</h2>
                <span className="flex gap-1">
                  {f.shortage && <Badge variant="outline" className="text-xs text-emerald-700">shortage occupation</Badge>}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.cls)}>{meta.label}</span>
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.roles.join(" · ")}</p>
              <p className="mt-1.5 text-sm">{f.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                EU Blue Card: <span className="font-medium text-foreground">{f.blueCardTier === "shortage" ? `lower threshold (€${BLUE_CARD_SHORTAGE_EUR.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : `standard threshold (€${BLUE_CARD_STANDARD_EUR.toLocaleString("en-US")})`}</span> — verify.
              </p>
            </div>
          );
        })}
      </div>

      <Alert variant="warning" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Demand and shortage status are qualitative signals grounded in the official in-demand list — not
          guarantees, and not specific salaries (which vary by role, region, and employer). Confirm against
          make-it-in-germany and real job listings before deciding.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/career/counseling" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden /> Which field fits me?
        </Link>
        <Link to="/arrival/blue-card-check" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Check a salary vs the threshold <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("shortageOccupations"), source("jobMarket"), source("blueCard")]} />
    </div>
  );
}
