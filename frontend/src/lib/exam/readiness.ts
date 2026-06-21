/**
 * Deterministic "ready to book" gate (gap G3-2). Compares a rolling PREDICTED band (from
 * lib/exam/analytics → predictedBand) against the student's TARGET band and returns a clear go / hold
 * verdict with the gap — so nobody books the real, expensive exam too early (or sits on a ready score).
 *
 * Pure + tested; carries no official claim (predicted bands already carry the standing estimate
 * disclaimer in the UI). A small margin is required above target so a one-off lucky attempt doesn't read
 * as "ready".
 */

export type ReadinessVerdict = "ready" | "almost" | "keep_practising" | "no_target" | "insufficient";

export interface Readiness {
  verdict: ReadinessVerdict;
  /** target − predicted, when both are known (positive = short of target). */
  gap: number | null;
  headline: string;
  detail: string;
}

/**
 * @param predicted rolling predicted band (undefined until ≥1 attempt)
 * @param confidence prediction confidence ("low" = too few attempts to trust a "ready")
 * @param target the student's target band (NaN/≤0 = not set)
 * @param bandLabel e.g. "Band" / "Score" / "TDN"
 */
export function bookingReadiness(
  predicted: number | undefined,
  confidence: "low" | "medium" | "high",
  target: number,
  bandLabel = "Band",
): Readiness {
  if (!Number.isFinite(target) || target <= 0) {
    return {
      verdict: "no_target",
      gap: null,
      headline: "Set a target to get a booking gate",
      detail: "Enter the target your programmes ask for and we'll tell you when your practice scores are consistently there.",
    };
  }
  if (predicted == null) {
    return {
      verdict: "insufficient",
      gap: null,
      headline: "Take a few timed mocks first",
      detail: "We need real attempts to project a band before advising whether to book.",
    };
  }

  const gap = Math.round((target - predicted) * 2) / 2;

  // Low confidence (1–2 attempts) can't justify a "ready" verdict even if a single score cleared target.
  if (confidence === "low" && gap <= 0) {
    return {
      verdict: "almost",
      gap,
      headline: "Promising — but do more mocks before booking",
      detail: `Your projection is at or above ${bandLabel} ${target}, but it's based on too few attempts to trust. Take 2–3 more timed mocks; if you stay there, book it.`,
    };
  }

  if (gap <= -0.5) {
    return {
      verdict: "ready",
      gap,
      headline: "Ready to book",
      detail: `Your projected ${bandLabel} (${predicted}) is consistently above your ${target} target. Book the real exam while you're sharp — and check the test-centre dates.`,
    };
  }
  if (gap <= 0) {
    return {
      verdict: "almost",
      gap,
      headline: "Right at your target — borderline",
      detail: `You're projecting ${bandLabel} ${predicted} against a ${target} target. That's cutting it fine; aim to sit half a band clear before booking so a bad day doesn't sink you.`,
    };
  }
  if (gap <= 1) {
    return {
      verdict: "keep_practising",
      gap,
      headline: `Not yet — about ${gap} band${gap === 1 ? "" : "s"} short`,
      detail: `Projected ${bandLabel} ${predicted}, target ${target}. Keep drilling your weakest question types; re-check the gate after your next mock.`,
    };
  }
  return {
    verdict: "keep_practising",
    gap,
    headline: `Hold off — ${gap} bands short of target`,
    detail: `Projected ${bandLabel} ${predicted} is well below your ${target} target. Booking now risks paying for a sitting you're not ready for.`,
  };
}
