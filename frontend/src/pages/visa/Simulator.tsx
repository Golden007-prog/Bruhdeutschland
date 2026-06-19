import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Lightbulb, Target, Volume2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { INTERVIEW_QUESTIONS } from "@/lib/seed/visa";

/** Whether the browser exposes the Web Speech API (the pluggable TTS made concrete). */
const SPEECH_AVAILABLE = typeof window !== "undefined" && "speechSynthesis" in window;

/** Visa interview simulator — a stepper through common questions with on-demand tips and TTS. */
export default function VisaSimulator() {
  const [index, setIndex] = useState(0);
  const [showTips, setShowTips] = useState(false);

  const total = INTERVIEW_QUESTIONS.length;
  const current = INTERVIEW_QUESTIONS[index];
  const pct = useMemo(() => Math.round(((index + 1) / total) * 100), [index, total]);

  const go = (next: number) => {
    setIndex(next);
    setShowTips(false);
  };

  const speak = () => {
    if (!SPEECH_AVAILABLE) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(current.question);
    utterance.lang = "en-US";
    synth.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 22 · Visa"
        title="Visa interview simulator"
        description="Rehearse the student-visa interview with realistic questions and spoken practice. Officers want a genuine student with a coherent plan — practice answering honestly and specifically."
        category="visa"
        fileRef={`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
      />

      <Disclaimer />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow">
              Question <span className="official-figure">{index + 1}</span> of{" "}
              <span className="official-figure">{total}</span>
            </p>
            <Badge variant="secondary">Practice set</Badge>
          </div>
          <Progress value={pct} label={`Interview progress: ${pct}%`} className="mt-1 h-1.5" />
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg leading-snug">{current.question}</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={speak}
                disabled={!SPEECH_AVAILABLE}
                aria-label={
                  SPEECH_AVAILABLE
                    ? "Read the question aloud"
                    : "Read aloud is not available in this browser"
                }
                title={SPEECH_AVAILABLE ? "Read aloud" : "Not available in this browser"}
              >
                <Volume2 aria-hidden />
              </Button>
            </div>
            {!SPEECH_AVAILABLE && (
              <p className="mt-2 text-xs text-muted-foreground">
                Spoken practice is unavailable — your browser does not support speech synthesis.
              </p>
            )}
          </div>

          <div className="rounded-md border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-category-visa" aria-hidden />
              What the officer is checking
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{current.checking}</p>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={() => setShowTips((s) => !s)}
              aria-expanded={showTips}
              aria-controls={`tips-${current.id}`}
            >
              {showTips ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {showTips ? "Hide answer tips" : "Reveal answer tips"}
            </Button>
            {showTips && (
              <div
                id={`tips-${current.id}`}
                className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  How to answer well
                </p>
                <ul className="mt-2 space-y-1.5">
                  {current.tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-sm text-emerald-900">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => go(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft aria-hidden />
              Previous
            </Button>
            <span className="eyebrow" aria-hidden>
              {INTERVIEW_QUESTIONS.map((q, i) => (
                <span
                  key={q.id}
                  className={
                    i === index ? "text-category-visa" : "text-muted-foreground/40"
                  }
                >
                  {"● "}
                </span>
              ))}
            </span>
            <Button onClick={() => go(index + 1)} disabled={index === total - 1}>
              Next
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
