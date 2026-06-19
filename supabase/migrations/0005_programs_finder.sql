-- Program finder (ADR-0006). Real, provenance-stamped programmes; public-read, admin (service-role)
-- write. Built for hybrid search (FTS + pg_trgm fuzzy + pgvector semantic). Requirements stay
-- needs_verification with an official link — the app assists, it does not certify.

create extension if not exists vector;
create extension if not exists pg_trgm;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'curated',            -- DAAD | Hochschulkompass | curated
  source_url text not null,                          -- official programme page (deep link)
  retrieved_at date not null default current_date,
  name text not null,
  degree text,                                       -- M.Sc. | M.A. | M.Eng. | LL.M. | ...
  course_type text not null default 'master',        -- bachelor | master | phd | graduate_school | ...
  university text not null,
  institution_type text,                             -- uni | uas | art_music
  city text,
  bundesland text,
  lat double precision,
  lng double precision,
  languages text not null default 'en',              -- de | en | de_en | other
  language_level_en text,
  language_level_de text,
  subject_group text,                                -- one of the 9 DAAD subject groups
  areas_of_study text[] not null default '{}',
  mode text default 'full_time',                     -- full_time | part_time | online | dual
  duration_weeks int,
  semesters int,
  intake text,                                       -- winter | summer | both
  application_deadline text,
  tuition_per_semester int,                          -- euros; null = no tuition
  semester_contribution int,
  admission_mode text,                               -- open | nc | aptitude
  joint_double_degree boolean not null default false,
  scholarships text[] not null default '{}',
  tests_required jsonb not null default '{}'::jsonb,
  requirements_raw jsonb not null default '{}'::jsonb,
  description text,
  needs_verification boolean not null default true,
  embedding vector(384),                             -- backfilled by a maintainer job (ADR-0006)
  fts tsvector,                                       -- maintained by the trigger below
  created_at timestamptz not null default now()
);

-- Generated columns reject to_tsvector (config-by-name is only STABLE), so a trigger maintains `fts`.
create or replace function public.programs_fts_update()
returns trigger language plpgsql set search_path = public as $$
begin
  new.fts :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.university, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.areas_of_study, ' '), '')), 'C') ||
    setweight(to_tsvector('english',
      coalesce(new.subject_group, '') || ' ' || coalesce(new.city, '') || ' ' || coalesce(new.description, '')), 'D');
  return new;
end $$;

drop trigger if exists programs_fts_trg on public.programs;
create trigger programs_fts_trg before insert or update on public.programs
  for each row execute function public.programs_fts_update();

create index if not exists programs_fts_idx on public.programs using gin (fts);
create index if not exists programs_name_trgm on public.programs using gin (name gin_trgm_ops);
create index if not exists programs_uni_trgm on public.programs using gin (university gin_trgm_ops);
create index if not exists programs_filters_idx
  on public.programs (course_type, languages, subject_group, bundesland, institution_type, intake, admission_mode);
-- HNSW for embeddings is added when they're backfilled (skipping the empty-index build in v1):
-- create index programs_embedding_idx on public.programs using hnsw (embedding vector_cosine_ops);

alter table public.programs enable row level security;
create policy "programs public read" on public.programs for select using (true);

-- ── user shortlist (bookmarks) ────────────────────────────────────────────────
create table if not exists public.user_shortlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, program_id)
);
alter table public.user_shortlist enable row level security;
create policy "own rows" on public.user_shortlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── saved searches (+ alert toggle) ───────────────────────────────────────────
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  alert boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.saved_searches enable row level security;
create policy "own rows" on public.saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
