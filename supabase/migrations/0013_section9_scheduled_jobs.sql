-- Section 9 (§9.5) — scheduled "Supabase functions". The recompute/leaderboard/deadline jobs are pure
-- DB work, so they are SECURITY DEFINER SQL functions run by pg_cron (server-side by construction — no
-- service-role key in any client). `readiness` stays client-computed (tested TS); these jobs only refresh
-- the purely DB-derived columns to avoid duplicating the formula. All idempotent. (gdpr_delete needs the
-- admin API, so it is the one true Edge Function — see supabase/functions/gdpr_delete.)

create extension if not exists pg_cron;

-- Refresh the DB-derived leaderboard columns for everyone (preserves readiness/opted_in/handle).
create or replace function public.refresh_leaderboard_stats()
returns void language sql security definer set search_path = public as $$
  insert into public.leaderboard_stats (user_id, roadmap_pct, best_band, streak, updated_at)
  select u.id,
         coalesce(r.pct, 0),
         b.best_band,
         coalesce(g.current_streak, 0),
         now()
  from auth.users u
  left join (
    select user_id, round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 0) as pct
    from public.roadmap_items group by user_id
  ) r on r.user_id = u.id
  left join (
    select user_id, max(overall_band) as best_band from public.exam_attempts group by user_id
  ) b on b.user_id = u.id
  left join public.goals_streaks g on g.user_id = u.id
  on conflict (user_id) do update
    set roadmap_pct = excluded.roadmap_pct,
        best_band   = excluded.best_band,
        streak      = excluded.streak,
        updated_at  = now();
$$;

-- One progress snapshot per user per day (idempotent on date).
create or replace function public.recompute_progress()
returns void language sql security definer set search_path = public as $$
  insert into public.progress_snapshots (user_id, overall_pct, by_category, created_at)
  select u.id, coalesce(r.pct, 0), '{}'::jsonb, now()
  from auth.users u
  left join (
    select user_id, round(100.0 * count(*) filter (where status = 'done') / nullif(count(*), 0), 0) as pct
    from public.roadmap_items group by user_id
  ) r on r.user_id = u.id
  where not exists (
    select 1 from public.progress_snapshots ps
    where ps.user_id = u.id and ps.created_at::date = now()::date
  );
$$;

-- Notify on deadlines due within 7 days (idempotent: at most one per deadline title per day).
create or replace function public.scan_deadlines()
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, created_at)
  select d.user_id, 'deadline', d.title, 'Due ' || to_char(d.due_date, 'YYYY-MM-DD'), now()
  from public.deadlines d
  where d.done = false
    and d.due_date between now()::date and (now()::date + 7)
    and not exists (
      select 1 from public.notifications n
      where n.user_id = d.user_id and n.kind = 'deadline' and n.title = d.title
        and n.created_at::date = now()::date
    );
$$;

-- These run only under pg_cron (as postgres); they must NOT be API-callable.
revoke execute on function public.refresh_leaderboard_stats() from public, anon, authenticated;
revoke execute on function public.recompute_progress() from public, anon, authenticated;
revoke execute on function public.scan_deadlines() from public, anon, authenticated;

-- Schedules (pg_cron 1.6 upserts by jobname → idempotent). keep_alive touches the DB twice daily so the
-- free-tier project is never idle for 7 days.
select cron.schedule('refresh_leaderboard', '0 3 * * *', $$ select public.refresh_leaderboard_stats(); $$);
select cron.schedule('recompute_progress',  '0 2 * * *', $$ select public.recompute_progress(); $$);
select cron.schedule('scan_deadlines',      '0 6 * * *', $$ select public.scan_deadlines(); $$);
select cron.schedule('keep_alive',          '0 */12 * * *', $$ select 1; $$);
