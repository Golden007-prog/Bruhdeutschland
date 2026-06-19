import type { ReactNode } from "react";

import { CATEGORY_ACCENT } from "@/lib/categories";
import type { FeatureCategoryKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** Small uppercase administrative label, e.g. "Profil · Profile & Assessment". */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Dossier file reference shown top-right (e.g. "§ 05" or a feature number). */
  fileRef?: string;
  /** Category accent for the top edge bar. */
  category?: FeatureCategoryKey;
  /** Right-aligned actions (buttons, links). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard page masthead. Carries the category accent as a thin top edge and an optional
 * Aktenzeichen-style file reference — the structural devices encode where you are in the dossier.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  fileRef,
  category,
  actions,
  className,
}: PageHeaderProps) {
  const accent = category ? CATEGORY_ACCENT[category] : null;
  return (
    <header className={cn("relative", className)}>
      {accent && <span aria-hidden className={cn("absolute -top-px left-0 h-1 w-16 rounded-full", accent.bar)} />}
      <div className="flex flex-wrap items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          {fileRef && (
            <div className="text-right">
              <p className="eyebrow">Aktenzeichen</p>
              <p className="official-figure text-sm font-medium">{fileRef}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
