import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * OAuth / magic-link return page (BrowserRouter / Owner-Mode). The Supabase client parses the session
 * from the URL on load; once the initial session resolves we route the user to where they were headed
 * (or the dashboard). On HashRouter/Pages the redirect lands on the app base instead and AuthProvider
 * handles the hand-off — this page is the clean-URL path for dev.
 */
export default function AuthCallback() {
  const { loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const returnTo = sessionStorage.getItem("auth:returnTo") || "/";
    sessionStorage.removeItem("auth:returnTo");
    navigate(returnTo, { replace: true });
  }, [loading, navigate]);

  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="ml-2 text-sm text-muted-foreground">Signing you in…</span>
    </div>
  );
}
