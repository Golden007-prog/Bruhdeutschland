/**
 * Free browser STT for Speaking answers (work-order §5D), wrapping the Web Speech API
 * `SpeechRecognition` (Chrome/Edge/Safari). Firefox lacks it → callers fall back to a typed answer
 * (and may capture audio with MediaRecorder). The transcript feeds the AI Speaking rubric.
 *
 * `SpeechRecognition` is non-standard and absent from the TS DOM lib, so we declare a minimal shape.
 */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSttAvailable(): boolean {
  return getCtor() !== null;
}

export interface SttOptions {
  lang?: string;
  /** Called with the full transcript so far (final + interim). */
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export interface SttController {
  start(): void;
  stop(): void;
}

/** Create a live recognizer. Returns null if the API is unavailable. */
export function createRecognizer(opts: SttOptions = {}): SttController | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = opts.lang ?? "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = "";

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const result = e.results[i];
      const transcript = result[0].transcript;
      if (result.isFinal) finalText += transcript;
      else interim += transcript;
    }
    opts.onTranscript?.((finalText + interim).trim(), interim === "");
  };
  rec.onerror = (e) => opts.onError?.(e.error);
  rec.onend = () => opts.onEnd?.();

  return {
    start: () => {
      finalText = "";
      try {
        rec.start();
      } catch {
        /* start() throws if already started; ignore */
      }
    },
    stop: () => rec.stop(),
  };
}
