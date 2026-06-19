import { describe, expect, it } from "vitest";

import { base64ToBytes, parseSampleRate, pcm16ToWavBuffer } from "./wav";

describe("base64ToBytes", () => {
  it("decodes base64 to the exact bytes", () => {
    // "AAEC" → [0,1,2]
    expect([...base64ToBytes("AAEC")]).toEqual([0, 1, 2]);
  });
  it("ignores whitespace", () => {
    expect(base64ToBytes("AA EC\n").length).toBe(3);
  });
});

describe("parseSampleRate", () => {
  it("reads the rate from a PCM mime", () => {
    expect(parseSampleRate("audio/L16;codec=pcm;rate=24000")).toBe(24000);
    expect(parseSampleRate("audio/L16;rate=16000")).toBe(16000);
  });
  it("defaults to 24000 when absent", () => {
    expect(parseSampleRate(undefined)).toBe(24000);
    expect(parseSampleRate("audio/wav")).toBe(24000);
  });
});

describe("pcm16ToWavBuffer", () => {
  it("writes a valid 44-byte RIFF/WAVE header in front of the PCM", () => {
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const buf = pcm16ToWavBuffer(pcm, 24000, 1);
    const view = new DataView(buf);
    const str = (off: number, len: number) =>
      String.fromCharCode(...new Uint8Array(buf, off, len));
    expect(str(0, 4)).toBe("RIFF");
    expect(str(8, 4)).toBe("WAVE");
    expect(str(12, 4)).toBe("fmt ");
    expect(str(36, 4)).toBe("data");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint32(24, true)).toBe(24000); // sample rate
    expect(view.getUint16(34, true)).toBe(16); // bits/sample
    expect(view.getUint32(40, true)).toBe(pcm.length); // data size
    expect(buf.byteLength).toBe(44 + pcm.length);
  });
});
