import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, SkipForward, Sparkles, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isTtsAvailable, TtsController, whenVoicesReady } from "@/lib/speech/tts";
import {
  listTiers,
  resolveTier,
  setPreferredTier,
  getTtsRate,
  setTtsRate,
  synthesizePassage,
  type TtsTier,
} from "@/lib/speech/provider";
import type { Passage } from "@/lib/exam/schema";

/**
 * Plays Listening transcripts aloud across the three TTS tiers (work-order §5): free Web Speech
 * (live, robotic), Gemini (human-like, multi-speaker dialogue + accents), and Chirp 3: HD (premium).
 * The transcript stays HIDDEN until review — the real test shows none. Audio defaults to "plays once";
 * a study-mode replay reuses the cached audio. Falls back gracefully when a tier is unavailable.
 */
export function ListeningPlayer({ passages, lang, nonce }: { passages: Passage[]; lang: string; nonce: string }) {
  const flatText = useMemo(() => passages.map((p) => `${p.title}. ${p.body}`).join("  "), [passages]);
  const tiers = useMemo(listTiers, []);
  const [tier, setTier] = useState<TtsTier>(() => resolveTier());
  const [rate, setRate] = useState<number>(() => getTtsRate());

  // shared state
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [error, setError] = useState("");

  // web-speech state
  const [sentence, setSentence] = useState(0);
  const [total, setTotal] = useState(0);
  const controllerRef = useRef<TtsController | null>(null);

  // file-tier state
  const [synth, setSynth] = useState<{ step: number; total: number } | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [clipIdx, setClipIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
      abortRef.current?.abort();
    };
  }, []);

  // Keep the <audio> playbackRate in sync with the speed control.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, clipIdx]);

  const fileTier = tier !== "web";

  function changeTier(next: TtsTier) {
    controllerRef.current?.stop();
    abortRef.current?.abort();
    audioRef.current?.pause();
    setTier(next);
    setPreferredTier(next);
    setPlaying(false);
    setPlayed(false);
    setUrls([]);
    setClipIdx(0);
    setSynth(null);
    setError("");
  }

  function changeRate(next: number) {
    setRate(next);
    setTtsRate(next);
    if (controllerRef.current && playing) {
      // Web Speech can't retune a live utterance; restart from the current sentence isn't worth it.
    }
  }

  // ── Web Speech (live) ──────────────────────────────────────────────────────
  const startWeb = async (replay = false) => {
    controllerRef.current?.stop();
    await whenVoicesReady();
    const c = new TtsController(flatText, {
      lang,
      rate,
      onSentence: (i, t) => {
        setSentence(i);
        setTotal(t);
      },
      onEnd: () => {
        setPlaying(false);
        setPlayed(true);
      },
      onError: () => setError("The browser voice stopped unexpectedly. Try replay or another voice."),
    });
    controllerRef.current = c;
    if (replay) setPlayed(false);
    c.play();
    setPlaying(true);
  };

  const toggleWeb = () => {
    const c = controllerRef.current;
    if (!c) {
      void startWeb();
      return;
    }
    if (playing) {
      c.pause();
      setPlaying(false);
    } else {
      c.resume();
      setPlaying(true);
    }
  };

  // ── File tiers (Gemini / Chirp) ────────────────────────────────────────────
  const synthesizeAll = async (): Promise<string[]> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const out: string[] = [];
    for (let i = 0; i < passages.length; i++) {
      setSynth({ step: i + 1, total: passages.length });
      const { url } = await synthesizePassage(passages[i], lang, nonce, tier, ctrl.signal);
      out.push(url);
    }
    setSynth(null);
    return out;
  };

  const startFile = async (replay = false) => {
    setError("");
    try {
      let list = urls;
      if (list.length === 0) {
        list = await synthesizeAll();
        setUrls(list);
      }
      if (replay) setPlayed(false);
      setClipIdx(0);
      // Defer to the next tick so the <audio src> binds before play().
      requestAnimationFrame(() => {
        const el = audioRef.current;
        if (el) {
          el.src = list[0];
          el.playbackRate = rate;
          void el.play();
          setPlaying(true);
        }
      });
    } catch (err) {
      setSynth(null);
      const msg = err instanceof Error ? err.message : "Synthesis failed";
      setError(`${msg}. You can switch to the free browser voice above.`);
    }
  };

  const onClipEnded = () => {
    const next = clipIdx + 1;
    if (next < urls.length) {
      setClipIdx(next);
      const el = audioRef.current;
      if (el) {
        el.src = urls[next];
        el.playbackRate = rate;
        void el.play();
      }
    } else {
      setPlaying(false);
      setPlayed(true);
    }
  };

  const toggleFile = () => {
    const el = audioRef.current;
    if (!el || urls.length === 0) {
      void startFile();
      return;
    }
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  if (!isTtsAvailable() && tier === "web") {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Your browser can&apos;t play the free voice (no speech synthesis). Add a Gemini key in Settings
        for human-like audio, or try Chrome, Edge, or Safari.
      </div>
    );
  }

  const pct = fileTier
    ? urls.length
      ? Math.round(((clipIdx + (played ? 1 : 0)) / urls.length) * 100)
      : 0
    : total
      ? Math.round(((sentence + 1) / total) * 100)
      : 0;

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          <p className="eyebrow">Audio · plays once {fileTier && <Sparkles className="ml-0.5 inline h-3 w-3 text-primary" aria-hidden />}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="tts-tier">Voice tier</label>
          <select
            id="tts-tier"
            value={tier}
            onChange={(e) => changeTier(e.target.value as TtsTier)}
            className="h-7 rounded-md border bg-card px-1.5 text-xs"
          >
            {tiers.map((t) => (
              <option key={t.tier} value={t.tier} disabled={!t.available}>
                {t.label}{t.available ? "" : " — set up"}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="tts-rate">Speed</label>
          <select
            id="tts-rate"
            value={rate}
            onChange={(e) => changeRate(Number(e.target.value))}
            className="h-7 rounded-md border bg-card px-1.5 text-xs"
          >
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
          </select>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">{tiers.find((t) => t.tier === tier)?.note}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {synth ? (
          <Button size="sm" disabled>
            <Loader2 className="animate-spin" aria-hidden /> Synthesizing voices {synth.step}/{synth.total}…
          </Button>
        ) : !played ? (
          <Button size="sm" onClick={fileTier ? toggleFile : toggleWeb} aria-label={playing ? "Pause audio" : "Play audio"}>
            {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            {playing ? "Pause" : (fileTier ? urls.length : controllerRef.current) ? "Resume" : "Play audio"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => (fileTier ? startFile(true) : startWeb(true))}>
            <RotateCcw aria-hidden /> Replay (study mode)
          </Button>
        )}
        {!fileTier && (
          <Button size="sm" variant="ghost" onClick={() => controllerRef.current?.next()} disabled={!playing}>
            <SkipForward aria-hidden /> Next sentence
          </Button>
        )}
      </div>

      {fileTier && (
        <audio
          ref={audioRef}
          className="sr-only"
          onEnded={onClipEnded}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      )}

      <Progress value={pct} label={`Audio ${pct}% played`} className="mt-3 h-1.5" indicatorClassName="bg-category-language" />

      {error && <p className="mt-2 text-xs text-amber-700">{error}</p>}

      <p className="mt-2 text-xs text-muted-foreground">
        The transcript is hidden until you finish — just like the real test. It appears in your review.
      </p>
    </div>
  );
}
