import type { MockExamDef } from "@/lib/types";

/**
 * GRE General — practice study aid (NOT the official test).
 * Format facts (Verbal 130–170, Quant 130–170, Writing 0–6; short format since Sep 2023) come from
 * the official ETS GRE test-structure page. Items below are original, generated practice questions
 * modelled on real GRE TYPES (Text Completion, Sentence Equivalence — modelled as single-best for
 * this engine, Reading Comprehension, Problem Solving, Quantitative Comparison). They are not real
 * exam items and do not predict a 130–170 scaled score. Practice length is shortened to ~16 minutes.
 */
const RC_PASSAGE = `Reading Comprehension passage

Historians once portrayed the medieval guild purely as a brake on innovation: by fixing prices,
limiting the number of masters, and standardizing techniques, guilds supposedly discouraged the
risk-taking on which technical progress depends. More recent scholarship complicates this view.
Guild records reveal that many guilds funded shared workshops, certified new methods, and trained
apprentices in skills that diffused across regions as journeymen travelled. The guild, in this
reading, was less an enemy of change than a mechanism for spreading it — albeit slowly and on the
guild's own terms.`;

export const GRE_EXAM: MockExamDef = {
  id: "gre-general-practice",
  title: "GRE General — practice set",
  durationMin: 16,
  passPct: 70,
  sections: [
    {
      name: "Verbal Reasoning",
      durationMin: 41,
      format: "Two sections: Text Completion, Sentence Equivalence, Reading Comprehension.",
      scoring: "Scaled 130–170 (1-point increments).",
    },
    {
      name: "Quantitative Reasoning",
      durationMin: 47,
      format: "Two sections: Problem Solving, Quantitative Comparison, Numeric Entry, Data Interpretation.",
      scoring: "Scaled 130–170 (1-point increments).",
    },
    {
      name: "Analytical Writing",
      durationMin: 30,
      format: "One 'Analyze an Issue' essay task (short format, since Sep 2023).",
      scoring: "0–6 in half-point increments.",
    },
  ],
  questions: [
    {
      id: "gre-q1",
      section: "Verbal · Text Completion",
      prompt:
        "Select the word that best completes the sentence: 'Although the committee's report was praised for its thoroughness, critics noted that its recommendations were so ______ that almost no concrete action could follow.'",
      choices: [
        { id: "a", text: "vague" },
        { id: "b", text: "meticulous" },
        { id: "c", text: "actionable" },
        { id: "d", text: "controversial" },
      ],
      answerId: "a",
      explanation:
        'The clue "almost no concrete action could follow" demands a word meaning unclear/non-specific: "vague." "Actionable" and "meticulous" contradict that result.',
    },
    {
      id: "gre-q2",
      section: "Verbal · Text Completion (two-blank logic)",
      prompt:
        "Choose the pair that best fits: 'Far from being ______, the author's late style grew increasingly ______, stripping away ornament until only the essential remained.'",
      choices: [
        { id: "a", text: "elaborate ... spare" },
        { id: "b", text: "spare ... elaborate" },
        { id: "c", text: "ornate ... decorative" },
        { id: "d", text: "concise ... economical" },
      ],
      answerId: "a",
      explanation:
        '"Far from being X, it grew Y" signals a contrast, and "stripping away ornament" points to a plain result. So X = elaborate (what it was NOT) and Y = spare (what it became).',
    },
    {
      id: "gre-q3",
      section: "Verbal · Sentence Equivalence (single-best for this engine)",
      prompt:
        "Pick the word that completes the sentence and yields the intended meaning: 'The normally ______ professor surprised everyone with a candid, unguarded lecture about her own early failures.'",
      choices: [
        { id: "a", text: "reticent" },
        { id: "b", text: "garrulous" },
        { id: "c", text: "gregarious" },
        { id: "d", text: "flamboyant" },
      ],
      answerId: "a",
      explanation:
        'The surprise is that she was "candid, unguarded," so she is normally the opposite — "reticent" (reserved). "Garrulous" and "gregarious" mean talkative/sociable, which is not surprising here.',
    },
    {
      id: "gre-q4",
      section: "Verbal · Reading Comprehension",
      passage: RC_PASSAGE,
      prompt: "The passage suggests that more recent scholarship views the medieval guild primarily as —",
      choices: [
        { id: "a", text: "an enemy of all technical change" },
        { id: "b", text: "a mechanism that spread new methods, though slowly" },
        { id: "c", text: "an institution focused only on fixing prices" },
        { id: "d", text: "a purely modern invention" },
      ],
      answerId: "b",
      explanation:
        'The passage concludes the guild "was less an enemy of change than a mechanism for spreading it — albeit slowly." (a) is the OLD view the passage revises.',
    },
    {
      id: "gre-q5",
      section: "Quant · Problem Solving",
      prompt:
        "A jacket is marked up 25% above its $80 cost, then sold at a 20% discount off the marked price. What is the final selling price?",
      choices: [
        { id: "a", text: "$76" },
        { id: "b", text: "$80" },
        { id: "c", text: "$84" },
        { id: "d", text: "$100" },
      ],
      answerId: "b",
      explanation:
        "Marked price = 80 × 1.25 = $100. After a 20% discount: 100 × 0.80 = $80. The two changes happen to cancel here.",
    },
    {
      id: "gre-q6",
      section: "Quant · Quantitative Comparison",
      prompt:
        "Quantity A: the value of 3^4. Quantity B: the value of 4^3. Which statement is correct?",
      choices: [
        { id: "a", text: "Quantity A is greater" },
        { id: "b", text: "Quantity B is greater" },
        { id: "c", text: "The two quantities are equal" },
        { id: "d", text: "The relationship cannot be determined" },
      ],
      answerId: "a",
      explanation:
        "3^4 = 81 and 4^3 = 64. Since 81 > 64, Quantity A is greater. Quantitative Comparison asks you to compare two fixed quantities.",
    },
    {
      id: "gre-q7",
      section: "Quant · Problem Solving",
      prompt:
        "If the average (arithmetic mean) of 5 numbers is 18, and four of them are 12, 16, 20, and 24, what is the fifth number?",
      choices: [
        { id: "a", text: "16" },
        { id: "b", text: "18" },
        { id: "c", text: "20" },
        { id: "d", text: "90" },
      ],
      answerId: "b",
      explanation:
        "Sum of all five = 5 × 18 = 90. The known four sum to 12 + 16 + 20 + 24 = 72. So the fifth = 90 − 72 = 18.",
    },
    {
      id: "gre-q8",
      section: "Quant · Problem Solving",
      prompt:
        "A train travels 240 km in 3 hours, then 180 km in 2 hours. What is its average speed for the whole trip (km/h)?",
      choices: [
        { id: "a", text: "78" },
        { id: "b", text: "80" },
        { id: "c", text: "84" },
        { id: "d", text: "90" },
      ],
      answerId: "c",
      explanation:
        "Average speed = total distance / total time = (240 + 180) / (3 + 2) = 420 / 5 = 84 km/h. Average speed uses totals, not the average of the two speeds.",
    },
  ],
};

export default GRE_EXAM;
