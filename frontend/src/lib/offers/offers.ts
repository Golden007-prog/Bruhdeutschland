/**
 * Shared shape for admission offers the student enters (gap analysis G25/G26/G28). One store
 * (`offers:list`, per-user scoped) backs the admission-letter interpreter, the offer-comparison board,
 * and the seat-acceptance deadline tracker, so an offer entered once appears in all three.
 *
 * The spine (G5-03/04/05): an offer can be linked to a tracker application (`appId`, the shared
 * programme identity), carries an accept/decline workflow status, an optional separate deposit /
 * enrolment-fee deadline, and a list of conditions to clear — so "apply → admit → accept → enrol" is one
 * continuous thread instead of a re-entered island.
 */

/** Where an offer is in the accept/decline workflow. Defaults to "received". */
export type OfferStatus = "received" | "accepted" | "declined";

/** A condition attached to a conditional offer (e.g. "final transcript"), with a met/clear toggle. */
export interface OfferCondition {
  id: string;
  text: string;
  met: boolean;
}

export interface Offer {
  id: string;
  programme: string;
  university: string;
  city: string;
  /** "EN" | "DE" | free text. */
  language: string;
  /** Tuition per semester in euros (0 / empty = none). */
  tuitionPerSem: number;
  /** "YYYY-MM-DD" seat-acceptance / enrolment deadline. */
  acceptBy: string;
  /** True when the offer is conditional (e.g. pending final transcript). */
  conditional: boolean;
  notes: string;
  /** Accept/decline workflow state (G5-03). */
  status: OfferStatus;
  /** Optional link to a tracker application id (`tracker:apps`) — the shared programme identity (G5-04). */
  appId?: string;
  /** Optional "YYYY-MM-DD" deposit / enrolment-fee deadline, separate from (often before) acceptBy. */
  depositBy?: string;
  /** Conditions to clear before the place is unconditional (G5-03). */
  conditions: OfferCondition[];
}

/** The localStorage key (scoped per user by the persistence layer). */
export const OFFERS_KEY = "offers:list";

export function emptyOffer(id: string): Offer {
  return {
    id,
    programme: "",
    university: "",
    city: "",
    language: "EN",
    tuitionPerSem: 0,
    acceptBy: "",
    conditional: false,
    notes: "",
    status: "received",
    appId: undefined,
    depositBy: undefined,
    conditions: [],
  };
}

/**
 * Normalize an offer that may have been persisted before the schema extension (G5-03/04/05). Older blobs
 * lack `status`/`conditions`/etc., so we backfill safe defaults — keeps the comparison board, seat
 * tracker, and deadline feed from reading `undefined` on a returning user's stored offers.
 */
export function normalizeOffer(o: Offer): Offer {
  return {
    ...emptyOffer(o.id),
    ...o,
    status: o.status ?? "received",
    conditions: Array.isArray(o.conditions) ? o.conditions : [],
  };
}
