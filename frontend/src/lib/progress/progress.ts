/**
 * Deterministic progress + readiness from REAL user data (real-data work order, Part B). Inputs are
 * the user's confirmed profile and their persisted roadmap step status — never mock data. Pure and
 * tested so every dashboard number traces to a computation over confirmed data (CLAUDE.md §4).
 */
import type { UserProfile } from "@/lib/profile/types";
import type { FeatureCategoryKey, ProcessStep } from "@/lib/types";

export type StepStatus = "todo" | "active" | "done";
export type StatusMap = Record<string, StepStatus>;

export const CATEGORY_KEYS: FeatureCategoryKey[] = [
  "profile",
  "documents",
  "language",
  "finance",
  "visa",
  "campus",
];

export function statusOf(map: StatusMap, id: string): StepStatus {
  return map[id] ?? "todo";
}

/** Derive a step's category from the tool it links to (no seed edit needed). */
export function categoryOf(step: ProcessStep): FeatureCategoryKey | undefined {
  const h = step.href ?? "";
  if (h.startsWith("/profile")) return "profile";
  if (h.startsWith("/documents")) return "documents";
  if (h.startsWith("/language")) return "language";
  if (h.startsWith("/finance")) return "finance";
  if (h.startsWith("/visa")) return "visa";
  if (h.startsWith("/campus")) return "campus";
  return undefined;
}

export interface Completion {
  done: number;
  active: number;
  total: number;
  pct: number;
}

export function completion(map: StatusMap, steps: ProcessStep[]): Completion {
  const total = steps.length;
  const done = steps.filter((s) => statusOf(map, s.id) === "done").length;
  const active = steps.filter((s) => statusOf(map, s.id) === "active").length;
  return { done, active, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export interface CategoryCompletion {
  key: FeatureCategoryKey;
  completion: Completion;
}

export function completionByCategory(map: StatusMap, steps: ProcessStep[]): CategoryCompletion[] {
  return CATEGORY_KEYS.map((key) => ({
    key,
    completion: completion(map, steps.filter((s) => categoryOf(s) === key)),
  })).filter((c) => c.completion.total > 0);
}

/** The intake fields that make a profile "complete enough" to personalize. */
function profileFlags(p: UserProfile): boolean[] {
  return [
    p.name.trim() !== "",
    p.homeCountry.trim() !== "",
    p.currentDegree.trim() !== "",
    p.gradeValue.trim() !== "" && p.gradeScale !== "",
    p.targetField.trim() !== "",
    p.germanLevel !== "",
    p.targetIntake !== "",
  ];
}

export function profileCompleteness(p: UserProfile): number {
  const f = profileFlags(p);
  return Math.round((f.filter(Boolean).length / f.length) * 100);
}

/** Weighted readiness: 40% profile completeness + 60% roadmap completion. Deterministic. */
export function readinessScore(p: UserProfile, map: StatusMap, steps: ProcessStep[]): number {
  return Math.round(profileCompleteness(p) * 0.4 + completion(map, steps).pct * 0.6);
}

/** The next not-done steps, in plan order. */
export function nextActions(map: StatusMap, steps: ProcessStep[], n = 3): ProcessStep[] {
  return steps.filter((s) => statusOf(map, s.id) !== "done").slice(0, n);
}
