/**
 * Push offer-derived deadlines into the central typed `deadlines` table (gap G5-01/06). Offers already
 * own their dates in `offers:list`, and the reminders/.ics export reads them directly — but the typed
 * `deadlines` table (the queryable spine shared with the calendar) never saw a seat-acceptance or deposit
 * date. This is a WRITE-ONLY mirror: offers stay the source of truth, so unlike {@link useTableSync} it
 * never hydrates from the table (that would pull in the calendar's own user-deadlines), it only upserts
 * the rows derived from the current offers and deletes the ones that disappear.
 *
 * Safety contract mirrors {@link syncTable}: no client / signed out → it no-ops (offers persist locally
 * via their own synced store regardless).
 */
import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { deleteRow, stableUuid, upsertRows, type OwnedRow } from "@/lib/persist/syncTable";
import type { Offer } from "./offers";
import { offerDeadlines } from "./offerDeadlines";

/** Derive the table rows (stable uuid PKs) for the current offers' accept/deposit deadlines. */
export function offerDeadlineRows(offers: Offer[], uid: string): OwnedRow[] {
  return offerDeadlines(offers).map((d) => ({
    id: stableUuid(`offer-deadline:${uid}:${d.id}`),
    user_id: uid,
    title: d.label,
    due_date: d.date,
    category: "visa", // seat/enrolment dates live in the visa & relocation category
  }));
}

export function useOfferDeadlineSync(offers: Offer[]): void {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  // Row ids we last wrote, so an offer (or its date) disappearing deletes the stale table row.
  const lastIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase || !uid) {
      lastIds.current = new Set();
      return;
    }
    const rows = offerDeadlineRows(offers, uid);
    const nextIds = new Set(rows.map((r) => r.id));
    const removed = [...lastIds.current].filter((id) => !nextIds.has(id));
    lastIds.current = nextIds;

    if (rows.length > 0) void upsertRows(supabase, "deadlines", rows);
    for (const id of removed) void deleteRow(supabase, "deadlines", uid, id);
  }, [offers, uid]);
}
