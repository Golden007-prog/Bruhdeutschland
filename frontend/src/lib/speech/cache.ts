/**
 * Synthesized-audio cache (work-order §5 — "cache the rendered audio so a replayed attempt doesn't
 * re-synthesize"). Two tiers, both best-effort and non-blocking:
 *   1. in-memory Map of object URLs (always; survives within a session)
 *   2. Supabase Storage bucket `exam-audio` at `${userId}/${key}.bin` (when signed in + configured)
 *
 * Audio blobs are far too large for localStorage, so there is no localStorage tier. If the bucket
 * doesn't exist or the user is signed out, the cloud path silently no-ops and we re-synthesize on a
 * cold load — correctness is never affected, only cost.
 */
import { supabase } from "@/lib/supabase/client";
import { onScopeChange } from "@/lib/persist/userScope";

const BUCKET = "exam-audio";
const mem = new Map<string, string>();

/** Stable short hash for a cache key (djb2 → base36). */
export function audioKey(...parts: (string | number | undefined)[]): string {
  const s = parts.filter((p) => p !== undefined).join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Look up cached audio: memory first, then Supabase Storage. Returns an object URL or null. */
export async function getCachedAudio(key: string): Promise<string | null> {
  const hit = mem.get(key);
  if (hit) return hit;

  const uid = await currentUserId();
  if (!uid || !supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${uid}/${key}.bin`);
    if (error || !data) return null;
    const url = URL.createObjectURL(data);
    mem.set(key, url);
    return url;
  } catch {
    return null;
  }
}

/** Cache a freshly synthesized blob in memory (always) and Supabase Storage (best-effort). */
export async function putCachedAudio(key: string, blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  mem.set(key, url);

  const uid = await currentUserId();
  if (uid && supabase) {
    // Fire-and-forget; failures (no bucket, quota, RLS) are non-fatal.
    void supabase.storage
      .from(BUCKET)
      .upload(`${uid}/${key}.bin`, blob, { upsert: true, contentType: blob.type })
      .catch(() => undefined);
  }
  return url;
}

/** Drop every in-memory object URL (e.g. on sign-out) to free memory. */
export function clearAudioMemoryCache(): void {
  for (const url of mem.values()) URL.revokeObjectURL(url);
  mem.clear();
}

// On any auth transition (sign-in / user-switch / sign-out) drop cached audio URLs so a previous
// user's synthesized clips can never be served to the next (data-isolation P0).
onScopeChange(clearAudioMemoryCache);
