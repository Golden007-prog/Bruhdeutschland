import { describe, expect, it } from "vitest";

import { generateExamFromSpec } from "@/lib/exam/generate";
import { generatedExamSchema } from "@/lib/exam/schema";
import { scoreExam, type AnswerMap } from "@/lib/exam/scoring";
import { TESTAS_SEED, TESTAS_SPEC } from "./testas";
import { TMS_SEED, TMS_SPEC } from "./tms";

describe("TestAS / TMS aptitude banks", () => {
  it("seed forms are schema-valid and flagged isSeed", () => {
    for (const seed of [TESTAS_SEED, TMS_SEED]) {
      const parsed = generatedExamSchema.parse(seed);
      expect(parsed.isSeed).toBe(true);
      expect(parsed.sections.length).toBeGreaterThan(0);
    }
  });

  it("every seed objective item is single-answer with a resolvable correct choice", () => {
    for (const seed of [TESTAS_SEED, TMS_SEED]) {
      for (const section of seed.sections) {
        for (const q of section.objective) {
          expect(q.choices.some((c) => c.id === q.answerId)).toBe(true);
        }
      }
    }
  });

  it("falls back to the bundled seed when no AI provider is configured", async () => {
    // No provider in the test env → generation throws → the offline seed is returned.
    const exam = await generateExamFromSpec(TESTAS_SPEC, TESTAS_SEED);
    expect(exam.isSeed).toBe(true);
    expect(exam.examId).toBe("testas");
  });

  it("scores a fully-correct TestAS seed attempt at 100% on the percent scale", async () => {
    const exam = await generateExamFromSpec(TESTAS_SPEC, TESTAS_SEED);
    const answers: AnswerMap = {};
    for (const s of exam.sections) for (const q of s.objective) answers[q.id] = q.answerId!;
    const score = scoreExam(exam, answers, { scale: TESTAS_SPEC.scale });
    expect(score.percent).toBe(100);
    // percent scale → no fabricated band.
    expect(score.overallBand).toBeUndefined();
  });

  it("scores an all-wrong TMS seed attempt at 0%", async () => {
    const exam = await generateExamFromSpec(TMS_SPEC, TMS_SEED);
    const answers: AnswerMap = {};
    for (const s of exam.sections) {
      for (const q of s.objective) {
        const wrong = q.choices.find((c) => c.id !== q.answerId);
        if (wrong) answers[q.id] = wrong.id;
      }
    }
    const score = scoreExam(exam, answers, { scale: TMS_SPEC.scale });
    expect(score.percent).toBe(0);
  });
});
