-- Account memory + dashboard source-of-truth tables (real-data work order, Part A).
-- All owner-only RLS (auth.uid() = user_id). Compact JSON only. Raw résumé text is PII — clients
-- should store confirmed structured fields, not long-term raw text.

-- ── intake_submissions: confirmed parsed résumé/LinkedIn/manual data ──────────
create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'manual',   -- manual | resume_pdf | linkedin_pdf
  parsed jsonb,                              -- Zod-validated structured fields (confirmed)
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists intake_user_idx on public.intake_submissions (user_id, created_at desc);

-- ── account_memory: durable per-user key/value the app remembers ──────────────
create table if not exists public.account_memory (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ── progress_snapshots: periodic computed completion for trend charts ─────────
create table if not exists public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_pct int not null default 0,
  by_category jsonb not null default '{}'::jsonb,
  readiness int,
  created_at timestamptz not null default now()
);
create index if not exists progress_user_idx on public.progress_snapshots (user_id, created_at desc);

-- ── events: append-only activity feed ("what was done, when") ─────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                        -- profile_updated | roadmap_step | exam_attempt | ...
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_user_idx on public.events (user_id, created_at desc);

-- ── Row-Level Security: owner-only ────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['intake_submissions','account_memory','progress_snapshots','events'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t);
  end loop;
end $$;
