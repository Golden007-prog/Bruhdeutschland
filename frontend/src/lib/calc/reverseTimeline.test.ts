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
