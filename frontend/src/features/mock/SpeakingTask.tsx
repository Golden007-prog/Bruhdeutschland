import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createRecognizer, isSttAvailable, type SttController } from "@/lib/speech/stt";
import { isTtsAvailable, speakOnce } from "@/lib/speech/tts";
import type { OpenTask } from "@/lib/exam/schema";

/**
 * A Speaking task with optional prep timer, speech-to-text capture (work-order §5D), and a typed
 * fallback when SpeechRecognition is unavailable (e.g. Firefox). The transcript is the answer that
 * later feeds the AI rubric. The question can be read aloud via TTS.
 */
export function SpeakingTask({
  task,
  lang,
  value,
  onChange,
}: {
  task: OpenTask;
  lang: string;
  value: string;
  onChange: (text: string) => void;
}) {
  const [prepLeft, setPrepLeft] = useState(task.prepSeconds ?? 0);
  const [prepping, setPrepping] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SttController | null>(null);
  const ttsOk = isTtsAvailable();
  // Text present when recording starts; the live transcript is appended to it so a second take or
  // typing-then-recording never overwrites earlier text (qa-findings P2).
  const baseRef = useRef("");
  const sttOk = isSttAvailable();

  useEffect(() => {
    if (!prepping) return;
    if (prepLeft <= 0) {
      setPrepping(false);
      return;
    }
    const id = setTimeout(() => setPrepLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [prepping, prepLeft]);

  useEffect(() => () => recRef.current?.stop(), []);

  const toggleRecord = () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    baseRef.current = value.trim();
    const rec = createRecognizer({
      lang,
      onTranscript: (text) => {
        const base = baseRef.current;
        onChange(base ? `${base} ${text}` : text);
      },
      onError: () => setRecording(false),
      onEnd: () => setRecording(false),
    });
    if (!rec) return;
    recRef.current = rec;
    rec.start();
    setRecording(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{task.prompt}</p>
        <div className="flex flex-col items-end">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Read the question aloud"
            disabled={!ttsOk}
            title={ttsOk ? undefined : "Audio unavailable in this browser"}
            onClick={() => speakOnce(task.prompt, lang)}
          >
            <Volume2 aria-hidden />
          </Button>
          {!ttsOk && <span className="text-[0.65rem] text-muted-foreground">audio unavailable in this browser</span>}
        </div>
      </div>
      {task.guidance && <p className="text-sm text-muted-foreground">{task.guidance}</p>}

      {task.prepSeconds ? (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => { setPrepLeft(task.prepSeconds ?? 0); setPrepping(true); }}>
            Start {task.prepSeconds}s prep
          </Button>
          {prepping && <span className="official-figure text-sm text-amber-700">{prepLeft}s to prepare</span>}
        </div>
      ) : null}

      {sttOk ? (
        <div className="space-y-2">
          <Button size="sm" variant={recording ? "secondary" : "default"} onClick={toggleRecord}>
            {recording ? <MicOff aria-hidden /> : <Mic aria-hidden />}
            {recording ? "Stop recording" : "Record answer"}
          </Button>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your spoken answer is transcribed here — you can also type or edit it."
            rows={4}
            aria-label="Speaking answer transcript"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Speech recognition isn&apos;t available in this browser — type your answer instead (or
            practise aloud and note it down). Chrome/Edge support live transcription.
          </p>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type what you would say…"
            rows={4}
            aria-label="Speaking answer"
          />
        </div>
      )}
    </div>
  );
}
