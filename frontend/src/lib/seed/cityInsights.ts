/**
 * Qualitative city signals for the City explorer (gap G2-4). The explorer already shows a grounded cost
 * baseline (CITY_PROFILES); this adds the OTHER axes a student weighs — local job-market character,
 * day-to-day English-friendliness, and Werkstudent context — that a Bangladesh/India applicant needs.
 *
 * GROUNDING (CLAUDE.md §2): these are deliberately QUALITATIVE descriptors, NOT statistics. No
 * employment rate, salary, or English-proficiency percentage is asserted — those vary and would be a
 * fabricated official figure. Each signal is a widely-reported characterisation framed as orientation;
 * the page tells the student to verify current conditions for their field themselves. Keyed by the same
 * city names as CITY_PROFILES so the two stay aligned.
 */

export type Strength = "stronger" | "mixed" | "research";

export interface CityInsight {
  /** Must match a CITY_PROFILES city name. */
  city: string;
  /** Local economy character — what kinds of employers cluster here (qualitative). */
  jobMarket: string;
  /** How far you can get day-to-day in English (qualitative orientation, not a score). */
  englishFriendliness: string;
  /** Rough English-friendliness signal for a quick scan (qualitative, not a measurement). */
  englishSignal: Strength;
  /** Werkstudent / part-time context worth knowing. */
  werkstudent: string;
}

export const CITY_INSIGHTS: CityInsight[] = [
  {
    city: "Berlin",
    jobMarket: "Largest startup & tech scene in Germany, plus media, research, and public-sector roles. Broad across fields.",
    englishFriendliness: "Among the most English-friendly cities — many startups operate in English and services are used to internationals.",
    englishSignal: "stronger",
    werkstudent: "Plenty of Werkstudent/English-speaking roles, but competition is high and rents have risen sharply.",
  },
  {
    city: "Munich",
    jobMarket: "Strong in automotive, engineering, IT, insurance and corporates (BMW, Siemens, many HQs). High-wage, high-cost.",
    englishFriendliness: "International workplaces are common, but everyday admin and many SMEs still expect German.",
    englishSignal: "mixed",
    werkstudent: "Good corporate Werkstudent market in engineering/IT; the very high cost of living offsets higher pay.",
  },
  {
    city: "Frankfurt",
    jobMarket: "Finance and consulting hub (banks, ECB), logistics around the airport. Narrower but well-paid sectors.",
    englishFriendliness: "Finance runs heavily in English; outside it, German helps a lot day to day.",
    englishSignal: "mixed",
    werkstudent: "Finance/IT Werkstudent roles exist; expensive city, so budget carefully.",
  },
  {
    city: "Hamburg",
    jobMarket: "Media, logistics/port, aerospace (Airbus), and a solid corporate base.",
    englishFriendliness: "Reasonably international, though German is the norm for most local roles.",
    englishSignal: "mixed",
    werkstudent: "Decent across media/logistics/engineering; verify field-specific demand.",
  },
  {
    city: "Cologne",
    jobMarket: "Media, insurance, and services; a large, diversified economy.",
    englishFriendliness: "Friendly, fairly international city; German still expected for most jobs.",
    englishSignal: "mixed",
    werkstudent: "Media/services Werkstudent roles; research your field's local demand.",
  },
  {
    city: "Stuttgart",
    jobMarket: "Automotive & manufacturing heartland (Mercedes, Porsche, Bosch) and strong engineering SMEs.",
    englishFriendliness: "Engineering roles can be international, but German is widely expected locally.",
    englishSignal: "mixed",
    werkstudent: "Excellent for engineering/automotive Werkstudent positions; German is often required.",
  },
  {
    city: "Aachen",
    jobMarket: "University/research town (RWTH) with engineering & tech spin-offs; smaller market than the metros.",
    englishFriendliness: "Big international student community around RWTH; the wider town leans German.",
    englishSignal: "mixed",
    werkstudent: "Strong research/HiWi and engineering Werkstudent links via the university; fewer large employers.",
  },
  {
    city: "Leipzig",
    jobMarket: "Fast-growing eastern city — logistics, automotive (Porsche/BMW plants), and a creative scene.",
    englishFriendliness: "Increasingly international but more German-dependent than Berlin/Munich.",
    englishSignal: "research",
    werkstudent: "Growing market and much lower rents; check English-role availability in your field first.",
  },
  {
    city: "Dresden",
    jobMarket: "\"Silicon Saxony\" — microelectronics & semiconductors, plus strong research institutes.",
    englishFriendliness: "Research/tech can be international; everyday life leans German.",
    englishSignal: "research",
    werkstudent: "Good for microelectronics/IT and research roles; lower cost of living. Verify English roles.",
  },
];

const BY_CITY = new Map(CITY_INSIGHTS.map((c) => [c.city, c]));

/** Insight for a city, or null when none is curated (the page then shows an honest "research this"). */
export function cityInsight(city: string): CityInsight | null {
  return BY_CITY.get(city) ?? null;
}

export const STRENGTH_LABEL: Record<Strength, string> = {
  stronger: "English-friendly",
  mixed: "German helps a lot",
  research: "Research your field",
};
