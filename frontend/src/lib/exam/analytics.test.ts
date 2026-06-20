import { describe, expect, it } from "vitest";

import type { AttemptRecord } from "./attempts";
import { bestOverall, improvementPoints, latestSkillStats, predictedBand, questionTypeStats, scoreHistory, streakFromAttempts } from "./analytics";
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

describe("scoreHistory", () => {
  it("orders points oldest → newest with a local MM-DD label and the overall band", () => {
    const atts = [
      attempt(DAY * 3, [section("reading", [item("x", 1)], 6)], 6),
      attempt(DAY * 1, [section("reading", [item("x", 1)], 5)], 5),
    ];
    const hist = scoreHistory(atts);
    expect(hist.map((h) => h.overall)).toEqual([5, 6]); // sorted ascending by time
    expect(hist[0].t).toBe(DAY * 1);
    expect(hist[1].t).toBe(DAY * 3);
    expect(hist[0].date).toMatch(/^\d{2}-\d{2}$/); // "MM-DD"
  });
  it("carries a null overall when an attempt has no band", () => {
    const hist = scoreHistory([attempt(DAY * 2, [section("reading", [item("x", 1)])])]);
    expect(hist[0].overall).toBeNull();
  });
});

describe("latestSkillStats", () => {
  it("takes each skill from the MOST RECENT attempt that exercised it", () => {
    const atts = [
      // Newer attempt covers reading; older covers reading+listening — listening must come from the older one.
      attempt(DAY * 5, [section("reading", [item("x", 1)], 7)], 7),
      attempt(DAY * 2, [section("reading", [item("x", 0)], 5), section("listening", [item("y", 1)], 6)], 5),
    ];
    const stats = latestSkillStats(atts);
    const reading = stats.find((s) => s.skill === "reading");
    const listening = stats.find((s) => s.skill === "listening");
    expect(reading?.band).toBe(7); // from the newer attempt
    expect(listening?.band).toBe(6); // from the older attempt (only it exercised listening)
    expect(stats).toHaveLength(2);
  });
  it("is empty for no attempts", () => {
    expect(latestSkillStats([])).toEqual([]);
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
