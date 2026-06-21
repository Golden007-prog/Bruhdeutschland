import { describe, expect, it } from "vitest";

import { emptyOffer, normalizeOffer, type Offer } from "./offers";
import {
  acceptedOffer,
  acceptOffer,
  hasUnmetConditions,
  offerDeadlines,
  offerLabel,
  openConditions,
} from "./offerDeadlines";

function make(p: Partial<Offer>): Offer {
  return normalizeOffer({ ...emptyOffer(p.id ?? "o1"), ...p });
}

describe("offerLabel", () => {
  it("prefers programme, then university, then city, never empty", () => {
    expect(offerLabel(make({ programme: "M.Sc. DS", university: "TUM" }))).toBe("M.Sc. DS");
    expect(offerLabel(make({ programme: "", university: "TUM" }))).toBe("TUM");
    expect(offerLabel(make({ programme: "", university: "", city: "Munich" }))).toBe("Munich");
    expect(offerLabel(make({ programme: "", university: "", city: "" }))).toBe("offer");
  });
});

describe("offerDeadlines", () => {
  it("emits acceptBy and depositBy events, omitting dateless ones", () => {
    const offers = [
      make({ id: "a", programme: "DS", acceptBy: "2026-08-01", depositBy: "2026-07-15" }),
      make({ id: "b", programme: "CS" }), // no dates → no events
    ];
    const events = offerDeadlines(offers);
    expect(events.map((e) => e.id).sort()).toEqual(["a:acceptBy", "a:depositBy"]);
    expect(events.find((e) => e.id === "a:acceptBy")?.date).toBe("2026-08-01");
    expect(events.find((e) => e.id === "a:depositBy")?.label).toContain("Pay deposit");
  });
});

describe("conditions", () => {
  it("counts only unmet conditions and gates 'unmet' on the offer being conditional", () => {
    const o = make({
      conditional: true,
      conditions: [
        { id: "c1", text: "transcript", met: false },
        { id: "c2", text: "language", met: true },
      ],
    });
    expect(openConditions(o)).toBe(1);
    expect(hasUnmetConditions(o)).toBe(true);

    // A non-conditional offer with leftover condition rows is not "unmet".
    expect(hasUnmetConditions(make({ conditional: false, conditions: [{ id: "c1", text: "x", met: false }] }))).toBe(false);
  });
});

describe("acceptOffer", () => {
  it("accepts the chosen offer and auto-declines the other received offers", () => {
    const offers = [make({ id: "a" }), make({ id: "b" }), make({ id: "c" })];
    const next = acceptOffer(offers, "b");
    expect(next.find((o) => o.id === "b")?.status).toBe("accepted");
    expect(next.find((o) => o.id === "a")?.status).toBe("declined");
    expect(next.find((o) => o.id === "c")?.status).toBe("declined");
  });

  it("leaves an already-declined offer declined (doesn't resurrect it)", () => {
    const offers = [make({ id: "a", status: "declined" }), make({ id: "b" })];
    const next = acceptOffer(offers, "b");
    expect(next.find((o) => o.id === "a")?.status).toBe("declined");
    expect(next.find((o) => o.id === "b")?.status).toBe("accepted");
  });
});

describe("acceptedOffer", () => {
  it("returns the single accepted offer, or undefined when none or many are accepted", () => {
    expect(acceptedOffer([make({ id: "a", status: "accepted" }), make({ id: "b" })])?.id).toBe("a");
    expect(acceptedOffer([make({ id: "a" }), make({ id: "b" })])).toBeUndefined();
    expect(
      acceptedOffer([make({ id: "a", status: "accepted" }), make({ id: "b", status: "accepted" })]),
    ).toBeUndefined();
  });
});

describe("normalizeOffer", () => {
  it("backfills defaults on a pre-schema-extension offer", () => {
    // Simulate an old stored blob lacking status/conditions.
    const legacy = { id: "old", programme: "DS", university: "TUM", city: "", language: "EN", tuitionPerSem: 0, acceptBy: "", conditional: false, notes: "" } as unknown as Offer;
    const o = normalizeOffer(legacy);
    expect(o.status).toBe("received");
    expect(o.conditions).toEqual([]);
  });
});
