/**
 * Gated access model. Anonymous visitors (and after logout) get only the landing/auth pages; the app
 * unlocks only after sign-in AND completing onboarding. Returning users with a saved profile skip the
 * wizard. When Supabase isn't configured (local dev / offline build) there's no auth to gate on, so the
 * app stays open. The gate waits for both auth and persisted-state hydration to avoid a redirect flash.
 */
import { isProfileStarted } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { useSyncHydrated, useSyncedState } from "@/lib/persist/useSyncedState";
import { useAuth } from "@/lib/auth/AuthProvider";

export type Access = "open" | "loading" | "anon" | "onboarding" | "ready";

export function useAccess(): Access {
  const { configured, loading, user } = useAuth();
  const hydrated = useSyncHydrated();
  const { profile } = useProfile();
  const [onboarded] = useSyncedState<boolean>("onboarded:v1", false);

  if (!configured) return "open";
  if (loading || !hydrated) return "loading";
  if (!user) return "anon";
  if (!(onboarded || isProfileStarted(profile))) return "onboarding";
  return "ready";
}
