/**
 * Exam generation orchestrator (work-order §5A/§5B). Generates ONE section per LLM call (keeps each
 * response within schema/size limits and drives the progressive loader), validates every section with
 * Zod, and assembles a {@link GeneratedExam}. Fallback ladder so the app never shows a broken exam:
 *   live generation → one transient retry → bundled offline seed form.
 */
import { EXAM_SPECS, type SectionSpec } from "@/data/exam-specs";
import { getSeedForm } from "@/data/seed-forms";
import { LLMError } from "@/lib/llm/types";
import { NoProviderError, resolveProvider } from "@/lib/llm/registry";
import { buildSectionPrompt, SECTION_SCHEMA_HINT, type Difficulty } from "./prompts";
import { generatedSectionSchema, type GeneratedExam, type GeneratedSection } from "./schema";
import { makeNonce, pickTopics, topicPool } from "./topics";

export type GenMode = "full" | "section" | "mini";

export interface GenProgress {
  step: number;
  total: number;
  label: string;
}

export interface GenerateOptions {
  mode?: GenMode;
  /** For single-section mode: which skill to generate. */
  sectionSkill?: string;
  /** Recently-seen topics to avoid (anti-repetition). */
  exclude?: string[];
  /** CEFR level for Goethe. */
  level?: string;
  /** TOEFL-2026 multistage difficulty for this generation. */
  difficulty?: Difficulty;
  /** Adaptive stage label (1 routing, 2 adapted). */
  stage?: 1 | 2;
  signal?: AbortSignal;
  onProgress?: (p: GenProgress) => void;
}

const delay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

/** Apply the requested mode to the spec's sections (mini ≈ half the objective questions). */
function planSections(examId: string, opts: GenerateOptions): SectionSpec[] {
  const spec = EXAM_SPECS[examId];
  let sections = spec.sections;
  if (opts.mode === "section" && opts.sectionSkill) {
    sections = sections.filter((s) => s.skill === opts.sectionSkill);
  }
  if (opts.mode === "mini") {
    sections = sections.map((s) => ({
      ...s,
      questions: s.questions > 0 ? Math.max(4, Math.round(s.questions / 2)) : 0,
      openTasks: s.openTasks ? Math.max(1, Math.round(s.openTasks / 2)) : s.openTasks,
    }));
  }
  return sections;
}

/** Generate (and Zod-validate) one section, with a single transient retry. */
async function generateSection(
  examId: string,
  section: SectionSpec,
  nonce: string,
  opts: GenerateOptions,
): Promise<GeneratedSection> {
  const spec = EXAM_SPECS[examId];
  const provider = await resolveProvider();
  const topics = pickTopics(topicPool(examId, section.skill), opts.exclude ?? [], 2, `${nonce}-${section.skill}`);
  const prompt = buildSectionPrompt({ spec, section, nonce, topics, level: opts.level, difficulty: opts.difficulty, stage: opts.stage });

  try {
    return await provider.generateJSON(generatedSectionSchema, prompt, SECTION_SCHEMA_HINT, {
      temperature: 0.85,
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof LLMError && (err.kind === "rate_limit" || err.kind === "network")) {
      await delay(1500, opts.signal); // backoff once
      return provider.generateJSON(generatedSectionSchema, prompt, SECTION_SCHEMA_HINT, {
        temperature: 0.85,
        signal: opts.signal,
      });
    }
    throw err;
  }
}

/**
 * Generate a full/section/mini exam. Falls back to the bundled seed form on any unrecoverable error
 * (no provider, repeated rate-limit, invalid output) so the user always gets a usable exam.
 */
export async function generateExam(examId: string, opts: GenerateOptions = {}): Promise<GeneratedExam> {
  const spec = EXAM_SPECS[examId];
  if (!spec) throw new Error(`Unknown exam: ${examId}`);
  const sections = planSections(examId, opts);
  const nonce = makeNonce();
  const total = sections.length + 1;

  try {
    const generated: GeneratedSection[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      opts.onProgress?.({ step: i + 1, total, label: `Writing the ${s.label} section…` });
      generated.push(await generateSection(examId, s, nonce, opts));
    }
    opts.onProgress?.({ step: total, total, label: "Preparing your exam…" });
    return {
      examId,
      title: spec.title,
      language: spec.language,
      sections: generated,
      nonce,
      isSeed: false,
    };
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    // Fallback ladder bottom rung: bundled seed bank.
    const seed = getSeedForm(examId);
    if (seed) {
      opts.onProgress?.({ step: total, total, label: "Using an offline practice form…" });
      return seed;
    }
    if (err instanceof NoProviderError) throw err;
    throw err;
  }
}

/**
 * Generate an adaptive Stage-2 block for a TOEFL-2026 Reading/Listening section (work-order §4/§6).
 * The runner calls this after Stage 1, passing a difficulty derived from Stage-1 accuracy, and appends
 * the returned items. Throws (so the runner can fall back to the pre-generated items) if no provider
 * is available or generation fails.
 */
export async function generateAdaptiveStage(
  examId: string,
  skill: string,
  difficulty: Difficulty,
  opts: { exclude?: string[]; signal?: AbortSignal } = {},
): Promise<GeneratedSection> {
  const spec = EXAM_SPECS[examId];
  const base = spec?.sections.find((s) => s.skill === skill);
  if (!base) throw new Error(`No ${skill} section for ${examId}`);
  const stageSection: SectionSpec = {
    ...base,
    questions: Math.max(4, Math.round(base.questions / 2)),
    openTasks: 0,
  };
  return generateSection(examId, stageSection, makeNonce(), { ...opts, difficulty, stage: 2 });
}
