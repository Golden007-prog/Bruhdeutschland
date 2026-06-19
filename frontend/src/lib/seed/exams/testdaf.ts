import type { MockExamDef } from "@/lib/types";

/**
 * TestDaF (digital) — practice study aid (NICHT der offizielle Test / NOT the official test).
 * Format facts (Lesen/Hören/Schreiben/Sprechen sections, TDN 3–5 scoring) come from the official
 * TestDaF Institut structure page. Items below are original, generated practice questions in German
 * modelled on TestDaF Lesen/Hören TYPES, with English explanations. They are not real exam items
 * and do not predict your TDN level. Practice length is shortened to ~15 minutes.
 */
const LESEN_TEXT = `Lesen (Leseverstehen) — Textauszug

Immer mehr Universitäten in Deutschland bieten Studiengänge an, die vollständig auf Englisch
unterrichtet werden. Für internationale Studierende hat das Vorteile: Sie können sofort mit dem
Fachstudium beginnen, ohne zuvor ein hohes Deutschniveau nachzuweisen. Fachleute weisen jedoch
darauf hin, dass Deutschkenntnisse im Alltag und bei der späteren Jobsuche weiterhin wichtig
bleiben. Viele Hochschulen empfehlen daher, parallel zum Studium einen Deutschkurs zu besuchen.`;

const HOREN_TEXT = `Hören (Hörverstehen) — Transkript-Auszug (als Text dargestellt)

Sprecherin: "Liebe Studierende, die Bibliothek hat ab dem nächsten Semester längere
Öffnungszeiten. Sie ist jetzt von montags bis freitags bis 24 Uhr geöffnet, am Wochenende bis
20 Uhr. Bitte denken Sie daran, Ihren Studierendenausweis mitzubringen, da der Zugang am Abend
nur mit gültigem Ausweis möglich ist."`;

