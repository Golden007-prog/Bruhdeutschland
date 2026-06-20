/**
 * Centralized dual-write wiring (SEC-3). One hook that takes a domain's existing `useSyncedState` list
 * and ALSO mirrors it to a typed Supabase table, so callers (Tracker, Roadmap, Calendar) opt in with a
 * pair of pure mappers instead of scattering supabase calls through their components.
 *
 * What it adds on top of {@link useSyncedState} (which stays the offline cache + `settings.data` path):
 *  - on sign-in (uid becomes non-null), HYDRATE from the table — but only when it already has rows, so a
 *    first-ever sign-in keeps the data the user built up while signed out instead of wiping it;
 *  - on every local change while signed in, reconcile the table: upsert the current rows and delete rows
 *    that disappeared. Everything degrades safely (no client / signed out → the typed-table half no-ops).
 *
 * It deliberately does NOT own the list state — the component still calls `useSyncedState` and passes the
 * value + setter in, so the local-first / guest behavior is identical whether or not this hook runs.
 *
 * id handling: the client list ids (`uid("app")`) aren't UUIDs, so for a uuid-keyed table the call site's
 * `toRow` emits a {@link stableUuid} as the row `id` (idempotent across reconciles). The hook tracks the
 * client-id → row-id mapping so a removed item is deleted by its real table id.
 */
import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { deleteRow, loadRows, stableUuid, upsertRows, type OwnedRow } from "./syncTable";

/**
 * Union local + cloud lists by stable client id (data-loss fix). On sign-in we adopt every cloud row
 * AND keep any local item the cloud doesn't have yet (e.g. programmes the user added while signed out),
 * so hydrate never silently discards signed-out edits. Cloud wins on id collision (it's the durable copy
 * that another device may have refined); the returned `localOnly` items are the ones to push up.
 */
export function mergeByClientId<Item>(
  local: Item[],
  cloud: Item[],
  idOf: (item: Item) => string,
): { merged: Item[]; localOnly: Item[] } {
  const cloudIds = new Set(cloud.map(idOf));
  const localOnly = local.filter((item) => !cloudIds.has(idOf(item)));
  return { merged: [...cloud, ...localOnly], localOnly };
}

export interface TableSyncConfig<Item> {
  /** Target typed table (e.g. "applications"). */
  table: string;
  /** Stable client id for an item — the React-side key, used to diff which items were removed. */
  idOf: (item: Item) => string;
  /**
   * Item → table row (without user_id; the hook stamps it). `index` is the item's position in the list,
   * for tables with a `sort_index` column. Return only columns that exist on the table; the row's `id`
   * is the value `deleteRow` will target (e.g. a {@link stableUuid} for a uuid-keyed table).
   */
  toRow: (item: Item, uid: string, index: number) => Omit<OwnedRow, "user_id"> & { id: string };
  /** Table row → item, applied on hydrate. */
  fromRow: (row: OwnedRow) => Item;
  /** Upsert conflict target when it isn't the primary key (e.g. "user_id,step_id"). */
  onConflict?: string;
}

/**
 * Wire a `useSyncedState` list to its typed table. Pass the current list + setter from the component.
 * Returns nothing — it works through side effects (hydrate on sign-in, reconcile on change).
 */
