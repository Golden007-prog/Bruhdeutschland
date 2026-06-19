/**
 * BYOK key storage (work-order §3). Keys live ONLY in the visitor's browser (localStorage) and are
 * never logged, never bundled, and never sent anywhere except the provider's own endpoint. SSR/no-DOM
 * safe. The Owner-Mode bridge needs no key here (it uses the operator's own Claude login).
 */
import type { ProviderId } from "./types";

const PREFIX = "deutschprep:key:";
const BRIDGE_URL_KEY = "deutschprep:bridgeUrl";
const ACTIVE_PROVIDER_KEY = "deutschprep:activeProvider";

/**
 * Safe localStorage accessor. Returns null when storage is unavailable or partially implemented
 * (privacy mode, sandboxed iframes, jsdom) so the app degrades instead of throwing.
 */
function store(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function" &&
      typeof window.localStorage.setItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {
    /* accessing localStorage can throw in some sandboxes */
  }
  return null;
}

function read(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  const s = store();
  if (!s) return;
  try {
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    /* quota / disabled — ignore */
  }
}

export function getKey(provider: ProviderId): string | null {
  return read(PREFIX + provider);
}

export function setKey(provider: ProviderId, key: string): void {
  const trimmed = key.trim();
  write(PREFIX + provider, trimmed || null);
}

export function clearKey(provider: ProviderId): void {
  write(PREFIX + provider, null);
}

export function hasKey(provider: ProviderId): boolean {
  return !!getKey(provider);
}

/** Owner-Mode bridge base URL (default localhost). Used for modes 1/3; tunnel URL for mode 2. */
export function getBridgeUrl(): string {
  return read(BRIDGE_URL_KEY) ?? "http://localhost:8787";
}

export function setBridgeUrl(url: string): void {
  write(BRIDGE_URL_KEY, url.trim().replace(/\/$/, ""));
}

export function getActiveProviderId(): string | null {
  return read(ACTIVE_PROVIDER_KEY);
}

export function setActiveProviderId(id: ProviderId): void {
  write(ACTIVE_PROVIDER_KEY, id);
}
