/**
 * Curated voice catalogs for the human-like TTS tiers (work-order §5). Gemini's prebuilt voices are
 * multilingual and language-agnostic — accent is steered by the natural-language prompt, not the
 * voice name — so we pair a voice with a default gender and rotate per speaker. Chirp 3: HD voices
 * are language-specific (en-US/GB/AU + de-DE). These names track the public voice lists and are
 * `needs_verification` against the live docs.
 */
import type { Speaker } from "@/lib/exam/schema";

export interface VoiceOption {
  /** The provider's voice id/name. */
  name: string;
  /** Friendly label for the picker. */
  label: string;
  gender: "male" | "female" | "neutral";
}

/** A subset of Gemini TTS prebuilt voices (multilingual). */
export const GEMINI_VOICES: VoiceOption[] = [
  { name: "Kore", label: "Kore (firm)", gender: "female" },
  { name: "Puck", label: "Puck (upbeat)", gender: "male" },
  { name: "Charon", label: "Charon (informative)", gender: "male" },
  { name: "Aoede", label: "Aoede (breezy)", gender: "female" },
  { name: "Leda", label: "Leda (youthful)", gender: "female" },
  { name: "Orus", label: "Orus (firm)", gender: "male" },
  { name: "Zephyr", label: "Zephyr (bright)", gender: "female" },
  { name: "Fenrir", label: "Fenrir (excitable)", gender: "male" },
];

/**
 * Chirp 3: HD voices keyed by language. Names follow the `<lang>-Chirp3-HD-<voice>` pattern.
 * Used only when a Google Cloud key is supplied (premium, opt-in).
 */
export const CHIRP_VOICES: Record<string, VoiceOption[]> = {
  "en-US": [
    { name: "en-US-Chirp3-HD-Charon", label: "Charon (US, m)", gender: "male" },
    { name: "en-US-Chirp3-HD-Aoede", label: "Aoede (US, f)", gender: "female" },
  ],
  "en-GB": [
    { name: "en-GB-Chirp3-HD-Charon", label: "Charon (UK, m)", gender: "male" },
    { name: "en-GB-Chirp3-HD-Aoede", label: "Aoede (UK, f)", gender: "female" },
  ],
  "en-AU": [
    { name: "en-AU-Chirp3-HD-Charon", label: "Charon (AU, m)", gender: "male" },
    { name: "en-AU-Chirp3-HD-Aoede", label: "Aoede (AU, f)", gender: "female" },
  ],
  "de-DE": [
    { name: "de-DE-Chirp3-HD-Charon", label: "Charon (DE, m)", gender: "male" },
    { name: "de-DE-Chirp3-HD-Aoede", label: "Aoede (DE, f)", gender: "female" },
  ],
};

/** Map a free-text accent label to the closest Chirp BCP-47 language tag. */
export function accentToLangTag(accent: string | undefined, fallback: string): string {
  const a = (accent ?? "").toLowerCase();
  if (a.includes("brit") || a.includes("uk")) return "en-GB";
  if (a.includes("australian") || a.includes("nz") || a.includes("new zealand")) return "en-AU";
  if (a.includes("american") || a.includes("us") || a.includes("north")) return "en-US";
  if (a.includes("deutsch") || a.includes("german") || a.includes("österreich") || a.includes("schweiz")) return "de-DE";
  return fallback;
}

/** Deterministically assign a Gemini voice to a speaker (so a dialogue's voices stay distinct + stable). */
export function geminiVoiceForSpeaker(speaker: Speaker, index: number): string {
  const pool = speaker.gender
    ? GEMINI_VOICES.filter((v) => v.gender === speaker.gender)
    : GEMINI_VOICES;
  const list = pool.length ? pool : GEMINI_VOICES;
  // Offset by index so two same-gender speakers don't collide.
  return list[index % list.length].name;
}

/** A short natural-language style hint for a speaker, used in the Gemini TTS prompt. */
export function speakerStyleHint(speaker: Speaker): string {
  const parts: string[] = [speaker.name];
  if (speaker.accent) parts.push(`speaks with a ${speaker.accent} accent`);
  if (speaker.style) parts.push(`in a ${speaker.style} tone`);
  return parts.join(" ");
}
