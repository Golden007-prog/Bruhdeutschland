/**
 * The app-wide intake profile hook. Persisted via {@link useSyncedState} — localStorage-first, mirrored
 * to Supabase when signed in — so the intake form, Parse, the dashboard, and every assessment tool read
 * and write one source of truth (page-audit §3.1).
 */
import { useCallback } from "react";

import { useSyncedState } from "@/lib/persist/useSyncedState";
import { DEFAULT_PROFILE, type UserProfile } from "./types";

const PROFILE_KEY = "profile:v1";

export interface UseProfile {
  profile: UserProfile;
  /** Replace the whole profile (also stamps updatedAt). */
  setProfile: (next: UserProfile) => void;
  /** Merge a partial patch (also stamps updatedAt). */
  update: (patch: Partial<UserProfile>) => void;
}

export function useProfile(): UseProfile {
  const [profile, setRaw] = useSyncedState<UserProfile>(PROFILE_KEY, DEFAULT_PROFILE);

  const update = useCallback(
    (patch: Partial<UserProfile>) => {
      setRaw((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
    },
    [setRaw],
  );

  const setProfile = useCallback(
    (next: UserProfile) => {
      setRaw({ ...next, updatedAt: new Date().toISOString() });
    },
    [setRaw],
  );

  return { profile, setProfile, update };
}
