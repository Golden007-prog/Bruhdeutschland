/**
 * Deterministic offer → deadline / spine helpers (gap G5-01/03/04/05/06, CLAUDE.md golden rule 4).
 * Pure functions so the offer dates the student enters can flow into the central deadline list and the
 * `.ics` export with the SAME deterministic arithmetic the rest of the app uses — no model, no dates
 * invented here (every date comes from the user's own offer).
 */

import type { Offer } from "./offers";

/** A central-deadline event derived from an offer (shape matches the reminders/.ics + calendar feeds). */
export interface OfferDeadline {
  /** Stable id, derived from the offer id + which date it is (so it's idempotent across renders). */
  id: string;
  label: string;
  /** "YYYY-MM-DD". */
  date: string;
}

/** A short human label for an offer (programme → university → city → "offer"). Never empty. */
export function offerLabel(o: Offer): string {
  return o.programme || o.university || o.city || "offer";
}

/**
 * Every dated commitment an offer carries: the seat-acceptance deadline and, separately, any deposit /
 * enrolment-fee deadline (often sooner). Dateless commitments are omitted — callers that need to surface
 * "this offer has no date yet" use the raw offer, not this list.
 */
export function offerDeadlines(offers: Offer[]): OfferDeadline[] {
  const out: OfferDeadline[] = [];
  for (const o of offers) {
    const name = offerLabel(o);
    if (o.acceptBy) out.push({ id: `${o.id}:acceptBy`, label: `Accept seat: ${name}`, date: o.acceptBy });
    if (o.depositBy) out.push({ id: `${o.id}:depositBy`, label: `Pay deposit: ${name}`, date: o.depositBy });
  }
  return out;
}

/** Conditions still open on an offer (not yet met). */
export function openConditions(o: Offer): number {
  return o.conditions.filter((c) => !c.met).length;
}

/** True when the offer is conditional AND still has unmet conditions — i.e. not yet a clean place. */
export function hasUnmetConditions(o: Offer): boolean {
  return o.conditional && openConditions(o) > 0;
}

/** The single accepted offer, if exactly one is accepted (what enrolment scopes to). */
export function acceptedOffer(offers: Offer[]): Offer | undefined {
  const accepted = offers.filter((o) => o.status === "accepted");
  return accepted.length === 1 ? accepted[0] : undefined;
}

/**
 * Accepting one offer means declining the others you were comparing (you can only enrol in one). Returns
 * the next offer list with `id` accepted and every OTHER currently-received offer auto-declined; offers
 * already explicitly declined stay declined. Pure — the caller persists the result.
 */
export function acceptOffer(offers: Offer[], id: string): Offer[] {
  return offers.map((o) => {
    if (o.id === id) return { ...o, status: "accepted" as const };
    if (o.status === "received") return { ...o, status: "declined" as const };
    return o;
  });
}
