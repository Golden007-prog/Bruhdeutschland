/**
 * Shared live-AI generation hook for the feature pages. Wraps the BYOK provider layer
 * ({@link resolveProvider} + {@link LLMProvider.generateJSON}) with a uniform loading / error model
 * so each page can add a "Generate with AI" path while keeping its existing template fallback.
 *
 * The page decides what to do on each outcome:
 *  - `result`  → render the AI output (label it "AI-generated — review before use")
 *  - `noProvider` is true when {@link NoProviderError} was thrown → link the user to /settings
 *  - `error`   → any other failure; the page keeps showing its template output and offers retry
 */
import { useCallback, useState } from "react";
import type { ZodType } from "zod";

import { LLMError, type ProviderId } from "@/lib/llm/types";
import { NoProviderError, resolveProvider } from "@/lib/llm/registry";

/** Which provider/model produced {@link UseGenerateResult.result} — surfaced so the AI badge is traceable. */
export interface AiProvenance {
  provider: ProviderId;
  model: string;
}

export interface UseGenerateResult<T> {
  /** The last successful AI result, or null. */
  result: T | null;
  /** Provider + model that produced the last result (null until one succeeds). */
  provenance: AiProvenance | null;
  /** True while a generation request is in flight. */
  loading: boolean;
  /** Human-readable error message for non-"no provider" failures, else null. */
  error: string | null;
  /** True when generation failed because no provider is configured (→ send to /settings). */
  noProvider: boolean;
  /** Run a generation. Resolves to the validated result, or null on failure. */
  generate: (
    schema: ZodType<T>,
    prompt: string,
    schemaHint: string,
    temperature?: number,
  ) => Promise<T | null>;
  /** Clear the current result/error (e.g. "start over"). */
  reset: () => void;
}

/** Map provider errors to a short, user-facing message (never logs the raw error or any PII). */
function messageFor(err: unknown): string {
  if (err instanceof LLMError) {
    switch (err.kind) {
      case "rate_limit":
        return "The AI provider is rate-limited right now. Wait a moment and try again.";
      case "auth":
        return "Your AI provider key was rejected. Check it in Settings.";
      case "invalid_output":
        return "The AI returned an unexpected shape. Try generating again.";
      case "network":
        return "Could not reach the AI provider. Check your connection and retry.";
      case "aborted":
        return "Generation was cancelled.";
      default:
        return "Generation failed. Try again, or use the template below.";
    }
  }
  return "Generation failed. Try again, or use the template below.";
}

export function useGenerate<T>(): UseGenerateResult<T> {
  const [result, setResult] = useState<T | null>(null);
  const [provenance, setProvenance] = useState<AiProvenance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noProvider, setNoProvider] = useState(false);

  const generate = useCallback(
    async (
      schema: ZodType<T>,
      prompt: string,
      schemaHint: string,
      temperature?: number,
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setNoProvider(false);
      try {
        const provider = await resolveProvider();
        const value = await provider.generateJSON<T>(schema, prompt, schemaHint, { temperature });
        setResult(value);
        setProvenance({ provider: provider.id, model: provider.model });
        return value;
      } catch (err) {
        if (err instanceof NoProviderError) {
          setNoProvider(true);
        } else {
          setError(messageFor(err));
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setProvenance(null);
    setError(null);
    setNoProvider(false);
  }, []);

  return { result, provenance, loading, error, noProvider, generate, reset };
}
