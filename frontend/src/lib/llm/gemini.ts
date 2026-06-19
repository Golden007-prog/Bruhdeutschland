/**
 * Gemini provider — the free Guest/Public default (work-order §3). Uses the user's own key (BYOK)
 * via the Google Generative AI SDK in JSON mode, validates with Zod, and repairs once on failure.
 * Default model is `gemini-2.5-flash-lite` for the higher free-tier quota.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ZodType } from "zod";

import { getKey } from "./keys";
import { extractJson, repairPrompt, validate } from "./json";
import { LLMError, type GenerateOpts, type LLMProvider, type ProviderId } from "./types";

export const GEMINI_MODELS = {
  default: "gemini-2.5-flash-lite",
  quality: "gemini-2.5-flash",
} as const;

export class GeminiProvider implements LLMProvider {
  readonly id: ProviderId = "gemini";
  readonly label = "Google Gemini (free)";
  readonly model: string;

  constructor(model: string = GEMINI_MODELS.default) {
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    return !!getKey("gemini");
  }

  async generateJSON<T>(
    schema: ZodType<T>,
    prompt: string,
    schemaHint: string,
    opts: GenerateOpts = {},
  ): Promise<T> {
    const key = getKey("gemini");
    if (!key) throw new LLMError("No Gemini API key set", "auth", this.id);

    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.8,
        maxOutputTokens: opts.maxOutputTokens,
      },
    });

    const run = async (text: string): Promise<string> => {
      try {
        const res = await model.generateContent(
          { contents: [{ role: "user", parts: [{ text }] }] },
          { signal: opts.signal },
        );
        return res.response.text();
      } catch (err) {
        throw mapGeminiError(err, this.id);
      }
    };

    // First attempt.
    let lastError = "";
    try {
      return validate(schema, extractJson(await run(prompt)));
    } catch (err) {
      if (err instanceof LLMError) throw err; // rate-limit/auth/network — let the caller fall back.
      lastError = err instanceof Error ? err.message : String(err);
    }
    // One repair attempt.
    try {
      const repaired = await run(repairPrompt(prompt, lastError, schemaHint));
      return validate(schema, extractJson(repaired));
    } catch (err) {
      if (err instanceof LLMError) throw err;
      throw new LLMError(
        `Gemini returned invalid output after repair: ${err instanceof Error ? err.message : err}`,
        "invalid_output",
        this.id,
      );
    }
  }
}

function mapGeminiError(err: unknown, id: ProviderId): LLMError {
  const msg = err instanceof Error ? err.message : String(err);
  if (/abort/i.test(msg)) return new LLMError(msg, "aborted", id);
  if (/429|rate|quota|resource.exhausted/i.test(msg)) return new LLMError(msg, "rate_limit", id);
  if (/api key|permission|401|403|unauthenticated/i.test(msg)) return new LLMError(msg, "auth", id);
  if (/network|fetch|timeout|ENOTFOUND/i.test(msg)) return new LLMError(msg, "network", id);
  return new LLMError(msg, "unknown", id);
}
