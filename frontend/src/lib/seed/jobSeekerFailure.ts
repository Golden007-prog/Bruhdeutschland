import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Job-seeker permit "no qualified job within 18 months" failure path — gap G9-01.
 *
 * Grounding (CLAUDE.md §2/§3): the 18-month post-study permit is NON-extendable, and the precise
 * conditions for each fallback (Opportunity Card points, re-entry rules, switching to study) are
 * official and change — so each option is flagged `needsVerification` and cited. No grace period,
 * fee, or processing time is asserted as fact.
 *
 * Verified 2026-06-21 against make-it-in-germany (Opportunity Card / job search) and BAMF
 * (graduate routes). Key fact carried in prose: the permit cannot be extended once it lapses
 * without a qualifying job — the holder must change status or leave.
 */

/** Make it in Germany — the Opportunity Card (Chancenkarte) job-search route. */
export const SOURCE_OPPORTUNITY_CARD: Source = {
  name: "Make it in Germany — Opportunity Card (Chancenkarte)",
  url: "https://www.make-it-in-germany.com/en/visa-residence/opportunity-card/job-search",
};

/** BAMF — routes for international university graduates. */
export const SOURCE_BAMF_GRADUATE: Source = {
  name: "BAMF — To Germany as a graduate",
  url: "https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/Arbeit/Hochschulabsolvent/hochschulabsolvent-node.html",
};

export interface JobSeekerFallback {
  id: string;
  title: string;
  /** When this option fits. */
  when: string;
  /** Whether it's an in-country switch or requires leaving Germany. */
  location: "in_germany" | "from_abroad";
  steps: string[];
  needsVerification: boolean;
  source?: Source;
  href?: string;
}

/**
 * The honest options when the 18-month window runs out WITHOUT a qualifying job. The permit itself
 * cannot be extended, so every route here is a CHANGE of status (or a re-entry), not a stretch of
 * the existing one.
 */
export const JOBSEEKER_FALLBACKS: JobSeekerFallback[] = [
  {
    id: "jf-study",
    title: "Switch back to a study / further-qualification permit",
    when: "If you can enrol in another degree or a recognised further qualification before the window closes.",
    location: "in_germany",
    steps: [
      "Secure admission to a further programme (a second Master's, a doctorate, or recognised further training).",
      "Apply to the Ausländerbehörde to switch from the job-seeker permit to a study permit before the current one expires.",
      "This keeps you in Germany legally and resets your search runway after the new programme — but it is study, not work.",
    ],
    needsVerification: true,
    source: SOURCE_BAMF_GRADUATE,
    href: "/profile/pathway",
  },
  {
    id: "jf-bridge",
    title: "Take a qualified role you can convert later",
    when: "If you have an offer that is qualified work (matching your degree) — even if it isn't your dream role.",
    location: "in_germany",
    steps: [
      "Any offer of qualified employment lets you switch to a work permit or EU Blue Card — it does not have to be the perfect job.",
      "Check it against the Blue Card salary threshold; the lower threshold covers recent graduates and shortage occupations.",
      "If the blocker is a regulated profession (you can't yet practise), recognition — not the job market — is what's gating you.",
    ],
    needsVerification: true,
    source: source("blueCard"),
    href: "/arrival/blue-card-check",
  },
  {
    id: "jf-opportunity",
    title: "Re-enter on the Opportunity Card (Chancenkarte)",
    when: "If the window will close before you land a role and you can plan a clean re-entry.",
    location: "from_abroad",
    steps: [
      "The Opportunity Card is a points-based job-search residence permit; as a graduate of a German university you generally qualify as a skilled worker.",
      "You apply for it from your home country — so plan the timing before you fall out of status, not after.",
      "It gives a fresh job-search period to convert once you have an offer. Confirm the current eligibility and duration before relying on it.",
    ],
    needsVerification: true,
    source: SOURCE_OPPORTUNITY_CARD,
  },
  {
    id: "jf-leave",
    title: "Leave on time and re-apply when you have an offer",
    when: "If none of the above lands before the deadline — the cleanest way to protect your record.",
    location: "from_abroad",
    steps: [
      "The 18-month permit cannot be extended; staying past it puts you out of status, which harms future applications.",
      "Leave before it expires, keep job-hunting remotely, and apply for a work visa / EU Blue Card from abroad once you have a qualifying offer.",
      "Leaving in status is far better than overstaying — it keeps the door open for a later return.",
    ],
    needsVerification: true,
    source: SOURCE_BAMF_GRADUATE,
  },
];

export const JOBSEEKER_FAILURE_SOURCES: Source[] = [
  SOURCE_OPPORTUNITY_CARD,
  SOURCE_BAMF_GRADUATE,
  source("makeItInGermany"),
];
