/**
 * Gemini TTS engine (work-order §5, Tier 2 — human-like, BYOK). Calls the Generative Language REST
 * endpoint directly (no extra SDK dependency) with `responseModalities: ["AUDIO"]`. Supports native
 * up-to-2-speaker dialogue with per-speaker voices + prompt-driven accents/styles; >2 speakers fall
 * back to a single narrating voice (Gemini's multi-speaker cap). Returns a playable WAV Blob.
 *
 * The user's Gemini key never leaves the browser except to Google's own endpoint, and is never logged.
 */
import type { Passage, Speaker } from "@/lib/exam/schema";
import { getKey } from "@/lib/llm/keys";
import { geminiVoiceForSpeaker, speakerStyleHint } from "./voices";
import { base64ToBytes, parseSampleRate, pcm16ToWav } from "./wav";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;

export class TtsError extends Error {
  constructor(message: string, readonly kind: "auth" | "rate_limit" | "network" | "empty" | "unknown") {
    super(message);
    this.name = "TtsError";
  }
}

interface InlinePart {
  inlineData?: { data?: string; mimeType?: string };
}

const languageName = (lang: string): string => (lang.toLowerCase().startsWith("de") ? "German" : "English");

/** Flatten a passage to a speaker-labelled script (or its plain body when it has no dialogue lines). */
function passageScript(passage: Passage): { script: string; speakers: Speaker[] } {
  const speakers = passage.speakers ?? [];
  if (passage.lines && passage.lines.length > 0 && speakers.length > 0) {
    const nameOf = (id: string) => speakers.find((s) => s.id === id)?.name ?? "Narrator";
    const script = passage.lines.map((l) => `${nameOf(l.speakerId)}: ${l.text}`).join("\n");
    return { script, speakers };
  }
  return { script: passage.body, speakers: [] };
}

/** Synthesize one listening passage with Gemini TTS. Multi-speaker when ≤2 named speakers exist. */
export async function geminiSynthesizePassage(
  passage: Passage,
  lang: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const key = getKey("gemini");
  if (!key) throw new TtsError("No Gemini API key set", "auth");

  const { script, speakers } = passageScript(passage);
  const useMulti = speakers.length >= 1 && speakers.length <= 2;

  const styleLine = useMulti
    ? `Voices — ${speakers.map(speakerStyleHint).join("; ")}.`
    : passage.accent
      ? `Read in a ${passage.accent} accent.`
      : "";

  const prompt = [
    `Read this ${languageName(lang)} listening passage aloud naturally at a steady exam pace.`,
    styleLine,
    "",
    script,
  ]
    .filter(Boolean)
    .join("\n");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechConfig: any = useMulti
    ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakers.map((s, i) => ({
            speaker: s.name,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoiceForSpeaker(s, i) } },
          })),
        },
      }
    : { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } };

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig },
      }),
      signal,
    });
  } catch (err) {
    throw new TtsError(err instanceof Error ? err.message : "network error", "network");
  }

  if (res.status === 401 || res.status === 403) throw new TtsError("Gemini rejected the API key", "auth");
  if (res.status === 429) throw new TtsError("Gemini TTS quota/rate limit reached", "rate_limit");
  if (!res.ok) throw new TtsError(`Gemini TTS failed (${res.status})`, "unknown");

  const json = (await res.json()) as { candidates?: { content?: { parts?: InlinePart[] } }[] };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const data = part?.inlineData?.data;
  if (!data) throw new TtsError("Gemini returned no audio", "empty");

  const pcm = base64ToBytes(data);
  return pcm16ToWav(pcm, parseSampleRate(part?.inlineData?.mimeType));
}
