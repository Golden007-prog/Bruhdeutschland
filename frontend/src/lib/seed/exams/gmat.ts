import type { MockExamDef } from "@/lib/types";

/**
 * GMAT Focus Edition — practice study aid (NOT the official test).
 * Format facts (Quant 21Q/45m, Verbal 23Q/45m, Data Insights 20Q/45m; Total 205–805) come from the
 * official GMAC GMAT exam-structure page. Items below are original, generated practice questions
 * modelled on real GMAT Focus TYPES (Problem Solving, Critical Reasoning, Reading Comprehension,
 * Data Sufficiency and Two-Part Analysis — the last two modelled as single-best for this engine).
 * They are not real exam items and do not predict a 205–805 score. Practice length is shortened to
 * ~16 minutes.
 */
const CR_PASSAGE = `Critical Reasoning context

A city council notes that since it installed protected bike lanes on Main Street two years ago,
the number of cyclists on that street has tripled, while reported collisions involving cyclists
have fallen. The council concludes that building protected bike lanes on every major street
would similarly reduce collisions citywide.`;

const RC_PASSAGE = `Reading Comprehension passage

Coral reefs occupy less than one percent of the ocean floor, yet they support roughly a quarter
of all marine species. This disproportionate richness arises partly from the reef's physical
complexity: its crevices and overhangs create countless microhabitats, each favouring different
organisms. When rising sea temperatures cause corals to expel the algae that nourish them — a
process called bleaching — the structure may persist for a time, but the living architecture that
generates new habitat begins to erode, and dependent species decline soon after.`;

