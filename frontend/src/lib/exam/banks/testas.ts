/**
 * TestAS — Core module (Kerntest) PRACTICE mock (gap G3-3). TestAS is the aptitude test many German
 * universities expect from international Bachelor / foundation applicants; until now the app only had a
 * guide page with no practice. This builds a timed, deterministically-scored Core-module mock on the
 * SAME engine as the language mocks (generate one section per LLM call → Zod-validate → score in tested
 * code), with a bundled offline seed when no AI provider is set.
 *
 * GROUNDING (CLAUDE.md §2): TestAS practice ITEMS are study aids, not official test content and not
 * score-equivalent — TestAS is reported as a percentile-based standard score with no fixed pass mark.
 * The structural facts below (Core module = study-aptitude subtests, not subject knowledge) come from
 * the official TestAS site; the format is intentionally shortened for practice. The spec is NOT added to
 * the global EXAM_SPECS registry — the page drives generation via generateExamFromSpec().
 */
import type { ExamSpec } from "@/data/exam-specs";
import type { GeneratedExam, GeneratedSection, ObjectiveQuestion } from "@/lib/exam/schema";

/** The id this mock runs under (attempts, progress autosave, scoring scale all key off it). */
export const TESTAS_EXAM_ID = "testas";

const TODAY = "2026-06-21";

/**
 * TestAS Core-module mock spec. Scale "percent" → deterministic objective scoring with NO invented band
 * (honest: TestAS gives a percentile standard score, which we don't fabricate). Sections mirror the
 * Core module's reasoning subtests, shortened for practice.
 */
export const TESTAS_SPEC: ExamSpec = {
  id: TESTAS_EXAM_ID,
  title: "TestAS — Core module (practice)",
  language: "en",
  ttsLang: "en-US",
  scoreScale: "Raw practice score (TestAS reports a percentile-based standard score)",
  scale: "percent",
  sections: [
    {
      skill: "quantitative",
      label: "Solving Quantitative Problems",
      questions: 6,
      timeMin: 18,
      format: "Word problems testing arithmetic, proportion, and basic algebra reasoning — speed matters.",
      questionTypes: ["quantitative word problem", "proportion / rate", "percentages", "basic algebra"],
    },
    {
      skill: "verbal",
      label: "Analysing Relationships (analogies)",
      questions: 6,
      timeMin: 12,
      format: "Analogy and relationship reasoning — find the pair with the same relation.",
      questionTypes: ["verbal analogy", "relationship reasoning", "odd-one-out"],
    },
    {
      skill: "quantitative",
      label: "Completing Numerical Series & Patterns",
      questions: 6,
      timeMin: 15,
      format: "Continue number series and figural/logical patterns by inferring the rule.",
      questionTypes: ["number series", "logical pattern", "rule inference"],
    },
  ],
  provenance: {
    source_name: "TestAS — official site (Core module overview)",
    source_url: "https://www.testas.de/en/",
    retrieved_at: TODAY,
    needs_verification: true,
  },
};

// ── Offline seed form (bottom rung of the fallback ladder; clearly flagged isSeed downstream) ──────
let counter = 0;
const uid = (p: string) => `${p}_testas_${++counter}`;

/** Single-best-answer objective item helper (mirrors data/seed-forms style). */
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

const QUANT_1: GeneratedSection = {
  skill: "quantitative",
  title: "Solving Quantitative Problems",
  instructions: "Solve each problem. Work quickly — TestAS rewards speed and accuracy together.",
  passages: [],
  open: [],
  objective: [
    mc("A train covers 240 km in 3 hours. At the same speed, how long does 400 km take?", ["4 h", "5 h", "6 h", "8 h"], 1, "Speed = 240/3 = 80 km/h; 400/80 = 5 h.", "Proportion / rate"),
    mc("If 5 workers build a wall in 12 days, how many days do 10 workers need (same rate)?", ["3", "6", "10", "24"], 1, "Twice the workers → half the time: 12/2 = 6 days.", "Inverse proportion"),
    mc("A jacket priced €80 is reduced by 25%. What is the new price?", ["€55", "€60", "€65", "€75"], 1, "80 × 0.75 = €60.", "Percentages"),
    mc("The average of 6, 10, and x is 9. What is x?", ["9", "10", "11", "12"], 2, "(6+10+x)/3 = 9 → 16+x = 27 → x = 11.", "Averages"),
    mc("Solve for n: 3n − 7 = 2n + 5.", ["6", "10", "12", "−2"], 2, "3n − 2n = 5 + 7 → n = 12.", "Basic algebra"),
    mc("A map scale is 1:50,000. A road is 4 cm on the map. Its real length is:", ["200 m", "2 km", "20 km", "200 km"], 1, "4 cm × 50,000 = 200,000 cm = 2 km.", "Scale / units"),
  ],
};