export function useTableSync<Item>(
  items: Item[],
  setItems: (next: Item[] | ((prev: Item[]) => Item[])) => void,
  config: TableSyncConfig<Item>,
): void {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  // client-id → table-row-id we last reconciled, so a removed item is deleted by its real table id.
  const lastRowIds = useRef<Map<string, string>>(new Map());
  // Which uid we've already hydrated for, so we hydrate exactly once per sign-in.
  const hydratedFor = useRef<string | null>(null);
  // Latest items, read inside async hydrate without re-subscribing the effect to every keystroke.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const { table, idOf, toRow, fromRow, onConflict } = config;

  // Snapshot the current list into the client-id → row-id map (for delete-diffing).
  const snapshot = (list: Item[], localUid: string): Map<string, string> => {
    const m = new Map<string, string>();
    list.forEach((item, i) => m.set(idOf(item), String(toRow(item, localUid, i).id)));
    return m;
  };

  // Hydrate from the table once per signed-in identity (only when the table actually has rows).
  useEffect(() => {
    if (!supabase || !uid) {
      hydratedFor.current = uid; // signed out: nothing to hydrate; reset so a later sign-in hydrates
      if (!uid) lastRowIds.current = new Map();
      return;
    }
    if (hydratedFor.current === uid) return;
    hydratedFor.current = uid;
    let active = true;
    void loadRows(supabase, table, uid).then((rows) => {
      if (!active) return;
      if (rows.length === 0) {
        // No remote rows: adopt whatever is local as the baseline for future delete-diffing.
        lastRowIds.current = snapshot(itemsRef.current, uid);
        return;
      }
      // UNION, never replace: keep every cloud row PLUS any local item the cloud doesn't have yet, so
      // data the user entered while signed out isn't wiped on sign-in. Then push the local-only items up.
      const mapped = rows.map(fromRow);
      const { merged, localOnly } = mergeByClientId(itemsRef.current, mapped, idOf);
      lastRowIds.current = snapshot(merged, uid);
      if (localOnly.length > 0 && supabase) {
        const upserts: OwnedRow[] = localOnly.map((item, i) => ({
          ...toRow(item, uid, mapped.length + i),
          user_id: uid,
        }));
        void upsertRows(supabase, table, upserts, onConflict);
      }
      setItems(merged);
    });
    return () => {
      active = false;
    };
    // mappers are stable module-level fns from the call site; table+uid drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, uid]);

  // Reconcile the table to the current list on every change (upsert present, delete removed).
  useEffect(() => {
    if (!supabase || !uid) return;
    if (hydratedFor.current !== uid) return; // wait until the initial hydrate settled

    const next = snapshot(items, uid);
    const removed: string[] = [];
    for (const [clientId, rowId] of lastRowIds.current) {
      if (!next.has(clientId)) removed.push(rowId);
    }
    lastRowIds.current = next;

    const rows: OwnedRow[] = items.map((item, i) => ({ ...toRow(item, uid, i), user_id: uid }));
    void upsertRows(supabase, table, rows, onConflict);
    for (const rowId of removed) void deleteRow(supabase, table, uid, rowId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, uid, table]);
}

/**
 * Roadmap step-status dual-write (SEC-3) — the record-shaped sibling of {@link useTableSync}. The roadmap
 * is a `Record<stepId, status>`, persisted to `roadmap_items` whose `unique(user_id, step_id)` is the
 * upsert key (so we upsert on that, not the uuid PK). Statuses are only ever set/changed (never deleted)
 * so there is no delete-diff. On sign-in it hydrates the map from the table when rows exist.
 */
export function useRoadmapSync<S extends string>(
  status: Record<string, S>,
  setStatus: (next: Record<string, S>) => void,
): void {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const hydratedFor = useRef<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    if (!supabase || !uid) {
      hydratedFor.current = uid;
      return;
    }
    if (hydratedFor.current === uid) return;
    hydratedFor.current = uid;
    let active = true;
    void loadRows<OwnedRow>(supabase, "roadmap_items", uid).then((rows) => {
      if (!active || rows.length === 0) return;
      const map: Record<string, S> = { ...statusRef.current };
      // DB strings are untrusted; the consumer falls back on any unknown status, so casting is safe here.
      for (const r of rows) map[String(r.step_id)] = String(r.status) as S;
      setStatus(map);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!supabase || !uid) return;
    if (hydratedFor.current !== uid) return;
    const rows: OwnedRow[] = Object.entries(status).map(([step_id, st]) => ({
      id: stableUuid(`roadmap:${uid}:${step_id}`), // PK only used on insert; conflict resolves on step_id
      user_id: uid,
      step_id,
      status: st,
    }));
    void upsertRows(supabase, "roadmap_items", rows, "user_id,step_id");
  }, [status, uid]);
}