export const GMAT_EXAM: MockExamDef = {
  id: "gmat-focus-practice",
  title: "GMAT Focus Edition — practice set",
  durationMin: 16,
  passPct: 70,
  sections: [
    {
      name: "Quantitative Reasoning",
      durationMin: 45,
      format: "21 Problem Solving questions (no geometry; algebra, arithmetic, word problems).",
      scoring: "Section 60–90; contributes to Total 205–805.",
    },
    {
      name: "Verbal Reasoning",
      durationMin: 45,
      format: "23 questions: Critical Reasoning and Reading Comprehension.",
      scoring: "Section 60–90.",
    },
    {
      name: "Data Insights",
      durationMin: 45,
      format: "20 questions: Data Sufficiency, Two-Part Analysis, Table/Graphics analysis, Multi-Source Reasoning.",
      scoring: "Section 60–90.",
    },
  ],
  questions: [
    {
      id: "gmat-q1",
      section: "Quant · Problem Solving",
      prompt:
        "A store sells pens at 3 for $2. How much will 30 pens cost at this rate?",
      choices: [
        { id: "a", text: "$15" },
        { id: "b", text: "$20" },
        { id: "c", text: "$45" },
        { id: "d", text: "$60" },
      ],
      answerId: "b",
      explanation:
        "30 pens = 10 groups of 3. Each group costs $2, so 10 × $2 = $20.",
    },
    {
      id: "gmat-q2",
      section: "Quant · Problem Solving",
      prompt:
        "If 2x + 3 = 17, what is the value of 5x?",
      choices: [
        { id: "a", text: "7" },
        { id: "b", text: "14" },
        { id: "c", text: "35" },
        { id: "d", text: "85" },
      ],
      answerId: "c",
      explanation:
        "2x + 3 = 17 → 2x = 14 → x = 7. Then 5x = 5 × 7 = 35.",
    },
    {
      id: "gmat-q3",
      section: "Quant · Problem Solving",
      prompt:
        "A company's revenue rose from $400,000 to $500,000. What was the percent increase?",
      choices: [
        { id: "a", text: "10%" },
        { id: "b", text: "20%" },
        { id: "c", text: "25%" },
        { id: "d", text: "80%" },
      ],
      answerId: "c",
      explanation:
        "Increase = $100,000 on a base of $400,000. 100,000 / 400,000 = 0.25 = 25%. Percent change is always relative to the original value.",
    },
    {
      id: "gmat-q4",
      section: "Verbal · Critical Reasoning",
      passage: CR_PASSAGE,
      prompt: "Which of the following, if true, most weakens the council's conclusion?",
      choices: [
        {
          id: "a",
          text: "Main Street is the only major street that connects directly to the city's largest park, attracting unusually safety-conscious recreational cyclists.",
        },
        { id: "b", text: "The protected bike lanes on Main Street were inexpensive to install." },
        { id: "c", text: "Most residents support building more bike lanes." },
        { id: "d", text: "Cycling is a popular form of exercise in the city." },
      ],
      answerId: "a",
      explanation:
        "The conclusion generalizes from Main Street to all streets. (a) shows Main Street is atypical (a special, safety-conscious population), undermining the generalization. The others are irrelevant to whether the result would transfer.",
    },
    {
      id: "gmat-q5",
      section: "Verbal · Critical Reasoning",
      passage: CR_PASSAGE,
      prompt: "The council's argument depends on which of the following assumptions?",
      choices: [
        {
          id: "a",
          text: "Other major streets are similar enough to Main Street that the same intervention would have a comparable effect.",
        },
        { id: "b", text: "Cyclists prefer Main Street to all other streets." },
        { id: "c", text: "The city has unlimited funds for construction." },
        { id: "d", text: "Collisions are the only safety concern for cyclists." },
      ],
      answerId: "a",
      explanation:
        "For the citywide conclusion to follow from one street's results, the council must assume the other streets are relevantly similar. This is the necessary bridging assumption.",
    },
    {
      id: "gmat-q6",
      section: "Verbal · Reading Comprehension",
      passage: RC_PASSAGE,
      prompt: "According to the passage, the high species richness of coral reefs arises partly because —",
      choices: [
        { id: "a", text: "reefs cover most of the ocean floor" },
        { id: "b", text: "the reef's physical complexity creates many microhabitats" },
        { id: "c", text: "warmer water increases the number of species" },
        { id: "d", text: "algae are the only organisms that live there" },
      ],
      answerId: "b",
      explanation:
        'The passage attributes the richness to "the reef\'s physical complexity: its crevices and overhangs create countless microhabitats." (a) is contradicted (reefs cover <1%).',
    },
    {
      id: "gmat-q7",
      section: "Data Insights · Data Sufficiency (single-best)",
      prompt:
        "Question: Is the integer n even? Statement (1): n + 1 is odd. Statement (2): 3n is even. Which option correctly describes sufficiency?",
      choices: [
        { id: "a", text: "Statement (1) ALONE is sufficient, but (2) alone is not." },
        { id: "b", text: "Statement (2) ALONE is sufficient, but (1) alone is not." },
        { id: "c", text: "EACH statement ALONE is sufficient." },
        { id: "d", text: "Statements (1) and (2) TOGETHER are still not sufficient." },
      ],
      answerId: "c",
      explanation:
        "From (1): n + 1 odd → n is even (sufficient). From (2): 3n even → n must be even, since 3 is odd (sufficient). Each statement alone settles the question, so the answer is 'each alone is sufficient.'",
    },
    {
      id: "gmat-q8",
      section: "Data Insights · Two-Part Analysis (single-best)",
      prompt:
        "A café sells small coffees at $3 and large coffees at $5. On one morning it sold 40 coffees for $164 total. How many SMALL coffees were sold? (Two-Part style: solve the system, report the small count.)",
      choices: [
        { id: "a", text: "18" },
        { id: "b", text: "22" },
        { id: "c", text: "26" },
        { id: "d", text: "28" },
      ],
      answerId: "a",
      explanation:
        "Let s = small, l = large. s + l = 40 and 3s + 5l = 164. Substitute l = 40 − s: 3s + 5(40 − s) = 164 → 3s + 200 − 5s = 164 → −2s = −36 → s = 18 (and l = 22).",
    },
  ],
};

export default GMAT_EXAM;
