import { Filter } from "lucide-react";

import type { Facets, FacetKey, Filters } from "@/lib/programs/search";
import { FACET_TITLES, facetValueLabel } from "./labels";
import { cn } from "@/lib/utils";

const FACET_ORDER: FacetKey[] = [
  "subjectGroup",
  "language",
  "degree",
  "city",
  "bundesland",
  "institutionType",
  "intake",
  "admissionMode",
  "mode",
  "tuition",
];

const TEST_OPTIONS = ["ielts", "toefl", "testdaf", "gre", "gmat"];
const ELIGIBILITY_OPTIONS: { key: "likely" | "borderline" | "stretch"; label: string }[] = [
  { key: "likely", label: "Likely eligible" },
  { key: "borderline", label: "Borderline" },
  { key: "stretch", label: "Stretch" },
];

export function FilterPanel({
  facets,
  filters,
  hasProfile,
  onToggleFacet,
  onSpecial,
  onClear,
}: {
  facets: Facets;
  filters: Filters;
  hasProfile: boolean;
  onToggleFacet: (key: FacetKey, value: string) => void;
  onSpecial: (patch: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const sel = (key: FacetKey): string[] =>
    ((filters as unknown as Record<string, string[] | undefined>)[key] ?? []);

  return (
    <aside className="space-y-3" aria-label="Filters">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <Filter className="h-4 w-4" aria-hidden /> Filters
        </h2>
        <button type="button" onClick={onClear} className="text-xs text-primary hover:underline">
          Clear all
        </button>
      </div>

      {FACET_ORDER.map((key) => {
        const options = facets[key] ?? [];
        if (options.length === 0) return null;
        const selected = sel(key);
        return (
          <details key={key} open={key === "subjectGroup" || key === "language" || selected.length > 0} className="rounded-md border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium">
              {FACET_TITLES[key]}
              {selected.length > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{selected.length}</span>
              )}
            </summary>
            <ul className="max-h-56 space-y-0.5 overflow-y-auto px-3 pb-2.5">
              {options.map((o) => (
                <li key={o.value}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.value)}
                      onChange={() => onToggleFacet(key, o.value)}
                      className="accent-[hsl(var(--primary))]"
                    />
                    <span className="min-w-0 flex-1 truncate">{facetValueLabel(key, o.value)}</span>
                    <span className="official-figure text-xs text-muted-foreground">{o.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </details>
        );
      })}

      {/* Extra filters */}
      <details className="rounded-md border bg-card" open={Boolean(filters.jointDouble || filters.tests?.length || filters.semestersMax || filters.eligibility?.length)}>
        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium">More filters</summary>
        <div className="space-y-3 px-3 pb-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(filters.jointDouble)}
              onChange={(e) => onSpecial({ jointDouble: e.target.checked || undefined })}
              className="accent-[hsl(var(--primary))]"
            />
            Joint / double degree
          </label>

          <div>
            <p className="eyebrow mb-1">Standardised tests</p>
            <div className="flex flex-wrap gap-1.5">
              {TEST_OPTIONS.map((t) => {
                const on = filters.tests?.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onSpecial({ tests: toggle(filters.tests, t) })}
                    className={cn("rounded-full border px-2.5 py-0.5 text-xs", on ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground")}
                  >
                    {t.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="dur" className="eyebrow mb-1 block">Max duration</label>
            <select
              id="dur"
              value={filters.semestersMax ?? ""}
              onChange={(e) => onSpecial({ semestersMax: e.target.value ? Number(e.target.value) : undefined })}
              className="h-8 w-full rounded-md border bg-card px-2 text-sm"
            >
              <option value="">Any</option>
              <option value="2">≤ 2 semesters</option>
              <option value="3">≤ 3 semesters</option>
              <option value="4">≤ 4 semesters</option>
            </select>
          </div>

          {hasProfile && (
            <div>
              <p className="eyebrow mb-1">Eligibility</p>
              <div className="space-y-1">
                {ELIGIBILITY_OPTIONS.map((o) => (
                  <label key={o.key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.eligibility?.includes(o.key))}
                      onChange={() => onSpecial({ eligibility: toggle(filters.eligibility, o.key) as Filters["eligibility"] })}
                      className="accent-[hsl(var(--primary))]"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </aside>
  );
}

function toggle<T extends string>(arr: T[] | undefined, v: T): T[] | undefined {
  const set = new Set(arr ?? []);
  if (set.has(v)) set.delete(v);
  else set.add(v);
  const out = [...set];
  return out.length ? out : undefined;
}
