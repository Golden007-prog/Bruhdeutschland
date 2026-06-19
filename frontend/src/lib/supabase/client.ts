/**
 * Supabase client (ADR-0003). Reads the public anon config from Vite env. If unset, the app still
 * runs fully — features degrade to localStorage and "sign in" is hidden — so the demo works with no
 * backend. The anon key is public by design and protected by RLS; NEVER put a service key here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
