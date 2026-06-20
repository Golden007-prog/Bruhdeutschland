/**
 * Active-user scope for per-user client storage (data-isolation P0). Every personal localStorage store
 * (profile/state, exam attempts, in-progress exams) keys itself by the signed-in user's id via
 * {@link scopedKey} so two accounts on the same browser can never read each other's cache. The active
 * id is driven by Supabase auth; `setActiveUser` is also the test seam. Signed-out → the `anon` scope.
 *
 * Non-personal device prefs (theme, TTS tier, the Owner-Mode bridge URL) deliberately stay global and do
 * NOT use this — they are not personal data and are expected to be device-wide. BYOK API keys, by
 * contrast, ARE per-user secrets and now scope through {@link scopedKey} (see lib/llm/keys.ts, SEC-7).
 */
import { onAuthChange } from "@/lib/supabase/auth";

const ANON = "anon";

let currentUserId: string | null = null;
let started = false;
const subs = new Set<() => void>();

/** The signed-in user's id, or null when signed out / before auth resolves. */
export function getActiveUserId(): string | null {
  return currentUserId;
}

/** The scope segment used in storage keys ("anon" when signed out). */
export function getScopeId(): string {
  return currentUserId ?? ANON;
}

/** Namespace a base storage key by the active scope, e.g. `deutschprep:x` → `deutschprep:x:<uid|anon>`. */
export function scopedKey(base: string): string {
  return `${base}:${getScopeId()}`;
}

/** Set the active identity (called by the auth subscription; also used directly in tests). */
export function setActiveUser(id: string | null): void {
  if (id === currentUserId) return;
  currentUserId = id;
  for (const fn of subs) fn();
}

/** Subscribe to scope (sign-in / switch / sign-out) changes. */
export function onScopeChange(fn: () => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

/** Begin tracking the signed-in user (idempotent). Safe when Supabase is unconfigured (stays anon). */
export function startUserScope(): void {
  if (started) return;
  started = true;
  onAuthChange((session) => setActiveUser(session?.user?.id ?? null));
}

// Track auth from import so scope is correct before any store reads. (No-op/anon when unconfigured.)
startUserScope();
