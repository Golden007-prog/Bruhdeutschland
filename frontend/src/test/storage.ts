/**
 * Install a working in-memory `localStorage` for tests. The harness's default jsdom Storage in this
 * project exposes only a partial API (the app guards every access via a `safeLocal()` accessor), so
 * tests that need real persistence — e.g. the per-user data-isolation tests — install this first.
 */
export function installMemoryStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const mock = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    key: (i: number) => [...store.keys()][i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
  } as Storage;
  Object.defineProperty(window, "localStorage", { value: mock, configurable: true, writable: true });
  Object.defineProperty(globalThis, "localStorage", { value: mock, configurable: true, writable: true });
  return store;
}
