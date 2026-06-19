/**
 * LLM provider contract (work-order §3). Every provider returns Zod-validated structured output, so
 * downstream code never parses free text. Keys are BYOK and never leave the browser except to the
 * provider's own endpoint (or, for the bridge, to localhost). Nothing here is ever logged.
 */
import type { ZodType } from "zod";

export type ProviderId = "gemini" | "claude-bridge" | "anthropic" | "openai";

export interface GenerateOpts {
  /** 0–1; higher for content, lower for answer keys (work-order §5A). */
  temperature?: number;
  /** Abort in-flight generation (e.g. user cancels). */
  signal?: AbortSignal;
  /** Optional max output tokens. */
  maxOutputTokens?: number;
}

export interface LLMProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly model: string;
  /** True when this provider is usable right now (key present / bridge reachable). */
  isAvailable(): Promise<boolean>;
  /**
   * Generate JSON conforming to `schema`. Implementations must validate against `schema`, retry once
   * with a repair prompt on validation failure, and throw {@link LLMError} if still invalid.
   * `schemaHint` is a short human-readable description of the desired shape for the prompt.
   */
  generateJSON<T>(schema: ZodType<T>, prompt: string, schemaHint: string, opts?: GenerateOpts): Promise<T>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    readonly kind: "rate_limit" | "auth" | "invalid_output" | "network" | "aborted" | "unknown",
    readonly providerId: ProviderId,
  ) {
    super(message);
    this.name = "LLMError";
  }
}
