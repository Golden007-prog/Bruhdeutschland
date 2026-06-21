import { describe, expect, it } from "vitest";

import { emptyOffer, normalizeOffer, type Offer } from "./offers";
import { offerDeadlineRows } from "./useOfferDeadlineSync";

function make(p: Partial<Offer>): Offer {
  return normalizeOffer({ ...emptyOffer(p.id ?? "o1"), ...p });
}

/**
 * The write-only offer → `deadlines` table feed (G5-01/06). Rows must be stable (idempotent across
 * renders) and carry uuid PKs derived from the offer id + which date, so re-running the sync upserts in
 * place rather than duplicating.
 */
describe("offerDeadlineRows", () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it("derives stable uuid rows for accept-by and deposit dates, owned + categorised", () => {
    const offers = [make({ id: "a", programme: "DS", acceptBy: "2026-08-01", depositBy: "2026-07-15" })];
    const rows = offerDeadlineRows(offers, "user-1");
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.user_id).toBe("user-1");
      expect(r.category).toBe("visa");
      expect(String(r.id)).toMatch(UUID_RE);
    }
    // Idempotent: same input → same row ids.
    expect(offerDeadlineRows(offers, "user-1").map((r) => r.id)).toEqual(rows.map((r) => r.id));
  });

  it("scopes row ids per user so two users' offers don't collide", () => {
    const offers = [make({ id: "a", acceptBy: "2026-08-01" })];
    const a = offerDeadlineRows(offers, "user-1")[0].id;
    const b = offerDeadlineRows(offers, "user-2")[0].id;
    expect(a).not.toBe(b);
  });

  it("omits offers with no dates", () => {
    expect(offerDeadlineRows([make({ id: "a" })], "user-1")).toEqual([]);
  });
});
