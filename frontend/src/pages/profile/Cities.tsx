import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, MapPin } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CITY_PROFILES, formatEur } from "@/lib/calc/costOfLiving";
import { cn } from "@/lib/utils";

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
        <button type="button" onClick={() => setSortByRent((s) => !s)} className="text-xs text-primary underline">
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
            </tr>
          </thead>
          <tbody>
            {cities.map((c, i) => {
              const total = c.rent + c.food + c.transport + c.insurance + c.other;
              return (
                <tr key={c.city} className={cn("border-t", i % 2 && "bg-muted/20")}>
                  <td className="p-3 font-medium"><MapPin className="mr-1 inline h-3.5 w-3.5 text-category-profile" aria-hidden />{c.city}</td>
                  <td className="official-figure p-3 text-right">{formatEur(c.rent)}</td>
                  <td className="official-figure p-3 text-right">{formatEur(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
