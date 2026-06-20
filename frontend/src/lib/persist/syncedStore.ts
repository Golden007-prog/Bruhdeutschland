/**
 * Persistence layer (work-order §5F/§5G) — PER-USER on device (data-isolation P0). LocalStorage-first
 * so it works instantly signed-out and with no backend; when signed in AND Supabase is configured the
 * same state mirrors to a per-user `settings.data` JSONB row for cross-device sync.
 *
 * Isolation invariants (the original bug was a single GLOBAL key shared across accounts):
 *  - the local blob is stored under a key NAMESPACED by user id: `deutschprep:state:<uid|anon>`;
 *  - on EVERY auth transition (sign-in / user-switch / sign-out) the in-memory blob is fully RESET to
 *    the new identity's namespace — never carried over — then that user's cloud blob is loaded;
 *  - the legacy un-namespaced `deutschprep:state` key is parked under `anon` once and removed, so it is
 *    never read as a signed-in user's data again.
 * All access degrades safely (privacy mode, jsdom, unconfigured Supabase) — it never throws.
 */
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { onAuthChange } from "@/lib/supabase/auth";

const KEY_BASE = "deutschprep:state";
const LEGACY_GLOBAL_KEY = "deutschprep:state"; // old shared key (no user suffix)
const ANON = "anon";

type Blob = Record<string, unknown>;
type Listener = () => void;

const nsKey = (userId: string | null): string => `${KEY_BASE}:${userId ?? ANON}`;

function safeLocal(): Storage | null {
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
    /* sandboxed */
  }
  return null;
}

function loadLocalFor(userId: string | null): Blob {
  const s = safeLocal();
  if (!s) return {};
  try {
    const raw = s.getItem(nsKey(userId));
    return raw ? (JSON.parse(raw) as Blob) : {};
  } catch {
    return {};
  }
}

/**
 * One-time migration: the old global key held whatever account last used this browser. Park it under
 * `anon` (so a signed-out guest keeps device-local prefs) WITHOUT assigning it to any signed-in
 * account, then remove the global key. After this it can never bleed into a logged-in user again.
 */
function migrateLegacyGlobalKey(): void {
  const s = safeLocal();
  if (!s) return;
  try {
    const legacy = s.getItem(LEGACY_GLOBAL_KEY);
    if (legacy == null) return;
    if (s.getItem(nsKey(null)) == null) s.setItem(nsKey(null), legacy);
    s.removeItem(LEGACY_GLOBAL_KEY);
  } catch {
    /* ignore */
  }
}

class SyncedStore {
  private blob: Blob;
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private identityKnown = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private hydrated = !isSupabaseConfigured;
  // Keys the user changed locally since the last identity load but before the cloud pull settled. The
  // cloud pull must NOT overwrite these (would silently lose edits made while signed out / mid-pull).
  private dirtyKeys = new Set<string>();

  constructor() {
    migrateLegacyGlobalKey();
    // Start from the anon namespace only — NEVER a signed-in user's data until auth tells us who they are.
    this.blob = loadLocalFor(null);
  }

  /** Begin watching auth so we reset+load per user when the session changes. */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (!isSupabaseConfigured) {
      this.blob = loadLocalFor(null);
      this.hydrated = true;
      this.emit();
      return;
    }
    onAuthChange((session) => this.setIdentity(session?.user?.id ?? null));
  }

  /**
   * Apply a new identity: RESET the in-memory blob to that identity's own namespace (no carryover from a
   * previous SIGNED-IN user — the isolation invariant), then pull its cloud blob. The one thing carried
   * forward on an anon→user sign-in is the GUEST's own unsaved edits (dirtyKeys), so logging in never
   * silently discards what you just typed. Public so tests can drive auth transitions.
   */
  setIdentity(id: string | null): void {
    const changed = id !== this.userId || !this.identityKnown;
    this.identityKnown = true;
    if (!changed) return;
    const prevWasAnon = this.userId === null;
    // Values the user edited while signed out — carried into the new identity so signing in doesn't
    // discard guest edits, and protected (below) from being overwritten by the cloud pull.
    const carried: Blob =
      id && prevWasAnon && this.dirtyKeys.size > 0
        ? Object.fromEntries([...this.dirtyKeys].filter((k) => k in this.blob).map((k) => [k, this.blob[k]]))
        : {};
    this.userId = id;
    this.blob = { ...loadLocalFor(id), ...carried }; // identity's own namespace + carried guest edits
    if (Object.keys(carried).length > 0) this.persistLocal();
    if (id && isSupabaseConfigured) {
      this.hydrated = false;
      this.emit();
      void this.pullFromCloud(id).finally(() => {
        this.hydrated = true;
        this.emit();
      });
    } else {
      // Signed out / unconfigured: a clean slate for the next signed-out session's dirty tracking.
      this.dirtyKeys = new Set();
      this.hydrated = true;
      this.emit();
    }
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  private async pullFromCloud(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { data } = await supabase.from("settings").select("data").eq("user_id", id).maybeSingle();
      if (this.userId !== id) return; // identity changed mid-flight — drop the stale result
      if (data?.data && typeof data.data === "object") {
        // This user's own namespace ∪ this user's own cloud blob. Cloud merges in EXCEPT for keys the
        // user changed while signed out / mid-pull — those keep the local edit (never silently lost).
        const cloud = data.data as Blob;
        const incoming = this.dirtyKeys.size === 0
          ? cloud
          : Object.fromEntries(Object.entries(cloud).filter(([k]) => !this.dirtyKeys.has(k)));
        this.blob = { ...this.blob, ...incoming };
        this.persistLocal();
        this.emit();
      }
      // The pull has reconciled; subsequent local edits are tracked fresh for the next transition.
      this.dirtyKeys = new Set();
    } catch {
      /* offline / RLS / table missing — stay on local */
    }
  }

  private persistLocal(): void {
    const s = safeLocal();
    if (!s) return;
    try {
      s.setItem(nsKey(this.userId), JSON.stringify(this.blob));
    } catch {
      /* quota */
    }
  }

  private scheduleCloudFlush(): void {
    if (!supabase || !this.userId) return;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flushCloud(), 800);
  }

  private async flushCloud(): Promise<void> {
    if (!supabase || !this.userId) return;
    try {
      await supabase.from("settings").upsert({ user_id: this.userId, data: this.blob, updated_at: new Date().toISOString() });
    } catch {
      /* best-effort */
    }
  }

  get<T>(key: string, fallback: T): T {
    return key in this.blob ? (this.blob[key] as T) : fallback;
  }

  set<T>(key: string, value: T): void {
    this.blob = { ...this.blob, [key]: value };
    // Track the edit so an in-flight / subsequent cloud pull won't clobber it (data-loss fix).
    this.dirtyKeys.add(key);
    this.persistLocal();
    this.scheduleCloudFlush();
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** A copy of the current user's stored blob (for GDPR export). */
  snapshot(): Blob {
    return { ...this.blob };
  }

  /**
   * Wipe the current user's saved data: clears the in-memory blob, their local namespace, and their
   * Supabase `settings` row. User-initiated remedy (Account → Reset my data).
   */
  async resetCurrentUserData(): Promise<void> {
    this.blob = {};
    const s = safeLocal();
    try {
      s?.removeItem(nsKey(this.userId));
    } catch {
      /* ignore */
    }
    if (supabase && this.userId) {
      try {
        await supabase.from("settings").delete().eq("user_id", this.userId);
      } catch {
        /* best-effort */
      }
    }
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}

export const syncedStore = new SyncedStore();
