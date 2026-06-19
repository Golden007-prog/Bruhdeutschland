-- Scale path (ADR-0006): server-side FTS + trigram ranking for when `programs` grows to thousands of
-- rows (the curated v1 searches client-side). SECURITY INVOKER → respects the public-read RLS.
create or replace function public.search_programs(q text default '', lim int default 100)
returns setof public.programs
language sql stable
set search_path = public as $$
  select p.*
  from public.programs p
  where q = ''
     or p.fts @@ websearch_to_tsquery('english', q)
     or p.name % q
     or p.university % q
  order by
    (case when q = '' then 0
          else ts_rank_cd(p.fts, websearch_to_tsquery('english', q)) end) desc,
    similarity(p.name, q) desc,
    p.name
  limit lim;
$$;
