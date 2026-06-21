import type { Source } from "@/lib/types";

/**
 * Emergency / health / community support directory — gap G8-05.
 *
 * Grounding (CLAUDE.md §2/§3): Germany's emergency numbers are STABLE, low-volatility facts
 * (112 / 110 / 116117) — these are grounded (`needsVerification: false`) and cited to official
 * sources. Everything that is per-university or per-provider (psychological counselling, buddy
 * programmes, specific crisis lines and their hours) is intentionally GENERIC + "find yours",
 * never asserted as a single national service, because it varies by university and city.
 *
 * Verified 2026-06-21 against 116117.de and federal emergency-number guidance.
 */

/* ── Official sources ──────────────────────────────────────────────────────────── */

/** The medical on-call (non-emergency) service — 116117. */
export const SOURCE_116117: Source = {
  name: "116117.de — Medical on-call service (non-emergency, nationwide)",
  url: "https://www.116117.de/de/englisch.php",
};

/** Federal portal — national emergency numbers for medical emergencies. */
export const SOURCE_EMERGENCY: Source = {
  name: "Bundesportal — National emergency numbers",
  url: "https://verwaltung.bund.de/leistungsverzeichnis/en/rechte-und-pflichten/102837939",
};

/** Deutsches Studierendenwerk — student counselling & psychosocial support entry point. */
export const SOURCE_DSW_COUNSELLING: Source = {
  name: "Deutsches Studierendenwerk — counselling & support for students",
  url: "https://www.studierendenwerke.de/en/",
};

/* ── Emergency numbers (STABLE FACTS — grounded, not needs-verification) ────────── */

export interface EmergencyNumber {
  id: string;
  number: string;
  label: string;
  /** When to call this — and, crucially, when NOT to. */
  when: string;
  /** These three are stable nationwide facts. */
  grounded: true;
  source: Source;
}

/**
 * The three numbers every new arrival should memorise. 112 and 110 are the stable EU/German
 * emergency numbers; 116117 is the nationwide non-emergency medical on-call service. Grounded.
 */
export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    id: "en-112",
    number: "112",
    label: "Emergency — ambulance & fire (life-threatening)",
    when: "Call for any life-threatening situation: severe injury, chest pain, breathing trouble, fire. Free, works from any phone, no SIM needed. English is generally handled.",
    grounded: true,
    source: SOURCE_EMERGENCY,
  },
  {
    id: "en-110",
    number: "110",
    label: "Police",
    when: "Call for crimes, accidents involving the police, or immediate danger from another person. (112 also reaches help if you're unsure which to call.)",
    grounded: true,
    source: SOURCE_EMERGENCY,
  },
  {
    id: "en-116117",
    number: "116117",
    label: "Medical on-call service (NOT an emergency line)",
    when: "Call when you need a doctor today but it is NOT life-threatening — evenings, weekends, holidays when your Hausarzt is closed. They direct you to the nearest on-call practice or send a doctor. Free, round the clock.",
    grounded: true,
    source: SOURCE_116117,
  },
];

/* ── How to actually see a doctor ──────────────────────────────────────────────── */

export const SEEING_A_DOCTOR: string[] = [
  "For routine care, register with a general practitioner (Hausarzt) near you — they become your first point of contact and refer you to specialists.",
  "Bring your health-insurance card (the statutory eGK or your private insurer's documents) to every appointment.",
  "Outside surgery hours but not an emergency? Call 116117 — they find the nearest on-call practice (Bereitschaftsdienst) or arrange a home visit.",
  "Life-threatening? Don't wait for an appointment — call 112 or go to the hospital emergency room (Notaufnahme).",
  "Mental-health crisis: your university's psychological counselling service and the Studierendenwerk are the right first stop for non-emergency support (see below); for an acute crisis use 112.",
];

/* ── Community / buddy / counselling (GENERIC + "find yours") ───────────────────── */

export interface SupportResource {
  id: string;
  title: string;
  /** What it is, generically — never a single named per-university service. */
  detail: string;
  /** How to find the specific one for the user's own university/city. */
  findYours: string;
  href?: string;
  source?: Source;
}

/**
 * Non-bureaucratic support: counselling, buddy programmes, diaspora/community. Deliberately generic
 * because the actual services are per-university. Each tells the user how to find THEIR version.
 */
export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    id: "sr-psych",
    title: "University psychological counselling",
    detail:
      "Almost every German university and Studierendenwerk runs a free, confidential psychological / psychosocial counselling service (Psychologische Beratung) for students — stress, anxiety, homesickness, exam pressure.",
    findYours:
      "Search your university name + 'psychologische Beratung' or 'student counselling', or start from the Studierendenwerk.",
    source: SOURCE_DSW_COUNSELLING,
  },
  {
    id: "sr-buddy",
    title: "International-office buddy / mentoring programme",
    detail:
      "Most international offices pair new arrivals with a local student buddy who helps with the first weeks — paperwork, the city, making friends. It is the fastest way to feel less alone.",
    findYours:
      "Ask your International Office / Akademisches Auslandsamt about a buddy or mentoring programme, or look for ESN (Erasmus Student Network) at your university.",
    href: "/campus/networking",
  },
  {
    id: "sr-community",
    title: "Community & diaspora groups",
    detail:
      "Student associations, faith communities, and home-country diaspora groups in your city are a strong informal safety net for practical help and belonging.",
    findYours:
      "Look for your university's student clubs (Hochschulgruppen) and city-based community groups; your buddy or International Office can point you to them.",
    href: "/campus/networking",
  },
];

/** Convenience: the sources this dataset cites, for a Sources footer. */
export const SUPPORT_SOURCES: Source[] = [SOURCE_EMERGENCY, SOURCE_116117, SOURCE_DSW_COUNSELLING];
