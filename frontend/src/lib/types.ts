/** Shared UI types. Mirror the backend schemas (data-model.md / agent-workflows.md) but are
 *  intentionally decoupled — the frontend runs on typed mock/seed data, no backend dependency. */

export type FeatureCategoryKey =
  | "profile"
  | "documents"
  | "language"
  | "finance"
  | "visa"
  | "campus";

export type RoadmapItemStatus = "locked" | "active" | "done";

export interface RoadmapItem {
  id: string;
  category: FeatureCategoryKey;
  title: string;
  description?: string;
  status: RoadmapItemStatus;
  /** ISO date (YYYY-MM-DD), if the item has a deadline. */
  deadline?: string;
  /** True when an official value backing this item is ungrounded (CLAUDE.md §2). */
  needsVerification?: boolean;
  /** Optional in-app link to the feature page that owns this step. */
  href?: string;
}

/** An official, source-grounded value — or one flagged for verification. */
export interface GroundedValue<T> {
  value: T | null;
  sourceName?: string;
  sourceUrl?: string;
  needsVerification: boolean;
}

export interface ExtractedFact {
  label: string;
  value: string;
}

export interface SkillGap {
  id: string;
  skill: string;
  severity: "low" | "medium" | "high";
}

export interface ParsedProfile {
  fileName: string;
  facts: ExtractedFact[];
  /** German GPA via the deterministic Modified Bavarian Formula. */
  germanGpa: GroundedValue<number>;
  gpaMethod: string;
  totalEcts: GroundedValue<number>;
  skillGaps: SkillGap[];
}

export interface FeatureModule {
  key: FeatureCategoryKey;
  label: string;
  /** Total number of features in this category (feature-matrix.md). */
  featureCount: number;
  /** Features the user has completed. */
  completedCount: number;
}

/* ------------------------------------------------------------------ *
 *  Provenance & official facts (CLAUDE.md §2, §3)
 * ------------------------------------------------------------------ */

/** A citable source: { name, url }. Registry lives in lib/sources.ts. */
export interface Source {
  name: string;
  url: string;
}

/**
 * An official figure shown in the UI. If `needsVerification` is true the value is rendered in the
 * "unstamped" (dashed amber) treatment and the user is told to confirm it against `source`.
 */
export interface OfficialFact {
  label: string;
  value: string;
  source?: Source;
  needsVerification: boolean;
  note?: string;
}

/* ------------------------------------------------------------------ *
 *  Process / step-by-step preparation
 * ------------------------------------------------------------------ */

export type StepState = "todo" | "active" | "done";

export interface ProcessStep {
  id: string;
  title: string;
  detail?: string;
  /** Optional rough effort/duration hint, e.g. "2–4 weeks". */
  durationHint?: string;
  /** Optional in-app link to the relevant tool. */
  href?: string;
  /** Optional source for an official requirement referenced by this step. */
  source?: Source;
  needsVerification?: boolean;
}

/* ------------------------------------------------------------------ *
 *  Document gathering & checklists
 * ------------------------------------------------------------------ */

export interface ChecklistItemDef {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  category?: FeatureCategoryKey;
}

/* ------------------------------------------------------------------ *
 *  Deadlines & event watch
 * ------------------------------------------------------------------ */

export type DeadlineSeverity = "info" | "soon" | "urgent" | "overdue";

export interface DeadlineEvent {
  id: string;
  title: string;
  /** ISO date YYYY-MM-DD. */
  date: string;
  category: FeatureCategoryKey;
  note?: string;
  /** Most German official dates change yearly — flag when not grounded. */
  needsVerification?: boolean;
  /** Citation for an official date/figure referenced by this event. */
  source?: Source;
  href?: string;
}

/* ------------------------------------------------------------------ *
 *  Application status board (process polling — mirrors ApplicationState FSM)
 * ------------------------------------------------------------------ */

export type ApplicationStageState = "not_started" | "in_progress" | "submitted" | "complete";

export interface ApplicationStage {
  id: string;
  title: string;
  state: ApplicationStageState;
  detail?: string;
  category: FeatureCategoryKey;
  updatedHint?: string;
}

/* ------------------------------------------------------------------ *
 *  Mock-exam engine (IELTS, TOEFL, TestDaF, …)
 * ------------------------------------------------------------------ */

export interface ExamChoice {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  /** Optional reading/listening passage shown above the prompt. */
  passage?: string;
  /** Optional section label, e.g. "Reading", "Listening". */
  section?: string;
  prompt: string;
  choices: ExamChoice[];
  /** id of the correct choice. */
  answerId: string;
  explanation?: string;
}

export interface ExamSectionDef {
  name: string;
  durationMin: number;
  format: string;
  scoring?: string;
}

export interface MockExamDef {
  id: string;
  title: string;
  /** Total time budget in minutes (drives the timer). */
  durationMin: number;
  /** Reference percent considered a pass for the practice set. */
  passPct: number;
  questions: ExamQuestion[];
  /** Optional official section breakdown shown before the user starts. */
  sections?: ExamSectionDef[];
}
