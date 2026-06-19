import type { MockExamDef } from "@/lib/types";

/**
 * TOEFL iBT — practice study aid (NOT the official test).
 * The TOEFL iBT was redesigned in January 2026 and now reports a 1–6 scale per section plus an
 * overall band (0–120 also reported during the transition). Format facts below are from the
 * official ETS TOEFL content page; the questions are original, generated practice items modelled
 * on real TOEFL TYPES (academic-passage MCQ and a "Write for an Academic Discussion"
 * comprehension item). They are not real exam items and do not predict your real score.
 * Practice length is shortened to ~15 minutes; the real test runs ~2 hours.
 */
const READING_PASSAGE = `Bioluminescence in the Deep Ocean

In the deep sea, where sunlight cannot reach, many organisms produce their own light through a
chemical reaction known as bioluminescence. The reaction typically involves a light-emitting
molecule, luciferin, and an enzyme, luciferase. When the two combine in the presence of oxygen,
energy is released as visible light rather than as heat — a property biologists call "cold light."

The functions of this light are varied. Some species use it to attract prey: the anglerfish, for
example, dangles a glowing lure in front of its mouth. Others use light defensively. Certain
squid eject a glowing cloud to confuse predators, much as a shallow-water octopus releases ink.
A third group uses light for communication and mating, flashing distinctive patterns that allow
members of the same species to recognise one another in the darkness. Because each strategy
depends on being seen by the right audience, the colour and timing of the light are often
finely tuned to the conditions of the animal's particular habitat.`;

const DISCUSSION_PROMPT = `"Write for an Academic Discussion" — comprehension item

Professor: "We have been discussing how cities should respond to rising summer temperatures.
Some argue the priority should be planting more trees to provide shade and cooling. Others say
limited budgets are better spent on installing cool, reflective roofing on existing buildings.
In your reply to a classmate, take a clear position and support it with one specific reason."

Student post (Min-ji): "I think planting trees is the better long-term choice. Trees keep cooling
the city for decades and also improve air quality, while reflective roofs only help the single
building they are installed on."`;

