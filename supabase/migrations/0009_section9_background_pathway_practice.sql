-- Section 9 (§9.2) — background, pathway/eligibility (deterministic outputs), roadmap, and practice
-- tables. Every table is per-user, FK to auth.users, indexed on user_id, RLS enabled + forced with the
-- owner-only `own rows` policy (to authenticated + ownership predicate). Flexible shapes use jsonb,
-- matching the house convention (e.g. exam_attempts.score). Deterministic engine *outputs* are persisted
-- here (the math still runs in tested TS — these rows are the saved result, not a model computation).

-- ── Background ────────────────────────────────────────────────────────────────
create table if not exists public.work_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text,
  title text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  skills text[] not null default '{}',
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_experiences_user_idx on public.work_experiences (user_id, sort_index);

create table if not exists public.education_timeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text,
  degree text,
  field text,
  start_year int,
  end_year int,
  grade text,
  ects int,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists education_timeline_user_idx on public.education_timeline (user_id, sort_index);

create table if not exists public.documents_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                 -- transcript | passport | certificate | …
  label text,
  status text not null default 'needed',  -- needed | obtained | submitted
  notes text,
  updated_at timestamptz not null default now()
);
create index if not exists documents_meta_user_idx on public.documents_meta (user_id, kind);

-- ── Pathway / eligibility (deterministic outputs) ─────────────────────────────
create table if not exists public.pathway_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text,                         -- bachelor | studienkolleg | master | medicine | blocked
  verdict jsonb not null default '{}'::jsonb,
  feasibility jsonb not null default '{}'::jsonb,
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pathway_results_user_idx on public.pathway_results (user_id, created_at desc);

create table if not exists public.eligibility_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists eligibility_checks_user_idx on public.eligibility_checks (user_id, created_at desc);

create table if not exists public.grade_conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_scale text,                  -- e.g. 'IN-10' | 'BD-4' | 'percentage'
  source_grade text,
  german_grade numeric,               -- Modified Bavarian Formula output (computed in tested TS)
  method text not null default 'modified_bavarian',
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists grade_conversions_user_idx on public.grade_conversions (user_id, created_at desc);

-- ── Roadmap / progress (roadmap_items + progress_snapshots already exist) ──────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  detail text,
  category text,
  status text not null default 'todo',   -- todo | doing | done
  due_date date,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks (user_id, status, sort_index);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,                  -- 'visa' | 'enrolment' | 'aps' | …
  label text,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ── Practice / tests (exam_attempts, answers, srs_cards, study_plan_items exist) ──
create table if not exists public.question_type_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,
  skill text,
  question_type text not null,
  attempts int not null default 0,
  correct int not null default 0,
  accuracy numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, exam_id, question_type)
);

create table if not exists public.skill_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,
  skill text not null,
  level numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, exam_id, skill)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                 -- writing | speaking
  exam_id text,
  rubric jsonb not null default '{}'::jsonb,   -- rubric scores + evidence
  evidence text,
  band numeric,
  created_at timestamptz not null default now()
);
create index if not exists assessments_user_idx on public.assessments (user_id, created_at desc);

-- ── RLS: enable + FORCE + owner-only on every new table ───────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'work_experiences','education_timeline','documents_meta',
    'pathway_results','eligibility_checks','grade_conversions',
    'tasks','checklists',
    'question_type_stats','skill_progress','assessments'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated '
      'using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;
