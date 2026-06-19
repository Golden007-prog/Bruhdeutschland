/**
 * Google Cloud "Chirp 3: HD" TTS engine (work-order §5, Tier 3 — premium, optional). Most natural
 * single voice; en-US/GB/AU + de-DE. Requires a Google Cloud API key with the Text-to-Speech API
 * enabled (BYOK, stored as the "chirp" service key). Returns an MP3 Blob.
 *
 * ⚠️ Honesty note: the Cloud TTS REST endpoint may be blocked by CORS from a pure static page in some
 * setups — hence Gemini is the recommended pure-browser path. On a CORS/network failure this throws a
 * clear error so the UI can fall back. Key never leaves the browser except to Google's endpoint.
 */
import type { Passage } from "@/lib/exam/schema";
import { getServiceKey } from "@/lib/llm/keys";
import { TtsError } from "./gemini-tts";
import { accentToLangTag, CHIRP_VOICES } from "./voices";

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

export const CHIRP_KEY_SERVICE = "chirp";

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Synthesize a passage with Chirp 3: HD. Picks a voice by the passage accent / exam language. */
export async function chirpSynthesizePassage(
  passage: Passage,
  lang: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const key = getServiceKey(CHIRP_KEY_SERVICE);
  if (!key) throw new TtsError("No Google Cloud TTS key set", "auth");

  const langTag = accentToLangTag(passage.accent, lang.startsWith("de") ? "de-DE" : "en-US");
  const voice = (CHIRP_VOICES[langTag] ?? CHIRP_VOICES["en-US"])[0];

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: passage.body },
        voice: { languageCode: langTag, name: voice.name },
        audioConfig: { audioEncoding: "MP3" },
      }),
      signal,
    });
  } catch (err) {
    throw new TtsError(
      err instanceof Error ? `${err.message} (Cloud TTS may be blocked by CORS in-browser — try Gemini)` : "network error",
      "network",
    );
  }

  if (res.status === 401 || res.status === 403) throw new TtsError("Google Cloud rejected the TTS key", "auth");
  if (res.status === 429) throw new TtsError("Cloud TTS quota/rate limit reached", "rate_limit");
  if (!res.ok) throw new TtsError(`Cloud TTS failed (${res.status})`, "unknown");

  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) throw new TtsError("Cloud TTS returned no audio", "empty");
  return base64ToBlob(json.audioContent, "audio/mpeg");
}
