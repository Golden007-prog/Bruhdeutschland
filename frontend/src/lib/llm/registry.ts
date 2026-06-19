/**
 * Provider registry + auto-select (work-order §3). On demand it resolves the best available provider:
 * the user's explicit choice if usable, else Owner-Mode bridge if reachable, else Gemini if a key is
 * present. The exam engine calls {@link resolveProvider}; the Settings screen calls {@link listProviders}.
 */
import { ClaudeBridgeProvider } from "./bridge";
import { GeminiProvider } from "./gemini";
import { getActiveProviderId, hasKey } from "./keys";
import type { LLMProvider, ProviderId } from "./types";

const gemini = new GeminiProvider();
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
  const preferredId = getActiveProviderId();
  if (preferredId) {
    const preferred = getProvider(preferredId as ProviderId);
    if (preferred && (await preferred.isAvailable())) return preferred;
  }
  // Bridge first (free, full Claude), then Gemini.
  if (await bridge.isAvailable()) return bridge;
  if (hasKey("gemini")) return gemini;
  throw new NoProviderError();
}

/** Cheap synchronous check used to decide whether to even attempt live generation. */
export function anyProviderConfigured(): boolean {
  return hasKey("gemini") || !!getActiveProviderId();
}
