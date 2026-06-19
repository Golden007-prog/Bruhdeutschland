import { describe, expect, it } from "vitest";

import { computeStreak } from "./attempts";

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