export const TOEFL_EXAM: MockExamDef = {
  id: "toefl-ibt-practice",
  title: "TOEFL iBT — practice set",
  durationMin: 15,
  passPct: 70,
  sections: [
    {
      name: "Reading",
      durationMin: 30,
      format: "~50 questions on academic passages (MCQ: detail, inference, vocabulary, purpose).",
      scoring: "1–6 scale per section (post Jan-2026 redesign); 0–120 overall also reported in transition.",
    },
    {
      name: "Listening",
      durationMin: 29,
      format: "~47 questions on academic lectures and campus conversations.",
      scoring: "1–6 per section.",
    },
    {
      name: "Speaking",
      durationMin: 8,
      format: "~11 tasks incl. independent + integrated speaking; new 'Take an Interview' task.",
      scoring: "1–6 per section.",
    },
    {
      name: "Writing",
      durationMin: 23,
      format: "~12 tasks incl. integrated writing and 'Write for an Academic Discussion'.",
      scoring: "1–6 per section.",
    },
  ],
  questions: [
    {
      id: "toefl-q1",
      section: "Reading · Detail",
      passage: READING_PASSAGE,
      prompt: "According to the passage, what is released when luciferin and luciferase combine?",
      choices: [
        { id: "a", text: "Energy in the form of visible light" },
        { id: "b", text: "Mostly heat, with a little light" },
        { id: "c", text: "Oxygen and water" },
        { id: "d", text: "An electric charge" },
      ],
      answerId: "a",
      explanation:
        'The passage states "energy is released as visible light rather than as heat," which is why it is called "cold light."',
    },
    {
      id: "toefl-q2",
      section: "Reading · Vocabulary in context",
      passage: READING_PASSAGE,
      prompt: 'In the passage, the word "lure" most nearly means —',
      choices: [
        { id: "a", text: "a warning signal" },
        { id: "b", text: "something used to attract" },
        { id: "c", text: "a type of enzyme" },
        { id: "d", text: "a defensive cloud" },
      ],
      answerId: "b",
      explanation:
        'The anglerfish "dangles a glowing lure in front of its mouth" to attract prey, so "lure" means something used to attract.',
    },
    {
      id: "toefl-q3",
      section: "Reading · Inference",
      passage: READING_PASSAGE,
      prompt:
        "It can be inferred from the passage that the squid's glowing cloud serves a purpose most similar to —",
      choices: [
        { id: "a", text: "the anglerfish's glowing lure" },
        { id: "b", text: "a shallow-water octopus releasing ink" },
        { id: "c", text: "species flashing patterns to find a mate" },
        { id: "d", text: "luciferase combining with oxygen" },
      ],
      answerId: "b",
      explanation:
        'The passage directly draws the comparison: the squid ejects a glowing cloud "much as a shallow-water octopus releases ink" — both are defensive distractions.',
    },
    {
      id: "toefl-q4",
      section: "Reading · Purpose",
      passage: READING_PASSAGE,
      prompt: "Why does the author mention communication and mating in the second paragraph?",
      choices: [
        { id: "a", text: "To prove bioluminescence wastes energy" },
        { id: "b", text: "To give a third example of how organisms use their light" },
        { id: "c", text: "To argue that anglerfish are the most advanced species" },
        { id: "d", text: "To explain how luciferin is produced" },
      ],
      answerId: "b",
      explanation:
        "The paragraph lists functions of bioluminescence — attracting prey, defence, then communication/mating as a third example ('A third group...').",
    },
    {
      id: "toefl-q5",
      section: "Reading · Detail",
      passage: READING_PASSAGE,
      prompt: "According to the passage, why are the colour and timing of the light often finely tuned?",
      choices: [
        { id: "a", text: "Because deep-sea water filters out all colours equally" },
        { id: "b", text: "Because each strategy depends on being seen by the right audience" },
        { id: "c", text: "Because luciferase only works at certain temperatures" },
        { id: "d", text: "Because predators cannot see any light at all" },
      ],
      answerId: "b",
      explanation:
        'The final sentence states the colour and timing are tuned "Because each strategy depends on being seen by the right audience."',
    },
    {
      id: "toefl-q6",
      section: "Writing · Academic Discussion (comprehension)",
      passage: DISCUSSION_PROMPT,
      prompt: "What position does the student, Min-ji, take in her post?",
      choices: [
        { id: "a", text: "Cities should prioritise reflective roofing over trees" },
        { id: "b", text: "Cities should prioritise planting trees over reflective roofing" },
        { id: "c", text: "Cities should spend nothing on cooling" },
        { id: "d", text: "Cities should ban new buildings entirely" },
      ],
      answerId: "b",
      explanation:
        'Min-ji writes "I think planting trees is the better long-term choice," taking the tree-planting position. A strong "Write for an Academic Discussion" reply must first identify the stance before responding.',
    },
    {
      id: "toefl-q7",
      section: "Writing · Academic Discussion (comprehension)",
      passage: DISCUSSION_PROMPT,
      prompt: "Which reason does Min-ji give to support her position?",
      choices: [
        { id: "a", text: "Trees are cheaper to install than reflective roofs" },
        { id: "b", text: "Reflective roofs help the entire neighbourhood at once" },
        { id: "c", text: "Trees keep cooling for decades and improve air quality" },
        { id: "d", text: "Reflective roofs last longer than trees" },
      ],
      answerId: "c",
      explanation:
        'Her supporting reason is that "Trees keep cooling the city for decades and also improve air quality," contrasting with roofs that only help one building.',
    },
    {
      id: "toefl-q8",
      section: "Writing · Academic Discussion (comprehension)",
      passage: DISCUSSION_PROMPT,
      prompt:
        "To earn a high score, what should YOUR reply do in this task type?",
      choices: [
        { id: "a", text: "Repeat the professor's question word for word" },
        { id: "b", text: "State a clear position and support it with a specific, relevant reason" },
        { id: "c", text: "Agree with every classmate to avoid conflict" },
        { id: "d", text: "Write only one short sentence with no reason" },
      ],
      answerId: "b",
      explanation:
        'The prompt asks you to "take a clear position and support it with one specific reason." High-scoring replies are on-topic, take a stance, and develop it with relevant detail.',
    },
  ],
};

export default TOEFL_EXAM;
