/**
 * Auth helpers (work-order §5G). Email magic-link + Google OAuth via Supabase. Google login is for
 * the ACCOUNT only — it is NOT an AI key (Gemini keys come from aistudio.google.com). All helpers
 * no-op gracefully when Supabase isn't configured, so the demo works signed-out.
 */
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "./client";

/**
 * Where Supabase should redirect after an email link / OAuth round-trip. On GitHub Pages we use
 * HashRouter, so we redirect to the app base URL and let `detectSessionInUrl` parse the tokens —
 * AuthProvider then routes the user onward (a `#/auth/callback` deep-link would collide with the
 * token fragment). In dev/Owner-Mode (BrowserRouter) we use a clean `/auth/callback` route.
 */
export function authRedirectUrl(): string {
  const base = import.meta.env.BASE_URL || "/"; // e.g. "/Bruhdeutschland/" — has a trailing slash
  const origin = window.location.origin;
  const useHash = import.meta.env.VITE_HASH_ROUTER === "true";
  return useHash ? `${origin}${base}` : `${origin}${base}auth/callback`;
}

export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? authRedirectUrl() },
  });
}

export async function signInWithEmail(email: string, redirectTo?: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Accounts are not configured in this build." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo ?? authRedirectUrl() },
  });
  return { error: error?.message };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Subscribe to auth changes; returns an unsubscribe fn. No-op when unconfigured. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) {
    cb(null);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
