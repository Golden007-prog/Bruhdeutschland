/**
 * Prompt builders for per-section exam generation (work-order §3/§5). Each call asks the model for
 * ONE {@link GeneratedSection} as strict JSON. We inject the official structure from exam-specs, a
 * topic + nonce for freshness, the authentic question types, the target difficulty (for TOEFL-2026
 * multistage), and — for Listening — a multi-speaker, accented transcript so the TTS tiers can render
 * a natural conversation. The model only WRITES content; all marking is deterministic (scoring.ts).
 */
import type { ExamSpec, SectionSpec } from "@/data/exam-specs";

export type Difficulty = "easier" | "standard" | "harder";

/** Compact human-readable shape used in the prompt and for repair retries. */
export const SECTION_SCHEMA_HINT = [
  "{",
  '  "skill": string, "title": string, "instructions": string,',
  '  "passages": [{ "id": string, "title": string, "body": string, "kind": "reading"|"listening",',
  '    "accent": string?, "speakers": [{ "id": string, "name": string, "accent": string?, "style": string?, "gender": "male"|"female"|"neutral"? }]?,',
  '    "lines": [{ "speakerId": string, "text": string }]? }],',
  '  "objective": [{ "id": string, "kind": "objective", "responseType": "single"|"multi"|"text"|"matching"|"ordering",',
  '    "typeLabel": string, "prompt": string, "choices": [{ "id": string, "text": string }],',
  '    "answerId": string?, "answerIds": string[]?, "acceptable": string[]?,',
  '    "pairs": [{ "id": string, "leftText": string, "answerId": string }]?,',
  '    "tokens": [{ "id": string, "text": string }]?, "order": string[]?,',
  '    "explanation": string, "passageRef": string?, "sourceRef": string? }],',
  '  "open": [{ "id": string, "kind": "open", "typeLabel": string, "prompt": string, "guidance": string?,',
  '    "minWords": number?, "prepSeconds": number?, "recordSeconds": number? }],',
  '  "figure": { "chartType": "bar"|"line"|"pie"|"table", "title": string, "xLabel": string?,',
  '    "yLabel": string?, "series": [{ "name": string, "points": [{ "label": string, "value": number }] }] }?',
  "}",
].join("\n");

const RESPONSE_TYPE_RULES = [
  "Choose responseType to match the authentic task and mark deterministically:",
  '- "single": one correct choice (MCQ, True/False/Not Given, Yes/No/Not Given). Needs ≥2 choices + answerId.',
  '- "multi": choose-TWO/▸several. Needs choices + answerIds (the full correct set).',
  '- "text": gap-fill / completion / short-answer / "Complete the Words". choices empty; give "acceptable" (1–3 exact accepted strings, lowercase ok).',
  '- "matching": matching headings/features/information, plan/map labelling. Put the option bank in "choices" and each item to match in "pairs" ({id, leftText, answerId→a choice id}).',
  '- "ordering": "Build a Sentence" / sentence ordering. Give "tokens" (the shuffled words) and "order" (token ids in correct sequence).',
].join("\n");

export interface SectionPromptCtx {
  spec: ExamSpec;
  section: SectionSpec;
  nonce: string;
  topics: string[];
  /** Optional CEFR level for Goethe. */
  level?: string;
  /** TOEFL-2026 multistage difficulty for this stage. */
  difficulty?: Difficulty;
  /** Stage label for adaptive sections ("routing" stage 1, "adapted" stage 2). */
  stage?: 1 | 2;
}

function listeningGuidance(section: SectionSpec): string[] {
  const accents = section.accents?.length ? section.accents.join(", ") : "varied native accents";
  return [
    `Write the audio as transcript "passages" with kind "listening" (read aloud by TTS, hidden until review).`,
    `For CONVERSATIONS, populate "speakers" (2–4, each with a name + an "accent" drawn from: ${accents}, plus a short "style" like warm/formal/hurried and a "gender") and "lines" ([{speakerId, text}]) forming a natural back-and-forth; ALSO fill "body" with the full readable transcript.`,
    `For MONOLOGUES (lecture/announcement), set "accent" on the passage and put the script in "body" (no speakers needed).`,
    `Make recordings PARAPHRASE the questions and include realistic distractors (a speaker correcting themselves, numbers restated, etc.).`,
  ];
}

