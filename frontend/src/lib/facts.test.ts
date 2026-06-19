import { describe, expect, it } from "vitest";

import {
  ANMELDUNG_DAYS,
  ANMELDUNG_WINDOW,
  APS_REQUIRED_COUNTRIES,
  FACTS_RETRIEVED_AT,
  WORK_LIMIT,
  WORK_LIMIT_DAYS,
} from "./facts";

/**
 * Grounding-drift guard (page-audit §3.4): official figures shown in prose must derive from the
 * structured constants so a page literal can never diverge from the cited source.
 */
describe("grounding constants are the single source of truth", () => {
  it("WORK_LIMIT value reflects WORK_LIMIT_DAYS", () => {
    expect(WORK_LIMIT.value).toContain(String(WORK_LIMIT_DAYS.full));
    expect(WORK_LIMIT.value).toContain(String(WORK_LIMIT_DAYS.half));
  });

  it("ANMELDUNG_WINDOW value reflects ANMELDUNG_DAYS", () => {
    expect(ANMELDUNG_WINDOW.value).toContain(String(ANMELDUNG_DAYS));
  });

  it("India is first in the APS-required list (India-primary)", () => {
    expect(APS_REQUIRED_COUNTRIES[0]).toBe("India");
    expect(APS_REQUIRED_COUNTRIES).toContain("China");
    expect(APS_REQUIRED_COUNTRIES).toContain("Vietnam");
  });

  it("exposes a seed retrieval date for the re-verify affordance", () => {
    expect(FACTS_RETRIEVED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
