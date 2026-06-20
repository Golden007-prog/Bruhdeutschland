/**
 * Per-user typed-table sync (SEC-3) — the DUAL-WRITE companion to {@link syncedStore}. Personal lists
 * (applications, roadmap step status, user deadlines) keep living in localStorage / the `settings.data`
 * JSONB blob (the offline cache + guest path), and ALSO mirror to their own typed Supabase table when a
 * user is signed in. This file holds only the dependency-injected primitives — every function takes the
 * supabase client + uid explicitly so they're trivially unit-testable and never reach for globals.
 *
 * Safety contract (relied on by {@link useTableSync}): with a null client or no uid these NEVER throw and
 * NEVER touch the network — `loadRows` resolves to `[]`, the writers resolve to nothing. RLS already
 * scopes every table to the owner; we additionally pass `user_id` so the offline cache and the table can
 * never disagree about whose row it is.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** A persistable table row always carries its owner + a primary-key id. */
export interface OwnedRow {
  id: string;
  user_id: string;
  [column: string]: unknown;
}

type Client = SupabaseClient | null | undefined;

/** All rows the given user owns in `table`. Returns `[]` (never throws) when offline / unconfigured. */
export async function loadRows<T extends OwnedRow>(
  client: Client,
  table: string,
  uid: string | null,
): Promise<T[]> {
  if (!client || !uid) return [];
  try {
    const { data, error } = await client.from(table).select("*").eq("user_id", uid);
    if (error || !data) return [];
    return data as T[];
  } catch {
    return [];
  }
}

/**
 * Upsert the given rows (each already carrying `user_id`). No-op when offline / unconfigured / empty.
 * Best-effort: swallows errors so a failed sync never breaks the local-first UX. Pass `onConflict` for a
 * table whose conflict target isn't the primary key — e.g. roadmap_items' `unique(user_id, step_id)`.
 */
export async function upsertRows(
  client: Client,
  table: string,
  rows: OwnedRow[],
  onConflict?: string,
): Promise<void> {
  if (!client || rows.length === 0) return;
  try {
    await client.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  } catch {
    /* best-effort — localStorage remains the source of truth */
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deterministic RFC-4122 UUID derived from an arbitrary client id (FNV-1a → 128 bits). The client list
 * ids (`uid("app")` etc.) aren't UUIDs, but several typed tables key on a `uuid` primary key; deriving a
 * STABLE uuid from the client id keeps upserts idempotent across reconciles (same item → same row) while
 * the human-facing client id stays the React key. Not cryptographic — only needs to be collision-light.
 *
 * IDEMPOTENT: an input that is already a uuid is returned unchanged. This matters because after a sign-in
 * HYDRATE the item's client id becomes the table's own uuid — passing it back through here must NOT remap
 * it, or the next reconcile would orphan the row and insert a duplicate.
 */
export function stableUuid(clientId: string): string {
  if (UUID_RE.test(clientId)) return clientId.toLowerCase();
  // Two independent FNV-1a passes (different seeds) give 64 bits each → 128 bits of hex.
  const fnv = (seed: number): string => {
    let h = seed >>> 0;
    for (let i = 0; i < clientId.length; i += 1) {
      h ^= clientId.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  };
  const hex = (fnv(0x811c9dc5) + fnv(0x9e3779b9) + fnv(0x85ebca77) + fnv(0xc2b2ae3d)).slice(0, 32);
  // Stamp version (4) and variant (8/9/a/b) nibbles so Postgres accepts it as a uuid.
  const v = `${hex.slice(0, 12)}4${hex.slice(13, 16)}${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 32)}`;
  return `${v.slice(0, 8)}-${v.slice(8, 12)}-${v.slice(12, 16)}-${v.slice(16, 20)}-${v.slice(20, 32)}`;
}

/** Delete one row the user owns (id + user_id scoped). No-op when offline / unconfigured. */
export async function deleteRow(
  client: Client,
  table: string,
  uid: string | null,
  id: string,
): Promise<void> {
  if (!client || !uid) return;
  try {
    await client.from(table).delete().eq("id", id).eq("user_id", uid);
  } catch {
    /* best-effort */
  }
}
