/**
 * Test-centre / booking directory seed (gap G3-5). The bridge from "I'm ready" to a booked sitting:
 * for each admission test, the OFFICIAL registration/centre-finder link plus a short, honest note on
 * how sittings are scheduled. After a student passes the readiness gate there was previously no in-app
 * path to actually book — this is it.
 *
 * GROUNDING (CLAUDE.md §2/§3): every centre/date fact is `needsVerification: true`. We do NOT ship test
 * dates, fees, or centre lists (they change constantly and are mission/test-owner specific) — only the
 * official URL where the student finds the current, binding information, and a qualitative note. The
 * booking-window guidance ("book early, slots are limited") is practical advice, not an official SLA.
 */

export interface TestCentreInfo {
  /** Stable id used for keys + the reminder storage key. */
  id: string;
  /** Test display name. */
  test: string;
  /** Family tag for grouping. */
  family: "English" | "German" | "Aptitude" | "Medicine";
  /** Official booking / centre-finder page. */
  bookingUrl: string;
  /** Human label for the official source. */
  sourceName: string;
  /** How sittings are scheduled + booking-window advice (qualitative; needsVerification). */
  note: string;
  /** True — every figure/date behind the link is volatile; verify on the official page. */
  needsVerification: true;
}

export const TEST_CENTRES: TestCentreInfo[] = [
  {
    id: "ielts",
    test: "IELTS Academic",
    family: "English",
    bookingUrl: "https://ielts.org/take-a-test/book-a-test",
    sourceName: "IELTS — book a test",
    note: "Computer-delivered sittings run frequently (often several per week) at approved centres; paper sittings are rarer. Book 2–4 weeks ahead to get your preferred date and city.",
    needsVerification: true,
  },
  {
    id: "toefl",
    test: "TOEFL iBT",
    family: "English",
    bookingUrl: "https://www.ets.org/toefl/test-takers/ibt/register.html",
    sourceName: "ETS — register for TOEFL iBT",
    note: "Test-centre and at-home sittings are offered on many dates. Note the Jan-2026 format change — confirm which version a programme accepts before booking.",
    needsVerification: true,
  },
  {
    id: "testdaf",
    test: "TestDaF (digital)",
    family: "German",
    bookingUrl: "https://www.testdaf.de/en/take-the-test/",
    sourceName: "TestDaF-Institut — take the test",
    note: "The digital TestDaF runs on fixed test dates several times a year at licensed centres worldwide. Registration windows close weeks before each date — plan backwards from your application deadline.",
    needsVerification: true,
  },
  {
    id: "goethe",
    test: "Goethe-Zertifikat / DSH",
    family: "German",
    bookingUrl: "https://www.goethe.de/en/spr/prf.html",
    sourceName: "Goethe-Institut — exams worldwide",
    note: "Dates and fees are set per Goethe-Institut location — use the worldwide directory to find your nearest centre and its calendar. DSH is sat at the admitting university itself.",
    needsVerification: true,
  },
  {
    id: "testas",
    test: "TestAS",
    family: "Aptitude",
    bookingUrl: "https://www.testas.de/en/",
    sourceName: "TestAS — register & find a test centre",
    note: "TestAS is offered on a few fixed dates per year (the official site lists upcoming dates and a centre finder for Germany and abroad). Register well before your Bachelor application deadlines.",
    needsVerification: true,
  },
  {
    id: "tms",
    test: "TMS (Medizin)",
    family: "Medicine",
    bookingUrl: "https://www.tms-info.org/",
    sourceName: "TMS / heiTEST — registration",
    note: "The TMS has a narrow annual registration window (phased, with first-time takers prioritised) and is usually sat once. It transitions to a new 'TMSnat' test from spring 2027 — verify the current format and dates.",
    needsVerification: true,
  },
];
