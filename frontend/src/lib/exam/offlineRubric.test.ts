import { describe, expect, it } from "vitest";

import { buildOfflineRubric, wordCount } from "./offlineRubric";

describe("wordCount", () => {
  it("counts whitespace-separated words and treats empty/blank as 0", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("   ")).toBe(0);
    expect(wordCount("one two   three\nfour")).toBe(4);
  });
});

describe("buildOfflineRubric", () => {
  it("returns the IELTS writing descriptor family with grounding and a checklist", () => {
    const r = buildOfflineRubric("ielts", "writing", "A short essay about libraries.", 250);
    expect(r.criteria.length).toBeGreaterThanOrEqual(3);
    expect(r.criteria[0].descriptor).toBeTruthy();
    expect(r.source_url).toContain("ielts.org");
    expect(r.checklist.length).toBeGreaterThan(0);
  });

  it("flags an under-length response without inventing a score", () => {
    const r = buildOfflineRubric("ielts", "writing", "Too short.", 250);
    expect(r.belowTarget).toBe(true);
    expect(r.lengthNote).toContain("below the target");
    // No band/score is asserted anywhere on the rubric object.
    expect(JSON.stringify(r)).not.toMatch(/\bband\s*\d/i);
  });

  it("does not flag an empty response as below-target and prompts the student to write", () => {
    const r = buildOfflineRubric("ielts", "writing", "", 250);
    expect(r.belowTarget).toBe(false);
    expect(r.lengthNote).toContain("No response captured");
  });

  it("uses speaking-specific self-checks for the speaking skill", () => {
    const r = buildOfflineRubric("ielts", "speaking", "I talked about my hometown for a minute.");
    expect(r.checklist.join(" ")).toMatch(/pace|speak/i);
  });

  it("falls back to a generic rubric for an unknown exam", () => {
    const r = buildOfflineRubric("testas", "writing", "Some text", 100);
    expect(r.criteria.length).toBeGreaterThanOrEqual(3);
  });
});
