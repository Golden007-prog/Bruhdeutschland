import { useCallback, useEffect, useRef, useState } from "react";

import { syncedStore } from "./syncedStore";

/**
 * Like useState, but persisted: localStorage-first, mirrored to Supabase when signed in (work-order
 * §5F/§5G). Re-renders when the store changes (e.g. cloud blob loads after sign-in). Signed-out and
 * unconfigured-Supabase both work — state simply stays on this device.
 */
export function useSyncedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const initialRef = useRef(initial);
  const [value, setValue] = useState<T>(() => syncedStore.get(key, initialRef.current));

  useEffect(() => {
    syncedStore.start();
    const sync = () => setValue(syncedStore.get(key, initialRef.current));
    sync(); // pick up anything already loaded for this key
    return syncedStore.subscribe(sync);
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        syncedStore.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
