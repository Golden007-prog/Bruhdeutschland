/**
 * Dynamic model discovery (multi-model work order §1). Model lineups churn fast, so we fetch the live
 * list from each provider with the user's own key and only fall back to a seed list (June 2026,
 * `needs_verification`) when discovery isn't possible. Filter Gemini to models that support
 * generateContent; Anthropic via /v1/models (best-effort from the browser — falls back to seed).
 */
import { getKey } from "./keys";

export interface ModelMeta {
  id: string;
  label: string;
  provider: "gemini" | "claude";
  note?: string;
  recommended?: boolean;
}

// ── Seed defaults (fallback only; discovery overrides) ────────────────────────────────────────────
export const SEED_GEMINI: ModelMeta[] = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "gemini", note: "Smart + fast", recommended: true },
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", provider: "gemini", note: "Max quality" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini", note: "Balanced" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite", provider: "gemini", note: "Cheapest · best free-tier headroom", recommended: true },
];

export const SEED_CLAUDE: ModelMeta[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "claude", note: "Max quality", recommended: true },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "claude", note: "Balanced" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "claude", note: "Fast / cheap" },
  { id: "claude-fable-5", label: "Claude Fable 5", provider: "claude", note: "Newest line" },
];

interface GeminiListModel {
  name?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

/** Live Gemini models that support generateContent, else the seed list. */
export async function discoverGeminiModels(signal?: AbortSignal): Promise<ModelMeta[]> {
  const key = getKey("gemini");
  if (!key) return SEED_GEMINI;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, { signal });
    if (!res.ok) return SEED_GEMINI;
    const json = (await res.json()) as { models?: GeminiListModel[] };
    const mapped = (json.models ?? [])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent") && /gemini/i.test(m.name ?? "") && !/embedding|aqa/i.test(m.name ?? ""))
      .map<ModelMeta>((m) => ({
        id: (m.name ?? "").replace(/^models\//, ""),
        label: m.displayName ?? (m.name ?? "").replace(/^models\//, ""),
        provider: "gemini",
        note: m.description?.slice(0, 70),
      }));
    return mapped.length ? mapped : SEED_GEMINI;
  } catch {
    return SEED_GEMINI;
  }
}

interface AnthropicModel {
  id?: string;
  display_name?: string;
}

/**
 * Live Claude models via the Anthropic API (BYOK `anthropic` key). Browser calls require the explicit
 * direct-access header; if no key / CORS-blocked, we return the seed list. Owner-Mode bridge model
 * discovery is a follow-up (the bridge would expose its plan's models).
 */
export async function discoverClaudeModels(signal?: AbortSignal): Promise<ModelMeta[]> {
  const key = getKey("anthropic");
  if (!key) return SEED_CLAUDE;
  try {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      signal,
    });
    if (!res.ok) return SEED_CLAUDE;
    const json = (await res.json()) as { data?: AnthropicModel[] };
    const mapped = (json.data ?? [])
      .filter((m) => !!m.id)
      .map<ModelMeta>((m) => ({ id: m.id as string, label: m.display_name ?? (m.id as string), provider: "claude" }));
    return mapped.length ? mapped : SEED_CLAUDE;
  } catch {
    return SEED_CLAUDE;
  }
}
