import { useMemo, useState } from "react";
import { RotateCcw, Sparkles, Volume2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { INITIAL_SRS, reviewByRating, type SrsState } from "@/lib/calc/srs";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { FLASHCARD_DECK } from "@/lib/seed/language";

/** Speak German text aloud via the Web Speech API. */
function speakGerman(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

const TTS_AVAILABLE = typeof window !== "undefined" && "speechSynthesis" in window;

type Grade = "again" | "good" | "easy";

/** Persisted SM-2 schedule for the deck, keyed by card id. */
type SrsMap = Record<string, SrsState>;

const EMPTY_SRS: SrsMap = {};

/** Build the initial in-memory queue (the deck's card ids in order). */
function initialQueue(): string[] {
  return FLASHCARD_DECK.map((c) => c.id);
}

/** Human-readable next-interval label for a card's current SM-2 state. */
function nextIntervalLabel(state: SrsState | undefined): string {
  if (!state || state.repetition === 0) return "new card";
  const d = state.intervalDays;
  return d === 1 ? "next in 1 day" : `next in ${d} days`;
}

export default function LanguageFlashcards() {
  // Per-card SM-2 schedule persists across sessions/devices; the session queue is in-memory only.
  const [srs, setSrs] = useSyncedState<SrsMap>("srs:german", EMPTY_SRS);
  const [queue, setQueue] = useState<string[]>(initialQueue);
  const [flipped, setFlipped] = useState(false);

  const total = FLASHCARD_DECK.length;
  const currentId = queue[0];
  const card = useMemo(
    () => FLASHCARD_DECK.find((c) => c.id === currentId),
    [currentId],
  );
  const complete = queue.length === 0;
  // Each card id sits in the queue at most once, so "learned" = retired = total − remaining.
  // Progress is derived from that, so it always lands at 100% and never overshoots.
  const learned = total - queue.length;
  const progressPct = total === 0 ? 100 : Math.round((learned / total) * 100);

  function grade(g: Grade): void {
    if (!currentId) return;
    // Deterministic SM-2 scheduling (src/lib/calc/srs.ts) — persist the new interval/easiness.
    setSrs((prev) => ({
      ...prev,
      [currentId]: reviewByRating(prev[currentId] ?? INITIAL_SRS, g),
    }));
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [head, ...rest] = prev;
      // again → keep practicing: re-show after the next ~2 cards (or immediately if it's the last one).
      if (g === "again") {
        const at = Math.min(2, rest.length);
        return [...rest.slice(0, at), head, ...rest.slice(at)];
      }
      // good / easy → recalled it: retire the card from this session.
      return rest;
    });
    setFlipped(false);
  }

  function restart(): void {
    setQueue(initialQueue());
    setFlipped(false);
  }

  function resetProgress(): void {
    setSrs(EMPTY_SRS);
    setQueue(initialQueue());
    setFlipped(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 13 · Language"
        title="Spaced-repetition flashcards"
        description="Memorize vocabulary efficiently with a spaced-repetition schedule that surfaces cards right before you'd forget them."
        category="language"
      />

      <Alert variant="info">
        <Sparkles aria-hidden />
        <AlertTitle>How the schedule works</AlertTitle>
        <AlertDescription>
          Tap the card (or press Enter / Space) to flip it. Then rate your recall: <b>Again</b>{" "}
          keeps it in the queue to practice again, while <b>Good</b> and <b>Easy</b> retire it for
          this session. The session ends when every card is retired. Each rating updates an SM-2
          schedule (easiness, repetition, interval) that is saved on this device and synced to your
          account when you sign in.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Learned <span className="official-figure font-medium text-foreground">{learned}</span> ·
          Remaining{" "}
          <span className="official-figure font-medium text-foreground">{queue.length}</span> of{" "}
          <span className="official-figure font-medium text-foreground">{total}</span>
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw aria-hidden />
            Restart
          </Button>
          <Button variant="ghost" size="sm" onClick={resetProgress}>
            Reset progress
          </Button>
        </div>
      </div>
      <Progress value={progressPct} label="Flashcard session progress" indicatorClassName="bg-category-language" />

      {complete || !card ? (
        <Card className="border-category-language/40">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-category-language">
              <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Session complete</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You worked through all {total} cards. Run the deck again to reinforce them.
              </p>
            </div>
            <Button onClick={restart}>
              <RotateCcw aria-hidden />
              Start a new session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label={
              flipped
                ? `Card showing answer: ${card.en}. Activate to show the German front.`
                : `Card showing German: ${card.de}. Activate to reveal the English answer.`
            }
            className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 rounded-lg border bg-card p-8 text-center shadow-sm transition-colors hover:border-category-language focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="eyebrow">{flipped ? "English" : "Deutsch"}</span>
            <span className="text-2xl font-semibold">{flipped ? card.en : card.de}</span>
            {flipped && card.hint && (
              <span className="text-sm text-muted-foreground">{card.hint}</span>
            )}
            {!flipped && (
              <Badge variant="secondary" className="mt-2">
                Tap or press Enter to flip
              </Badge>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!TTS_AVAILABLE}
              onClick={() => speakGerman(card.de)}
              aria-label={`Listen to "${card.de}"`}
            >
              <Volume2 aria-hidden />
              Listen (German)
            </Button>
            {!TTS_AVAILABLE && (
              <span className="text-xs text-muted-foreground">Audio unavailable in this browser.</span>
            )}
          </div>

          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="official-figure">
              {nextIntervalLabel(srs[card.id])}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Rate your recall">
            <Button variant="outline" onClick={() => grade("again")} disabled={!flipped}>
              Again
            </Button>
            <Button variant="secondary" onClick={() => grade("good")} disabled={!flipped}>
              Good
            </Button>
            <Button onClick={() => grade("easy")} disabled={!flipped}>
              Easy
            </Button>
          </div>
          {!flipped && (
            <p className="text-center text-xs text-muted-foreground">
              Flip the card to reveal the rating buttons.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
