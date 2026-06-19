/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (public). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon key (public by design; protected by RLS). NEVER a service key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Vite base path for GitHub Pages, e.g. "/Bruhdeutschland/". */
  readonly VITE_BASE_PATH?: string;
  /** "true" → use HashRouter (GitHub Pages); otherwise BrowserRouter (local/Owner Mode). */
  readonly VITE_HASH_ROUTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
