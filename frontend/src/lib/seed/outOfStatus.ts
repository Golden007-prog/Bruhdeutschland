import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Permit-loss / out-of-status & exmatrikulation RECOVERY — gap G9-03.
 *
 * Grounding (CLAUDE.md §2/§3): grace periods, whether a Fiktionsbescheinigung applies, and re-entry
 * rules are official and case-specific — so every recovery route is `needsVerification` and cited to
 * the Ausländerbehörde / BAMF. No grace period or deadline is asserted as fact. The Fiktions­bescheinigung
 * concept is reused from the residence-permit page (which already grounds it).
 *
 * Verified 2026-06-21: routes cited to BAMF (Ausländerbehörde / residence) and the residence-permit
 * source already in the registry.
 */

export interface RecoveryRoute {
  id: string;
  /** The failure the user has already hit. */
  situation: string;
  /** The concrete recovery steps. */
  steps: string[];
  needsVerification: boolean;
  source?: Source;
  href?: string;
}

export const RECOVERY_ROUTES: RecoveryRoute[] = [
  {
    id: "rec-midprocess",
    situation: "My permit expired but my renewal application is already in",
    steps: [
      "If you applied to renew BEFORE your permit expired, the Ausländerbehörde usually issues a Fiktionsbescheinigung — a provisional document that keeps your stay lawful while they decide.",
      "Carry it like a permit; it lets you stay (and often work, as your old permit did) until the decision.",
      "If you only realised after expiry, contact the Ausländerbehörde immediately and ask in writing what bridges your status — do not just wait.",
    ],
    needsVerification: true,
    source: source("residencePermit"),
    href: "/arrival/residence-permit",
  },
  {
    id: "rec-exmatrik",
    situation: "I was exmatrikuliert for a missed Rückmeldung",
    steps: [
      "Contact the Studierendensekretariat at once — a late Rückmeldung can often be fixed by paying the contribution plus any late fee within a short remedy window.",
      "If re-registration isn't possible, ask about re-enrolment or applying again for the next semester; your study place may be recoverable.",
      "Tell the Ausländerbehörde: a student residence permit depends on enrolment, so losing your place can put your permit at risk — get ahead of it rather than waiting for a letter.",
    ],
    needsVerification: true,
    source: source("auslaenderbehoerde"),
    href: "/arrival/university-onboarding",
  },
  {
    id: "rec-refused",
    situation: "My renewal was refused, or my permit has fully lapsed (out of status)",
    steps: [
      "Read the decision for its reasons and any deadline to object (Widerspruch) or appeal — these are stated on the notice and are time-limited.",
      "Get qualified help fast: the Ausländerbehörde, a migration advice service (Migrationsberatung), or an immigration lawyer. Being out of status is serious but often recoverable if you act immediately.",
      "Depending on the case, the route may be to fix the underlying condition (enrolment, finances, insurance) and re-apply, or to leave in an orderly way and re-enter — clarify which before the situation hardens.",
    ],
    needsVerification: true,
    source: source("bamf"),
  },
];

export const OUT_OF_STATUS_SOURCES: Source[] = [
  source("residencePermit"),
  source("auslaenderbehoerde"),
  source("bamf"),
];
