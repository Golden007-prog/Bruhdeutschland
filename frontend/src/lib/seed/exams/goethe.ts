import type { MockExamDef } from "@/lib/types";

/**
 * Goethe-Zertifikat — practice study aid (NICHT die offizielle Prüfung / NOT the official exam).
 * Format facts (4 modules Lesen/Hören/Schreiben/Sprechen, ~60% pass mark) come from the official
 * Goethe-Institut exam pages. NOTE: the 60% pass mark should be verified per level (facts pack
 * caveat). Items below are original, generated CEFR A2–B2 German grammar / vocabulary / reading
 * practice questions with English explanations. They are not real exam items and do not certify a
 * CEFR level. Practice length is shortened to ~14 minutes.
 */
const LESEN_TEXT = `Lesen (B1) — kurze Anzeige

WG-Zimmer frei! Ab 1. September vermieten wir ein helles Zimmer (18 m²) in einer ruhigen
Drei-Zimmer-Wohnung in Uni-Nähe. Die Miete beträgt 420 Euro warm. Wir suchen eine
nichtrauchende Mitbewohnerin oder einen nichtrauchenden Mitbewohner, gern Studentin oder
Student. Haustiere sind leider nicht erlaubt. Bei Interesse schreib uns einfach eine Nachricht!`;

export const GOETHE_EXAM: MockExamDef = {
  id: "goethe-zertifikat-practice",
  title: "Goethe-Zertifikat — Übungstest (A2–B2)",
  durationMin: 14,
  passPct: 60,
  sections: [
    {
      name: "Lesen",
      durationMin: 65,
      format: "Reading module: notices, emails, articles (B2 example timing shown).",
      scoring: "Pass mark ~60% — verify per level (A1–C2 each set their own pass threshold).",
    },
    {
      name: "Hören",
      durationMin: 40,
      format: "Listening: announcements, conversations, interviews (B2 example timing).",
      scoring: "~60% pass (per level).",
    },
    {
      name: "Schreiben",
      durationMin: 75,
      format: "Writing: informal/formal messages and an opinion text (B2 example timing).",
      scoring: "~60% pass (per level).",
    },
    {
      name: "Sprechen",
      durationMin: 15,
      format: "Speaking: presentation + partner discussion (B2 example timing).",
      scoring: "~60% pass (per level).",
    },
  ],
  questions: [
    {
      id: "goethe-q1",
      section: "Wortschatz · A2",
      prompt: "Wählen Sie das passende Wort: 'Ich fahre jeden Morgen mit dem ______ zur Arbeit.'",
      choices: [
        { id: "a", text: "Bus" },
        { id: "b", text: "Buch" },
        { id: "c", text: "Brot" },
        { id: "d", text: "Bett" },
      ],
      answerId: "a",
      explanation:
        '"mit dem Bus fahren" = to travel by bus. The others (Buch/Brot/Bett) are not means of transport.',
    },
    {
      id: "goethe-q2",
      section: "Grammatik · A2 (Artikel im Dativ)",
      prompt: "Wählen Sie die korrekte Form: 'Wir helfen ______ Kindern bei den Hausaufgaben.'",
      choices: [
        { id: "a", text: "der" },
        { id: "b", text: "den" },
        { id: "c", text: "die" },
        { id: "d", text: "das" },
      ],
      answerId: "b",
      explanation:
        '"helfen" takes the dative. The dative plural article is "den," and the noun adds -n: "den Kindern."',
    },
    {
      id: "goethe-q3",
      section: "Grammatik · B1 (Perfekt)",
      prompt: "Wählen Sie das richtige Hilfsverb: 'Gestern ______ ich nach Berlin gefahren.'",
      choices: [
        { id: "a", text: "habe" },
        { id: "b", text: "bin" },
        { id: "c", text: "war" },
        { id: "d", text: "werde" },
      ],
      answerId: "b",
      explanation:
        'Verbs of movement (fahren, gehen, kommen) form the Perfekt with "sein": "ich bin ... gefahren."',
    },
    {
      id: "goethe-q4",
      section: "Grammatik · B1 (Konnektoren)",
      prompt:
        "Wählen Sie den passenden Konnektor: 'Ich lerne Deutsch, ______ ich in Deutschland studieren möchte.'",
      choices: [
        { id: "a", text: "weil" },
        { id: "b", text: "obwohl" },
        { id: "c", text: "trotzdem" },
        { id: "d", text: "damit nicht" },
      ],
      answerId: "a",
      explanation:
        '"weil" introduces a reason (causal) and sends the verb to the end: "weil ich ... studieren möchte." "obwohl" would mean "although," which contradicts the sentence.',
    },
    {
      id: "goethe-q5",
      section: "Wortschatz · B1",
      prompt: "Welches Wort passt? 'Die Prüfung war sehr schwer. Ich muss sie leider ______.'",
      choices: [
        { id: "a", text: "wiederholen" },
        { id: "b", text: "wiederfinden" },
        { id: "c", text: "wiedersehen" },
        { id: "d", text: "widersprechen" },
      ],
      answerId: "a",
      explanation:
        '"eine Prüfung wiederholen" = to retake/repeat an exam, which fits a failed exam. The others do not collocate with "Prüfung."',
    },
    {
      id: "goethe-q6",
      section: "Lesen · B1 (Detailverstehen)",
      passage: LESEN_TEXT,
      prompt: "Wie hoch ist die Miete für das WG-Zimmer?",
      choices: [
        { id: "a", text: "180 Euro" },
        { id: "b", text: "420 Euro warm" },
        { id: "c", text: "920 Euro kalt" },
        { id: "d", text: "Die Miete steht nicht in der Anzeige." },
      ],
      answerId: "b",
      explanation:
        'The advert states: "Die Miete beträgt 420 Euro warm." ("warm" means utilities are included.)',
    },
    {
      id: "goethe-q7",
      section: "Lesen · B1 (Richtig/Falsch)",
      passage: LESEN_TEXT,
      prompt: "Welche Aussage ist laut Anzeige RICHTIG?",
      choices: [
        { id: "a", text: "Haustiere sind erlaubt." },
        { id: "b", text: "Es wird eine rauchende Person gesucht." },
        { id: "c", text: "Das Zimmer ist in Uni-Nähe und für Studierende geeignet." },
        { id: "d", text: "Das Zimmer ist erst ab Januar frei." },
      ],
      answerId: "c",
      explanation:
        'The advert says the room is "in Uni-Nähe" and they would welcome a "Studentin oder Student." Pets are NOT allowed, and they want a non-smoker, available from 1 September.',
    },
    {
      id: "goethe-q8",
      section: "Grammatik · B2 (Passiv)",
      prompt:
        "Wählen Sie die korrekte Passivform: 'Das Formular ______ bis Freitag eingereicht werden.'",
      choices: [
        { id: "a", text: "muss" },
        { id: "b", text: "musst" },
        { id: "c", text: "müssen" },
        { id: "d", text: "gemusst" },
      ],
      answerId: "a",
      explanation:
        '"Das Formular" is singular (3rd person), so the modal is "muss": "Das Formular muss ... eingereicht werden." (modal + Passiv-Infinitiv "eingereicht werden").',
    },
  ],
};

export default GOETHE_EXAM;