export const TESTDAF_EXAM: MockExamDef = {
  id: "testdaf-digital-practice",
  title: "TestDaF (digital) — Übungstest",
  durationMin: 15,
  passPct: 70,
  sections: [
    {
      name: "Lesen",
      durationMin: 55,
      format: "~34 Aufgaben zum Leseverstehen (Detail, Hauptaussage, Zuordnung).",
      scoring: "TDN 3 / 4 / 5 pro Bereich (~CEFR B2–C1). TDN 4 in allen Teilen ist der häufige Zielwert.",
    },
    {
      name: "Hören",
      durationMin: 40,
      format: "~30 Aufgaben zum Hörverstehen (Gespräche, Vorträge, Notizen).",
      scoring: "TDN 3 / 4 / 5.",
    },
    {
      name: "Schreiben",
      durationMin: 60,
      format: "2 Aufgaben (Daten beschreiben + argumentierender Text).",
      scoring: "TDN 3 / 4 / 5.",
    },
    {
      name: "Sprechen",
      durationMin: 35,
      format: "~7 Aufgaben in einer rechnergestützten Prüfung.",
      scoring: "TDN 3 / 4 / 5.",
    },
  ],
  questions: [
    {
      id: "testdaf-q1",
      section: "Lesen · Detailverstehen",
      passage: LESEN_TEXT,
      prompt:
        "Was ist laut Text ein Vorteil englischsprachiger Studiengänge für internationale Studierende?",
      choices: [
        { id: "a", text: "Sie müssen nie Deutsch lernen." },
        { id: "b", text: "Sie können sofort mit dem Fachstudium beginnen." },
        { id: "c", text: "Sie zahlen keine Studiengebühren." },
        { id: "d", text: "Sie bekommen automatisch ein Stipendium." },
      ],
      answerId: "b",
      explanation:
        'The text says students "können sofort mit dem Fachstudium beginnen, ohne zuvor ein hohes Deutschniveau nachzuweisen." (b) restates this directly. (a) is too absolute — the text says German stays important.',
    },
    {
      id: "testdaf-q2",
      section: "Lesen · Hauptaussage",
      passage: LESEN_TEXT,
      prompt: "Welche Empfehlung geben viele Hochschulen laut Text?",
      choices: [
        { id: "a", text: "Parallel zum Studium einen Deutschkurs zu besuchen." },
        { id: "b", text: "Das Studium in einem anderen Land zu beginnen." },
        { id: "c", text: "Auf Englisch zu verzichten." },
        { id: "d", text: "Den Studiengang sofort zu wechseln." },
      ],
      answerId: "a",
      explanation:
        'The final sentence: "Viele Hochschulen empfehlen daher, parallel zum Studium einen Deutschkurs zu besuchen."',
    },
    {
      id: "testdaf-q3",
      section: "Lesen · Schlussfolgerung",
      passage: LESEN_TEXT,
      prompt:
        "Was lässt sich aus dem Text über Deutschkenntnisse schließen?",
      choices: [
        { id: "a", text: "Sie sind für die Jobsuche unwichtig." },
        { id: "b", text: "Sie bleiben im Alltag und bei der Jobsuche wichtig." },
        { id: "c", text: "Sie werden nur für die Prüfung gebraucht." },
        { id: "d", text: "Sie sind nur für EU-Bürger relevant." },
      ],
      answerId: "b",
      explanation:
        'The text states "dass Deutschkenntnisse im Alltag und bei der späteren Jobsuche weiterhin wichtig bleiben." — they remain important in daily life and the job hunt.',
    },
    {
      id: "testdaf-q4",
      section: "Lesen · Wortschatz",
      passage: LESEN_TEXT,
      prompt: 'Was bedeutet "parallel zum Studium" in diesem Kontext?',
      choices: [
        { id: "a", text: "vor dem Studium" },
        { id: "b", text: "nach dem Studium" },
        { id: "c", text: "gleichzeitig mit dem Studium" },
        { id: "d", text: "anstelle des Studiums" },
      ],
      answerId: "c",
      explanation:
        '"Parallel zu" means "at the same time as / alongside." So the recommendation is to take a German course concurrently with studying.',
    },
    {
      id: "testdaf-q5",
      section: "Hören · Detailverstehen",
      passage: HOREN_TEXT,
      prompt:
        "Bis wann ist die Bibliothek ab dem nächsten Semester von montags bis freitags geöffnet?",
      choices: [
        { id: "a", text: "bis 20 Uhr" },
        { id: "b", text: "bis 22 Uhr" },
        { id: "c", text: "bis 24 Uhr" },
        { id: "d", text: "rund um die Uhr" },
      ],
      answerId: "c",
      explanation:
        'The announcement: "von montags bis freitags bis 24 Uhr geöffnet." Note the distractor: bis 20 Uhr applies only to the weekend.',
    },
    {
      id: "testdaf-q6",
      section: "Hören · Detailverstehen",
      passage: HOREN_TEXT,
      prompt: "Was müssen die Studierenden am Abend mitbringen?",
      choices: [
        { id: "a", text: "einen Personalausweis" },
        { id: "b", text: "ihren gültigen Studierendenausweis" },
        { id: "c", text: "ein Buch zum Zurückgeben" },
        { id: "d", text: "einen Antrag" },
      ],
      answerId: "b",
      explanation:
        'The speaker says evening access is "nur mit gültigem Ausweis möglich" and asks students to bring their "Studierendenausweis."',
    },
    {
      id: "testdaf-q7",
      section: "Hören · Hauptaussage",
      passage: HOREN_TEXT,
      prompt: "Worum geht es in der Durchsage hauptsächlich?",
      choices: [
        { id: "a", text: "um neue, längere Öffnungszeiten der Bibliothek" },
        { id: "b", text: "um die Schließung der Bibliothek" },
        { id: "c", text: "um eine Erhöhung der Mahngebühren" },
        { id: "d", text: "um einen Umzug der Bibliothek" },
      ],
      answerId: "a",
      explanation:
        'The main point is that the library "hat ab dem nächsten Semester längere Öffnungszeiten" — new, longer opening hours.',
    },
    {
      id: "testdaf-q8",
      section: "Lesen · Grammatik im Kontext",
      passage: LESEN_TEXT,
      prompt:
        'Wählen Sie die korrekte Form: "Viele Hochschulen empfehlen, einen Deutschkurs ______."',
      choices: [
        { id: "a", text: "zu besuchen" },
        { id: "b", text: "besuchen" },
        { id: "c", text: "besucht" },
        { id: "d", text: "zu besuchend" },
      ],
      answerId: "a",
      explanation:
        'After "empfehlen, ... etwas zu tun" German uses the zu-infinitive: "einen Deutschkurs zu besuchen." This matches the original sentence in the text.',
    },
  ],
};

export default TESTDAF_EXAM;
