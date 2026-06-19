import { describe, expect, it } from "vitest";

import { evaluatePathway, type PathwayInput } from "./pathway";

const input = (p: Partial<PathwayInput>): PathwayInput => ({
  country: "India",
  highestQualification: "class12",
  targetLevel: "bachelor",
  targetSubject: "Computer Science",
  ...p,
});

describe("evaluatePathway", () => {
  it("BLOCKS a Class-10 school-leaver honestly (no Studienkolleg either)", () => {
    const r = evaluatePathway(input({ highestQualification: "class10" }));
    expect(r.route).toBe("blocked");
    expect(r.title).toMatch(/Class 12/i);
  });

  it("routes India Class-12 Bachelor to Studienkolleg by default, with the WS2026/27 flag", () => {
    const r = evaluatePathway(input({ country: "India", highestQualification: "class12", targetLevel: "bachelor" }));
    expect(r.route).toBe("studienkolleg");
    expect(r.kurs?.code).toBe("T"); // CS → T-Kurs
    expect(r.notes.some((n) => /70%/.test(n.detail))).toBe(true);
    expect(r.needsVerification).toBe(true);
  });

  it("routes Bangladesh Class-12 Bachelor to Studienkolleg too", () => {
    const r = evaluatePathway(input({ country: "Bangladesh", targetLevel: "bachelor", targetSubject: "Business" }));
    expect(r.route).toBe("studienkolleg");
    expect(r.kurs?.code).toBe("W"); // business → W-Kurs
  });

  it("offers a direct-Bachelor carve-out for ~1 year of Indian university study", () => {
    const r = evaluatePathway(input({ country: "India", highestQualification: "some_bachelor", targetLevel: "bachelor" }));
    expect(r.route).toBe("direct_bachelor");
  });

  it("routes Medicine to the Humanmedizin pathway with the terminology reset + M-Kurs", () => {
    const r = evaluatePathway(input({ targetLevel: "medicine", targetSubject: "Medicine" }));
    expect(r.route).toBe("medicine");
    expect(r.title).toMatch(/Humanmedizin/);
    expect(r.title).toMatch(/no .*MBBS/i);
    expect(r.kurs?.code).toBe("M");
    expect(r.notes.some((n) => /German-taught|German only/i.test(n.label + n.detail))).toBe(true);
    expect(r.notes.some((n) => /Numerus Clausus|NC/i.test(n.label + n.detail))).toBe(true);
  });

  it("keeps the Master's flow for a Bachelor-holder", () => {
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "master" }));
    expect(r.route).toBe("master");
  });

  it("nudges a degree-holder away from a German Bachelor", () => {
    const r = evaluatePathway(input({ highestQualification: "bachelor", targetLevel: "bachelor" }));
    expect(r.route).toBe("master");
    expect(r.title).toMatch(/already hold a degree/i);
  });
});
