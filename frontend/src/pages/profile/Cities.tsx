import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Info, Languages, MapPin } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CITY_PROFILES, formatEur } from "@/lib/calc/costOfLiving";
import { cityInsight, STRENGTH_LABEL, type Strength } from "@/lib/seed/cityInsights";
import { cn } from "@/lib/utils";

const SIGNAL_CLS: Record<Strength, string> = {
  stronger: "bg-emerald-100 text-emerald-900",
  mixed: "bg-amber-100 text-amber-900",
  research: "bg-sky-100 text-sky-900",
};

const FACTORS = [
  "Rent & availability (biggest cost difference between cities)",
  "Size & vibe — big metro (Berlin/Munich) vs compact student town (Aachen/Leipzig)",
  "Job market for Werkstudent / post-study work in your field",
  "International community & English-friendliness day-to-day",
  "Public transport (your Semesterticket usually covers the region)",
];

/** G17 — City explorer. Compares the rough cost baseline (grounded in CITY_PROFILES) + factors to research. */
export default function ProfileCities() {
  const [sortByRent, setSortByRent] = useState(true);
  const [openCity, setOpenCity] = useState<string | null>(null);
  const cities = [...CITY_PROFILES].sort((a, b) =>
    sortByRent ? a.rent - b.rent : a.city.localeCompare(b.city),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G17 · Profile"
        title="City explorer — where to study & live"
        description="Location shapes your budget and your experience as much as the programme. Compare the rough monthly cost baseline and the factors worth researching before you commit."
        category="profile"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The euro figures are <strong>illustrative planning baselines</strong>, not live rents. Munich and
          Frankfurt run expensive; eastern cities like Leipzig and Dresden are cheaper. Always check current
          listings for your specific city.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setSortByRent((s) => !s)}
          className="rounded text-xs text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sort by {sortByRent ? "name" : "cost"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">City</th>
              <th className="p-3 text-right font-medium">~Rent/mo</th>
              <th className="p-3 text-right font-medium">~Total/mo</th>
              <th className="p-3 text-right font-medium">Language &amp; jobs</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c, i) => {
              const total = c.rent + c.food + c.transport + c.insurance + c.other;
              const insight = cityInsight(c.city);
              const open = openCity === c.city;
              return (
                <Fragment key={c.city}>
                  <tr className={cn("border-t", i % 2 && "bg-muted/20")}>
                    <td className="p-3 font-medium"><MapPin className="mr-1 inline h-3.5 w-3.5 text-category-profile" aria-hidden />{c.city}</td>
                    <td className="official-figure p-3 text-right">{formatEur(c.rent)}</td>
                    <td className="official-figure p-3 text-right">{formatEur(total)}</td>
                    <td className="p-3 text-right">
                      {insight ? (
                        <button
                          type="button"
                          onClick={() => setOpenCity(open ? null : c.city)}
                          aria-expanded={open}
                          className="inline-flex items-center gap-1.5 rounded text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Badge variant="secondary" className={cn("font-normal", SIGNAL_CLS[insight.englishSignal])}>{STRENGTH_LABEL[insight.englishSignal]}</Badge>
                          {open ? "Hide" : "Details"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Research locally</span>
                      )}
                    </td>
                  </tr>
                  {insight && open && (
                    <tr className="border-t bg-muted/10">
                      <td colSpan={4} className="p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold"><Briefcase className="h-3.5 w-3.5 text-category-profile" aria-hidden /> Job-market character</p>
                            <p className="mt-1 text-sm text-muted-foreground">{insight.jobMarket}</p>
                            <p className="mt-1.5 text-xs text-muted-foreground"><span className="font-medium text-foreground">Werkstudent:</span> {insight.werkstudent}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 text-xs font-semibold"><Languages className="h-3.5 w-3.5 text-category-profile" aria-hidden /> English-friendliness</p>
                            <p className="mt-1 text-sm text-muted-foreground">{insight.englishFriendliness}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Job-market and language notes are <strong>qualitative orientation</strong>, not statistics — no
        employment rate or English-proficiency figure is implied. Demand varies sharply by field and by
        year; confirm current conditions for <em>your</em> field on job portals and the city&apos;s own pages.
      </p>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">What to research for a city</h2>
        <ul className="mt-2 space-y-1.5">
          {FACTORS.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/finance/cost-of-living" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Detailed cost-of-living <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/visa/accommodation" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find accommodation <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
