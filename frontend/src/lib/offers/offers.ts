/**
 * Shared shape for admission offers the student enters (gap analysis G25/G26/G28). One store
 * (`offers:list`, per-user scoped) backs the admission-letter interpreter, the offer-comparison board,
 * and the seat-acceptance deadline tracker, so an offer entered once appears in all three.
 */
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
}

/** The localStorage key (scoped per user by the persistence layer). */
export const OFFERS_KEY = "offers:list";

export function emptyOffer(id: string): Offer {
  return { id, programme: "", university: "", city: "", language: "EN", tuitionPerSem: 0, acceptBy: "", conditional: false, notes: "" };
}
