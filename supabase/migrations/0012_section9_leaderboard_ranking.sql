-- Section 9 (§9.4) — fair, opt-in, leak-proof cross-user ranking.
-- `leaderboard_stats` keeps the normal owner-only RLS (a user reads/writes only their OWN row). Ranking
-- is the one place owner-RLS isn't enough, so it is exposed through two SECURITY DEFINER RPCs that NEVER
-- return another user's identifiable row:
--   • my_rank(dimension)      → the caller's own value + anonymized cohort aggregates (below/total/avg/
--                               p50/p90). The percentile FORMULA runs in tested TS from these counts.
--   • leaderboard_top(dim)    → opt-in board: pseudonymous handle + value only, for users who opted in.
-- Both guard on auth.uid() and are revoked from anon (SECURITY DEFINER in public is otherwise callable by
-- anon). Refreshed per-user by the client and/or recompute_progress (S9-D); pg_cron refresh optional.

create table if not exists public.leaderboard_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  readiness numeric not null default 0,        -- 0–100 readiness score (computed in tested TS)
  roadmap_pct numeric not null default 0,      -- 0–100 roadmap completion
  streak numeric not null default 0,           -- current practice streak (days)
  best_band numeric,                           -- best mock band across tests
  opted_in boolean not null default false,     -- pseudonymous leaderboard opt-in (default OFF, GDPR)
  handle text,                                 -- user-chosen pseudonym; no real name/email
  updated_at timestamptz not null default now()
);
-- one pseudonym per opted-in user (case-insensitive)
create unique index if not exists leaderboard_handle_uidx
  on public.leaderboard_stats (lower(handle)) where handle is not null;

alter table public.leaderboard_stats enable row level security;
alter table public.leaderboard_stats force row level security;
create policy "own rows" on public.leaderboard_stats for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── my_rank: caller rank + anonymized cohort aggregates (no other user's row) ──
create or replace function public.my_rank(dimension text)
returns table(value numeric, below bigint, total bigint, avg numeric, p50 numeric, p90 numeric)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); col text;
begin
  if uid is null then raise exception 'authentication required'; end if;
  col := case dimension
    when 'readiness'   then 'readiness'
    when 'roadmap_pct' then 'roadmap_pct'
    when 'streak'      then 'streak'
    when 'best_band'   then 'best_band'
    else null end;
  if col is null then raise exception 'invalid dimension'; end if;
  return query execute format($q$
    with me as (select (%1$I)::numeric v from public.leaderboard_stats where user_id = $1)
    select
      (select v from me),
      count(*) filter (where (l.%1$I)::numeric < (select v from me) and (select v from me) is not null),
      count(l.%1$I),
      round(avg((l.%1$I)::numeric), 2),
      percentile_cont(0.5) within group (order by (l.%1$I)::numeric),
      percentile_cont(0.9) within group (order by (l.%1$I)::numeric)
    from public.leaderboard_stats l
  $q$, col) using uid;
end $$;

-- ── leaderboard_top: opt-in, pseudonymous board (handle + value only) ─────────
create or replace function public.leaderboard_top(dimension text, lim int default 20)
returns table(handle text, value numeric, rnk bigint)
language plpgsql stable security definer set search_path = public as $$
declare col text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  col := case dimension
    when 'readiness'   then 'readiness'
    when 'roadmap_pct' then 'roadmap_pct'
    when 'streak'      then 'streak'
    when 'best_band'   then 'best_band'
    else null end;
  if col is null then raise exception 'invalid dimension'; end if;
  return query execute format($q$
    select l.handle, (l.%1$I)::numeric v, rank() over (order by (l.%1$I)::numeric desc) r
    from public.leaderboard_stats l
    where l.opted_in = true and l.handle is not null
    order by v desc
    limit greatest(1, least($1, 100))
  $q$, col) using lim;
end $$;

-- SECURITY DEFINER in public is callable by PUBLIC by default — lock to authenticated only.
revoke execute on function public.my_rank(text) from public, anon;
revoke execute on function public.leaderboard_top(text, int) from public, anon;
grant execute on function public.my_rank(text) to authenticated;
grant execute on function public.leaderboard_top(text, int) to authenticated;
