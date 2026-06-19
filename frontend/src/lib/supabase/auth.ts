/**
 * Auth helpers (work-order §5G). Email magic-link + Google OAuth via Supabase. Google login is for
 * the ACCOUNT only — it is NOT an AI key (Gemini keys come from aistudio.google.com). All helpers
 * no-op gracefully when Supabase isn't configured, so the demo works signed-out.
 */
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "./client";

export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? window.location.origin + window.location.pathname },
  });
}

export async function signInWithEmail(email: string, redirectTo?: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Accounts are not configured in this build." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo ?? window.location.origin + window.location.pathname },
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
