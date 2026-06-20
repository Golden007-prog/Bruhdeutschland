/**
 * BYOK key storage (work-order §3; Section 9 §9.2 / qa-findings SEC-7).
 *
 * Provider + service API keys are the user's own secrets, so they are now scoped PER USER via
 * {@link scopedKey} — a different account signed in on the same browser can no longer read the previous
 * account's key (the SEC-7 co-located-account fix). Keys still live ONLY in the browser, are never logged,
 * never bundled, and never sent anywhere except the provider's own endpoint. Non-secret device prefs (the
 * Owner-Mode bridge URL, the active-provider choice) stay device-global. SSR/no-DOM safe.
 */
import type { ProviderId } from "./types";
import { scopedKey } from "@/lib/persist/userScope";

const PREFIX = "deutschprep:key:";
const SERVICE_PREFIX = "deutschprep:svc:";
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

/**
 * One-time migration: keys used to be stored at the un-scoped global `deutschprep:key:<provider>` /
 * `deutschprep:svc:<service>`. Park each under the signed-out `anon` scope (so a returning guest keeps
 * their key) WITHOUT assigning it to any signed-in account, then remove the global — after this a legacy
 * key can never bleed into a logged-in user. Detection: a legacy key's tail has no `:` (provider/service
 * names contain none); a scoped key's tail ends in `:<uid|anon>`. Runs once at import.
 */
function migrateLegacyKeys(): void {
  const s = store();
  if (!s) return;
  try {
    const legacy: string[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const k = s.key(i);
      if (!k) continue;
      for (const p of [PREFIX, SERVICE_PREFIX]) {
        if (k.startsWith(p) && !k.slice(p.length).includes(":")) legacy.push(k);
      }
    }
    for (const k of legacy) {
      const val = s.getItem(k);
      const anonKey = `${k}:anon`;
      if (val != null && s.getItem(anonKey) == null) s.setItem(anonKey, val);
      s.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
migrateLegacyKeys();

export function getKey(provider: ProviderId): string | null {
  return read(scopedKey(PREFIX + provider));
}

export function setKey(provider: ProviderId, key: string): void {
  const trimmed = key.trim();
  write(scopedKey(PREFIX + provider), trimmed || null);
}

export function clearKey(provider: ProviderId): void {
  write(scopedKey(PREFIX + provider), null);
}

export function hasKey(provider: ProviderId): boolean {
  return !!getKey(provider);
}

/** Owner-Mode bridge base URL (default localhost). Device-wide (not a secret). */
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

/**
 * Generic service keys for non-LLM BYOK integrations (e.g. the optional Google Cloud "chirp" TTS key).
 * Same storage guarantees as {@link getKey}: browser-only, per-user scoped, never logged, never bundled.
 */
export function getServiceKey(service: string): string | null {
  return read(scopedKey(SERVICE_PREFIX + service));
}

export function setServiceKey(service: string, key: string): void {
  write(scopedKey(SERVICE_PREFIX + service), key.trim() || null);
}

export function hasServiceKey(service: string): boolean {
  return !!getServiceKey(service);
}
