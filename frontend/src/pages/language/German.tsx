import { CheckCircle2, Volume2, VolumeX } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CEFR_LEVELS } from "@/lib/seed/language";

/** Speak German text aloud via the Web Speech API (no network, in-browser). */
function speakGerman(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

const TTS_AVAILABLE = typeof window !== "undefined" && "speechSynthesis" in window;

export default function LanguageGerman() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 12 · Language"
        title="German A1–B2 course"
        description="A structured path from beginner to B2, with audio practice for listening and pronunciation."
        category="language"
      />

      <Alert variant="info">
        <CheckCircle2 aria-hidden />
        <AlertTitle>B2 is the usual floor for German-taught study</AlertTitle>
        <AlertDescription>
          Levels follow the Common European Framework (CEFR). Climb the ladder, then certify with an
          accepted exam — see the Goethe &amp; TestDaF comparison. Use the Listen buttons to hear
          each phrase in German.
        </AlertDescription>
      </Alert>

      {!TTS_AVAILABLE && (
        <Alert variant="warning">
          <VolumeX aria-hidden />
          <AlertTitle>Audio not available in this browser</AlertTitle>
          <AlertDescription>
            Your browser does not expose speech synthesis, so the Listen buttons are disabled. The
            written phrases and translations are still available.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={CEFR_LEVELS[0]?.level ?? "A1"}>
        <TabsList aria-label="CEFR levels">
          {CEFR_LEVELS.map((lvl) => (
            <TabsTrigger key={lvl.level} value={lvl.level}>
              <span className="official-figure">{lvl.level}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CEFR_LEVELS.map((lvl) => (
          <TabsContent key={lvl.level} value={lvl.level} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="official-figure">{lvl.level}</Badge>
              <h2 className="text-lg font-semibold">{lvl.label}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{lvl.summary}</p>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What you can do at {lvl.level}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lvl.canDo.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-category-language"
                        aria-hidden
                      />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Example phrases</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {lvl.phrases.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{p.de}</p>
                        <p className="text-sm text-muted-foreground">{p.en}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!TTS_AVAILABLE}
                        onClick={() => speakGerman(p.de)}
                        aria-label={`Listen to "${p.de}"`}
                      >
                        <Volume2 aria-hidden />
                        Listen
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
