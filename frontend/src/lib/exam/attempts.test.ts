import { beforeEach, describe, expect, it } from "vitest";

import { installMemoryStorage } from "@/test/storage";
import { setActiveUser } from "@/lib/persist/userScope";
import { clearAttempts, computeStreak, dayStr, getAttempts, recordAttempt, type AttemptRecord } from "./attempts";
import type { ExamScore } from "./scoring";

const mem = installMemoryStorage();

const emptyScore: ExamScore = { sections: [], correct: 0, total: 0, percent: 0, bandedSkills: [], hasOpenTasks: false };
const make = (examId: string): Omit<AttemptRecord, "id"> => ({
  examId, examTitle: examId, mode: "full", startedAt: 0, finishedAt: 1, durationMs: 1, score: emptyScore,
});

describe("computeStreak", () => {
  it("starts a streak at 1 on the first practice", () => {
    expect(computeStreak({ current: 0, longest: 0, last: null }, "2026-06-20")).toEqual({
      current: 1,
      longest: 1,
      last: "2026-06-20",
    });
  });

  it("keeps the streak unchanged for same-day re-practice", () => {
    expect(computeStreak({ current: 3, longest: 5, last: "2026-06-20" }, "2026-06-20")).toEqual({
      current: 3,
      longest: 5,
      last: "2026-06-20",
    });
  });

  it("increments on a consecutive day", () => {
    expect(computeStreak({ current: 3, longest: 5, last: "2026-06-19" }, "2026-06-20")).toEqual({
      current: 4,
      longest: 5,
      last: "2026-06-20",
    });
  });

  it("resets to 1 after a gap", () => {
    expect(computeStreak({ current: 3, longest: 5, last: "2026-06-10" }, "2026-06-20")).toEqual({
      current: 1,
      longest: 5,
      last: "2026-06-20",
    });
  });

  it("raises the longest streak when surpassed", () => {
    expect(computeStreak({ current: 5, longest: 5, last: "2026-06-19" }, "2026-06-20")).toEqual({
      current: 6,
      longest: 6,
      last: "2026-06-20",
    });
  });
});

describe("dayStr — local calendar bucketing (no UTC off-by-one)", () => {
  it("buckets a just-after-LOCAL-midnight time to that local day, not the previous UTC day", () => {
    // 00:30 local on 21 Jun 2026, constructed in LOCAL time. In IST (UTC+5:30) / CET this is still the
    // previous UTC day, so a toISOString() slice would wrongly yield "2026-06-20". The local key must
    // match the wall-clock day the user sees. (getFullYear/Month/Date are local, so this is TZ-robust.)
    const ms = new Date(2026, 5, 21, 0, 30, 0).getTime();
    expect(dayStr(ms)).toBe("2026-06-21");
  });

  it("a consecutive-local-day attempt increments the streak (not collapsed by the UTC shift)", () => {
    const d1 = dayStr(new Date(2026, 5, 20, 23, 50).getTime()); // late evening, day 1
    const d2 = dayStr(new Date(2026, 5, 21, 0, 30).getTime()); // just after midnight, day 2
    expect(d1).toBe("2026-06-20");
    expect(d2).toBe("2026-06-21");
    const s1 = computeStreak({ current: 0, longest: 0, last: null }, d1);
    const s2 = computeStreak(s1, d2);
    expect(s2.current).toBe(2);
  });
});

describe("exam attempts per-user isolation", () => {
  beforeEach(() => {
    mem.clear();
    setActiveUser(null);
  });

  it("scopes attempt history by user so accounts don't share it", async () => {
    setActiveUser("user-A");
    await recordAttempt(make("ielts"));
    expect(getAttempts()).toHaveLength(1);

    setActiveUser("user-B");
    expect(getAttempts()).toHaveLength(0); // B sees none of A's attempts

    await recordAttempt(make("toefl"));
    expect(getAttempts()).toHaveLength(1);
    expect(getAttempts()[0].examId).toBe("toefl");

    setActiveUser("user-A");
    expect(getAttempts()).toHaveLength(1); // A still has only its own
    expect(getAttempts()[0].examId).toBe("ielts");

    clearAttempts();
    expect(getAttempts()).toHaveLength(0);
  });
});
