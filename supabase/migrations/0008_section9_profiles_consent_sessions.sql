-- Section 9 (§9.1) — identity & consent capture on signup.
-- Extends `profiles` with the identity + GDPR-consent columns Section 9 requires, enriches the existing
-- on_auth_user_created trigger to mirror Google/email identity into the row, and adds append-only
-- `consents` (versioned) + `sessions` (login-event trail; we never store Google tokens — Supabase manages
-- those). New tables follow the house pattern from 0001 but additionally use `to authenticated` + FORCE
-- RLS (Supabase-recommended; the ownership predicate makes both old and new policies leak-proof).

-- ── profiles: identity + consent columns (all nullable → safe additive change) ──
alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists locale text,
  add column if not exists provider text,            -- 'google' | 'email' | …
  add column if not exists last_login timestamptz,
  add column if not exists consent_version text,
  add column if not exists consent_at timestamptz;

-- Enrich the signup trigger to copy identity from auth.users. SECURITY DEFINER + fixed search_path as
-- before; raw_user_meta_data is used only for display fields (never for authorization). Idempotent.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, full_name, email, avatar_url, provider, last_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    now()
  )
  on conflict (id) do nothing;
  return new;
end $$;
-- EXECUTE stays revoked from API roles (see 0003); the trigger fires regardless.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ── consents (append-only, versioned) ─────────────────────────────────────────
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,                  -- e.g. 'privacy-2026-06'
  scope text not null default 'app',      -- 'app' | 'analytics' | 'leaderboard' | …
  granted boolean not null default true,
  granted_at timestamptz not null default now()
);
create index if not exists consents_user_idx on public.consents (user_id, granted_at desc);

-- ── sessions (login-event trail; no third-party tokens) ───────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'login',     -- 'login' | 'refresh'
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id, created_at desc);

-- ── RLS: enable + FORCE + owner-only (to authenticated, with ownership predicate) ──
do $$
declare t text;
begin
  foreach t in array array['consents','sessions'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated '
      'using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
