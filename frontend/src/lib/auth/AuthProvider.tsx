/**
 * App-wide auth context (work order §6). Wraps the router so every page can read the current session
 * via {@link useAuth}. Guest-first: when Supabase is unconfigured or the user is signed out, the app
 * still works on localStorage — `user` is just null. Persistence + JWT auto-refresh are configured on
 * the client; here we hydrate the initial session and subscribe to changes, then route a freshly
 * signed-in user off the auth pages.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { onAuthChange } from "@/lib/supabase/auth";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the initial getSession() resolves — guards against an anon flicker. */
  loading: boolean;
  /** Whether accounts are available at all in this build. */
  configured: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  configured: false,
});

// /auth/callback routes itself (see AuthCallback) — only the in-SPA login/signup pages need this.
const AUTH_ROUTES = new Set(["/login", "/signup"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const navigate = useNavigate();
  const location = useLocation();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const unsub = onAuthChange((s) => {
      if (active) setSession(s);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Route a freshly signed-in user away from the auth pages to their intended destination.
  useEffect(() => {
    const signedIn = Boolean(session);
    if (signedIn && !wasSignedIn.current && AUTH_ROUTES.has(location.pathname)) {
      const returnTo = sessionStorage.getItem("auth:returnTo");
      sessionStorage.removeItem("auth:returnTo");
      navigate(returnTo && returnTo !== location.pathname ? returnTo : "/", { replace: true });
    }
    wasSignedIn.current = signedIn;
  }, [session, location.pathname, navigate]);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, configured: isSupabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
