/**
 * Zod schemas for AI-generated exam content (work-order §3, §5A). Every LLM response is validated
 * against these before it touches the UI; on failure the provider retries once then falls back to a
 * bundled seed form. Schemas are kept SHALLOW because Gemini's structured-output rejects very deep
 * or large schemas — we generate one section per call and assemble client-side.
 */
import { z } from "zod";

export const examLanguageSchema = z.enum(["en", "de"]);
export type ExamLanguage = z.infer<typeof examLanguageSchema>;

/** A single-best-answer choice. */
export const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export type Choice = z.infer<typeof choiceSchema>;

/**
 * One objective (auto-scorable) item. `typeLabel` is the authentic question-type name shown in
 * review (e.g. "True / False / Not Given", "Matching headings"). `passageRef` links to a passage in
 * the same section. `sourceRef` is the paragraph/transcript line the answer comes from (review aid).
 */
export const objectiveQuestionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("objective"),
  typeLabel: z.string().min(1),
  prompt: z.string().min(1),
  choices: z.array(choiceSchema).min(2).max(8),
  answerId: z.string().min(1),
  explanation: z.string().min(1),
  passageRef: z.string().optional(),
  sourceRef: z.string().optional(),
});
export type ObjectiveQuestion = z.infer<typeof objectiveQuestionSchema>;

/** One open-ended task (Writing/Speaking) scored by an AI rubric, not auto-marked. */
export const openTaskSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("open"),
  typeLabel: z.string().min(1),
  prompt: z.string().min(1),
  guidance: z.string().optional(),
  minWords: z.number().int().positive().optional(),
  prepSeconds: z.number().int().nonnegative().optional(),
  recordSeconds: z.number().int().positive().optional(),
});
export type OpenTask = z.infer<typeof openTaskSchema>;

/** Reading passage or hidden listening transcript. */
export const passageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  kind: z.enum(["reading", "listening"]),
});
export type Passage = z.infer<typeof passageSchema>;

/** Data for a renderable Writing Task 1 figure (drawn with Recharts). */
export const figureSchema = z.object({
  chartType: z.enum(["bar", "line", "pie", "table"]),
  title: z.string().min(1),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  series: z
    .array(
      z.object({
        name: z.string(),
        points: z.array(z.object({ label: z.string(), value: z.number() })).min(1),
      }),
    )
    .min(1),
});
export type Figure = z.infer<typeof figureSchema>;

export const examSkillSchema = z.enum([
  "listening",
  "reading",
  "writing",
  "speaking",
  "verbal",
  "quantitative",
  "data_insights",
  "analytical_writing",
]);
export type ExamSkill = z.infer<typeof examSkillSchema>;

/**
 * One generated section (the unit of an LLM call). Contains its passages (if any), objective
 * questions, and/or open tasks. A listening section also carries transcripts (kind "listening")
 * that TTS reads aloud and that stay hidden until review.
 */
export const generatedSectionSchema = z.object({
  skill: examSkillSchema,
  title: z.string().min(1),
  instructions: z.string().optional(),
  passages: z.array(passageSchema).default([]),
  objective: z.array(objectiveQuestionSchema).default([]),
  open: z.array(openTaskSchema).default([]),
  figure: figureSchema.optional(),
});
export type GeneratedSection = z.infer<typeof generatedSectionSchema>;

/** A fully assembled exam form (one or more sections). */
export const generatedExamSchema = z.object({
  examId: z.string().min(1),
  title: z.string().min(1),
  language: examLanguageSchema,
  sections: z.array(generatedSectionSchema).min(1),
  nonce: z.string().min(1),
  isSeed: z.boolean().default(false),
});
export type GeneratedExam = z.infer<typeof generatedExamSchema>;

/** AI rubric feedback for an open task (Writing/Speaking). */
export const rubricFeedbackSchema = z.object({
  criteria: z
    .array(
      z.object({
        name: z.string(),
        score: z.number(),
        max: z.number(),
        comment: z.string(),
      }),
    )
    .min(1),
  estimatedBand: z.string(),
  summary: z.string(),
  improvements: z.array(z.string()).default([]),
});
export type RubricFeedback = z.infer<typeof rubricFeedbackSchema>;