export function buildSectionPrompt(ctx: SectionPromptCtx): string {
  const { spec, section, nonce, topics, level, difficulty, stage } = ctx;
  const lang = spec.language === "de" ? "German" : "English";
  const examId = spec.id;
  const skill = section.skill;
  const isListening = skill === "listening";
  const isReading = skill === "reading";
  const isWriting = skill === "writing" || skill === "analytical_writing";
  const isSpeaking = skill === "speaking";
  const types = section.questionTypes?.length
    ? `Authentic question/task types to draw from: ${section.questionTypes.join("; ")}.`
    : "";

  const lines: string[] = [
    `You are an expert ${spec.title} item writer. Generate ONE section as STRICT JSON only (no prose, no code fences).`,
    `Exam: ${spec.title}. Section: ${section.label} (skill="${skill}"). Content language: ${lang}.`,
    level ? `Target CEFR level: ${level}.` : "",
    difficulty ? `Target difficulty: ${difficulty}${stage ? ` (multistage stage ${stage}${stage === 2 ? ", adapted to performance" : ", routing"})` : ""} — tune vocabulary, inference load, and distractor subtlety accordingly.` : "",
    `Variety seed: ${nonce}. Center the material on: ${topics.join("; ")}. Avoid reusing these exact titles/topics if possible.`,
    types,
    RESPONSE_TYPE_RULES,
    `Every objective item needs a one-sentence "explanation" and, where applicable, a "sourceRef" quoting the passage/transcript line that proves the answer. Use stable unique ids for every passage/question/choice/pair/token (e.g. "p1", "q1", "q1c2", "q1p1", "q1t3").`,
  ];

  if (isReading) {
    if (examId === "toefl") {
      lines.push(
        `Produce ${section.questions} TOEFL-2026 Reading items mixing: "Complete the Words" (responseType "text" cloze — short passage in "passages", several gap items with acceptable answers), "Read in Daily Life" (responseType "single" — an ad/menu/form/email in a passage, MCQ), and "Read an Academic Passage" (a ~200-word academic passage with 4–5 "single" MCQs). Reference passages via "passageRef".`,
      );
    } else if (examId === "toefl-legacy") {
      lines.push(
        `Produce 1–2 academic passages (~500–700 words) and ${section.questions} legacy-TOEFL "single" MCQ items (factual, inference, vocabulary-in-context, sentence simplification, rhetorical purpose), referencing passages via "passageRef".`,
      );
    } else {
      lines.push(
        `Write ${examId === "ielts" ? "passages totalling 3 academic texts (~700–900 words each)" : "1–2 academic passage(s) (~500–800 words)"} in "passages" (kind "reading"). Produce ${section.questions} items using a realistic MIX of responseTypes: some "single" (MCQ + True/False/Not Given), at least one "matching" (matching headings/information — option bank in choices, items in pairs), and at least one "text" (summary/sentence completion). Paraphrase between question and text.`,
      );
    }
  }

  if (isListening) {
    lines.push(...listeningGuidance(section));
    if (examId === "ielts") lines.push(`Use 4 parts (conversation, monologue, academic discussion ≤4 speakers, lecture). Produce ${section.questions} items mixing "single", "matching" (incl. plan/map labelling), and "text" (form/note/table completion).`);
    else lines.push(`Produce ${section.questions} items mixing "single" and "text".`);
  }

  if (isWriting) {
    if (examId === "toefl") {
      lines.push(
        `TOEFL-2026 Writing. In "objective", add 2–3 "ordering" items ("Build a Sentence": tokens = shuffled words, order = correct id sequence, with a one-line explanation). In "open", add: an "Write an Email" task (typeLabel "Write an Email", guidance with the scenario, minWords 50) and a "Write for an Academic Discussion" task (minWords 100, a professor's question + two student posts in the prompt).`,
      );
    } else if (examId === "ielts") {
      lines.push(
        `IELTS Writing. Task 1 MUST include a "figure" with real underlying data (chartType bar/line/pie/table, 1–3 series) so the prompt describes an actual chart, minWords 150. Task 2 is a 250-word discussion/argument essay (no figure). Put both in "open".`,
      );
    } else {
      lines.push(`Produce ${section.openTasks ?? 1} open task(s) in "open" with clear prompts, "guidance", and "minWords".`);
    }
  }

  if (isSpeaking) {
    if (examId === "toefl") {
      lines.push(
        `TOEFL-2026 Speaking, all in "open". Add a "Listen and Repeat" task (typeLabel "Listen and Repeat") whose prompt contains 7 numbered target sentences to read back, recordSeconds 60. Add a "Take an Interview" task (typeLabel "Take an Interview") whose prompt lists 4 short interview questions, prepSeconds 0, recordSeconds 180.`,
      );
    } else {
      lines.push(
        `Produce ${section.openTasks ?? 3} open task(s) in "open" representing the speaking parts. Give the cue-card/long-turn part prepSeconds 60 and recordSeconds 120; other parts recordSeconds 60.`,
      );
    }
  }

  if (!isReading && !isListening && !isWriting && !isSpeaking) {
    // verbal / quantitative / data_insights (GRE/GMAT)
    lines.push(
      `Produce ${section.questions} "single" objective items. ${examId === "gre" || examId === "gmat" ? "Write any mathematical notation in inline LaTeX delimited by $...$ so it renders with KaTeX." : ""} Ensure the math is correct and the explanation shows the working.`,
    );
  }

  lines.push(`Return JSON matching exactly: ${SECTION_SCHEMA_HINT}`);
  return lines.filter(Boolean).join("\n");
}

