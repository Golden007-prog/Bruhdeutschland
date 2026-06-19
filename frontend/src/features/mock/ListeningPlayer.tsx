import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isTtsAvailable, TtsController, whenVoicesReady } from "@/lib/speech/tts";
import type { Passage } from "@/lib/exam/schema";

/**
 * Plays Listening transcripts aloud via chunked TTS (work-order §5D). The transcript text stays
 * HIDDEN until review (real IELTS shows no transcript). Audio defaults to playing once; a study-mode
 * replay is offered. Falls back to a clear message when the browser has no speech synthesis.
 */
export function ListeningPlayer({ passages, lang }: { passages: Passage[]; lang: string }) {
  const text = passages.map((p) => `${p.title}. ${p.body}`).join("  ");
  const [sentence, setSentence] = useState(0);
  const [total, setTotal] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const controllerRef = useRef<TtsController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.stop();
  }, []);

  if (!isTtsAvailable()) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Your browser can&apos;t play audio (no speech synthesis). Read the transcript in the review
        screen, or try Chrome, Edge, or Safari for the Listening audio.
      </div>
    );
  }

  const start = async (replay = false) => {
    controllerRef.current?.stop();
    await whenVoicesReady();
    const c = new TtsController(text, {
      lang,
      onSentence: (i, t) => {
        setSentence(i);
        setTotal(t);
      },
      onEnd: () => {
        setPlaying(false);
        setPlayed(true);
      },
    });
    controllerRef.current = c;
    if (replay) setPlayed(false);
    c.play();
    setPlaying(true);
  };

  const toggle = () => {
    const c = controllerRef.current;
    if (!c) {
      void start();
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

  const pct = total ? Math.round(((sentence + 1) / total) * 100) : 0;

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="eyebrow">Audio · plays once</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!played ? (
          <Button size="sm" onClick={toggle} aria-label={playing ? "Pause audio" : "Play audio"}>
            {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            {playing ? "Pause" : controllerRef.current ? "Resume" : "Play audio"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => start(true)}>
            <RotateCcw aria-hidden /> Replay (study mode)
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => controllerRef.current?.next()} disabled={!playing}>
          <SkipForward aria-hidden /> Next sentence
        </Button>
      </div>
      <Progress value={pct} label={`Audio ${pct}% played`} className="mt-3 h-1.5" indicatorClassName="bg-category-language" />
      <p className="mt-2 text-xs text-muted-foreground">
        The transcript is hidden until you finish — just like the real test. It appears in your review.
      </p>
    </div>
  );
}
