import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

/**
 * Honest storage notice (work order §8F-54). DeutschPrep uses localStorage for app state — no tracking
 * or advertising cookies — so this is a one-time, dismissible notice rather than a consent gate.
 */
export function ConsentBanner() {
  const [dismissed, setDismissed] = useSyncedState<boolean>("consent:v1", false);
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Storage notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          DeutschPrep stores your data in this browser — no tracking or advertising cookies. Read our{" "}
          <Link to="/legal/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <button type="button" onClick={() => setDismissed(true)} className={cn(buttonVariants({ size: "sm" }))}>
          Got it
        </button>
      </div>
    </div>
  );
}
