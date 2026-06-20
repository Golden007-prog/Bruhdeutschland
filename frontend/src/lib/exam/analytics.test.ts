import { describe, expect, it } from "vitest";

import type { AttemptRecord } from "./attempts";
import { bestOverall, improvementPoints, predictedBand, questionTypeStats, streakFromAttempts } from "./analytics";
import type { ExamScore, ItemResult, SectionScore } from "./scoring";

function item(typeLabel: string, earned: number, possible = 1): ItemResult {
  return { id: `${typeLabel}-${earned}`, typeLabel, responseType: "single", earned, possible, correct: earned === possible };
}
function section(skill: string, items: ItemResult[], band?: number): SectionScore {
  const earned = items.reduce((a, b) => a + b.earned, 0);
  const possible = items.reduce((a, b) => a + b.possible, 0);
  return { skill, title: skill, correct: earned, total: possible, percent: possible ? Math.round((earned / possible) * 100) : 0, band, items };
}
function attempt(finishedAt: number, sections: SectionScore[], overallBand?: number): AttemptRecord {
  const score: ExamScore = {
    sections,
    correct: sections.reduce((a, s) => a + s.correct, 0),
    total: sections.reduce((a, s) => a + s.total, 0),
    percent: 0,
    overallBand,
    bandedSkills: [],
    hasOpenTasks: false,
  };
  return { id: `a${finishedAt}`, examId: "ielts", examTitle: "IELTS", mode: "full", startedAt: finishedAt - 1000, finishedAt, durationMs: 1000, score };
}

const DAY = 86_400_000;

describe("questionTypeStats", () => {
  it("aggregates accuracy per type, worst first", () => {
    const a = attempt(DAY * 10, [section("reading", [item("Matching headings", 0), item("Matching headings", 1), item("True/False/Not Given", 1)])]);
    const stats = questionTypeStats([a]);
    expect(stats[0].type).toBe("Matching headings"); // 1/2 = 50% worst
    expect(stats[0].accuracy).toBeCloseTo(0.5);
    expect(stats[1].accuracy).toBe(1);
  });
});

describe("improvementPoints", () => {
  it("ranks a frequent, low-accuracy, recent type highest", () => {
    const now = DAY * 20;
    const a = attempt(DAY * 20, [
      section("reading", [
        item("Matching headings", 0), item("Matching headings", 0), item("Matching headings", 1),
        item("Multiple choice", 1), item("Multiple choice", 1),
      ]),
    ]);
    const pts = improvementPoints([a], now);
    expect(pts[0].type).toBe("Matching headings");
  });
});

describe("predictedBand", () => {
  it("projects an upward trend", () => {
    const atts = [
      attempt(DAY * 1, [section("reading", [item("x", 1)], 5)], 5),
      attempt(DAY * 2, [section("reading", [item("x", 1)], 5.5)], 5.5),
      attempt(DAY * 3, [section("reading", [item("x", 1)], 6)], 6),
    ];
    const p = predictedBand(atts);
    expect(p.value).toBeGreaterThanOrEqual(6);
    expect(p.confidence).toBe("medium");
  });
  it("is honest about no data", () => {
    expect(predictedBand([]).value).toBeUndefined();
  });
});

describe("bestOverall + streak", () => {
  it("finds the best band", () => {
    const atts = [attempt(DAY, [section("r", [item("x", 1)])], 6), attempt(DAY * 2, [section("r", [item("x", 1)])], 6.5)];
    expect(bestOverall(atts)).toBe(6.5);
  });
  it("counts consecutive-day streaks", () => {
    const atts = [attempt(DAY * 10, [section("r", [item("x", 1)])]), attempt(DAY * 11, [section("r", [item("x", 1)])])];
    expect(streakFromAttempts(atts).current).toBe(2);
  });
});
