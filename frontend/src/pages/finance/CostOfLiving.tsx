import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  CITY_PROFILES,
  computeCost,
  formatEur,
  type CityCostProfile,
} from "@/lib/calc/costOfLiving";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { acceptedOffer } from "@/lib/offers/offerDeadlines";

/** Match a free-text offer city to a known cost profile (case-insensitive). "" when no match. */
function matchCity(city: string): string {
  const c = city.trim().toLowerCase();
  if (!c) return "";
  return CITY_PROFILES.find((p) => p.city.toLowerCase() === c)?.city ?? "";
}

/** The study city implied by the student's offers — accepted offer first, else the first matching offer. */
function impliedCity(offers: Offer[]): string {
  const accepted = acceptedOffer(offers);
  if (accepted) {
    const m = matchCity(accepted.city);
    if (m) return m;
  }
  for (const o of offers) {
    const m = matchCity(o.city);
    if (m) return m;
  }
  return "";
}

type LineKey = keyof Omit<CityCostProfile, "city">;

const LINES: { key: LineKey; label: string; hint: string }[] = [
  { key: "rent", label: "Rent (warm)", hint: "Shared room or small flat, incl. utilities" },
  { key: "food", label: "Food & groceries", hint: "Groceries and the occasional meal out" },
  { key: "transport", label: "Transport", hint: "Discounted student / semester ticket" },
  { key: "insurance", label: "Health insurance", hint: "Statutory student rate" },
  { key: "other", label: "Other", hint: "Phone, study materials, leisure, misc." },
];

/** Feature 18 — Cost-of-living calculator. Deterministic math via src/lib/calc/costOfLiving. */
export default function FinanceCostOfLiving() {
  const [rawOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const prefillCity = useMemo(() => impliedCity(rawOffers.map(normalizeOffer)), [rawOffers]);
  // Default to the city the student's offers imply (G6-04); fall back to the first profile. Manual override preserved.
  const [city, setCity] = useState<string>(prefillCity || CITY_PROFILES[0].city);
  const [overrides, setOverrides] = useState<Partial<Record<LineKey, number>>>({});

  const base = useMemo(
    () => CITY_PROFILES.find((p) => p.city === city) ?? CITY_PROFILES[0],
    [city],
  );

  // Deterministic totals — never hand-computed (CLAUDE.md golden rule 4).
  const breakdown = useMemo(() => computeCost(base, overrides), [base, overrides]);

  const onCityChange = (next: string) => {
    setCity(next);
    setOverrides({}); // a new city resets to that city's baselines
  };

  const onLineChange = (key: LineKey, raw: string) => {
    if (raw === "") {
      setOverrides((o) => {
        const next = { ...o };
        delete next[key];
        return next;
      });
      return;
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return;
    setOverrides((o) => ({ ...o, [key]: num }));
  };

  const reset = () => setOverrides({});
  const edited = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 18 · Finance"
        title="Cost-of-living calculator"
        description="Estimate a monthly budget by city, then adjust each line to your situation. The totals are computed deterministically from the figures you see."
        category="finance"
        fileRef="§ 18"
      />

      <Disclaimer />

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Planning baseline, not an official figure</AlertTitle>
        <AlertDescription>
          These city figures are illustrative averages to help you budget — they are not official and
          not binding. The amount you must actually <em>prove</em> for the visa is the blocked-account
          minimum set by the Federal Foreign Office.{" "}
          <Link to="/finance/sperrkonto" className="font-medium text-primary hover:underline">
            See the Sperrkonto guide
          </Link>
          .
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your monthly budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="cost-city" className="text-sm font-medium">
                City
              </label>
              <select
                id="cost-city"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                className="flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CITY_PROFILES.map((p) => (
                  <option key={p.city} value={p.city}>
                    {p.city}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {prefillCity && city === prefillCity
                  ? `Pre-selected ${prefillCity} from your offers. `
                  : "Picking a city loads typical baselines. "}
                Edit any line to match your plans.
              </p>
            </div>

            <Separator />

            <fieldset className="space-y-3">
              <legend className="sr-only">Monthly cost lines (euros)</legend>
              {LINES.map((line) => {
                const value = overrides[line.key] ?? base[line.key];
                const isOverridden = overrides[line.key] !== undefined;
                const inputId = `cost-${line.key}`;
                return (
                  <div key={line.key} className="grid grid-cols-[1fr_8rem] items-center gap-3">
                    <div className="min-w-0">
                      <label htmlFor={inputId} className="text-sm font-medium">
                        {line.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{line.hint}</p>
                    </div>
                    <div className="relative">
                      <span
                        aria-hidden
                        className="official-figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        €
                      </span>
                      <Input
                        id={inputId}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={10}
                        value={value}
                        onChange={(e) => onLineChange(line.key, e.target.value)}
                        className="official-figure pl-6 text-right"
                        aria-describedby={isOverridden ? `${inputId}-edited` : undefined}
                      />
                      {isOverridden && (
                        <span id={`${inputId}-edited`} className="sr-only">
                          edited from baseline
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </fieldset>

            {edited && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                <RotateCcw aria-hidden /> Reset to {base.city} baseline
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Estimate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              {LINES.map((line) => (
                <div key={line.key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{line.label}</dt>
                  <dd className="official-figure">{formatEur(breakdown[line.key])}</dd>
                </div>
              ))}
            </dl>

            <Separator />

            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Per month</p>
              <p className="official-figure text-xl font-semibold">
                {formatEur(breakdown.monthlyTotal)}
              </p>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-muted-foreground">Per year</p>
              <p className="official-figure text-base font-medium text-muted-foreground">
                {formatEur(breakdown.annualTotal)}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Illustrative planning estimate for {breakdown.city}. Compare your annual figure against
              the blocked-account amount, which is the binding minimum for the visa.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
