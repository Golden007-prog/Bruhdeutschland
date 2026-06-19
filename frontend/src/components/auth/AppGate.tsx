import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

import { useAccess } from "@/lib/auth/useAccess";

/** Full-screen loader shown while auth + persisted state hydrate. */
export function GateLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/**
 * Guards the whole app: anonymous → landing, signed-in-but-not-onboarded → the wizard, otherwise the
 * app renders. (`open` = accounts unconfigured, e.g. local dev — no gating possible.)
 */
export function AppGate() {
  const access = useAccess();
  if (access === "loading") return <GateLoader />;
  if (access === "anon") return <Navigate to="/welcome" replace />;
  if (access === "onboarding") return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
