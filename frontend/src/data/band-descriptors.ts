/**
 * Band-descriptor ANCHORS for AI rubric scoring (work-order §7). The model must quote the descriptor
 * phrase that justifies each sub-score, so the estimate carries provenance instead of a bare number.
 * These are concise paraphrases of the public top-band descriptors (not verbatim reproductions) with
 * a source link; treat as indicative and `needs_verification` against the official rubric.
 */
export interface CriterionDescriptor {
  name: string;
  /** A short anchor describing top-band performance for this criterion. */
  descriptor: string;
}

export interface RubricSet {
  criteria: CriterionDescriptor[];
  /** Max sub-score per criterion (the band ceiling). */
  maxPerCriterion: number;
  bandLabel: string;
  source_name: string;
  source_url: string;
  needs_verification: boolean;
}

const IELTS_WRITING: RubricSet = {
  bandLabel: "Band",
  maxPerCriterion: 9,
  source_name: "IELTS — Writing band descriptors (public)",
  source_url: "https://www.ielts.org/for-test-takers/how-ielts-is-scored",
  needs_verification: true,
  criteria: [
    { name: "Task Achievement / Response", descriptor: "fully addresses all parts of the task with a clear, fully developed position and relevant, extended, well-supported ideas" },
    { name: "Coherence & Cohesion", descriptor: "sequences information logically with clear progression; manages cohesion and paragraphing so naturally it attracts no attention" },
    { name: "Lexical Resource", descriptor: "uses a wide range of vocabulary with very natural and sophisticated control of meaning and collocation; only rare minor slips" },
    { name: "Grammatical Range & Accuracy", descriptor: "uses a wide range of structures with full flexibility and accuracy; only rare minor errors as slips" },
  ],
};

const IELTS_SPEAKING: RubricSet = {
  bandLabel: "Band",
  maxPerCriterion: 9,
  source_name: "IELTS — Speaking band descriptors (public)",
  source_url: "https://www.ielts.org/for-test-takers/how-ielts-is-scored",
  needs_verification: true,
  criteria: [
    { name: "Fluency & Coherence", descriptor: "speaks fluently with only very occasional repetition or self-correction; develops topics fully and coherently" },
    { name: "Lexical Resource", descriptor: "uses vocabulary with full flexibility and precision and uses idiomatic language naturally and accurately" },
    { name: "Grammatical Range & Accuracy", descriptor: "uses a full range of structures naturally and appropriately with consistently accurate control apart from slips" },
    { name: "Pronunciation", descriptor: "uses a full range of pronunciation features with precision and subtlety and is effortless to understand" },
  ],
};

const TOEFL_WRITING: RubricSet = {
  bandLabel: "Score",
  maxPerCriterion: 6,
  source_name: "ETS — TOEFL writing rubric (2026)",
  source_url: "https://www.ets.org/toefl.html",
  needs_verification: true,
  criteria: [
    { name: "Development", descriptor: "responds fully and clearly to the task with well-chosen, well-elaborated details and examples" },
    { name: "Organization", descriptor: "is well organised with a clear progression of ideas and effective connections between them" },
    { name: "Language Use", descriptor: "displays a range of vocabulary and syntax with strong control; errors are rare and do not impede meaning" },
  ],
};

const TOEFL_SPEAKING: RubricSet = {
  bandLabel: "Score",
  maxPerCriterion: 6,
  source_name: "ETS — TOEFL speaking rubric (2026)",
  source_url: "https://www.ets.org/toefl.html",
  needs_verification: true,
  criteria: [
    { name: "Delivery", descriptor: "speech is clear and fluent with well-paced, intelligible pronunciation and natural intonation" },
    { name: "Language Use", descriptor: "uses vocabulary and grammar effectively with good control, range, and automaticity" },
    { name: "Topic Development", descriptor: "responds fully and coherently with well-developed, clearly connected ideas" },
  ],
};

const GENERIC: RubricSet = {
  bandLabel: "Score",
  maxPerCriterion: 5,
  source_name: "Generic writing rubric",
  source_url: "",
  needs_verification: true,
  criteria: [
    { name: "Content", descriptor: "fully and relevantly addresses the task with developed, supported ideas" },
    { name: "Organization", descriptor: "is clearly structured with logical progression and effective cohesion" },
    { name: "Language", descriptor: "uses a range of accurate vocabulary and grammar with strong control" },
  ],
};

const TABLE: Record<string, { writing: RubricSet; speaking: RubricSet }> = {
  ielts: { writing: IELTS_WRITING, speaking: IELTS_SPEAKING },
  toefl: { writing: TOEFL_WRITING, speaking: TOEFL_SPEAKING },
  "toefl-legacy": { writing: TOEFL_WRITING, speaking: TOEFL_SPEAKING },
};

/** Get the rubric anchor set for an exam + open skill (writing/speaking). Falls back to a generic set. */
export function rubricFor(examId: string, skill: string): RubricSet {
  const fam = TABLE[examId];
  if (fam) return skill === "speaking" ? fam.speaking : fam.writing;
  return GENERIC;
}
