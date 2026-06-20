import { describe, expect, it } from "vitest";

import { mergeByClientId } from "./useTableSync";

/**
 * Unit test for the sign-in hydrate merge (data-loss fix). The dual-write hook used to hard-REPLACE local
 * state with the cloud rows on sign-in, silently discarding anything the user added while signed out. The
 * merge must instead UNION by client id: every cloud row PLUS any local-only item, with the local-only set
 * reported so the hook can push it up to the table.
 */
interface Item {
  id: string;
  name: string;
}
const idOf = (i: Item) => i.id;

describe("mergeByClientId", () => {
  it("unions local + cloud, keeping local items the cloud doesn't have (no data loss on sign-in)", () => {
    const local: Item[] = [
      { id: "a", name: "cloud-a-local-copy" },
      { id: "z", name: "added-while-signed-out" }, // only on this device
    ];
    const cloud: Item[] = [
      { id: "a", name: "cloud-a" },
      { id: "b", name: "cloud-b" },
    ];

    const { merged, localOnly } = mergeByClientId(local, cloud, idOf);

    // Cloud rows are all present (cloud wins on id collision)...
    expect(merged.filter((m) => m.id === "a")).toEqual([{ id: "a", name: "cloud-a" }]);
    expect(merged.map((m) => m.id).sort()).toEqual(["a", "b", "z"]);
    // ...and the signed-out addition survives and is flagged to upsert.
    expect(localOnly).toEqual([{ id: "z", name: "added-while-signed-out" }]);
  });

  it("returns the cloud set unchanged when local has no extra items", () => {
    const cloud: Item[] = [{ id: "a", name: "a" }];
    const { merged, localOnly } = mergeByClientId([{ id: "a", name: "stale" }], cloud, idOf);
    expect(merged).toEqual(cloud);
    expect(localOnly).toEqual([]);
  });

  it("keeps all local items when the cloud is empty", () => {
    const local: Item[] = [{ id: "x", name: "x" }];
    const { merged, localOnly } = mergeByClientId(local, [], idOf);
    expect(merged).toEqual(local);
    expect(localOnly).toEqual(local);
  });
});
