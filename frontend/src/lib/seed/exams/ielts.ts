import type { MockExamDef } from "@/lib/types";

/**
 * IELTS Academic — practice study aid (NOT the official test).
 * Format facts (sections, durations, Band 0–9 scoring) are from the official IELTS Academic
 * format page; the questions below are original, generated practice items modelled on the real
 * IELTS Academic question TYPES (True/False/Not Given, Matching headings, Summary completion,
 * note-completion). They are not real exam items and do not predict your real band score.
 * Practice length is shortened to ~14 minutes; the real test runs ~2h45m.
 */
const READING_PASSAGE = `The Rise of Urban Beekeeping

Over the past two decades, beekeeping has moved from the countryside into the heart of major
cities. Rooftops, balconies and community gardens in London, Paris and Berlin now host tens of
thousands of hives. Advocates argue that cities can be surprisingly hospitable to honeybees:
urban parks and private gardens offer a long, varied flowering season, and city temperatures
are often a few degrees warmer than the surrounding countryside, extending the foraging period.

Not everyone is convinced the trend is healthy, however. Some researchers warn that a rapid
increase in managed honeybee colonies may place wild pollinators — such as solitary bees and
bumblebees — under pressure, because the two groups compete for the same limited flowers. A
2020 study in one European capital found that the number of registered hives had grown faster
than the available forage could comfortably support. The authors did not call for a ban, but
they recommended that cities plant more bee-friendly flowers before approving new hives.`;

const NOTES_PASSAGE = `Listening note-completion (transcript excerpt rendered as text)

"Welcome to the community garden induction. Sessions run every Saturday from nine until eleven.
Please bring your own gloves; tools are provided. The annual membership fee is twenty-four euros,
and that includes access to the shared greenhouse. New members must attend at least one safety
briefing before using the powered equipment."`;

export const IELTS_EXAM: MockExamDef = {
  id: "ielts-academic-practice",
  title: "IELTS Academic — practice set",
  durationMin: 14,
  passPct: 70,
  sections: [
    {
      name: "Listening",
      durationMin: 30,
      format: "4 recorded sections, 40 questions (note/form/sentence completion, matching, MCQ).",
      scoring: "Contributes to the overall Band 0–9 (each section reported as a band).",
    },
    {
      name: "Reading",
      durationMin: 60,
      format: "3 academic passages, 40 questions (True/False/Not Given, matching headings, summary completion).",
      scoring: "Band 0–9.",
    },
    {
      name: "Writing",
      durationMin: 60,
      format: "Task 1 (describe a graph/chart/process, 150+ words) + Task 2 (essay, 250+ words).",
      scoring: "Band 0–9, scored on task achievement, coherence, lexis, grammar.",
    },
    {
      name: "Speaking",
      durationMin: 14,
      format: "Face-to-face interview: intro, cue-card long turn, two-way discussion (11–14 min).",
      scoring: "Band 0–9.",
    },
  ],
  questions: [
    {
      id: "ielts-q1",
      section: "Reading · True / False / Not Given",
      passage: READING_PASSAGE,
      prompt:
        'Statement: "City temperatures can lengthen the period during which urban bees can forage." According to the passage, is this TRUE, FALSE, or NOT GIVEN?',
      choices: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
        { id: "c", text: "Not Given" },
        { id: "d", text: "True only in London" },
      ],
      answerId: "a",
      explanation:
        'The passage states city temperatures "are often a few degrees warmer ... extending the foraging period," which matches the statement, so it is True. (City-specific limits like "only in London" are not claimed.)',
    },
    {
      id: "ielts-q2",
      section: "Reading · True / False / Not Given",
      passage: READING_PASSAGE,
      prompt:
        'Statement: "The 2020 study recommended banning all new urban hives." Is this TRUE, FALSE, or NOT GIVEN?',
      choices: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
        { id: "c", text: "Not Given" },
        { id: "d", text: "Partly true" },
      ],
      answerId: "b",
      explanation:
        'The text explicitly says the authors "did not call for a ban" and instead recommended planting more flowers, so the statement is False (a direct contradiction = False, not Not Given).',
    },
    {
      id: "ielts-q3",
      section: "Reading · True / False / Not Given",
      passage: READING_PASSAGE,
      prompt:
        'Statement: "Urban honey sells for a higher price than rural honey." Is this TRUE, FALSE, or NOT GIVEN?',
      choices: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
        { id: "c", text: "Not Given" },
        { id: "d", text: "False, it sells for less" },
      ],
      answerId: "c",
      explanation:
        "The passage never mentions the price of honey at all, so there is no basis to confirm or contradict the claim: Not Given.",
    },
    {
      id: "ielts-q4",
      section: "Reading · Matching headings",
      passage: READING_PASSAGE,
      prompt:
        "Choose the best heading for the SECOND paragraph (beginning 'Not everyone is convinced...').",
      choices: [
        { id: "a", text: "Why cities suit honeybees" },
        { id: "b", text: "Concerns about competition with wild pollinators" },
        { id: "c", text: "A complete history of beekeeping" },
        { id: "d", text: "How to harvest urban honey" },
      ],
      answerId: "b",
      explanation:
        "The second paragraph is about researchers' worries that managed honeybees compete with wild bees for limited forage — heading (b) captures the paragraph's main idea; (a) describes paragraph one.",
    },
    {
      id: "ielts-q5",
      section: "Reading · Summary completion",
      passage: READING_PASSAGE,
      prompt:
        "Summary completion — choose the word that fits: 'The study found hives had grown faster than the available ______ could support.'",
      choices: [
        { id: "a", text: "forage" },
        { id: "b", text: "rooftops" },
        { id: "c", text: "temperature" },
        { id: "d", text: "membership" },
      ],
      answerId: "a",
      explanation:
        'The passage says hives "had grown faster than the available forage could comfortably support," so the missing word is "forage."',
    },
    {
      id: "ielts-q6",
      section: "Listening · Note completion",
      passage: NOTES_PASSAGE,
      prompt: "Complete the note: 'Sessions run every Saturday from ______.'",
      choices: [
        { id: "a", text: "nine until eleven" },
        { id: "b", text: "eight until ten" },
        { id: "c", text: "ten until twelve" },
        { id: "d", text: "nine until noon" },
      ],
      answerId: "a",
      explanation:
        'The transcript states sessions run "every Saturday from nine until eleven." Note-completion answers must come word-for-word from the recording.',
    },
    {
      id: "ielts-q7",
      section: "Listening · Note completion",
      passage: NOTES_PASSAGE,
      prompt: "Complete the note: 'The annual membership fee is ______.'",
      choices: [
        { id: "a", text: "fourteen euros" },
        { id: "b", text: "twenty-four euros" },
        { id: "c", text: "twenty euros" },
        { id: "d", text: "forty euros" },
      ],
      answerId: "b",
      explanation:
        'The speaker says the fee is "twenty-four euros." Listen carefully for fourteen vs. forty vs. twenty-four — these are classic IELTS distractors.',
    },
    {
      id: "ielts-q8",
      section: "Listening · Sentence completion",
      passage: NOTES_PASSAGE,
      prompt:
        "Before using powered equipment, new members must first attend at least one ______.",
      choices: [
        { id: "a", text: "greenhouse tour" },
        { id: "b", text: "committee meeting" },
        { id: "c", text: "safety briefing" },
        { id: "d", text: "gardening class" },
      ],
      answerId: "c",
      explanation:
        'The transcript states new members "must attend at least one safety briefing before using the powered equipment."',
    },
  ],
};

export default IELTS_EXAM;
