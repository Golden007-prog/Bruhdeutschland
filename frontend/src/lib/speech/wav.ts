/**
 * PCM → WAV helpers (work-order §5). Gemini TTS returns raw little-endian 16-bit PCM (e.g.
 * "audio/L16;codec=pcm;rate=24000"); browsers can't play that directly, so we wrap it in a minimal
 * 44-byte WAV/RIFF header to produce a playable Blob. Pure + unit-tested (no DOM beyond Blob).
 */

/** Decode a base64 string to bytes (jsdom + browser both provide atob). */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Parse a sample rate from a mime like "audio/L16;codec=pcm;rate=24000" (default 24000). */
export function parseSampleRate(mime: string | undefined): number {
  const m = /rate=(\d+)/.exec(mime ?? "");
  return m ? Number(m[1]) : 24000;
}

/** Build a WAV (RIFF/PCM16) ArrayBuffer from raw 16-bit little-endian PCM mono samples. */
export function pcm16ToWavBuffer(pcm: Uint8Array, sampleRate = 24000, channels = 1): ArrayBuffer {
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);
  return buffer;
}

/** Wrap raw PCM16 bytes in a playable WAV Blob. */
export function pcm16ToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1): Blob {
  return new Blob([pcm16ToWavBuffer(pcm, sampleRate, channels)], { type: "audio/wav" });
}
