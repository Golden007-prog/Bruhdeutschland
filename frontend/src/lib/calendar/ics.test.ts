import { describe, expect, it } from "vitest";

import { buildIcs, escapeIcsText, nextDayIcsDate, toIcsDate, toIcsStamp } from "./ics";

describe("ics helpers", () => {
  it("escapes RFC-5545 special chars", () => {
    expect(escapeIcsText("M.Sc, CS; A\\B")).toBe("M.Sc\\, CS\\; A\\\\B");
    expect(escapeIcsText("line1\nline2")).toBe("line1\\nline2");
  });
  it("formats DATE and exclusive next-day end across month/year roll", () => {
    expect(toIcsDate("2026-07-15")).toBe("20260715");
    expect(nextDayIcsDate("2026-12-31")).toBe("20270101");
    expect(toIcsDate("nope")).toBe("");
  });
  it("formats a UTC DTSTAMP", () => {
    expect(toIcsStamp(new Date(Date.UTC(2026, 5, 20, 9, 5, 3)))).toBe("20260620T090503Z");
  });
});

describe("buildIcs", () => {
  const stamp = "20260620T090503Z";
  const out = buildIcs([{ date: "2026-07-15", label: "Accept seat: M.Sc, CS" }], stamp);

  it("includes a DTSTAMP in every VEVENT (qa COR-6)", () => {
    expect(out).toContain(`DTSTAMP:${stamp}`);
  });
  it("escapes the SUMMARY (qa SEC-4)", () => {
    expect(out).toContain("SUMMARY:Accept seat: M.Sc\\, CS");
  });
  it("emits a well-formed all-day VEVENT", () => {
    expect(out).toContain("BEGIN:VEVENT");
    expect(out).toContain("DTSTART;VALUE=DATE:20260715");
    expect(out).toContain("DTEND;VALUE=DATE:20260716");
    expect(out.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(out.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
  it("skips undated entries", () => {
    expect(buildIcs([{ date: "", label: "x" }], stamp)).not.toContain("BEGIN:VEVENT");
  });
});