const VERBAL_1: GeneratedSection = {
  skill: "verbal",
  title: "Analysing Relationships",
  instructions: "Identify the relationship in the first pair and complete the second pair the same way.",
  passages: [],
  open: [],
  objective: [
    mc("Doctor is to hospital as teacher is to ___.", ["student", "school", "lesson", "book"], 1, "Doctor works in a hospital; a teacher works in a school (workplace relation).", "Verbal analogy"),
    mc("Hot is to cold as up is to ___.", ["high", "down", "tall", "over"], 1, "Antonym pair: hot/cold, up/down.", "Antonym analogy"),
    mc("Author is to novel as composer is to ___.", ["orchestra", "symphony", "piano", "audience"], 1, "Creator-to-creation: author→novel, composer→symphony.", "Creator analogy"),
    mc("Which word does NOT belong: oak, pine, rose, birch?", ["oak", "pine", "rose", "birch"], 2, "Oak, pine, and birch are trees; a rose is a flower.", "Odd-one-out"),
    mc("Kilometre is to distance as litre is to ___.", ["weight", "volume", "speed", "area"], 1, "Unit-to-quantity: kilometre measures distance, litre measures volume.", "Unit analogy"),
    mc("Glove is to hand as shoe is to ___.", ["sock", "foot", "leather", "lace"], 1, "Item worn on a body part: glove→hand, shoe→foot.", "Function analogy"),
  ],
};

const PATTERN_1: GeneratedSection = {
  skill: "quantitative",
  title: "Completing Numerical Series & Patterns",
  instructions: "Infer the rule of each series or pattern and choose the value that continues it.",
  passages: [],
  open: [],
  objective: [
    mc("Continue the series: 2, 4, 8, 16, ___", ["18", "24", "32", "64"], 2, "Each term doubles: 16 × 2 = 32.", "Number series (geometric)"),
    mc("Continue the series: 3, 6, 9, 12, ___", ["13", "14", "15", "18"], 2, "Arithmetic, +3 each step: 12 + 3 = 15.", "Number series (arithmetic)"),
    mc("Continue the series: 1, 1, 2, 3, 5, ___", ["6", "7", "8", "10"], 2, "Fibonacci: each term is the sum of the two before (3 + 5 = 8).", "Number series (Fibonacci)"),
    mc("Continue the series: 100, 81, 64, 49, ___", ["36", "40", "42", "45"], 0, "Squares descending: 10², 9², 8², 7², 6² = 36.", "Number series (squares)"),
    mc("Continue the series: 2, 5, 11, 23, ___", ["35", "41", "46", "47"], 3, "Each term = previous × 2 + 1: 23 × 2 + 1 = 47.", "Number series (rule)"),
    mc("Continue the series: A, C, F, J, ___", ["L", "M", "N", "O"], 3, "Gaps grow +2, +3, +4, +5: J (+5) → O.", "Letter pattern"),
  ],
};

/** The bundled offline TestAS Core-module form (clone via the page before answering). */
export const TESTAS_SEED: GeneratedExam = {
  examId: TESTAS_EXAM_ID,
  title: "TestAS — Core module (offline practice)",
  language: "en",
  sections: [QUANT_1, VERBAL_1, PATTERN_1],
  nonce: "seed-testas",
  isSeed: true,
};
