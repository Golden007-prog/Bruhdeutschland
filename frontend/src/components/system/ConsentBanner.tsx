import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { CONSENT_VERSION, recordConsent } from "@/lib/consent/consent";

/**
 * Honest storage notice (work order §8F-54; Section 9 §9.1 versioned consent). DeutschPrep uses
 * localStorage for app state — no tracking or advertising cookies — so this is a dismissible notice.
 * Acceptance is recorded with its version + timestamp (locally, and to the signed-in user's `consents`
 * row + profile), and bumping CONSENT_VERSION re-shows the banner so a changed notice is re-accepted.
 */
export function ConsentBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useSyncedState<boolean>(`consent:${CONSENT_VERSION}`, false);
  if (dismissed) return null;

  const accept = () => {
    setDismissed(true);
    void recordConsent(supabase, user?.id ?? null, new Date().toISOString());
  };

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
        <button type="button" onClick={accept} className={cn(buttonVariants({ size: "sm" }))}>
          Got it
        </button>
      </div>
    </div>
  );
}
