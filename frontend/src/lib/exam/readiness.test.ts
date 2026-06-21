import { describe, expect, it } from "vitest";

import { bookingReadiness } from "./readiness";

describe("bookingReadiness", () => {
  it("asks for a target when none is set", () => {
    expect(bookingReadiness(7, "high", 0).verdict).toBe("no_target");
    expect(bookingReadiness(7, "high", NaN).verdict).toBe("no_target");
  });

  it("needs attempts before advising", () => {
    expect(bookingReadiness(undefined, "low", 7).verdict).toBe("insufficient");
  });

  it("says ready only when comfortably above target with enough confidence", () => {
    const r = bookingReadiness(7.5, "high", 7);
    expect(r.verdict).toBe("ready");
    expect(r.gap).toBe(-0.5);
  });

  it("does NOT say ready on a single lucky high attempt (low confidence)", () => {
    const r = bookingReadiness(7.5, "low", 7);
    expect(r.verdict).toBe("almost");
  });

  it("calls a right-at-target projection borderline", () => {
    expect(bookingReadiness(7, "high", 7).verdict).toBe("almost");
  });

  it("tells a short student to keep practising with the gap", () => {
    const r = bookingReadiness(6, "high", 7);
    expect(r.verdict).toBe("keep_practising");
    expect(r.gap).toBe(1);
  });
});
