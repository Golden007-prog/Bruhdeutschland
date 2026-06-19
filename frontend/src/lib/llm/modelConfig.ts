/**
 * Multi-model configuration (multi-model work order §0/§2). Lets the user choose WHICH Claude model and
 * WHICH Gemini model to use, enable either or both, and pick an orchestration mode. Stored per-user
 * (namespaced via userScope, like every personal store — data-isolation P0) so it syncs per account and
 * never bleeds across logins. Providers read it synchronously; the Settings screen reads/writes it.
 */
import { scopedKey } from "@/lib/persist/userScope";

export type OrchestrationMode = "smart" | "failover" | "gemini_only" | "claude_only";

export interface ModelConfig {
  /** Use the free BYOK Gemini provider. */
  geminiEnabled: boolean;
  /** Use Claude (Owner-Mode bridge or BYOK Anthropic key). */
  claudeEnabled: boolean;
  /** Chosen Gemini model id (discovery overrides the seed list). */
  geminiModel: string;
  /** Chosen Claude model id (passed to the bridge / Anthropic API). */
  claudeModel: string;
  /** How both are used when both are enabled. */
  mode: OrchestrationMode;
}

const KEY = "deutschprep:models";

export const DEFAULT_CONFIG: ModelConfig = {
  geminiEnabled: true,
  claudeEnabled: true,
  geminiModel: "gemini-2.5-flash-lite",
  claudeModel: "claude-opus-4-8",
  mode: "smart",
};

function ls(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function" && typeof window.localStorage.setItem === "function") {
      return window.localStorage;
    }
  } catch {
    /* sandboxed */
  }
  return null;
}

export function getModelConfig(): ModelConfig {
  try {
    const raw = ls()?.getItem(scopedKey(KEY));
    return raw ? { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ModelConfig>) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setModelConfig(patch: Partial<ModelConfig>): ModelConfig {
  const next = { ...getModelConfig(), ...patch };
  try {
    ls()?.setItem(scopedKey(KEY), JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export const getGeminiModel = (): string => getModelConfig().geminiModel || DEFAULT_CONFIG.geminiModel;
export const getClaudeModel = (): string => getModelConfig().claudeModel || DEFAULT_CONFIG.claudeModel;

/** Quick presets the Settings screen can apply. */
export const MODEL_PRESETS: { key: string; label: string; apply: Partial<ModelConfig> }[] = [
  { key: "best", label: "Best quality", apply: { geminiEnabled: true, claudeEnabled: true, geminiModel: "gemini-3.1-pro", claudeModel: "claude-opus-4-8", mode: "smart" } },
  { key: "fast", label: "Fastest", apply: { geminiModel: "gemini-2.5-flash-lite", claudeModel: "claude-haiku-4-5", mode: "smart" } },
  { key: "free", label: "Free only (Gemini)", apply: { geminiEnabled: true, claudeEnabled: false, geminiModel: "gemini-2.5-flash-lite", mode: "gemini_only" } },
  { key: "balanced", label: "Balanced", apply: { geminiEnabled: true, claudeEnabled: true, geminiModel: "gemini-2.5-flash", claudeModel: "claude-sonnet-4-6", mode: "smart" } },
];
