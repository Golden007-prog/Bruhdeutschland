import { useState, type ReactNode } from "react";
import { Highlighter, NotebookPen, X } from "lucide-react";

import { useSyncedState } from "@/lib/persist/useSyncedState";
import type { Passage } from "@/lib/exam/schema";
import { cn } from "@/lib/utils";

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Render passage text with the user's saved highlight substrings wrapped in <mark>. */
function withHighlights(text: string, highlights: string[]): ReactNode {
  const valid = [...new Set(highlights.filter((h) => h.trim().length >= 2))].sort((a, b) => b.length - a.length);
  if (valid.length === 0) return text;
  const re = new RegExp(`(${valid.map(escapeRe).join("|")})`, "g");
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-sm bg-amber-200/80 px-0.5 dark:bg-amber-300/40 dark:text-foreground">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * The Reading stimulus pane (mock-test §3): the passage(s) with a real-IELTS-style HIGHLIGHTER (select
 * text → mark) and a NOTES scratchpad. Highlights + notes persist per attempt (keyed by the form nonce,
 * stored per-user via the synced store), so they survive a refresh and appear in review.
 */
export function ReadingStimulus({ passages, nonce }: { passages: Passage[]; nonce: string }) {
  const [highlights, setHighlights] = useSyncedState<string[]>(`exam:hl:${nonce}`, []);
  const [notes, setNotes] = useSyncedState<string>(`exam:notes:${nonce}`, "");
  const [hlMode, setHlMode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const onMouseUp = () => {
    if (!hlMode) return;
    const sel = typeof window !== "undefined" ? window.getSelection?.() : null;
    const text = sel?.toString().trim() ?? "";
    if (text.length >= 2 && text.length <= 240) {
      setHighlights((h) => (h.includes(text) ? h : [...h, text]));
      sel?.removeAllRanges();
    }
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 bg-card/95 px-1 pb-2 backdrop-blur">
        <button
          type="button"
          aria-pressed={hlMode}
          onClick={() => setHlMode((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
            hlMode ? "border-amber-400 bg-amber-100 text-amber-900" : "bg-card hover:bg-muted",
          )}
        >
          <Highlighter className="h-3.5 w-3.5" aria-hidden /> {hlMode ? "Highlighting on" : "Highlighter"}
        </button>
        {highlights.length > 0 && (
          <button type="button" onClick={() => setHighlights([])} className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted">
            <X className="h-3.5 w-3.5" aria-hidden /> Clear ({highlights.length})
          </button>
        )}
        <button
          type="button"
          aria-pressed={showNotes}
          onClick={() => setShowNotes((v) => !v)}
          className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs", showNotes ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-muted")}
        >
          <NotebookPen className="h-3.5 w-3.5" aria-hidden /> Notes
        </button>
        {hlMode && <span className="text-xs text-muted-foreground">Select text in the passage to highlight it.</span>}
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          aria-label="Your notes for this section"
          placeholder="Jot notes here — they're saved and shown in review."
          className="w-full rounded-md border bg-card p-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      <div onMouseUp={onMouseUp} className={cn(hlMode && "cursor-text select-text")}>
        {passages.map((p) => (
          <article key={p.id} className="mb-3 rounded-md border bg-muted/20 p-4">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {withHighlights(p.body, highlights)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
