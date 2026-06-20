import { describe, expect, it } from "vitest";

import {
  intakeStartMonth,
  monthDiff,
  reverseTimeline,
  TIMELINE_MILESTONES,
} from "./reverseTimeline";

describe("intakeStartMonth", () => {
  it("winter intake starts in October", () => {
    expect(intakeStartMonth("WS", 2026)).toBe("2026-10");
  });
  it("summer intake starts in April", () => {
    expect(intakeStartMonth("SS", 2027)).toBe("2027-04");
  });
});

describe("monthDiff", () => {
  it("counts whole months across years", () => {
    expect(monthDiff("2026-01", "2027-01")).toBe(12);
    expect(monthDiff("2026-10", "2026-06")).toBe(-4);
  });
});

describe("reverseTimeline", () => {
  const now = new Date(2025, 5, 1); // June 2025
  const milestones = reverseTimeline("WS", 2026, now);

  it("produces one dated milestone per template entry", () => {
    expect(milestones).toHaveLength(TIMELINE_MILESTONES.length);
  });
  it("places the arrival milestone at the intake start", () => {
    const arrival = milestones.find((m) => m.key === "arrival");
    expect(arrival?.month).toBe("2026-10");
  });
  it("back-dates 'apply' four months before the WS start (June 2026)", () => {
    const apply = milestones.find((m) => m.key === "apply");
    expect(apply?.month).toBe("2026-06");
  });
  it("back-dates research 14 months before (Aug 2025)", () => {
    const research = milestones.find((m) => m.key === "research");
    expect(research?.month).toBe("2025-08");
  });
  it("flags milestones already in the past as overdue", () => {
    // Planning a WS2026 intake from June 2025, nothing is overdue yet (earliest is Aug 2025).
    expect(milestones.every((m) => !m.overdue)).toBe(true);
    // But planning the same intake from Sept 2026, most milestones are overdue.
    const late = reverseTimeline("WS", 2026, new Date(2026, 8, 1));
    expect(late.find((m) => m.key === "research")?.overdue).toBe(true);
  });
});

describe("reverseTimeline — SS intake + year-rollover back-dating", () => {
  const ss = reverseTimeline("SS", 2027, new Date(2025, 0, 1)); // plan SS2027 from Jan 2025

  it("places the arrival milestone at the SS start (April)", () => {
    expect(ss.find((m) => m.key === "arrival")?.month).toBe("2027-04");
  });
  it("back-dates milestones whose offset crosses the year boundary into the PRIOR year", () => {
    // April 2027 − 4 months = December 2026 (the most off-by-one-prone, prior-year case).
    expect(ss.find((m) => m.key === "apply")?.month).toBe("2026-12");
    // April 2027 − 14 months = February 2026.
    expect(ss.find((m) => m.key === "research")?.month).toBe("2026-02");
    // April 2027 − 2 months stays in 2027 (February).
    expect(ss.find((m) => m.key === "admission")?.month).toBe("2027-02");
  });
  it("orders monthsFromNow consistently with the rolled-over months", () => {
    const research = ss.find((m) => m.key === "research");
    const arrival = ss.find((m) => m.key === "arrival");
    // Feb 2026 is 13 months after Jan 2025; April 2027 is 27 months after.
    expect(research?.monthsFromNow).toBe(13);
    expect(arrival?.monthsFromNow).toBe(27);
    expect(ss.every((m) => !m.overdue)).toBe(true); // earliest (Feb 2026) is still ahead of Jan 2025
  });
});
