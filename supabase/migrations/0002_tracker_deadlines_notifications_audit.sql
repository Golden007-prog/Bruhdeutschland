-- DeutschPrep hosted target — work-order §6 tables missing from 0001:
-- applications (Kanban tracker), deadlines (user-defined), notifications, audit_log.
-- Same conventions as 0001: per-user, owner-only Row-Level Security, compact data, anon-key safe.
-- Apply via the Supabase MCP or the SQL editor, after 0001.

-- ── applications (Kanban: researching → applying → submitted → decision) ───────
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university text not null,
  program text not null,
  stage text not null default 'researching',  -- researching | applying | submitted | decision
  intake text,                                 -- WS | SS
  deadline date,
  url text,
  notes text,
  sort_index int not null default 0,           -- ordering within a Kanban column
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_stage_idx
  on public.applications (user_id, stage, sort_index);

-- ── deadlines (user-defined, beyond the seeded official dates) ─────────────────
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date not null,
  category text,                               -- profile|documents|language|finance|visa|campus
  application_id uuid references public.applications(id) on delete set null,
  note text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists deadlines_user_due_idx on public.deadlines (user_id, due_date);

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                          -- deadline | system | tip
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── audit_log (lightweight, per-user activity timeline; no raw PII) ────────────
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_user_idx on public.audit_log (user_id, created_at desc);

-- ── Row-Level Security: each user only their own rows ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['applications','deadlines','notifications','audit_log'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t);
  end loop;
end $$;
