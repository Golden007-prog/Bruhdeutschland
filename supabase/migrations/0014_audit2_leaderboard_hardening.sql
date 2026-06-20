-- Audit-2 fixes for the ranking layer:
--   SEC-A  client could upsert its OWN readiness/score + arbitrary handle and appear on the public board.
--   FLOW   the `readiness` column was never written (client wrote only opted_in/handle; cron skipped it),
--          so the primary leaderboard dimension was permanently 0 for everyone.
--   SEC-B  `my_rank` aggregated over NON-opted-in users (small-N inference could leak a non-consenting
--          user's value); §9.4 wants an opt-in, anonymized cohort.
--
-- Fix: the ranked metric columns are now SERVER-AUTHORED only. Clients may write just opted_in + handle
-- (column-level grants); readiness/roadmap_pct/best_band/streak are set exclusively by SECURITY DEFINER
-- functions (the nightly cron + a new client-callable `refresh_my_leaderboard` that recomputes the
-- caller's own metrics on demand). `my_rank` now aggregates over the opted-in cohort with a min-cohort
-- guard. readiness is a deterministic, bounded composite of the DB-derived metrics (not model-computed).

-- 1) Lock down direct client writes to the score columns (server-author them).
revoke insert, update on public.leaderboard_stats from authenticated;
grant select on public.leaderboard_stats to authenticated;            -- RLS still scopes to the own row
grant insert (user_id, opted_in, handle) on public.leaderboard_stats to authenticated;
grant update (opted_in, handle, updated_at) on public.leaderboard_stats to authenticated;

-- 2) On-demand, server-authoritative recompute of the CALLER's metrics (fixes readiness-0 + SEC-A).
create or replace function public.refresh_my_leaderboard()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); rp numeric; bb numeric; st numeric; rd numeric;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 0)
    into rp from public.roadmap_items where user_id = uid;
  select max(overall_band) into bb from public.exam_attempts where user_id = uid;
  select current_streak into st from public.goals_streaks where user_id = uid;
  rp := coalesce(rp, 0); st := coalesce(st, 0);
  -- bounded 0–100 composite: roadmap progress (50%) + best band scaled (35%) + streak capped (15%).
  rd := round(0.5 * rp + 0.35 * least(coalesce(bb, 0) / 9.0 * 100, 100) + 0.15 * least(st * 5, 100));
  insert into public.leaderboard_stats (user_id, readiness, roadmap_pct, best_band, streak, updated_at)
  values (uid, rd, rp, bb, st, now())
  on conflict (user_id) do update
    set readiness = excluded.readiness, roadmap_pct = excluded.roadmap_pct,
        best_band = excluded.best_band, streak = excluded.streak, updated_at = now();
end $$;
revoke execute on function public.refresh_my_leaderboard() from public, anon;
grant execute on function public.refresh_my_leaderboard() to authenticated;

-- 3) Make the nightly cron also set readiness (so offline users stay ranked on the primary dimension).
create or replace function public.refresh_leaderboard_stats()
returns void language sql security definer set search_path = public as $$
  insert into public.leaderboard_stats (user_id, readiness, roadmap_pct, best_band, streak, updated_at)
  select u.id,
         round(0.5 * coalesce(r.pct, 0)
             + 0.35 * least(coalesce(b.best_band, 0) / 9.0 * 100, 100)
             + 0.15 * least(coalesce(g.current_streak, 0) * 5, 100)),
         coalesce(r.pct, 0), b.best_band, coalesce(g.current_streak, 0), now()
  from auth.users u
  left join (
    select user_id, round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 0) as pct
    from public.roadmap_items group by user_id
  ) r on r.user_id = u.id
  left join (select user_id, max(overall_band) as best_band from public.exam_attempts group by user_id) b on b.user_id = u.id
  left join public.goals_streaks g on g.user_id = u.id
  on conflict (user_id) do update
    set readiness = excluded.readiness, roadmap_pct = excluded.roadmap_pct,
        best_band = excluded.best_band, streak = excluded.streak, updated_at = now();
$$;

-- 4) my_rank: aggregate over the OPTED-IN cohort only, with a min-cohort guard (fixes SEC-B). The caller's
--    own value is always returned; aggregates are null when fewer than 5 opted-in peers exist.
create or replace function public.my_rank(dimension text)
returns table(value numeric, below bigint, total bigint, avg numeric, p50 numeric, p90 numeric)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); col text; min_cohort int := 5; n bigint;
begin
  if uid is null then raise exception 'authentication required'; end if;
  col := case dimension
    when 'readiness' then 'readiness' when 'roadmap_pct' then 'roadmap_pct'
    when 'streak' then 'streak' when 'best_band' then 'best_band' else null end;
  if col is null then raise exception 'invalid dimension'; end if;
  return query execute format($q$
    with me as (select (%1$I)::numeric v from public.leaderboard_stats where user_id = $1),
         cohort as (select (%1$I)::numeric v from public.leaderboard_stats where opted_in = true and (%1$I) is not null)
    select
      (select v from me),
      case when (select count(*) from cohort) >= $2
           then (select count(*) from cohort c where c.v < (select v from me) and (select v from me) is not null) end,
      case when (select count(*) from cohort) >= $2 then (select count(*) from cohort) end,
      case when (select count(*) from cohort) >= $2 then (select round(avg(v), 2) from cohort) end,
      case when (select count(*) from cohort) >= $2 then (select percentile_cont(0.5) within group (order by v) from cohort) end,
      case when (select count(*) from cohort) >= $2 then (select percentile_cont(0.9) within group (order by v) from cohort) end
  $q$, col) using uid, min_cohort;
end $$;
revoke execute on function public.my_rank(text) from public, anon;
grant execute on function public.my_rank(text) to authenticated;
