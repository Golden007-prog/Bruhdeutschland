import { describe, expect, it } from "vitest";

import { IELTS_RAW_TO_BAND, rawToBand } from "@/data/exam-specs";
import type { GeneratedExam, ObjectiveQuestion } from "./schema";
import { isAnswered, markItem, roundToHalf, scoreExam } from "./scoring";

function mcq(id: string, answerId: string): ObjectiveQuestion {
  return {
    id,
    kind: "objective",
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

describe("scoreExam (IELTS)", () => {
  it("scores only objective questions and flags open tasks", () => {
    const answers = { r1: "a", r2: "b", r3: "b", r4: "a" }; // 3/4 correct
    const score = scoreExam(exam, answers, { bandTable: IELTS_RAW_TO_BAND, scale: "ielts" });
    expect(score.correct).toBe(3);
    expect(score.total).toBe(4);
    expect(score.percent).toBe(75);
    expect(score.hasOpenTasks).toBe(true);
    // 3/4 → scaled to 30/40 → band 7.0
    expect(score.sections[0].band).toBe(7.0);
    expect(score.overallBand).toBe(7.0);
  });

  it("treats unanswered questions as incorrect", () => {
    const score = scoreExam(exam, {}, { bandTable: IELTS_RAW_TO_BAND, scale: "ielts" });
    expect(score.correct).toBe(0);
    expect(score.percent).toBe(0);
  });

  it("rounds to the nearest half band (.25 up to half, .75 up to whole)", () => {
    expect(roundToHalf(6.75)).toBe(7.0);
    expect(roundToHalf(6.25)).toBe(6.5);
    expect(roundToHalf(6.1)).toBe(6.0);
  });
});

describe("markItem — every response type is deterministically marked", () => {
  it("single: correct only on the exact choice", () => {
    const q = mcq("q", "a");
    expect(markItem(q, "a")).toEqual({ earned: 1, possible: 1 });
    expect(markItem(q, "b")).toEqual({ earned: 0, possible: 1 });
    expect(markItem(q, undefined)).toEqual({ earned: 0, possible: 1 });
  });

  it("multi: correct only when the selected SET equals answerIds", () => {
    const q: ObjectiveQuestion = {
      id: "q", kind: "objective", responseType: "multi", typeLabel: "Choose two",
      prompt: "Pick two", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }],
      answerIds: ["a", "c"], explanation: "x",
    };
    expect(markItem(q, ["a", "c"]).earned).toBe(1);
    expect(markItem(q, ["c", "a"]).earned).toBe(1); // order-independent
    expect(markItem(q, ["a"]).earned).toBe(0); // incomplete
    expect(markItem(q, ["a", "b", "c"]).earned).toBe(0); // over-selected
  });

  it("text: case- and whitespace-insensitive against accepted answers", () => {
    const q: ObjectiveQuestion = {
      id: "q", kind: "objective", responseType: "text", typeLabel: "Complete the Words",
      prompt: "Fill the gap", choices: [], acceptable: ["photosynthesis", "photo synthesis"], explanation: "x",
    };
    expect(markItem(q, "  Photosynthesis ").earned).toBe(1);
    expect(markItem(q, "PHOTO   SYNTHESIS").earned).toBe(1);
    expect(markItem(q, "respiration").earned).toBe(0);
    expect(markItem(q, "").earned).toBe(0);
  });

  it("matching: one mark per correctly matched pair (partial credit)", () => {
    const q: ObjectiveQuestion = {
      id: "q", kind: "objective", responseType: "matching", typeLabel: "Matching headings",
      prompt: "Match", choices: [{ id: "h1", text: "Heading 1" }, { id: "h2", text: "Heading 2" }],
      pairs: [
        { id: "p1", leftText: "Para A", answerId: "h1" },
        { id: "p2", leftText: "Para B", answerId: "h2" },
      ],
      explanation: "x",
    };
    expect(markItem(q, { p1: "h1", p2: "h2" })).toEqual({ earned: 2, possible: 2 });
    expect(markItem(q, { p1: "h1", p2: "h1" })).toEqual({ earned: 1, possible: 2 });
    expect(markItem(q, {})).toEqual({ earned: 0, possible: 2 });
  });

  it("ordering: all-or-nothing on the full token order", () => {
    const q: ObjectiveQuestion = {
      id: "q", kind: "objective", responseType: "ordering", typeLabel: "Build a Sentence",
      prompt: "Order the words", choices: [],
      tokens: [{ id: "t1", text: "I" }, { id: "t2", text: "am" }, { id: "t3", text: "here" }],
      order: ["t1", "t2", "t3"], explanation: "x",
    };
    expect(markItem(q, ["t1", "t2", "t3"]).earned).toBe(1);
    expect(markItem(q, ["t2", "t1", "t3"]).earned).toBe(0);
    expect(markItem(q, ["t1", "t2"]).earned).toBe(0);
  });
});

describe("isAnswered", () => {
  it("detects a non-empty answer per response type", () => {
    expect(isAnswered(mcq("q", "a"), "a")).toBe(true);
    expect(isAnswered(mcq("q", "a"), undefined)).toBe(false);
    const text: ObjectiveQuestion = { id: "t", kind: "objective", responseType: "text", typeLabel: "x", prompt: "p", choices: [], acceptable: ["x"], explanation: "e" };
    expect(isAnswered(text, "  ")).toBe(false);
    expect(isAnswered(text, "word")).toBe(true);
    const match: ObjectiveQuestion = { id: "m", kind: "objective", responseType: "matching", typeLabel: "x", prompt: "p", choices: [{ id: "h", text: "H" }], pairs: [{ id: "p1", leftText: "L", answerId: "h" }], explanation: "e" };
    expect(isAnswered(match, {})).toBe(false);
    expect(isAnswered(match, { p1: "h" })).toBe(true);
  });
});

describe("scoreExam (TOEFL-2026 1–6 + CEFR + 0–120 concordance)", () => {
  const toefl: GeneratedExam = {
    examId: "toefl", title: "TOEFL", language: "en", nonce: "n", isSeed: false,
    sections: [
      { skill: "reading", title: "Reading", passages: [], open: [], objective: [mcq("r1", "a"), mcq("r2", "a")] },
    ],
  };
  it("derives a 1–6 band, CEFR level, and a 0–120 concordance band", () => {
    const score = scoreExam(toefl, { r1: "a", r2: "a" }, { scale: "toefl-2026" }); // 100%
    expect(score.sections[0].band).toBe(6.0);
    expect(score.overallBand).toBe(6.0);
    expect(score.cefr).toBe("C2");
    expect(score.concordance120?.min).toBe(114);
    expect(score.concordance120?.max).toBe(120);
  });
});
