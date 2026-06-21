import { describe, expect, it } from "vitest";

import {
  activeNeeds,
  deriveRequirementNeeds,
  programmeTargets,
  type OfferLike,
  type TrackerApp,
} from "./programmes";

const app = (id: string, program: string, university: string): TrackerApp => ({ id, program, university });
const offer = (id: string, programme: string, university: string): OfferLike => ({ id, programme, university });

describe("programmeTargets", () => {
  it("prefixes ids by origin so app and offer ids never collide", () => {
    const t = programmeTargets([app("1", "MSc CS", "TUM")], [offer("1", "MSc DE", "RWTH")]);
    expect(t.map((x) => x.key)).toEqual(["app:1", "offer:1"]);
    expect(t[0].origin).toBe("app");
    expect(t[1].origin).toBe("offer");
  });

  it("collapses an offer that duplicates an application (same programme+university)", () => {
    const t = programmeTargets(
      [app("a1", "MSc Data Engineering", "TU München")],
      [offer("o1", "msc data engineering", "tu münchen")], // same, different case
    );
    expect(t).toHaveLength(1);
    expect(t[0].origin).toBe("app");
  });

  it("keeps an offer that names a different programme", () => {
    const t = programmeTargets([app("a1", "MSc CS", "TUM")], [offer("o1", "MSc Robotics", "TUM")]);
    expect(t).toHaveLength(2);
  });

  it("builds a readable label and falls back when fields are empty", () => {
    const t = programmeTargets([app("a1", "MSc CS", "TUM"), app("a2", "", "")], []);
    expect(t[0].label).toBe("MSc CS — TUM");
    expect(t[1].label).toBe("Untitled programme");
  });

  it("does not dedupe two blank apps against each other", () => {
    const t = programmeTargets([app("a1", "", ""), app("a2", "", "")], []);
    expect(t).toHaveLength(2);
  });
});

describe("deriveRequirementNeeds — text signals", () => {
  it("detects a certified-translation requirement", () => {
    const needs = deriveRequirementNeeds("Please provide a certified translation of your degree.", "India");
    expect(needs.find((n) => n.id === "translation")?.needed).toBe(true);
  });

  it("detects VPD and admission-test and language mentions", () => {
    const needs = deriveRequirementNeeds("A VPD is required. TestAS recommended. IELTS 6.5.", "India");
    expect(needs.find((n) => n.id === "vpd")?.needed).toBe(true);
    expect(needs.find((n) => n.id === "test")?.needed).toBe(true);
    expect(needs.find((n) => n.id === "language")?.needed).toBe(true);
  });

  it("leaves an un-mentioned need UNKNOWN, never asserts not-required", () => {
    const needs = deriveRequirementNeeds("Bachelor degree in a related field.", "India");
    expect(needs.find((n) => n.id === "translation")?.needed).toBeUndefined();
  });
});

describe("deriveRequirementNeeds — APS is country-gated, not text-driven", () => {
  it("India → APS needed (grounded, with source)", () => {
    const aps = deriveRequirementNeeds("", "India").find((n) => n.id === "aps")!;
    expect(aps.needed).toBe(true);
    expect(aps.source).toBeDefined();
  });

  it("Bangladesh → APS explicitly NOT needed (no-APS persona)", () => {
    const aps = deriveRequirementNeeds("", "Bangladesh").find((n) => n.id === "aps")!;
    expect(aps.needed).toBe(false);
  });

  it("unknown country → APS unknown + needsVerification", () => {
    const aps = deriveRequirementNeeds("", "Atlantis").find((n) => n.id === "aps")!;
    expect(aps.needed).toBeUndefined();
    expect(aps.needsVerification).toBe(true);
  });
});

describe("activeNeeds", () => {
  it("returns only positively-detected needs", () => {
    const needs = deriveRequirementNeeds("certified translation; VPD required", "Bangladesh");
    const active = activeNeeds(needs);
    expect(active.map((n) => n.id).sort()).toEqual(["translation", "vpd"]);
  });
});
