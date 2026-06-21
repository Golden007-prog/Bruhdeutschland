/**
 * TMS — Test für Medizinische Studiengänge PRACTICE mock (gap G3-4). The TMS is an optional aptitude
 * test many German medical faculties weight heavily; the app had only a guide page with no practice.
 * This builds at least one timed, deterministically-scored subtest on the SAME engine as the language
 * mocks, with a bundled offline seed when no AI provider is set.
 *
 * GROUNDING (CLAUDE.md §2): TMS practice ITEMS are study aids, not official test content and not
 * score-equivalent. The subtest STRUCTURE (reasoning/concentration under time pressure, in German;
 * not subject knowledge) comes from the official TMS site. NOTE the TMS is transitioning to a new
 * "TMSnat" test from spring 2027 — verify the current format on the official site before relying on it.
 * The spec is NOT registered in the global EXAM_SPECS; the page drives generation via
 * generateExamFromSpec().
 */
import type { ExamSpec } from "@/data/exam-specs";
import type { GeneratedExam, GeneratedSection, ObjectiveQuestion } from "@/lib/exam/schema";

export const TMS_EXAM_ID = "tms";

const TODAY = "2026-06-21";

/**
 * TMS practice spec. Content language German (the real test is in German). Scale "percent" → honest
 * objective scoring with no fabricated standard value (the real TMS reports a standardised value we
 * don't invent). Two of the most practisable subtests are included.
 */
export const TMS_SPEC: ExamSpec = {
  id: TMS_EXAM_ID,
  title: "TMS — Übungstest (practice)",
  language: "de",
  ttsLang: "de-DE",
  scoreScale: "Rohpunkte (Übung) — der echte TMS liefert einen standardisierten Wert",
  scale: "percent",
  sections: [
    {
      skill: "quantitative",
      label: "Quantitative & formale Probleme",
      questions: 6,
      timeMin: 18,
      format: "Rechen- und Textaufgaben aus Medizin/Naturwissenschaft — Tempo und Genauigkeit zählen.",
      questionTypes: ["Textaufgabe", "Dreisatz / Proportion", "Prozentrechnung", "Einheiten"],
    },
    {
      skill: "quantitative",
      label: "Muster zuordnen (logisches Schlussfolgern)",
      questions: 6,
      timeMin: 14,
      format: "Zahlen-/Logikreihen fortsetzen und Regeln erkennen.",
      questionTypes: ["Zahlenreihe", "Logikmuster", "Regelerkennung"],
    },
  ],
  provenance: {
    source_name: "TMS / heiTEST — offizielle Seite (Untertests)",
    source_url: "https://www.tms-info.org/",
    retrieved_at: TODAY,
    needs_verification: true,
  },
};

// ── Offline seed form ─────────────────────────────────────────────────────────────────────────────
let counter = 0;
const uid = (p: string) => `${p}_tms_${++counter}`;

function mc(prompt: string, choices: string[], correctIdx: number, explanation: string, typeLabel: string): ObjectiveQuestion {
  return {
    id: uid("q"),
    kind: "objective",
    responseType: "single",
    typeLabel,
    prompt,
    choices: choices.map((text, i) => ({ id: `c${i}`, text })),
    answerId: `c${correctIdx}`,
    explanation,
  };
}

const QUANT_DE: GeneratedSection = {
  skill: "quantitative",
  title: "Quantitative & formale Probleme",
  instructions: "Lösen Sie die Aufgaben. Arbeiten Sie zügig — der TMS belohnt Tempo und Genauigkeit.",
  passages: [],
  open: [],
  objective: [
    mc("Eine Infusion läuft mit 120 ml pro Stunde. Wie lange dauert es, 300 ml zu geben?", ["1,5 h", "2 h", "2,5 h", "3 h"], 2, "300 / 120 = 2,5 Stunden.", "Dreisatz / Rate"),
    mc("Ein Medikament wird auf 60 % der ursprünglichen Dosis von 250 mg reduziert. Neue Dosis?", ["120 mg", "150 mg", "175 mg", "200 mg"], 1, "250 × 0,60 = 150 mg.", "Prozentrechnung"),
    mc("Der Mittelwert von 4, 9 und x ist 7. Wie groß ist x?", ["6", "7", "8", "9"], 2, "(4+9+x)/3 = 7 → 13+x = 21 → x = 8.", "Mittelwert"),
    mc("Lösen Sie: 4n − 6 = 2n + 8.", ["5", "6", "7", "8"], 2, "4n − 2n = 8 + 6 → 2n = 14 → n = 7.", "Algebra"),
    mc("5 mg sind wie viel Gramm?", ["0,005 g", "0,05 g", "0,5 g", "50 g"], 0, "1 mg = 0,001 g, also 5 mg = 0,005 g.", "Einheiten"),
    mc("Ein Tank zu 3/4 gefüllt enthält 30 Liter. Wie viel fasst er voll?", ["36 l", "40 l", "45 l", "48 l"], 1, "30 entspricht 3/4 → voll = 30 ÷ 3 × 4 = 40 l.", "Bruchrechnung"),
  ],
};

const PATTERN_DE: GeneratedSection = {
  skill: "quantitative",
  title: "Muster zuordnen",
  instructions: "Erkennen Sie die Regel der Reihe oder des Musters und wählen Sie die Fortsetzung.",
  passages: [],
  open: [],
  objective: [
    mc("Setzen Sie fort: 3, 6, 12, 24, ___", ["30", "36", "48", "60"], 2, "Jeder Wert wird verdoppelt: 24 × 2 = 48.", "Zahlenreihe (geometrisch)"),
    mc("Setzen Sie fort: 5, 8, 11, 14, ___", ["15", "16", "17", "18"], 2, "Arithmetisch, +3: 14 + 3 = 17.", "Zahlenreihe (arithmetisch)"),
    mc("Setzen Sie fort: 1, 4, 9, 16, ___", ["20", "24", "25", "30"], 2, "Quadratzahlen: 1², 2², 3², 4², 5² = 25.", "Zahlenreihe (Quadrate)"),
    mc("Setzen Sie fort: 2, 3, 5, 8, 13, ___", ["18", "20", "21", "26"], 2, "Fibonacci: jeder Wert ist die Summe der beiden vorigen (8 + 13 = 21).", "Zahlenreihe (Fibonacci)"),
    mc("Setzen Sie fort: 1, 2, 6, 24, ___", ["48", "96", "120", "144"], 2, "Multiplikation mit 2, 3, 4, 5: 24 × 5 = 120.", "Zahlenreihe (Fakultät)"),
    mc("Setzen Sie fort: B, D, G, K, ___", ["M", "N", "O", "P"], 2, "Abstände wachsen +2, +3, +4, +5: K (+5) → O.", "Buchstabenmuster"),
  ],
};

/** The bundled offline TMS form (clone via the page before answering). */
export const TMS_SEED: GeneratedExam = {
  examId: TMS_EXAM_ID,
  title: "TMS — Übungstest (offline)",
  language: "de",
  sections: [QUANT_DE, PATTERN_DE],
  nonce: "seed-tms",
  isSeed: true,
};