/**
 * Prompt for AI rubric scoring of an open (Writing/Speaking) response (work-order §7). The model must
 * QUOTE the official descriptor phrase justifying each sub-score (provenance), return a band/score
 * RANGE + confidence, and never a bare number. Descriptor anchors are supplied by the caller.
 */
export function buildRubricPrompt(
  examTitle: string,
  taskPrompt: string,
  response: string,
  criteria: { name: string; descriptor: string }[],
  context?: { stimulus?: string; minWords?: number },
): string {
  const trimmed = response.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const criteriaBlock = criteria
    .map((c, i) => `${i + 1}. ${c.name} (max ${maxFor(examTitle)}) — top-band descriptor anchor: "${c.descriptor}"`)
    .join("\n");
  return [
    `You are a certified ${examTitle} examiner grading ONE candidate response. Read the response in full FIRST.`,
    `Score every criterion ONLY on what the candidate actually wrote below — never assume content that isn't there.`,
    `The response is ${wordCount} words${context?.minWords ? ` (task target ≥ ${context.minWords})` : ""}. If it is empty, off-topic, merely copies the prompt, gibberish, or far below the target length, you MUST award the LOWEST band for the affected criteria and say so — do NOT default to a middling band.`,
    `For EACH criterion, "evidence" MUST contain (a) the descriptor phrase you matched and (b) a SHORT VERBATIM QUOTE of the candidate's own words that justifies the score. If you cannot quote their words, the score is too high — lower it.`,
    `Map scores to the ${examTitle} scale (a low/empty answer is near the bottom; only sustained, accurate, well-developed writing reaches the top band).`,
    context?.stimulus
      ? `The task is based on this STIMULUS — judge accuracy/relevance against it (e.g. did they describe the real data / address the real question?):\n${context.stimulus.slice(0, 1500)}`
      : "",
    `Output a per-criterion score (with its max), an overall band/score RANGE ("bandLow"/"bandHigh") and a "confidence". Never a bare single number. This is an ESTIMATE — only a certified human rater gives a real score.`,
    ``,
    `CRITERIA:`,
    criteriaBlock,
    ``,
    `Return STRICT JSON only: ${RUBRIC_SCHEMA_HINT}`,
    ``,
    `TASK: ${taskPrompt}`,
    ``,
    `CANDIDATE RESPONSE (${wordCount} words) — grade THIS text:`,
    `"""`,
    trimmed.slice(0, 6000) || "(the candidate left this blank)",
    `"""`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Rough per-criterion max for the prompt (IELTS bands to 9, TOEFL to 6, else 5). */
function maxFor(examTitle: string): number {
  if (/ielts/i.test(examTitle)) return 9;
  if (/toefl/i.test(examTitle)) return 6;
  return 5;
}

export const RUBRIC_SCHEMA_HINT =
  '{ "criteria": [{ "name": string, "score": number, "max": number, "evidence": string, "comment": string }], "bandLow": string, "bandHigh": string, "confidence": "low"|"medium"|"high", "summary": string, "improvements": string[] }';
