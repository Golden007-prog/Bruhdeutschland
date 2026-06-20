import { describe, expect, it, vi } from "vitest";

import { deleteRow, loadRows, stableUuid, upsertRows, type OwnedRow } from "./syncTable";

/**
 * Unit tests for the DI'd per-user table primitives (SEC-3). A hand-rolled query-builder spy stands in
 * for the supabase client so we can assert: the right table is hit, queries are scoped to the user, and
 * everything degrades to a safe no-op (never throws) when the client is null / signed out.
 */

/** A chainable builder that records calls and resolves like a PostgREST query. */
function makeBuilder(result: { data?: unknown; error?: unknown } = { data: [] }) {
  const calls = {
    select: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
  };
  const builder: Record<string, unknown> = {};
  // select(...).eq(...) resolves to the result (thenable so `await` works).
  builder.select = (...a: unknown[]) => {
    calls.select(...a);
    return builder;
  };
  builder.upsert = (...a: unknown[]) => {
    calls.upsert(...a);
    return Promise.resolve(result);
  };
  builder.delete = (...a: unknown[]) => {
    calls.delete(...a);
    return builder;
  };
  builder.eq = (...a: unknown[]) => {
    calls.eq(...a);
    return builder;
  };
  // Make the builder awaitable (resolves to the result after the chained .eq()s).
  builder.then = (onFulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onFulfilled);
  return { builder, calls };
}

function makeClient(result?: { data?: unknown; error?: unknown }) {
  const { builder, calls } = makeBuilder(result);
  const from = vi.fn(() => builder);
  // The shape we use is a small subset of SupabaseClient; cast through unknown for the test.
  return { client: { from } as never, from, calls };
}

describe("loadRows", () => {
  it("selects all rows scoped to the user from the right table", async () => {
    const rows = [{ id: "1", user_id: "u1", university: "TUM" }];
    const { client, from, calls } = makeClient({ data: rows });

    const out = await loadRows(client, "applications", "u1");

    expect(from).toHaveBeenCalledWith("applications");
    expect(calls.select).toHaveBeenCalledWith("*");
    expect(calls.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(out).toEqual(rows);
  });

  it("returns [] (no network) when the client is null", async () => {
    expect(await loadRows(null, "applications", "u1")).toEqual([]);
  });

  it("returns [] (no network) when there is no uid", async () => {
    const { client, from } = makeClient();
    expect(await loadRows(client, "applications", null)).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns [] on a query error instead of throwing", async () => {
    const { client } = makeClient({ data: null, error: { message: "boom" } });
    expect(await loadRows(client, "applications", "u1")).toEqual([]);
  });
});

describe("upsertRows", () => {
  const rows: OwnedRow[] = [
    { id: "a", user_id: "u1", university: "TUM" },
    { id: "b", user_id: "u1", university: "RWTH" },
  ];

  it("upserts the rows into the right table", async () => {
    const { client, from, calls } = makeClient();
    await upsertRows(client, "applications", rows);
    expect(from).toHaveBeenCalledWith("applications");
    expect(calls.upsert).toHaveBeenCalledWith(rows, undefined);
  });

  it("passes onConflict through when given", async () => {
    const { client, calls } = makeClient();
    await upsertRows(client, "roadmap_items", rows, "user_id,step_id");
    expect(calls.upsert).toHaveBeenCalledWith(rows, { onConflict: "user_id,step_id" });
  });

  it("is a no-op when the client is null or there are no rows", async () => {
    const { client, calls } = makeClient();
    await upsertRows(null, "applications", rows);
    await upsertRows(client, "applications", []);
    expect(calls.upsert).not.toHaveBeenCalled();
  });
});

describe("deleteRow", () => {
  it("deletes by id AND user_id from the right table", async () => {
    const { client, from, calls } = makeClient();
    await deleteRow(client, "deadlines", "u1", "row-7");
    expect(from).toHaveBeenCalledWith("deadlines");
    expect(calls.delete).toHaveBeenCalled();
    expect(calls.eq).toHaveBeenCalledWith("id", "row-7");
    expect(calls.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("is a no-op when the client is null or uid missing", async () => {
    const { client, from } = makeClient();
    await deleteRow(null, "deadlines", "u1", "row-7");
    await deleteRow(client, "deadlines", null, "row-7");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("stableUuid", () => {
  it("derives a valid, deterministic RFC-4122 uuid from a client id", () => {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const a = stableUuid("app-abc");
    expect(a).toMatch(re);
    expect(stableUuid("app-abc")).toBe(a); // deterministic
    expect(stableUuid("app-xyz")).not.toBe(a); // different inputs → different ids
  });

  it("is idempotent — an input that is already a uuid passes through unchanged", () => {
    const u = stableUuid("app-abc");
    expect(stableUuid(u)).toBe(u);
  });
});
