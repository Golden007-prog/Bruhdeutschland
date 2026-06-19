/**
 * Persistence layer (work-order §5F/§5G). LocalStorage-first so it works instantly signed-out and
 * with no backend setup; when the user is signed in AND Supabase is configured, the same state mirrors
 * to a single `settings.data` JSONB row for cross-device sync. All access degrades safely (privacy
 * mode, jsdom, unconfigured Supabase) — it never throws.
 *
 * One shared blob keyed by short strings keeps wiring trivial; the granular tables in the migration
 * (srs_cards, roadmap_items, documents) remain available for future per-feature use.
 */
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { onAuthChange } from "@/lib/supabase/auth";

const LOCAL_KEY = "deutschprep:state";

type Blob = Record<string, unknown>;
type Listener = () => void;

function safeLocal(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {
    /* sandboxed */
  }
  return null;
}

function loadLocal(): Blob {
  const s = safeLocal();
  if (!s) return {};
  try {
    const raw = s.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Blob) : {};
  } catch {
    return {};
  }
}

class SyncedStore {
  private blob: Blob = loadLocal();
  private listeners = new Set<Listener>();
  private userId: string | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  // True once the cloud blob has loaded (or there's nothing to load). The auth gate waits for this so
  // a returning user's saved profile/progress is in hand before it decides where to route them.
  private hydrated = !isSupabaseConfigured;

  /** Begin watching auth so we can load/merge the cloud blob when a user signs in. */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (!isSupabaseConfigured) {
      this.hydrated = true;
      this.emit();
      return;
    }
    onAuthChange((session) => {
      const id = session?.user?.id ?? null;
      this.userId = id;
      if (id) {
        this.hydrated = false;
        this.emit();
        void this.pullFromCloud().finally(() => {
          this.hydrated = true;
          this.emit();
        });
      } else {
        this.hydrated = true;
        this.emit();
      }
    });
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  private async pullFromCloud(): Promise<void> {
    if (!supabase || !this.userId) return;
    try {
      const { data } = await supabase.from("settings").select("data").eq("user_id", this.userId).maybeSingle();
      if (data?.data && typeof data.data === "object") {
        // Cloud wins on conflict at load; keep any local-only keys.
        this.blob = { ...this.blob, ...(data.data as Blob) };
        this.persistLocal();
        this.emit();
      }
    } catch {
      /* offline / RLS / table missing — stay on local */
    }
  }

  private persistLocal(): void {
    const s = safeLocal();
    if (!s) return;
    try {
      s.setItem(LOCAL_KEY, JSON.stringify(this.blob));
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
    this.persistLocal();
    this.scheduleCloudFlush();
    this.emit();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }
}

export const syncedStore = new SyncedStore();
