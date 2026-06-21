import { describe, it, expect } from "vitest";
import { KURSE, type KursCode } from "@/lib/pathway/kurs";
import {
  SEED_STUDIENKOLLEGS,
  filterStudienkollegs,
  studienkollegBundeslaender,
} from "./studienkollegs";

describe("SEED_STUDIENKOLLEGS grounding invariants", () => {
  it("has a meaningful directory of state colleges", () => {
    expect(SEED_STUDIENKOLLEGS.length).toBeGreaterThanOrEqual(12);
  });

  it("every entry is provenance-stamped + needsVerification (CLAUDE.md golden rule #2)", () => {
    for (const sk of SEED_STUDIENKOLLEGS) {
      expect(sk.needsVerification).toBe(true);
      expect(sk.source).toBeTruthy();
      expect(sk.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(sk.officialUrl).toMatch(/^https:\/\//);
      expect(sk.name).toBeTruthy();
      expect(sk.partnerUniversity).toBeTruthy();
      expect(sk.city).toBeTruthy();
      expect(sk.bundesland).toBeTruthy();
    }
  });

  it("uses only valid university Kurs codes (FH-scheme colleges leave kurse empty)", () => {
    const valid = new Set(Object.keys(KURSE) as KursCode[]);
    for (const sk of SEED_STUDIENKOLLEGS) {
      for (const k of sk.kurse) expect(valid.has(k)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = SEED_STUDIENKOLLEGS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("filterStudienkollegs", () => {
  it("filters by Bundesland", () => {
    const bl = SEED_STUDIENKOLLEGS[0].bundesland;
    const out = filterStudienkollegs(SEED_STUDIENKOLLEGS, { bundesland: bl });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((s) => s.bundesland === bl)).toBe(true);
  });

  it("filters by Kurs but keeps colleges whose streams are unverified ([])", () => {
    const out = filterStudienkollegs(SEED_STUDIENKOLLEGS, { kurs: "M" });
    expect(out.every((s) => s.kurse.length === 0 || s.kurse.includes("M"))).toBe(true);
  });

  it("filters by type", () => {
    const out = filterStudienkollegs(SEED_STUDIENKOLLEGS, { type: "fh" });
    expect(out.every((s) => s.type === "fh")).toBe(true);
  });

  it("studienkollegBundeslaender returns sorted unique names", () => {
    const bl = studienkollegBundeslaender();
    expect(bl).toEqual([...bl].sort());
    expect(new Set(bl).size).toBe(bl.length);
  });
});
