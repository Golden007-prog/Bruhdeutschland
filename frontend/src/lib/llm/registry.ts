/**
 * Provider registry + auto-select (work-order §3). On demand it resolves the best available provider:
 * the user's explicit choice if usable, else Owner-Mode bridge if reachable, else Gemini if a key is
 * present. The exam engine calls {@link resolveProvider}; the Settings screen calls {@link listProviders}.
 */
import type { ZodType } from "zod";

import { ClaudeBridgeProvider } from "./bridge";
import { GeminiProvider, GEMINI_MODELS } from "./gemini";
import { getActiveProviderId, hasKey } from "./keys";
import { getModelConfig } from "./modelConfig";
import type { GenerateOpts, LLMProvider, ProviderId } from "./types";

const gemini = new GeminiProvider();
/** A quality-model Gemini used for grading (so scores reflect the text, not the fast "lite" default). */
const qualityGemini = new GeminiProvider(GEMINI_MODELS.quality);
const bridge = new ClaudeBridgeProvider();

/** All known providers (order = fallback preference when no explicit choice). */
const ALL: LLMProvider[] = [bridge, gemini];

export class NoProviderError extends Error {
  constructor() {
    super("No AI provider available. Add a free Gemini key in Settings, or start the Owner-Mode bridge.");
    this.name = "NoProviderError";
  }
}

export function getProvider(id: ProviderId): LLMProvider | undefined {
  return ALL.find((p) => p.id === id);
}

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  available: boolean;
}

/** Availability of every provider, for the Settings UI. */
export async function listProviders(): Promise<ProviderStatus[]> {
  return Promise.all(
    ALL.map(async (p) => ({ id: p.id, label: p.label, available: await p.isAvailable() })),
  );
}

/**
 * Resolve the provider to use now. Honors the user's saved choice when it's actually available,
 * otherwise falls back: bridge (if reachable) → gemini (if keyed). Throws {@link NoProviderError}
 * when nothing is usable so callers can show the key wizard / seed-bank path.
 */
export async function resolveProvider(): Promise<LLMProvider> {
  const cfg = getModelConfig();
  const preferredId = getActiveProviderId();
  if (preferredId === "gemini" && cfg.geminiEnabled && hasKey("gemini")) return gemini;
  if (preferredId === "claude-bridge" && cfg.claudeEnabled && (await bridge.isAvailable())) return bridge;
  // Honour the enable toggles: Claude (bridge) first when on, else free Gemini.
  if (cfg.claudeEnabled && (await bridge.isAvailable())) return bridge;
  if (cfg.geminiEnabled && hasKey("gemini")) return gemini;
  throw new NoProviderError();
}

export interface Provenance {
  provider: ProviderId;
  model: string;
  latencyMs: number;
}

/** Ordered provider chain for a task, honouring the enable toggles + orchestration mode (failover). */
async function providerChain(kind: "generate" | "grade"): Promise<LLMProvider[]> {
  const cfg = getModelConfig();
  const claudeOk = cfg.claudeEnabled && (await bridge.isAvailable());
  const geminiOk = cfg.geminiEnabled && hasKey("gemini");
  const g = kind === "grade" ? qualityGemini : gemini; // grade with the quality model, not "lite"
  if (cfg.mode === "gemini_only") return geminiOk ? [g] : [];
  if (cfg.mode === "claude_only") return claudeOk ? [bridge] : [];
  // smart / failover: grading prefers Claude; bulk generation prefers free Gemini; the other is the failover.
  const claudeFirst = kind === "grade";
  const ordered: [boolean, LLMProvider][] = claudeFirst
    ? [[claudeOk, bridge], [geminiOk, g]]
    : [[geminiOk, g], [claudeOk, bridge]];
  return ordered.filter(([ok]) => ok).map(([, p]) => p);
}

/**
 * ModelRouter entry point (multi-model §2/§3): run a structured-output call through the configured
 * providers with cross-provider FAILOVER, returning the validated result PLUS provenance. Output is
 * Zod-validated identically regardless of which model answered.
 */
export async function routeJSON<T>(
  schema: ZodType<T>,
  prompt: string,
  schemaHint: string,
  opts: GenerateOpts,
  kind: "generate" | "grade" = "generate",
): Promise<{ result: T; provenance: Provenance }> {
  const chain = await providerChain(kind);
  if (chain.length === 0) throw new NoProviderError();
  let lastErr: unknown;
  for (const p of chain) {
    const t0 = Date.now();
    try {
      const result = await p.generateJSON<T>(schema, prompt, schemaHint, opts);
      return { result, provenance: { provider: p.id, model: p.model, latencyMs: Date.now() - t0 } };
    } catch (err) {
      lastErr = err;
      if (opts.signal?.aborted) throw err; // honour cancellation; don't fail over a user abort
    }
  }
  throw lastErr ?? new NoProviderError();
}

/** Cheap synchronous check used to decide whether to even attempt live generation. */
export function anyProviderConfigured(): boolean {
  return hasKey("gemini") || !!getActiveProviderId();
}

/**
 * Provider best suited to GRADING open responses (Writing/Speaking rubric). Prefers the Owner-Mode
 * bridge (full Claude) for the most reliable judgement, else Gemini's higher-quality model (not the
 * fast "lite" default) so scores actually reflect the candidate's text rather than a generic band.
 */
export async function resolveGradingProvider(): Promise<LLMProvider> {
  if (await bridge.isAvailable()) return bridge;
  if (hasKey("gemini")) return new GeminiProvider(GEMINI_MODELS.quality);
  return resolveProvider();
}
