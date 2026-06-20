-- Section 9 (§9.2) — discovery, finance, visa/docs, outcomes & comms tables. Per-user, FK to
-- auth.users, indexed on user_id, RLS enabled + forced, owner-only `own rows` policy. (`generated_docs`
-- + Storage land in S9-B, `leaderboard_stats` in S9-C, encrypted `api_keys` in S9-E.)

-- ── Discovery (programs, user_shortlist, applications, saved_searches exist) ───
create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  program_ids uuid[] not null default '{}',
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comparisons_user_idx on public.comparisons (user_id, updated_at desc);

-- ── Finance ───────────────────────────────────────────────────────────────────
create table if not exists public.cost_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city text,
  monthly jsonb not null default '{}'::jsonb,        -- per-category breakdown (computed in tested TS)
  assumptions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists cost_profiles_user_idx on public.cost_profiles (user_id, updated_at desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'journey',              -- journey | monthly
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  currency text not null default 'EUR',
  updated_at timestamptz not null default now()
);
create index if not exists budgets_user_idx on public.budgets (user_id, kind);

create table if not exists public.scholarship_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scholarship_key text not null,
  name text,
  status text not null default 'matched',            -- matched | applied | awarded | rejected
  score numeric,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scholarship_matches_user_idx on public.scholarship_matches (user_id, status);

create table if not exists public.sperrkonto_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text,
  target_amount int,                                 -- e.g. 11904 (grounded fact, set client-side)
  deposited int not null default 0,
  status text not null default 'planning',           -- planning | opening | funded | active
  opened_at date,
  updated_at timestamptz not null default now()
);

-- ── Visa / docs (deadlines exist) ─────────────────────────────────────────────
create table if not exists public.visa_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null default 'student_visa',
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create table if not exists public.document_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  doc_type text,                                     -- sop | cv | lor | transcript | …
  status text not null default 'draft',
  version int not null default 1,
  storage_path text,                                 -- optional pointer into Storage (S9-B)
  sent_to text,
  updated_at timestamptz not null default now()
);
create index if not exists document_vault_user_idx on public.document_vault (user_id, doc_type);

-- ── Outcomes / ranking inputs & comms (goals_streaks, notifications exist) ─────
create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                                -- admit | reject | visa_granted | enrolled | …
  detail jsonb not null default '{}'::jsonb,
  occurred_on date,
  created_at timestamptz not null default now()
);
create index if not exists outcomes_user_idx on public.outcomes (user_id, created_at desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,                                -- 'first_mock' | 'b2_reached' | …
  label text,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  channel text not null default 'in_app',            -- in_app | email
  sent_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reminders_user_due_idx on public.reminders (user_id, due_at);

-- ── RLS: enable + FORCE + owner-only on every new table ───────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'comparisons',
    'cost_profiles','budgets','scholarship_matches','sperrkonto_status',
    'visa_checklists','document_vault',
    'outcomes','achievements','reminders'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated '
      'using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
