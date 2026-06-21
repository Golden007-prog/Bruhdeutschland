import { describe, expect, it } from "vitest";

import { findDates, readLetter } from "./admissionLetter";

describe("findDates", () => {
  it("parses German day-first dd.mm.yyyy", () => {
    expect(findDates("Frist: 15.07.2026.")[0].iso).toBe("2026-07-15");
  });
  it("parses ISO yyyy-mm-dd", () => {
    expect(findDates("by 2026-09-30 at the latest")[0].iso).toBe("2026-09-30");
  });
  it("parses '15. Juli 2026' and 'July 15, 2026'", () => {
    expect(findDates("bis zum 15. Juli 2026")[0].iso).toBe("2026-07-15");
    expect(findDates("by July 15, 2026")[0].iso).toBe("2026-07-15");
  });
  it("ignores impossible dates", () => {
    expect(findDates("45.99.2026")).toHaveLength(0);
  });
});

describe("readLetter", () => {
  it("returns empty + confidence none for blank input", () => {
    const r = readLetter("   ");
    expect(r.confidence).toBe("none");
    expect(r.enrolmentDeadline).toBe("");
  });

  it("extracts the deadline next to an enrolment cue with high confidence", () => {
    const text =
      "Zulassungsbescheid der Technische Universität München. " +
      "Bitte schreiben Sie sich bis zur Immatrikulationsfrist 30.09.2026 ein. " +
      "Ihr Studium beginnt am 01.10.2026.";
    const r = readLetter(text);
    expect(r.enrolmentDeadline).toBe("2026-09-30");
    expect(r.confidence).toBe("high");
    expect(r.university).toContain("Technische Universität München");
    expect(r.rejection).toBe(false);
  });

  it("flags a conditional admission and pulls the condition sentence", () => {
    const text =
      "Wir bieten Ihnen eine bedingte Zulassung an. " +
      "Sie müssen das Abschlusszeugnis bis 31.08.2026 nachreichen.";
    const r = readLetter(text);
    expect(r.conditional).toBe(true);
    expect(r.conditions.length).toBeGreaterThan(0);
    expect(r.conditions.some((c) => /nachreichen/i.test(c))).toBe(true);
  });

  it("detects a rejection", () => {
    const r = readLetter("Ablehnungsbescheid. Leider können wir Ihnen keinen Studienplatz anbieten.");
    expect(r.rejection).toBe(true);
  });

  it("falls back to the latest date with low confidence when no cue is present", () => {
    const r = readLetter("Some letter mentioning 01.03.2026 and also 12.05.2026 without a deadline word.");
    expect(r.enrolmentDeadline).toBe("2026-05-12");
    expect(r.confidence).toBe("low");
  });

  it("is unconditional when no condition language appears", () => {
    const r = readLetter("Herzlichen Glückwunsch! Sie sind unbedingt zugelassen. Frist: 30.09.2026.");
    expect(r.conditional).toBe(false);
  });
});
