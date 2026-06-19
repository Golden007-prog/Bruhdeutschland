import type { FeatureCategoryKey } from "./types";

/** Human-readable category names (feature-matrix.md / CLAUDE.md §4). */
export const CATEGORY_LABELS: Record<FeatureCategoryKey, string> = {
  profile: "Profile & Assessment",
  documents: "Document Prep",
  language: "Language & Test Prep",
  finance: "Finance & Logistics",
  visa: "Visa & Relocation",
  campus: "Campus Life",
};

/** Categories whose guidance is immigration/financial and therefore needs the disclaimer. */
export const ADVISORY_CATEGORIES: ReadonlySet<FeatureCategoryKey> = new Set<FeatureCategoryKey>([
  "finance",
  "visa",
]);

/**
 * Per-category accent classes. Tailwind only emits classes it sees verbatim in source, so the
 * full class strings are listed literally here rather than interpolated (`bg-category-${key}`).
 */
export interface CategoryAccent {
  /** Solid bar / dot (the timeline spine, card edge). */
  bar: string;
  /** Tinted text for the accent. */
  text: string;
  /** Progress-indicator fill. */
  indicator: string;
}

export const CATEGORY_ACCENT: Record<FeatureCategoryKey, CategoryAccent> = {
  profile: { bar: "bg-category-profile", text: "text-category-profile", indicator: "bg-category-profile" },
  documents: { bar: "bg-category-documents", text: "text-category-documents", indicator: "bg-category-documents" },
  language: { bar: "bg-category-language", text: "text-category-language", indicator: "bg-category-language" },
  finance: { bar: "bg-category-finance", text: "text-category-finance", indicator: "bg-category-finance" },
  visa: { bar: "bg-category-visa", text: "text-category-visa", indicator: "bg-category-visa" },
  campus: { bar: "bg-category-campus", text: "text-category-campus", indicator: "bg-category-campus" },
};
