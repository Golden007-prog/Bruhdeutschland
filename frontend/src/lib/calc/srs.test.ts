import { describe, expect, it } from "vitest";

import { INITIAL_SRS, reviewByRating, reviewCard } from "./srs";

describe("SM-2 spaced repetition", () => {
  it("advances intervals 1 → 6 → ×easiness on successive good recalls", () => {
    let s = INITIAL_SRS;
    s = reviewCard(s, 4);
    expect(s.repetition).toBe(1);
    expect(s.intervalDays).toBe(1);
    s = reviewCard(s, 4);
    expect(s.repetition).toBe(2);
    expect(s.intervalDays).toBe(6);
    s = reviewCard(s, 4);
    expect(s.repetition).toBe(3);
    expect(s.intervalDays).toBeGreaterThan(6); // 6 × easiness
  });

  it("resets the streak to a 1-day interval on a lapse (quality < 3)", () => {
    let s = reviewCard(INITIAL_SRS, 5);
    s = reviewCard(s, 5);
    expect(s.repetition).toBe(2);
    const lapsed = reviewCard(s, 1);
    expect(lapsed.repetition).toBe(0);
    expect(lapsed.intervalDays).toBe(1);
  });

  it("never lets easiness fall below 1.3", () => {
    let s = INITIAL_SRS;
    for (let i = 0; i < 10; i++) s = reviewCard(s, 0);
    expect(s.easiness).toBeGreaterThanOrEqual(1.3);
  });

  it("maps UI ratings (again/good/easy) onto SM-2 qualities", () => {
    expect(reviewByRating(INITIAL_SRS, "again").repetition).toBe(0);
    expect(reviewByRating(INITIAL_SRS, "good").repetition).toBe(1);
    expect(reviewByRating(INITIAL_SRS, "easy").repetition).toBe(1);
    // "easy" raises easiness more than "good".
    expect(reviewByRating(INITIAL_SRS, "easy").easiness).toBeGreaterThan(
      reviewByRating(INITIAL_SRS, "good").easiness,
    );
  });
});
