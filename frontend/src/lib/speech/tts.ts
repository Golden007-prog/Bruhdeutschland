/**
 * Free browser TTS for Listening (work-order §5D), wrapping the Web Speech API `SpeechSynthesis`.
 * Chrome cuts a single utterance at ~15 s / ~200 chars, so we split the transcript into sentence-sized
 * utterances and queue them back-to-back, exposing play/pause/stop/next-sentence and a sentence index.
 * A watchdog calls `resume()` periodically to defeat Chrome's long-speech auto-pause bug.
 */

export function isTtsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Split text into utterance-sized chunks (sentence boundaries, then hard-wrap long ones). */
export function splitSentences(text: string, maxLen = 200): string[] {
  const rough = text
    .replace(/\s+/g, " ")
    .match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  for (const s of rough) {
    const sentence = s.trim();
    if (!sentence) continue;
    if (sentence.length <= maxLen) {
      out.push(sentence);
    } else {
      // Hard-wrap overly long sentences on commas/spaces.
      let buf = "";
      for (const word of sentence.split(" ")) {
        if ((buf + " " + word).trim().length > maxLen) {
          if (buf) out.push(buf.trim());
          buf = word;
        } else {
          buf = (buf + " " + word).trim();
        }
      }
      if (buf) out.push(buf.trim());
    }
  }
  return out;
}

export function getVoices(lang?: string): SpeechSynthesisVoice[] {
  if (!isTtsAvailable()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (!lang) return voices;
  const prefix = lang.slice(0, 2).toLowerCase();
  return voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
}

/** Resolve voices, waiting once for the async `voiceschanged` event if they aren't ready yet. */
export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isTtsAvailable()) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);
    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Safety timeout in case the event never fires.
    window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  voiceURI?: string;
  onSentence?: (index: number, total: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export class TtsController {
  private readonly sentences: string[];
  private readonly opts: SpeakOptions;
  private index = 0;
  private playing = false;
  private stopped = false;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  /** The utterance currently queued, so we can detach its handlers before an intentional cancel(). */
  private active: SpeechSynthesisUtterance | null = null;

  constructor(text: string, opts: SpeakOptions = {}) {
    this.sentences = splitSentences(text);
    this.opts = opts;
  }

  get total(): number {
    return this.sentences.length;
  }
  get current(): number {
    return this.index;
  }
  get isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (!isTtsAvailable() || this.playing) return;
    this.stopped = false;
    this.playing = true;
    this.startWatchdog();
    this.speakCurrent();
  }

  private startWatchdog(): void {
    this.stopWatchdog();
    // Chrome pauses long synthesis after ~15s; nudging resume keeps the queue alive.
    this.watchdog = setInterval(() => {
      if (this.playing && isTtsAvailable()) window.speechSynthesis.resume();
    }, 8000);
  }
  private stopWatchdog(): void {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  private speakCurrent(): void {
    if (this.stopped || this.index >= this.sentences.length) {
      this.finish();
      return;
    }
    const u = new SpeechSynthesisUtterance(this.sentences[this.index]);
    if (this.opts.lang) u.lang = this.opts.lang;
    if (this.opts.rate) u.rate = this.opts.rate;
    if (this.opts.voiceURI) {
      const voice = getVoices().find((v) => v.voiceURI === this.opts.voiceURI);
      if (voice) u.voice = voice;
    }
    this.active = u;
    this.opts.onSentence?.(this.index, this.sentences.length);
    u.onend = () => {
      if (this.stopped) return;
      this.index += 1;
      this.speakCurrent();
    };
    u.onerror = (e) => {
      // "interrupted"/"canceled" are expected on stop()/next(); ignore those.
      if (this.stopped) return;
      this.opts.onError?.(e.error ?? "speech error");
      this.finish();
    };
    window.speechSynthesis.speak(u);
  }

  pause(): void {
    if (isTtsAvailable() && this.playing) {
      window.speechSynthesis.pause();
      this.playing = false;
      this.stopWatchdog();
    }
  }

  resume(): void {
    if (isTtsAvailable() && !this.playing && !this.stopped) {
      this.playing = true;
      this.startWatchdog();
      window.speechSynthesis.resume();
    }
  }

  stop(): void {
    this.stopped = true;
    this.playing = false;
    this.stopWatchdog();
    if (this.active) {
      this.active.onerror = null;
      this.active.onend = null;
      this.active = null;
    }
    if (isTtsAvailable()) window.speechSynthesis.cancel();
  }

  /** Skip to the next sentence. */
  next(): void {
    if (!isTtsAvailable() || this.index >= this.sentences.length - 1) return;
    this.index += 1;
    // Detach the in-flight utterance's handlers BEFORE cancel() so its onerror ("interrupted"/"canceled")
    // doesn't fire a spurious error and halt playback on this intentional skip — then re-speak directly.
    if (this.active) {
      this.active.onerror = null;
      this.active.onend = null;
      this.active = null;
    }
    window.speechSynthesis.cancel();
    if (this.playing) this.speakCurrent();
  }

  private finish(): void {
    this.playing = false;
    this.stopWatchdog();
    if (!this.stopped) this.opts.onEnd?.();
  }
}

/** Speak text once and return a controller. */
export function speak(text: string, opts?: SpeakOptions): TtsController {
  const c = new TtsController(text, opts);
  c.play();
  return c;
}

/** Fire-and-forget a single short phrase (e.g. a flashcard word). */
export function speakOnce(text: string, lang = "de-DE"): void {
  if (!isTtsAvailable()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.speak(u);
}
