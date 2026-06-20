import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordConsent, CONSENT_VERSION } from "./consent";

function makeClient() {
  const calls: { table: string; op: string; payload?: unknown }[] = [];
  const client = {
    from(table: string) {
      return {
        insert: async (payload: unknown) => { calls.push({ table, op: "insert", payload }); return { error: null }; },
        update: (payload: unknown) => ({
          eq: async () => { calls.push({ table, op: "update", payload }); return { error: null }; },
        }),
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("recordConsent", () => {
  it("inserts a versioned consents row and stamps profiles for a signed-in user", async () => {
    const { client, calls } = makeClient();
    await recordConsent(client, "u1", "2026-06-21T00:00:00.000Z");
    expect(calls).toContainEqual(expect.objectContaining({ table: "consents", op: "insert" }));
    expect(calls).toContainEqual(expect.objectContaining({ table: "profiles", op: "update" }));
    const insert = calls.find((c) => c.table === "consents");
    expect((insert?.payload as { version: string; granted: boolean }).version).toBe(CONSENT_VERSION);
    expect((insert?.payload as { granted: boolean }).granted).toBe(true);
  });

  it("no-ops when signed out or with no client", async () => {
    const { client, calls } = makeClient();
    await recordConsent(client, null, "t");
    await recordConsent(null, "u1", "t");
    expect(calls).toHaveLength(0);
  });
});
