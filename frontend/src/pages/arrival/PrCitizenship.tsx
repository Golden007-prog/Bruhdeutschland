import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarClock, Info, Stamp } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { eligibilityDates, estimateImmigrationTimeline } from "@/lib/immigration/timeline";
import { BLUE_CARD_PR, CITIZENSHIP_RULE } from "@/lib/facts";
import { relativeLabel, severityFor } from "@/lib/calc/deadlines";
import { useProfile } from "@/lib/profile/useProfile";
import type { DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEV_CLS: Record<DeadlineSeverity, string> = {
  overdue: "border-emerald-300 bg-emerald-50/50",
  urgent: "border-emerald-300 bg-emerald-50/50",
  soon: "border-sky-200 bg-sky-50/50",
  info: "border-amber-200 bg-amber-50/50",
};

const RANK: Record<string, number> = { "": 0, none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

const monthLabel = (ym: string): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return "—";
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

/** Long-game §4 — PR & citizenship timeline tracker (deterministic, grounded 2026; persisted). */
export default function ArrivalPrCitizenship() {
  const { profile } = useProfile();
  const [start, setStart] = useSyncedState<string>("immigration:residenceStart", "");
  const [onBlueCard, setOnBlueCard] = useSyncedState<boolean>("immigration:onBlueCard", true);
  const [hasB1Override, setHasB1Override] = useSyncedState<string>("immigration:hasB1", "");

  const hasB1 = hasB1Override === "" ? RANK[profile.germanLevel] >= 3 : hasB1Override === "yes";

  const timeline = useMemo(() => estimateImmigrationTimeline({ onBlueCard, hasB1 }), [onBlueCard, hasB1]);
  const dates = useMemo(() => (start ? eligibilityDates(start, timeline) : null), [start, timeline]);

  const cards = dates
    ? [
        { key: "pr", icon: Stamp, label: "Permanent residence (Niederlassungserlaubnis)", month: dates.prMonth, sub: `${timeline.prMonths} months of qualified residence` },
        { key: "citizenship", icon: BadgeCheck, label: "Citizenship eligibility", month: dates.citizenshipMonth, sub: `${timeline.citizenshipYears} years' legal residence` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Long game · Tool"
        title="PR & citizenship timeline tracker"
        description="Set when your qualified-residence clock starts and we estimate when you'd be eligible for permanent residence and citizenship under the current 2026 rules. Indicative — the law changes; verify with the Ausländerbehörde."
        category="visa"
      />

      <Disclaimer />

      <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="pr-start" className="text-sm font-medium">Qualified-residence start</label>
          <Input id="pr-start" type="month" value={start} onChange={(e) => setStart(e.target.value)} />
          <p className="text-xs text-muted-foreground">When you start qualified work / your post-study permit.</p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onBlueCard} onChange={(e) => setOnBlueCard(e.target.checked)} className="accent-[hsl(var(--primary))]" />
            On an EU Blue Card (the fast route)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasB1} onChange={(e) => setHasB1Override(e.target.checked ? "yes" : "no")} className="accent-[hsl(var(--primary))]" />
            B1 German achieved
          </label>
        </div>
      </section>

      {dates ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => {
            const sev = severityFor(`${c.month}-01`);
            const Icon = c.icon;
            return (
              <div key={c.key} className={cn("rounded-lg border p-4 shadow-sm", SEV_CLS[sev])}>
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-4 w-4" aria-hidden /> {c.label}</p>
                <p className="official-figure mt-1 inline-flex items-center gap-2 text-2xl font-bold">
                  <CalendarClock className="h-5 w-5" aria-hidden /> {monthLabel(c.month)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.sub} · {relativeLabel(`${c.month}-01`)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>Set your qualified-residence start above to see indicative PR and citizenship dates.</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="prc-facts" className="space-y-3">
        <h2 id="prc-facts" className="eyebrow">The current rules — verify each</h2>
        <OfficialFactRow fact={BLUE_CARD_PR} />
        <OfficialFactRow fact={CITIZENSHIP_RULE} />
      </section>

      <Alert variant="warning" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Indicative estimate only. Study time before qualified work often counts only partially, the
          5-year citizenship clock has its own conditions (B1, civics test, self-sufficiency), and the law
          changes — the 3-year fast-track was repealed on 30 Oct 2025. Confirm your case with the Ausländerbehörde.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/immigration-pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          The full ladder <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/reminders" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Add to my reminders <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
