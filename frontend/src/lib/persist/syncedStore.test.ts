import { beforeEach, describe, expect, it } from "vitest";

import { installMemoryStorage } from "@/test/storage";
import { syncedStore } from "./syncedStore";

const mem = installMemoryStorage();

/**
 * Data-isolation P0 regression test. Reproduces the reported bug — two accounts on the SAME browser —
 * and proves it's fixed: each identity reads only its own namespaced data, switching never leaks the
 * previous user's data, and a brand-new identity starts empty.
 */
describe("syncedStore per-user isolation", () => {
  beforeEach(() => {
    mem.clear();
    syncedStore.setIdentity(null); // start from a known (anon) identity
  });

  it("never lets one account read another's data (same browser, back-to-back)", () => {
    // Account A signs in and saves a profile.
    syncedStore.setIdentity("user-A");
    syncedStore.set("profile", { name: "Alice", gpa: "1.9" });
    expect(syncedStore.get("profile", null)).toEqual({ name: "Alice", gpa: "1.9" });

    // Account B signs in on the SAME browser → must see EMPTY, not A's data (the reported bug).
    syncedStore.setIdentity("user-B");
    expect(syncedStore.get("profile", null)).toBeNull();

    // B saves its own different data.
    syncedStore.set("profile", { name: "Bob" });
    expect(syncedStore.get("profile", null)).toEqual({ name: "Bob" });

    // Back to A → A still sees ONLY A's data, never Bob's.
    syncedStore.setIdentity("user-A");
    expect(syncedStore.get("profile", null)).toEqual({ name: "Alice", gpa: "1.9" });

    // Sign out → no user data is readable.
    syncedStore.setIdentity(null);
    expect(syncedStore.get("profile", null)).toBeNull();
  });

  it("a brand-new account starts empty", () => {
    syncedStore.setIdentity("returning-user");
    syncedStore.set("onboarded", "v1");
    syncedStore.setIdentity("fresh-user");
    expect(syncedStore.get("onboarded", null)).toBeNull();
    expect(syncedStore.get("profile", null)).toBeNull();
  });

  it("resetCurrentUserData wipes the current account's blob", async () => {
    syncedStore.setIdentity("user-C");
    syncedStore.set("profile", { name: "Carol" });
    await syncedStore.resetCurrentUserData();
    expect(syncedStore.get("profile", null)).toBeNull();
  });

  it("namespaces persisted keys by user id", () => {
    syncedStore.setIdentity("user-D");
    syncedStore.set("k", 1);
    expect(localStorage.getItem("deutschprep:state:user-D")).toContain('"k":1');
    // The legacy global key is never used as the live store.
    expect(localStorage.getItem("deutschprep:state")).toBeNull();
  });
});
