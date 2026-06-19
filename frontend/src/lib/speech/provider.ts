/**
 * Tiered TTS provider registry + preferences (work-order §5). Three tiers:
 *   - `web`    Web Speech API — free, offline, robotic; speaks live (no audio file)
 *   - `gemini` Gemini TTS — human-like, BYOK, native ≤2-speaker dialogue + accents (recommended)
 *   - `chirp`  Google Cloud Chirp 3: HD — premium single voice, opt-in (separate key)
 *
 * File-producing tiers (gemini/chirp) are cached by form+segment so a replay never re-synthesizes.
 * The `web` tier is handled by the existing TtsController in tts.ts (this module only synthesizes
 * files). Preferences (tier, rate, study/test mode) live in localStorage.
 */
import type { Passage } from "@/lib/exam/schema";
import { getKey, getServiceKey } from "@/lib/llm/keys";
import { audioKey, getCachedAudio, putCachedAudio } from "./cache";
import { chirpSynthesizePassage } from "./chirp-tts";
import { geminiSynthesizePassage } from "./gemini-tts";

export type TtsTier = "web" | "gemini" | "chirp";

export interface TierInfo {
  tier: TtsTier;
  label: string;
  available: boolean;
  /** True when this tier renders an audio file (vs. live Web Speech). */
  producesFile: boolean;
  note: string;
}

const PREF_TIER = "deutschprep:tts:tier";
const PREF_RATE = "deutschprep:tts:rate";

/** Safe localStorage accessor (mirrors keys.ts — degrades when storage is stubbed/unavailable). */
function ls(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function" &&
      typeof window.localStorage.setItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {
    /* accessing localStorage can throw in some sandboxes */
  }
  return null;
}

export function getPreferredTier(): TtsTier {
  const v = ls()?.getItem(PREF_TIER);
  return v === "gemini" || v === "chirp" || v === "web" ? v : "web";
}

export function setPreferredTier(tier: TtsTier): void {
  ls()?.setItem(PREF_TIER, tier);
}

export function getTtsRate(): number {
  const v = Number(ls()?.getItem(PREF_RATE));
  return v >= 0.5 && v <= 1.5 ? v : 1;
}

export function setTtsRate(rate: number): void {
  ls()?.setItem(PREF_RATE, String(rate));
}

/** Availability + human notes for every tier (drives the picker). */
export function listTiers(): TierInfo[] {
  const hasGemini = !!getKey("gemini");
  const hasChirp = !!getServiceKey("chirp");
  return [
    { tier: "web", label: "Browser voice (free)", available: true, producesFile: false, note: "Offline, no key — robotic but always works." },
    { tier: "gemini", label: "Gemini voice (human-like)", available: hasGemini, producesFile: true, note: hasGemini ? "Multi-speaker dialogue + accents, uses your Gemini key." : "Add a free Gemini key in Settings to enable." },
    { tier: "chirp", label: "Chirp 3: HD (premium)", available: hasChirp, producesFile: true, note: hasChirp ? "Most natural single voice (Google Cloud)." : "Optional — needs a Google Cloud TTS key + billing." },
  ];
}

/** Resolve the tier to actually use: the preference if available, else the best available file tier, else web. */
export function resolveTier(): TtsTier {
  const tiers = listTiers();
  const pref = getPreferredTier();
  if (tiers.find((t) => t.tier === pref)?.available) return pref;
  if (tiers.find((t) => t.tier === "gemini")?.available) return "gemini";
  if (tiers.find((t) => t.tier === "chirp")?.available) return "chirp";
  return "web";
}

export interface SynthResult {
  /** Object URL for an <audio> element. */
  url: string;
  tier: TtsTier;
}

/**
 * Synthesize a listening passage to a cached audio file for the given file-tier (gemini/chirp).
 * Throws for the `web` tier (which has no file — callers use TtsController instead).
 */
export async function synthesizePassage(
  passage: Passage,
  lang: string,
  formNonce: string,
  tier: TtsTier,
  signal?: AbortSignal,
): Promise<SynthResult> {
  if (tier === "web") throw new Error("Web Speech tier produces no audio file");

  const key = audioKey(tier, lang, formNonce, passage.id, passage.body.length);
  const cached = await getCachedAudio(key);
  if (cached) return { url: cached, tier };

  const blob =
    tier === "gemini"
      ? await geminiSynthesizePassage(passage, lang, signal)
      : await chirpSynthesizePassage(passage, lang, signal);

  const url = await putCachedAudio(key, blob);
  return { url, tier };
}
