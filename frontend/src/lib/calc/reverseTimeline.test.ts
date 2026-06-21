import { describe, expect, it } from "vitest";

import {
  intakeStartMonth,
  monthDiff,
  reverseTimeline,
  routeNeedsStudienkolleg,
  STUDIENKOLLEG_LEAD_MONTHS,
  STUDIENKOLLEG_MILESTONES,
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

describe("routeNeedsStudienkolleg", () => {
  it("is true for studienkolleg and medicine (school-leaver arc)", () => {
    expect(routeNeedsStudienkolleg("studienkolleg")).toBe(true);
    expect(routeNeedsStudienkolleg("medicine")).toBe(true);
  });
  it("is false for direct routes and when omitted", () => {
    expect(routeNeedsStudienkolleg("master")).toBe(false);
    expect(routeNeedsStudienkolleg("direct_bachelor")).toBe(false);
    expect(routeNeedsStudienkolleg(undefined)).toBe(false);
  });
});

describe("reverseTimeline — G0-1 route-aware Studienkolleg arc", () => {
  const now = new Date(2025, 5, 1); // June 2025

  it("leaves the direct arc unchanged for a master route", () => {
    const direct = reverseTimeline("WS", 2026, now);
    const master = reverseTimeline("WS", 2026, now, "master");
    expect(master).toHaveLength(direct.length);
    expect(master).toHaveLength(TIMELINE_MILESTONES.length);
    expect(master.find((m) => m.key === "apply")?.month).toBe("2026-06");
  });

  it("prepends the Studienkolleg pre-arc for a studienkolleg route", () => {
    const sk = reverseTimeline("WS", 2026, now, "studienkolleg");
    expect(sk).toHaveLength(TIMELINE_MILESTONES.length + STUDIENKOLLEG_MILESTONES.length);
    // The pre-arc milestones come first and the standard "research" still anchors to the degree intake.
    expect(sk[0].key).toBe("sk-german-b1");
    expect(sk.find((m) => m.key === "research")?.month).toBe("2025-08");
  });

  it("back-dates the pre-arc a further STUDIENKOLLEG_LEAD_MONTHS ahead of the degree intake", () => {
    const sk = reverseTimeline("WS", 2026, now, "studienkolleg");
    // sk-start has monthsBefore 0; it sits LEAD_MONTHS (14) before the WS2026 (Oct) intake start.
    const skStart = sk.find((m) => m.key === "sk-start");
    // Oct 2026 − 14 months = Aug 2025.
    expect(skStart?.month).toBe("2025-08");
    // The whole pre-arc lands on/before the first standard milestone ("research", Aug 2025).
    const research = sk.find((m) => m.key === "research")!;
    const skB1 = sk.find((m) => m.key === "sk-german-b1")!;
    expect(skB1.monthsFromNow).toBeLessThanOrEqual(research.monthsFromNow);
    expect(STUDIENKOLLEG_LEAD_MONTHS).toBe(14);
  });

  it("treats school-leaver medicine like the Studienkolleg arc", () => {
    const med = reverseTimeline("WS", 2026, now, "medicine");
    expect(med).toHaveLength(TIMELINE_MILESTONES.length + STUDIENKOLLEG_MILESTONES.length);
    expect(med[0].key).toBe("sk-german-b1");
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
