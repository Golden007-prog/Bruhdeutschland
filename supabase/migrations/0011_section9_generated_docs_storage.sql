-- Section 9 (§9.3) — generated-document storage. Private `generated-docs` Storage bucket (owner-folder
-- RLS, mirroring the existing `exam-audio` bucket) + a versioned `generated_docs` metadata table with
-- model provenance. Path convention: `<userId>/<type>/<uuid>-v<N>.<ext>`. Versions are never overwritten
-- (a new row + object per version). Owner-scoped writes happen client-side under RLS — no service role
-- needed; the optional Drive backup stores `drive_file_id` here later (S9-F).

-- ── generated_docs (metadata; one row per version) ────────────────────────────
create table if not exists public.generated_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                      -- sop | cv | lor | exam_report | roadmap_export | …
  version int not null default 1,
  storage_path text not null,              -- '<userId>/<type>/<uuid>-v<N>.<ext>' in the generated-docs bucket
  model_provider text,                     -- provenance: who generated it (gemini | anthropic | deterministic)
  model_name text,                         -- e.g. 'claude-opus-4-8'
  source_inputs_hash text,                 -- hash of the inputs that produced it (reproducibility)
  drive_file_id text,                      -- set when backed up to Google Drive (drive.file scope)
  created_at timestamptz not null default now()
);
create index if not exists generated_docs_user_idx on public.generated_docs (user_id, type, version desc);

alter table public.generated_docs enable row level security;
alter table public.generated_docs force row level security;
create policy "own rows" on public.generated_docs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── private Storage bucket + owner-folder RLS (mirrors exam-audio) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-docs', 'generated-docs', false,
  5242880,  -- 5 MB cap (free-tier Storage is 1 GB; keep generated PDFs/text compact)
  array['application/pdf','text/plain','text/markdown','application/json','text/html']
)
on conflict (id) do nothing;

-- One FOR ALL policy = INSERT+SELECT+UPDATE+DELETE, so upsert works (Storage upsert needs all three).
-- Owner is the first path segment: '<userId>/...'.
create policy "generated-docs own files" on storage.objects for all to authenticated
  using (bucket_id = 'generated-docs' and (storage.foldername(name))[1] = (auth.uid())::text)
  with check (bucket_id = 'generated-docs' and (storage.foldername(name))[1] = (auth.uid())::text);
