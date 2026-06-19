import { Progress } from "@/components/ui/progress";
import { CATEGORY_ACCENT } from "@/lib/categories";
import type { FeatureCategoryKey, FeatureModule } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FeatureModuleGridProps {
  modules: FeatureModule[];
  /** When provided, each card becomes an activatable button. */
  onSelect?: (key: FeatureCategoryKey) => void;
  className?: string;
}

function pctOf(m: FeatureModule): number {
  return m.featureCount ? Math.round((m.completedCount / m.featureCount) * 100) : 0;
}

function ModuleCard({ module, onSelect }: { module: FeatureModule; onSelect?: (k: FeatureCategoryKey) => void }) {
  const accent = CATEGORY_ACCENT[module.key];
  const pct = pctOf(module);
  const interactive = Boolean(onSelect);

  const body = (
    <>
      {/* Category accent edge */}
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1 rounded-t-lg", accent.bar)} />
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold leading-tight">{module.label}</h3>
        <span className="official-figure text-sm text-muted-foreground">{pct}%</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="official-figure font-medium text-foreground">{module.completedCount}</span> of{" "}
        <span className="official-figure">{module.featureCount}</span> features
      </p>
      <Progress
        value={pct}
        label={`${module.label}: ${module.completedCount} of ${module.featureCount} features complete`}
        className="mt-3 h-1.5"
        indicatorClassName={accent.indicator}
      />
    </>
  );

  const shared = "relative overflow-hidden rounded-lg border bg-card p-4 pt-5 text-left shadow-sm";

  if (interactive) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(module.key)}
        className={cn(
          shared,
          "transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {body}
      </button>
    );
  }
  return <article className={shared}>{body}</article>;
}

/**
 * The six feature-category modules (CLAUDE.md §4). Each card shows its label, completed/total
 * feature counts, and progress, with the category's accent color. Responsive: 1 → 2 → 3 columns.
 */
export function FeatureModuleGrid({ modules, onSelect, className }: FeatureModuleGridProps) {
  return (
    <section className={className} aria-labelledby="modules-heading">
      <div className="mb-3">
        <p className="eyebrow">Bereiche · Categories</p>
        <h2 id="modules-heading" className="mt-1 text-lg font-semibold tracking-tight">
          Feature modules
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <ModuleCard key={m.key} module={m} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
