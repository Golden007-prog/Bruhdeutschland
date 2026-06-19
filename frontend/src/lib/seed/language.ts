import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Language-only seed data: CEFR course levels (A1–B2), a German↔English flashcard deck, and the
 * German university-certificate comparison table.
 *
 * Structural facts about the German certificates (which section levels are required, what each test
 * looks like) are sourced from each test owner's official format pages, cited via SourceLink on the
 * page. PROGRAM-SPECIFIC pass thresholds (e.g. the exact band a given Master's wants) are NOT settled
 * facts and are rendered with the grounding/verification treatment from src/lib/facts.ts — never as a
 * guarantee here (CLAUDE.md §2/§3). The example phrases below are ordinary, widely-taught beginner
 * German used purely as study material; they are not official admission claims.
 */

/* ── CEFR course levels (A1–B2) ─────────────────────────────────────────────── */

export interface GermanPhrase {
  id: string;
  /** German text — passed to speechSynthesis with lang "de-DE". */
  de: string;
  /** English gloss. */
  en: string;
}

export interface CefrLevel {
  /** "A1" | "A2" | "B1" | "B2". */
  level: string;
  label: string;
  /** One-line description of where this level sits on the path. */
  summary: string;
  /** "Can-do" descriptors in the CEFR self-assessment style. */
  canDo: string[];
  /** A handful of example phrases with audio. */
  phrases: GermanPhrase[];
}

export const CEFR_LEVELS: CefrLevel[] = [
  {
    level: "A1",
    label: "Breakthrough",
    summary: "Everyday survival German: greetings, introductions, simple needs.",
    canDo: [
      "Understand and use familiar everyday expressions and very basic phrases.",
      "Introduce yourself and others; ask and answer questions about personal details.",
      "Interact simply when the other person talks slowly and clearly.",
    ],
    phrases: [
      { id: "a1-1", de: "Guten Tag, ich heiße Anna.", en: "Hello, my name is Anna." },
      { id: "a1-2", de: "Wie geht es Ihnen?", en: "How are you? (formal)" },
      { id: "a1-3", de: "Ich komme aus Indien.", en: "I come from India." },
      { id: "a1-4", de: "Ich hätte gern einen Kaffee, bitte.", en: "I would like a coffee, please." },
      { id: "a1-5", de: "Entschuldigung, wo ist der Bahnhof?", en: "Excuse me, where is the train station?" },
    ],
  },
  {
    level: "A2",
    label: "Waystage",
    summary: "Routine matters: shopping, daily life, simple past and plans.",
    canDo: [
      "Understand sentences and frequent expressions about immediate relevance (shopping, work, area).",
      "Communicate in simple, routine tasks needing a direct exchange of information.",
      "Describe in simple terms your background, environment, and immediate needs.",
    ],
    phrases: [
      { id: "a2-1", de: "Am Wochenende möchte ich meine Freunde besuchen.", en: "At the weekend I want to visit my friends." },
      { id: "a2-2", de: "Können Sie mir bitte helfen?", en: "Could you please help me?" },
      { id: "a2-3", de: "Gestern habe ich für die Prüfung gelernt.", en: "Yesterday I studied for the exam." },
      { id: "a2-4", de: "Die Wohnung ist leider zu teuer.", en: "Unfortunately the flat is too expensive." },
      { id: "a2-5", de: "Wann fährt der nächste Bus?", en: "When does the next bus leave?" },
    ],
  },
  {
    level: "B1",
    label: "Threshold",
    summary: "Independent user: handle most situations, give opinions, manage university admin.",
    canDo: [
      "Understand the main points of clear standard input on familiar matters (work, school, leisure).",
      "Deal with most situations likely to arise while travelling in a German-speaking area.",
      "Produce simple connected text and describe experiences, plans, and opinions briefly.",
    ],
    phrases: [
      { id: "b1-1", de: "Ich interessiere mich für einen Masterstudiengang in Informatik.", en: "I'm interested in a Master's program in computer science." },
      { id: "b1-2", de: "Könnten Sie mir erklären, wie die Einschreibung funktioniert?", en: "Could you explain how enrolment works?" },
      { id: "b1-3", de: "Meiner Meinung nach ist das eine gute Idee.", en: "In my opinion that is a good idea." },
      { id: "b1-4", de: "Ich muss mich beim Bürgeramt anmelden.", en: "I have to register at the citizens' office." },
      { id: "b1-5", de: "Wenn ich Zeit habe, lerne ich jeden Tag Deutsch.", en: "When I have time, I study German every day." },
    ],
  },
  {
    level: "B2",
    label: "Vantage",
    summary: "Confident independent user: the typical floor for German-taught Master's study.",
    canDo: [
      "Understand the main ideas of complex text on both concrete and abstract topics.",
      "Interact with fluency and spontaneity that makes regular interaction with native speakers possible.",
      "Produce clear, detailed text and explain a viewpoint on an issue, giving pros and cons.",
    ],
    phrases: [
      { id: "b2-1", de: "Die Forschungsergebnisse lassen sich nicht eindeutig interpretieren.", en: "The research findings cannot be interpreted unambiguously." },
      { id: "b2-2", de: "Einerseits ist das Studium anspruchsvoll, andererseits sehr lohnend.", en: "On the one hand the studies are demanding, on the other very rewarding." },
      { id: "b2-3", de: "Ich würde gern an Ihrem Seminar teilnehmen.", en: "I would like to take part in your seminar." },
      { id: "b2-4", de: "Trotz der Schwierigkeiten habe ich die Frist eingehalten.", en: "Despite the difficulties, I met the deadline." },
      { id: "b2-5", de: "Es wäre hilfreich, wenn Sie das genauer erläutern könnten.", en: "It would be helpful if you could explain that in more detail." },
    ],
  },
];

/* ── Flashcard deck (German ↔ English) ──────────────────────────────────────── */

export interface Flashcard {
  id: string;
  /** German front — also used for de-DE audio. */
  de: string;
  /** English back. */
  en: string;
  /** Short usage/grammar hint shown when the card is flipped. */
  hint?: string;
}

/**
 * A starter A1–B1 deck of high-frequency words and phrases students meet during admission and
 * arrival. Original study material — not an official vocabulary list.
 */
export const FLASHCARD_DECK: Flashcard[] = [
  { id: "fc-1", de: "die Bewerbung", en: "the application", hint: "f. — sich bewerben = to apply." },
  { id: "fc-2", de: "die Zulassung", en: "the admission / acceptance", hint: "Zulassungsbescheid = letter of admission." },
  { id: "fc-3", de: "die Frist", en: "the deadline", hint: "f. — Bewerbungsfrist = application deadline." },
  { id: "fc-4", de: "das Zeugnis", en: "the certificate / transcript", hint: "n. — Abschlusszeugnis = final certificate." },
  { id: "fc-5", de: "die Hochschule", en: "the university / higher-ed institution", hint: "f. — covers Uni and Fachhochschule." },
  { id: "fc-6", de: "die Immatrikulation", en: "the enrolment", hint: "sich immatrikulieren = to enrol." },
  { id: "fc-7", de: "das Sperrkonto", en: "the blocked account", hint: "n. — proof of financial resources." },
  { id: "fc-8", de: "die Krankenversicherung", en: "the health insurance", hint: "f. — mandatory for enrolment." },
  { id: "fc-9", de: "die Anmeldung", en: "the (address) registration", hint: "f. — at the Bürgeramt within 14 days." },
  { id: "fc-10", de: "der Aufenthaltstitel", en: "the residence permit", hint: "m. — converted from the visa after arrival." },
  { id: "fc-11", de: "Ich brauche Hilfe.", en: "I need help.", hint: "brauchen = to need (+ accusative)." },
  { id: "fc-12", de: "Vielen Dank für Ihre Unterstützung.", en: "Many thanks for your support.", hint: "Formal, useful in emails to offices." },
];

/* ── German certificate comparison ──────────────────────────────────────────── */

export interface GermanCertificate {
  id: string;
  name: string;
  /** The level / result this certificate represents for university admission. */
  result: string;
  /** Whether it is accepted as proof of German for admission (broadly). */
  acceptance: string;
  /** Sections / structure summary (from the test owner's format page). */
  format: string;
  /** Validity / practical notes. */
  notes: string;
  source: Source;
}

/**
 * The certificates German universities most commonly accept as proof of German-language ability for
 * admission. Acceptance is decided per university/program — always confirm the exact requirement on
 * the program page. Structure notes follow each test owner's official format pages (cited).
 */
export const GERMAN_CERTIFICATES: GermanCertificate[] = [
  {
    id: "testdaf",
    name: "TestDaF",
    result: "TDN 3 / 4 / 5 per section (TDN 4 in all four is the common bar)",
    acceptance: "Widely accepted nationwide for university admission.",
    format:
      "Four sections — Reading, Listening, Writing, Speaking — each reported on the TestDaF level scale (TDN 3–5). Now offered as a digital exam.",
    notes:
      "TDN 4 across all four sections is the level many German-taught programs reference. Some programs ask TDN 5 in certain sections.",
    source: source("testdaf"),
  },
  {
    id: "dsh",
    name: "DSH (DSH-2)",
    result: "DSH-1 / DSH-2 / DSH-3 (DSH-2 is the usual admission level)",
    acceptance: "University-run exam, recognised by the awarding university and widely beyond it.",
    format:
      "A written part (reading comprehension, listening, scientific structures, text production) plus an oral part. Run by individual universities, so exact format varies.",
    notes:
      "Usually taken in Germany at the host university. DSH-2 is broadly equivalent to the common B2/C1 bar; DSH-3 is the highest band.",
    source: source("daadRequirements"),
  },
  {
    id: "goethe-c1",
    name: "Goethe-Zertifikat C1",
    result: "CEFR C1 (pass)",
    acceptance: "Accepted by many universities as proof of German; confirm per program.",
    format:
      "Four modules — Reading, Listening, Writing, Speaking — assessing the C1 level of the Common European Framework.",
    notes:
      "Internationally available through Goethe-Institut centres. A C2 (Großes Deutsches Sprachdiplom) is also offered for the highest level.",
    source: source("goethe"),
  },
  {
    id: "goethe-c2",
    name: "Goethe-Zertifikat C2 (GDS)",
    result: "CEFR C2 (mastery)",
    acceptance: "Exceeds the typical admission bar; accepted broadly.",
    format:
      "Four independently certifiable modules — Reading, Listening, Writing, Speaking — at the highest CEFR level.",
    notes:
      "More than most Master's programs require, but useful for German-language teaching/research tracks.",
    source: source("goethe"),
  },
  {
    id: "telc-c1-hochschule",
    name: "telc Deutsch C1 Hochschule",
    result: "CEFR C1 (designed for university entry)",
    acceptance: "Recognised for admission to German universities; confirm per program.",
    format:
      "Written exam (reading, language elements, listening, writing) and an oral exam, with academic-context tasks tailored to higher education.",
    notes:
      "Purpose-built for university admission, which is why many universities list it alongside TestDaF and DSH.",
    source: source("telc"),
  },
];
