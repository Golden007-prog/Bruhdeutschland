/**
 * Prompt builders for per-section exam generation (work-order §5A/§5B). Each call asks the model for
 * ONE {@link GeneratedSection} as strict JSON. We inject the official structure from exam-specs, a
 * topic + nonce for freshness, an exclusion list to avoid repeats, and the authentic question types.
 */
import type { ExamSpec, SectionSpec } from "@/data/exam-specs";

/** Compact human-readable shape used in the prompt and for repair retries. */
export const SECTION_SCHEMA_HINT = [
  "{",
  '  "skill": string, "title": string, "instructions": string,',
  '  "passages": [{ "id": string, "title": string, "body": string, "kind": "reading"|"listening" }],',
  '  "objective": [{ "id": string, "kind": "objective", "typeLabel": string, "prompt": string,',
  '    "choices": [{ "id": string, "text": string }], "answerId": string, "explanation": string,',
  '    "passageRef": string?, "sourceRef": string? }],',
  '  "open": [{ "id": string, "kind": "open", "typeLabel": string, "prompt": string, "guidance": string?,',
  '    "minWords": number?, "prepSeconds": number?, "recordSeconds": number? }],',
  '  "figure": { "chartType": "bar"|"line"|"pie"|"table", "title": string, "xLabel": string?,',
  '    "yLabel": string?, "series": [{ "name": string, "points": [{ "label": string, "value": number }] }] }?',
  "}",
].join("\n");

export interface SectionPromptCtx {
  spec: ExamSpec;
  section: SectionSpec;
  nonce: string;
  topics: string[];
  /** Optional CEFR level for Goethe. */
  level?: string;
}

export function buildSectionPrompt(ctx: SectionPromptCtx): string {
  const { spec, section, nonce, topics, level } = ctx;
  const lang = spec.language === "de" ? "German" : "English";
  const isListening = section.skill === "listening";
  const isReading = section.skill === "reading";
  const isWriting = section.skill === "writing" || section.skill === "analytical_writing";
  const isSpeaking = section.skill === "speaking";
  const types = section.questionTypes?.length
    ? `Use a realistic MIX of these authentic question types: ${section.questionTypes.join(", ")}.`
    : "";

  const lines: string[] = [
    `You are an expert ${spec.title} item writer. Generate ONE section as STRICT JSON only (no prose, no code fences).`,
    `Exam: ${spec.title}. Section: ${section.label} (skill="${section.skill}"). Content language: ${lang}.`,
    level ? `Target CEFR level: ${level}.` : "",
    `Variety seed: ${nonce}. Center the material on: ${topics.join("; ")}. Do NOT reuse these exact titles/topics if avoidable.`,
    `All objective questions are SINGLE-BEST-ANSWER with 3–4 plausible choices, exactly one correct "answerId" matching a choice id, a one-sentence "explanation", and (where applicable) a "sourceRef" quoting the passage/transcript line that proves the answer.`,
    types,
  ];

  if (isReading) {
    lines.push(
      `Write ${section.skill === "reading" && spec.id === "ielts" ? "passages totalling 3 academic texts (~700–900 words each)" : "1–2 academic passage(s) (~500–800 words)"} in "passages" with kind "reading". Produce ${section.questions} objective questions referencing them via "passageRef". Include scanning-for-detail and skimming targets, with paraphrase between question and text.`,
    );
  }
  if (isListening) {
    lines.push(
      `Write the audio as transcript "passages" with kind "listening" (these are read aloud by TTS and hidden until review). For IELTS use 4 parts. Produce ${section.questions} objective questions. Make recordings PARAPHRASE the questions and include realistic distractors (a speaker correcting themselves, etc.).`,
    );
  }
  if (isWriting) {
    lines.push(
      `Produce ${section.openTasks ?? 1} open task(s) in "open" (kind "open") with clear prompts, "guidance", and "minWords".`,
    );
    if (spec.id === "ielts") {
      lines.push(
        `Task 1 MUST include a "figure" with real underlying data (chartType bar/line/pie/table, 1–3 series) so the prompt describes an actual chart, and minWords 150. Task 2 is a 250-word discussion/argument essay (no figure).`,
      );
    }
  }
  if (isSpeaking) {
    lines.push(
      `Produce ${section.openTasks ?? 3} open task(s) in "open" representing the speaking parts. Give Part 2 a cue card with prepSeconds 60 and recordSeconds 120; other parts recordSeconds 60.`,
    );
  }
  if (!isReading && !isListening && !isWriting && !isSpeaking) {
    // verbal / quantitative / data_insights
    lines.push(
      `Produce ${section.questions} objective questions. ${spec.id === "gre" || spec.id === "gmat" ? "Write any mathematical notation in inline LaTeX delimited by $...$ so it renders with KaTeX." : ""} For data/quant items, ensure the math is correct and the explanation shows the working.`,
    );
  }

  lines.push(
    `Use stable, unique string ids for every passage/question/choice (e.g. "p1", "q1", "q1c2").`,
    `Return JSON matching exactly: ${SECTION_SCHEMA_HINT}`,
  );
  return lines.filter(Boolean).join("\n");
}

/** Prompt for AI rubric scoring of an open (Writing/Speaking) response. */
export function buildRubricPrompt(
  spec: ExamSpec,
  taskPrompt: string,
  response: string,
  criteria: string[],
): string {
  return [
    `You are a ${spec.title} examiner. Score the candidate response against these criteria: ${criteria.join(", ")}.`,
    `Return STRICT JSON only: { "criteria": [{ "name": string, "score": number, "max": number, "comment": string }], "estimatedBand": string, "summary": string, "improvements": string[] }.`,
    `Be constructive and specific. Make clear this is an ESTIMATE — only a certified examiner gives a real score.`,
    ``,
    `TASK: ${taskPrompt}`,
    ``,
    `RESPONSE: ${response.slice(0, 4000)}`,
  ].join("\n");
}

export const RUBRIC_SCHEMA_HINT =
  '{ "criteria": [{ "name": string, "score": number, "max": number, "comment": string }], "estimatedBand": string, "summary": string, "improvements": string[] }';
