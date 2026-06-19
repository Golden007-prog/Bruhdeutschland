import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAAD_STIPEND, DEUTSCHLANDSTIPENDIUM } from "@/lib/facts";
import { source } from "@/lib/sources";
import { SCHOLARSHIPS, type Scholarship } from "@/lib/seed/finance";
import { useProfile } from "@/lib/profile/useProfile";
import { currentYM, formatYearsMonths, summarizeExperience, yearsFrom } from "@/lib/profile/experience";

type Filter = "all" | "open-to-all" | "merit" | "mobility" | "experience";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All schemes" },
  { key: "open-to-all", label: "Open to all nationalities" },
  { key: "merit", label: "Merit-based" },
  { key: "mobility", label: "Exchange / mobility" },
  { key: "experience", label: "Requires work experience" },
];

/** Honest match of the user's experience against an experience-required scheme (never asserts eligibility). */
function experienceMatch(
  s: Scholarship,
  expMonths: number,
  monthsSinceGrad: number | null,
): { tone: "ok" | "warn" | "muted"; text: string } | null {
  if (s.requiresExperienceYears == null) return null;
  const req = s.requiresExperienceYears;
  const have = formatYearsMonths(expMonths);
  const tooOld =
    s.degreeWithinYears != null && monthsSinceGrad != null && monthsSinceGrad > s.degreeWithinYears * 12;
  const recency = tooOld ? ` (note: your degree is older than ${s.degreeWithinYears} yrs — may not qualify)` : "";
  if (expMonths === 0) return { tone: "muted", text: `Requires ~${req} yrs experience — add your work history to check.` };
  if (yearsFrom(expMonths) >= req) return { tone: "ok", text: `You meet the indicative ${req}-yr experience bar (you have ${have})${recency}.` };
  return { tone: "warn", text: `Unlock at ${req} yrs — you have ${have}${recency}.` };
}

const BASIS_LABEL: Record<Scholarship["basis"], string> = {
  merit: "Merit-based",
  need: "Need-based",
  mobility: "Exchange / mobility",
};

function matches(s: Scholarship, filter: Filter): boolean {
  switch (filter) {
    case "open-to-all":
      return s.openToAllNationalities;
    case "merit":
      return s.basis === "merit";
    case "mobility":
      return s.basis === "mobility";
    case "experience":
      return s.requiresExperienceYears != null;
    default:
      return true;
  }
}

/** Feature 20 — Scholarship finder. */
export default function FinanceScholarships() {
  const [filter, setFilter] = useState<Filter>("all");
  const { profile } = useProfile();
  const exp = useMemo(() => summarizeExperience(profile, currentYM()), [profile]);

  const results = useMemo(() => SCHOLARSHIPS.filter((s) => matches(s, filter)), [filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 20 · Finance"
        title="Scholarship finder"
        description="Funding you may be eligible for as a Master's applicant. Filter by who can apply, then check each scheme's current call for amounts and deadlines."
        category="finance"
        fileRef="§ 20"
      />

      <Disclaimer />

      <div className="grid gap-3 sm:grid-cols-2">
        <OfficialFactRow fact={DAAD_STIPEND} />
        <OfficialFactRow fact={DEUTSCHLANDSTIPENDIUM} />
      </div>

      <section aria-labelledby="sch-filter" className="space-y-3">
        <h2 id="sch-filter" className="eyebrow">
          Filter · Filter
        </h2>
        <div role="group" aria-label="Filter scholarships" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={
                  "rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (active
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted")
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <p className="official-figure text-xs text-muted-foreground" aria-live="polite">
          {results.length} of {SCHOLARSHIPS.length} schemes
        </p>
      </section>

      <ul className="grid gap-4 lg:grid-cols-2">
        {results.map((s) => (
          <li key={s.id}>
            <Card className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-category-finance/10 text-category-finance">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">{s.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.funder}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{BASIS_LABEL[s.basis]}</Badge>
                  {s.openToAllNationalities ? (
                    <Badge variant="success">Open to all nationalities</Badge>
                  ) : (
                    <Badge variant="outline">Eligibility restricted</Badge>
                  )}
                  {s.requiresExperienceYears != null && <Badge variant="warning">Needs ~{s.requiresExperienceYears} yrs experience</Badge>}
                </div>

                {(() => {
                  const m = experienceMatch(s, exp.totalMonths, exp.monthsSinceGraduation);
                  if (!m) return null;
                  const cls =
                    m.tone === "ok" ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
                      : m.tone === "warn" ? "border-amber-200 bg-amber-50/50 text-amber-800"
                        : "border-dashed bg-muted/30 text-muted-foreground";
                  return <p className={`rounded-md border p-2 text-xs ${cls}`}>{m.text}</p>;
                })()}

                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="eyebrow">Covers</dt>
                    <dd className="mt-0.5">{s.amount}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow">Who can apply</dt>
                    <dd className="mt-0.5 text-muted-foreground">{s.eligibility}</dd>
                  </div>
                </dl>

                {s.note && (
                  <p className="rounded-md border border-dashed bg-amber-50/40 p-2 text-xs text-amber-800">
                    {s.note}
                  </p>
                )}

                <div className="mt-auto pt-1">
                  <SourceLink source={s.source} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Amounts, eligibility, and deadlines are set per call and change yearly. Treat everything here
        as a starting point and confirm the details in each scheme&apos;s official call before applying.
      </p>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-2">Sources · Quellen</p>
        <ul className="space-y-1.5">
          <li>
            <SourceLink source={source("daadScholarships")} />
          </li>
          <li>
            <SourceLink source={source("deutschlandstipendium")} />
          </li>
          <li>
            <SourceLink source={source("erasmus")} />
          </li>
        </ul>
      </div>
    </div>
  );
}
