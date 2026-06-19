import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

/** Reactive min-width media query (SSR/jsdom-safe). */
function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  const [match, setMatch] = useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : true,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const m = window.matchMedia(query);
    const handler = () => setMatch(m.matches);
    handler();
    m.addEventListener?.("change", handler);
    return () => m.removeEventListener?.("change", handler);
  }, [query]);
  return match;
}

const MIN = 0.3;
const MAX = 0.7;
const clampRatio = (n: number): number => Math.min(MAX, Math.max(MIN, n));

/** Fixed pane height: the area below the app + sticky exam headers, in dvh so mobile chrome doesn't clip. */
const PANE_HEIGHT = "h-[calc(100dvh-13rem)] min-h-[24rem]";

/**
 * Split exam layout (mock-test §1/§2): the STIMULUS pane is pinned on the left with its own scrollbar,
 * while the WORK pane (questions / essay) scrolls independently on the right — matching real
 * computer-delivered IELTS/TOEFL. Neither pane drags the other; the page itself doesn't scroll here.
 * A keyboard-operable divider resizes the split (ratio persisted per user). Below 1024px it collapses
 * to a segmented Stimulus | Questions toggle so neither pane is squeezed.
 */
export function SplitExamLayout({
  stimulus,
  work,
  stimulusLabel = "Stimulus",
  workLabel = "Questions",
}: {
  stimulus: ReactNode;
  work: ReactNode;
  stimulusLabel?: string;
  workLabel?: string;
}) {
  const wide = useMinWidth(1024);
  const [ratio, setRatio] = useSyncedState<number>("exam:splitRatio", 0.55);
  const [tab, setTab] = useState<"stimulus" | "work">("work");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) setRatio(clampRatio((e.clientX - rect.left) / rect.width));
    },
    [setRatio],
  );

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [onPointerMove]);

  const onDividerKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setRatio((r) => clampRatio((typeof r === "number" ? r : 0.55) - 0.02));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setRatio((r) => clampRatio((typeof r === "number" ? r : 0.55) + 0.02));
    } else if (e.key === "Home") {
      e.preventDefault();
      setRatio(0.5);
    }
  };

  // ── Mobile / narrow: segmented toggle, one full-width pane at a time ──────────
  if (!wide) {
    return (
      <div className="space-y-3">
        <div role="tablist" aria-label="Exam panes" className="grid grid-cols-2 gap-1 rounded-md border bg-muted/40 p-1 text-sm">
          {(["stimulus", "work"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("rounded px-2 py-1.5 transition-colors", tab === t ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
            >
              {t === "stimulus" ? stimulusLabel : workLabel}
            </button>
          ))}
        </div>
        <div tabIndex={0} role="region" className={cn("overflow-y-auto rounded-md border bg-card p-3", PANE_HEIGHT)} aria-label={tab === "stimulus" ? stimulusLabel : workLabel}>
          {tab === "stimulus" ? stimulus : work}
        </div>
      </div>
    );
  }

  // ── Desktop: pinned stimulus + independently scrolling work, resizable divider ─
  const pct = Math.round(clampRatio(typeof ratio === "number" ? ratio : 0.55) * 100);
  return (
    <div ref={containerRef} className={cn("flex w-full overflow-hidden rounded-md border", PANE_HEIGHT)}>
      <section aria-label={stimulusLabel} tabIndex={0} style={{ width: `${pct}%` }} className="min-w-0 overflow-y-auto bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        {stimulus}
      </section>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the passage and questions panes"
        aria-valuenow={pct}
        aria-valuemin={Math.round(MIN * 100)}
        aria-valuemax={Math.round(MAX * 100)}
        tabIndex={0}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onKeyDown={onDividerKey}
        className="relative w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/50 focus-visible:bg-primary focus-visible:outline-none"
        title="Drag (or use ← →) to resize"
      >
        {/* widen the hit/focus target without affecting layout */}
        <span className="pointer-events-auto absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden />
      </div>
      <section aria-label={workLabel} tabIndex={0} className="min-w-0 flex-1 overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        {work}
      </section>
    </div>
  );
}
