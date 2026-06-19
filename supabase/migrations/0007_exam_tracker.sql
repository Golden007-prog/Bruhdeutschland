-- Mock-exam improvement tracker (IELTS/TOEFL upgrade work-order §8). EXTENDS the existing exam_attempts
-- + answers tables (0001_init) with queryable analytics columns, and adds study-plan + goals/streaks
-- tables plus a private Storage bucket for cached synthesized Listening audio. Owner-only RLS
-- (auth.uid() = user_id) — exam_attempts/answers already have it from init.

-- ── extend exam_attempts with queryable scoring columns (score jsonb stays the source of truth) ──
alter table public.exam_attempts add column if not exists scale text;
alter table public.exam_attempts add column if not exists mode text not null default 'full';
alter table public.exam_attempts add column if not exists duration_ms int;
alter table public.exam_attempts add column if not exists correct int not null default 0;
alter table public.exam_attempts add column if not exists total int not null default 0;
alter table public.exam_attempts add column if not exists percent int not null default 0;
alter table public.exam_attempts add column if not exists overall_band numeric;
alter table public.exam_attempts add column if not exists cefr text;
alter table public.exam_attempts add column if not exists concordance_120 int;
alter table public.exam_attempts add column if not exists predicted_band numeric;
alter table public.exam_attempts add column if not exists sections jsonb not null default '[]'::jsonb;

-- ── extend answers with per-question-type analytics fields ──────────────────────
alter table public.answers add column if not exists exam_id text;
alter table public.answers add column if not exists skill text;
alter table public.answers add column if not exists question_type text;
alter table public.answers add column if not exists response_type text;
alter table public.answers add column if not exists earned int not null default 0;
alter table public.answers add column if not exists possible int not null default 1;
alter table public.answers add column if not exists is_correct boolean not null default false;
alter table public.answers add column if not exists time_spent_ms int;
create index if not exists answers_type_idx on public.answers (user_id, exam_id, question_type);

-- ── study_plan_items: ranked improvement actions (drill this / add to plan) ─────
create table if not exists public.study_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text,
  skill text,
  question_type text,
  title text not null,
  detail text,
  priority numeric not null default 0,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists study_plan_user_idx on public.study_plan_items (user_id, status, priority desc);

-- ── goals_streaks: one row per user (target band, streaks, milestones) ──────────
create table if not exists public.goals_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_exam text,
  target_band numeric,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_practice_date date,
  attempts_count int not null default 0,
  updated_at timestamptz not null default now()
);

-- ── Row-Level Security: owner-only (new tables) ───────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['study_plan_items','goals_streaks'] loop
    execute format('alter table public.%I enable row level security;', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own rows') then
      execute format(
        'create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    end if;
  end loop;
end $$;

-- ── Storage: private bucket for cached synthesized Listening audio ─────────────
insert into storage.buckets (id, name, public)
values ('exam-audio', 'exam-audio', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'exam-audio own files') then
    create policy "exam-audio own files" on storage.objects for all
      using (bucket_id = 'exam-audio' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'exam-audio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;
