/**
 * Zod schemas for AI-generated exam content (work-order §3, §5A). Every LLM response is validated
 * against these before it touches the UI; on failure the provider retries once then falls back to a
 * bundled seed form. Schemas are kept SHALLOW because Gemini's structured-output rejects very deep
 * or large schemas — we generate one section per call and assemble client-side.
 */
import { z } from "zod";

export const examLanguageSchema = z.enum(["en", "de"]);
export type ExamLanguage = z.infer<typeof examLanguageSchema>;

/** A single-best-answer choice (also used as the right-hand bank for matching items). */
export const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});
export type Choice = z.infer<typeof choiceSchema>;

/**
 * How an objective item is answered AND deterministically marked (work-order §3, IELTS/TOEFL exact
 * question types). Every variant is auto-scored in tested code — the model never marks:
 *  - `single`   one radio choice (default; also covers True/False/Not Given, Yes/No/Not Given)
 *  - `multi`    choose-N checkboxes; correct iff the selected SET equals `answerIds`
 *  - `text`     gap-fill / short-answer / "Complete the Words"; correct iff the typed answer (case +
 *               whitespace normalised) is in `acceptable`
 *  - `matching` match each `pairs[].leftText` to a right-bank option (`choices`); each pair = 1 mark
 *  - `ordering` "Build a Sentence" / sentence-ordering; correct iff the token order equals `order`
 */
export const responseTypeSchema = z.enum(["single", "multi", "text", "matching", "ordering"]);
export type ResponseType = z.infer<typeof responseTypeSchema>;

/** One left-hand item in a matching question, with the id of its correct right-bank option. */
export const matchPairSchema = z.object({
  id: z.string().min(1),
  leftText: z.string().min(1),
  answerId: z.string().min(1),
});
export type MatchPair = z.infer<typeof matchPairSchema>;

/** A draggable token for an ordering / "Build a Sentence" item. */
export const tokenSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
export type Token = z.infer<typeof tokenSchema>;

/**
 * One objective (auto-scorable) item. `typeLabel` is the authentic question-type name shown in
 * review (e.g. "True / False / Not Given", "Matching headings", "Complete the Words"). `passageRef`
 * links to a passage in the same section. `sourceRef` is the paragraph/transcript line the answer
 * comes from (review aid). `responseType` selects how it is rendered and marked (defaults to single).
 */
export const objectiveQuestionSchema = z
  .object({
    id: z.string().min(1),
    kind: z.literal("objective"),
    responseType: responseTypeSchema.optional(),
    typeLabel: z.string().min(1),
    prompt: z.string().min(1),
    /** Choice bank (single/multi answers; right-hand options for matching). Empty for text/ordering. */
    choices: z.array(choiceSchema).max(12).default([]),
    /** single: the correct choice id. */
    answerId: z.string().optional(),
    /** multi: the set of correct choice ids. */
    answerIds: z.array(z.string()).optional(),
    /** text: accepted answers (compared case- and whitespace-insensitively). */
    acceptable: z.array(z.string()).optional(),
    /** matching: left items mapped to a right-bank choice id. */
    pairs: z.array(matchPairSchema).optional(),
    /** ordering: the tokens to arrange. */
    tokens: z.array(tokenSchema).optional(),
    /** ordering: the correct sequence of token ids. */
    order: z.array(z.string()).optional(),
    explanation: z.string().min(1),
    passageRef: z.string().optional(),
    sourceRef: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    const rt = q.responseType ?? "single";
    const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (rt === "single") {
      if (q.choices.length < 2) fail("single-choice item needs ≥2 choices");
      if (!q.answerId) fail("single-choice item needs answerId");
    } else if (rt === "multi") {
      if (q.choices.length < 2) fail("multi item needs ≥2 choices");
      if (!q.answerIds || q.answerIds.length < 1) fail("multi item needs answerIds");
    } else if (rt === "text") {
      if (!q.acceptable || q.acceptable.length < 1) fail("text item needs acceptable answers");
    } else if (rt === "matching") {
      if (q.choices.length < 2) fail("matching item needs a right-hand bank in choices");
      if (!q.pairs || q.pairs.length < 1) fail("matching item needs pairs");
    } else if (rt === "ordering") {
      if (!q.tokens || q.tokens.length < 2) fail("ordering item needs ≥2 tokens");
      if (!q.order || q.order.length !== (q.tokens?.length ?? 0)) fail("ordering item needs a full order");
    }
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

/** A named voice in a listening dialogue, with optional accent/style cues for the TTS engine. */
export const speakerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** e.g. "British", "Australian", "North American", "German" — drives voice selection (work-order §3). */
  accent: z.string().optional(),
  /** e.g. "warm", "formal", "hurried" — passed to prompt-driven TTS (Gemini multi-speaker). */
  style: z.string().optional(),
  gender: z.enum(["male", "female", "neutral"]).optional(),
});
export type Speaker = z.infer<typeof speakerSchema>;

/** One line of a multi-speaker listening transcript. */
export const transcriptLineSchema = z.object({
  speakerId: z.string().min(1),
  text: z.string().min(1),
});
export type TranscriptLine = z.infer<typeof transcriptLineSchema>;

/**
 * Reading passage or hidden listening transcript. For Listening, `lines` + `speakers` (when present)
 * drive a multi-speaker, accented rendering (work-order §3/§5); `body` is the flat transcript used as
 * the TTS fallback and shown in review. `accent` is a single-voice hint for monologues.
 */
export const passageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  kind: z.enum(["reading", "listening"]),
  accent: z.string().optional(),
  speakers: z.array(speakerSchema).optional(),
  lines: z.array(transcriptLineSchema).optional(),
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
export const generatedSectionSchema = z
  .object({
    skill: examSkillSchema,
    title: z.string().min(1),
    instructions: z.string().optional(),
    passages: z.array(passageSchema).default([]),
    objective: z.array(objectiveQuestionSchema).default([]),
    open: z.array(openTaskSchema).default([]),
    figure: figureSchema.optional(),
  })
  // A section must give the candidate something to do — at least one objective question or open task.
  // Without this, a model can emit a schema-valid but empty section that renders a dead "0/0" page.
  .superRefine((section, ctx) => {
    if (section.objective.length === 0 && section.open.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Section must contain at least one objective question or open task.",
        path: ["objective"],
      });
    }
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

/**
 * AI rubric feedback for an open task (Writing/Speaking). Each criterion carries `evidence` — the
 * descriptor phrase + response quote justifying the sub-score (work-order §7 provenance) — and the
 * overall estimate is a RANGE (`bandLow`–`bandHigh`) with a `confidence`, never a bare number.
 */
export const rubricFeedbackSchema = z.object({
  criteria: z
    .array(
      z.object({
        name: z.string(),
        score: z.number(),
        max: z.number(),
        evidence: z.string().default(""),
        comment: z.string(),
      }),
    )
    .min(1),
  bandLow: z.string(),
  bandHigh: z.string(),
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  summary: z.string(),
  improvements: z.array(z.string()).default([]),
});
export type RubricFeedback = z.infer<typeof rubricFeedbackSchema>;
