import { describe, expect, it } from "vitest";

import { IELTS_RAW_TO_BAND, rawToBand } from "@/data/exam-specs";
import type { GeneratedExam } from "./schema";
import { roundToHalf, scoreExam } from "./scoring";

function mcq(id: string, answerId: string) {
  return {
    id,
    kind: "objective" as const,
    typeLabel: "Multiple choice",
    prompt: `Q ${id}`,
    choices: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    answerId,
    explanation: "because",
  };
}

const exam: GeneratedExam = {
  examId: "ielts",
  title: "Test",
  language: "en",
  nonce: "n1",
  isSeed: false,
  sections: [
    {
      skill: "reading",
      title: "Reading",
      passages: [],
      open: [],
      objective: [mcq("r1", "a"), mcq("r2", "a"), mcq("r3", "b"), mcq("r4", "a")],
    },
    {
      skill: "writing",
      title: "Writing",
      passages: [],
      objective: [],
      open: [{ id: "w1", kind: "open", typeLabel: "Essay", prompt: "Write." }],
    },
  ],
};

describe("rawToBand", () => {
  it("maps raw /40 onto the indicative IELTS band table", () => {
    expect(rawToBand(40, IELTS_RAW_TO_BAND)).toBe(9.0);
    expect(rawToBand(30, IELTS_RAW_TO_BAND)).toBe(7.0);
    expect(rawToBand(23, IELTS_RAW_TO_BAND)).toBe(6.0);
    expect(rawToBand(0, IELTS_RAW_TO_BAND)).toBe(0.0);
  });
});

describe("scoreExam", () => {
  it("scores only objective questions and flags open tasks", () => {
    const answers = { r1: "a", r2: "b", r3: "b", r4: "a" }; // 3/4 correct
    const score = scoreExam(exam, answers, IELTS_RAW_TO_BAND);
    expect(score.correct).toBe(3);
    expect(score.total).toBe(4);
    expect(score.percent).toBe(75);
    expect(score.hasOpenTasks).toBe(true);
    // 3/4 → scaled to 30/40 → band 7.0
    expect(score.sections[0].band).toBe(7.0);
    expect(score.overallBand).toBe(7.0);
  });

  it("treats unanswered questions as incorrect", () => {
    const score = scoreExam(exam, {}, IELTS_RAW_TO_BAND);
    expect(score.correct).toBe(0);
    expect(score.percent).toBe(0);
  });

  it("rounds to the nearest half band", () => {
    expect(roundToHalf(6.75)).toBe(7.0);
    expect(roundToHalf(6.25)).toBe(6.5);
    expect(roundToHalf(6.1)).toBe(6.0);
  });
});
