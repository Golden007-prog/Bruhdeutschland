import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteAllUserData, exportAllUserData, GDPR_USER_TABLES, GDPR_BUCKETS } from "./userData";

/** Minimal chainable mock that records which tables/buckets were touched. */
function makeClient() {
  const deletedTables: string[] = [];
  const selectedTables: string[] = [];
  const removed: Record<string, string[]> = {};
  const client = {
    from(table: string) {
      return {
        select() {
          selectedTables.push(table);
          return {
            eq: async () => ({ data: table === "profiles" ? [{ id: "u1" }] : [{ user_id: "u1", table }] }),
          };
        },
        delete() {
          return { eq: async () => { deletedTables.push(table); return { error: null }; } };
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          list: async (prefix: string) => ({
            // one file directly under the uid folder
            data: prefix === "u1" ? [{ name: "file.txt", id: "obj1" }] : [],
            error: null,
          }),
          remove: async (paths: string[]) => { removed[bucket] = paths; return { error: null }; },
        };
      },
    },
  } as unknown as SupabaseClient;
  return { client, deletedTables, selectedTables, removed };
}

describe("deleteAllUserData", () => {
  it("deletes every per-user table + profiles and removes Storage files in all buckets", async () => {
    const { client, deletedTables, removed } = makeClient();
    await deleteAllUserData(client, "u1");

    // every enumerated table, plus profiles, was deleted
    for (const t of GDPR_USER_TABLES) expect(deletedTables).toContain(t);
    expect(deletedTables).toContain("profiles");
    expect(deletedTables.length).toBe(GDPR_USER_TABLES.length + 1);

    // both buckets had the uid-scoped file removed
    for (const b of GDPR_BUCKETS) expect(removed[b]).toEqual(["u1/file.txt"]);
  });
});

describe("exportAllUserData", () => {
  it("bundles profiles + every populated table + storage file list + the local snapshot", async () => {
    const { client } = makeClient();
    const local = { theme: "dark" };
    const out = await exportAllUserData(client, "u1", local, "2026-06-21T00:00:00.000Z");

    expect(out.userId).toBe("u1");
    expect(out.generatedAt).toBe("2026-06-21T00:00:00.000Z");
    expect(out.localSnapshot).toEqual(local);
    expect(out.tables.profiles).toEqual([{ id: "u1" }]);
    // a representative typed table is included
    expect(out.tables.exam_attempts).toBeDefined();
    expect(Object.keys(out.tables).length).toBe(GDPR_USER_TABLES.length + 1); // +profiles
    for (const b of GDPR_BUCKETS) expect(out.storage[b]).toEqual(["u1/file.txt"]);
  });
});
