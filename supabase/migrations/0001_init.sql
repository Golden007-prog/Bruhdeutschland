-- DeutschPrep hosted target — initial schema (ADR-0003, work-order §5G).
-- Every table is per-user and protected by Row-Level Security so a visitor sees only their rows.
-- No PII beyond what the user enters; store compact JSON, never audio blobs (audio is synthesized
-- client-side). Apply via the Supabase MCP or the SQL editor.

-- ── profiles (1:1 with auth.users) ───────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_country text,
  current_degree text,
  current_grade text,
  target_intake text,        -- 'WS' | 'SS'
  target_field text,
  german_level text,         -- CEFR
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── generated exam forms (cache; "reuse last" vs "generate new") ──────────────
create table if not exists public.exam_forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,            -- ielts | toefl | testdaf | goethe | gre | gmat
  mode text not null default 'full',-- full | section | mini
  form jsonb not null,              -- GeneratedExam
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists exam_forms_user_exam_idx on public.exam_forms (user_id, exam_id, created_at desc);

-- ── exam attempts + answers ──────────────────────────────────────────────────
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,
  form_id uuid references public.exam_forms(id) on delete set null,
  score jsonb,                      -- ExamScore
  rubric jsonb,                     -- RubricFeedback[] for open tasks
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index if not exists exam_attempts_user_idx on public.exam_attempts (user_id, exam_id, started_at desc);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id text not null,
  response text,
  created_at timestamptz not null default now()
);
create index if not exists answers_attempt_idx on public.answers (attempt_id);

-- ── SRS flashcards (SM-2 state) ──────────────────────────────────────────────
create table if not exists public.srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck text not null default 'german',
  front text not null,
  back text not null,
  hint text,
  easiness real not null default 2.5,
  repetition int not null default 0,
  interval_days int not null default 0,
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists srs_cards_due_idx on public.srs_cards (user_id, due_at);

-- ── roadmap items, documents checklist, seen topics, settings ─────────────────
create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step_id text not null,
  status text not null default 'todo',   -- todo | active | done
  updated_at timestamptz not null default now(),
  unique (user_id, step_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                    -- sop | cv | lor | checklist | vpd
  item_key text,                         -- for checklist/vpd item state
  content jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists documents_user_kind_idx on public.documents (user_id, kind);

create table if not exists public.seen_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null,
  topic text not null,
  created_at timestamptz not null default now()
);
create index if not exists seen_topics_user_exam_idx on public.seen_topics (user_id, exam_id, created_at desc);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── Row-Level Security: each user only their own rows ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','exam_forms','exam_attempts','answers','srs_cards',
    'roadmap_items','documents','seen_topics','settings'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- profiles + settings key on id/user_id = auth.uid()
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The rest key on user_id.
do $$
declare t text;
begin
  foreach t in array array[
    'exam_forms','exam_attempts','answers','srs_cards','roadmap_items','documents','seen_topics'
  ] loop
    execute format(
      'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
