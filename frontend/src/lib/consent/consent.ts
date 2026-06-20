/**
 * Versioned consent capture (Section 9 §9.1 / qa-findings SEC-9). The old ConsentBanner stored only a
 * dismissible boolean; we now record WHICH version was accepted and WHEN, both for the signed-in user's
 * `consents` row (append-only audit) and on their `profiles` row (`consent_version` / `consent_at`).
 * Bumping {@link CONSENT_VERSION} re-shows the banner so a changed notice is re-accepted. Best-effort and
 * dependency-injected so it's unit-testable; never throws.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Bump when the storage/privacy notice materially changes (forces re-acceptance). */
export const CONSENT_VERSION = "2026-06-21";

/** Record acceptance of the current consent version for a signed-in user. No-op when signed out. */
export async function recordConsent(
  client: SupabaseClient | null | undefined,
  uid: string | null,
  nowIso: string,
  version: string = CONSENT_VERSION,
): Promise<void> {
  if (!client || !uid) return;
  try {
    await client.from("consents").insert({
      user_id: uid,
      version,
      scope: "app",
      granted: true,
      granted_at: nowIso,
    });
    await client.from("profiles").update({ consent_version: version, consent_at: nowIso }).eq("id", uid);
  } catch {
    /* best-effort — the local dismiss flag still records acceptance on this device */
  }
}
