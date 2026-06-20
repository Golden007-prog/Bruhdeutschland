# DeutschPrep — Fresh Security + Red-Team Audit (Section 9 persistence layer)

**Date:** 2026-06-21
**Scope:** React+Vite SPA on GitHub Pages (`golden007-prog.github.io/Bruhdeutschland`) + Supabase backend
(project `dxfjstgnokncqabnumkr`). 46 public tables, 2 Storage buckets, 6 SECURITY DEFINER functions,
4 pg_cron jobs, 1 edge function (`gdpr_delete`), Owner-Mode Claude bridge.
**Method:** Adversarial. Every claim was *attacked* (role-impersonation SQL, JWT-claims simulation,
rolled-back write attempts, deployed-bundle secret scan), not assumed. Read-only — no code/DB changed.

**Severity:** P0 leak/secret/money/app-breaking · P1 broken/lost-data · P2 edge/weak-validation · P3 polish.

**Headline:** The previously-known cross-user **P0 is closed** — verified empirically, not on faith. RLS is
enabled and owner-scoped on every one of the 46 tables; anon reads return 0 rows; cross-user writes are
rejected by RLS; the ranking RPCs are revoked from anon and their dynamic `format()` is injection-safe; the
deployed bundle leaks no service key. Findings below are **hardening / compliance / integrity** gaps, none P0.

---

## Red-team attempts table

| # | Attack | How | Result | Severity |
|---|--------|-----|--------|----------|
| 1 | Anon reads other users' data | `SET ROLE anon; SELECT count(*) FROM profiles / leaderboard_stats` | **0 rows** (RLS denies; `programs`=35 by design) | safe |
| 2 | Authed user A reads B's leaderboard row | impersonate uid A, `SELECT … WHERE user_id<>A` | **0 rows** | safe |
| 3 | Authed A updates B's profile | `UPDATE profiles SET email=… WHERE id<>A` | **rows_affected=0** (RLS) | safe |
| 4 | Forge `user_id` on INSERT (write into B) | insert `roadmap_items`/`leaderboard_stats` with B's uid | **blocked: "violates row-level security policy"** | safe |
| 5 | SQL-injection via `my_rank` dynamic `format()` | `my_rank('readiness"; drop table profiles; --')` | **rejected: "invalid dimension"** (CASE whitelist) | safe |
| 6 | Anon calls ranking RPC | `SET ROLE anon; my_rank('readiness')` | **blocked: "permission denied for function"** | safe |
| 7 | Anon writes the shared catalog | `SET ROLE anon; INSERT/UPDATE programs` | INSERT **blocked by RLS**, UPDATE **0 rows** | safe |
| 8 | Service-role/API key in deployed JS bundle | `curl` bundle, grep `service_role/sk-ant/AIza/PRIVATE KEY` | **none** — only the anon JWT (public by design) | safe |
| 9 | User self-inflates leaderboard rank | authed user upserts own `leaderboard_stats.readiness=99999` | **policy allows it** (no value/opt-in guard; FK blocked only the synthetic uid) | **P2** (SEC-A) |
| 10 | `my_rank` aggregates leak non-opted-in users | inspect function body / opt-in filter | **no `opted_in` filter** in `my_rank` cohort; small-N aggregate inference possible | **P2** (SEC-B) |
| 11 | Delete another user via `gdpr_delete` | read `index.ts` — does it take uid from body? | **No** — uid derived from caller JWT only; A cannot delete B | safe |
| 12 | `gdpr_delete` CORS abuse | `Access-Control-Allow-Origin: "*"` + reads Authorization header | bearer-token (not cookie) auth ⇒ no ambient CSRF, but `*` is over-broad | **P3** (SEC-C) |
| 13 | Co-located account reads another's BYOK key | read `keys.ts` scoping + legacy migration | **per-user `scopedKey`**, legacy parked under `:anon`; isolated | safe |
| 14 | A→B data bleed on auth switch (dual-write) | trace `syncedStore.setIdentity` + `useTableSync` hydrate | `syncedStore` resets blob synchronously per identity; narrow theoretical race remains | **P3** (SEC-D) |

---

## Findings

### SEC-A — Client can self-set its own leaderboard rank (rank integrity) — P2
**Where:** `leaderboard_stats` RLS policy `own rows` = `FOR ALL … auth.uid()=user_id` (no value/opt-in
constraint); `migrations/0012_section9_leaderboard_ranking.sql`. Confirmed by rolled-back test #9.
**Impact:** A signed-in user can directly `upsert` their own `leaderboard_stats` row with an arbitrary
`readiness`/`best_band`/`streak` and `opted_in=true`, between the nightly `refresh_leaderboard_stats`
(pg_cron job 1, 03:00) runs. The scheduled function recomputes from source tables, but in the window before
the next refresh the public leaderboard (`leaderboard_top`) shows the forged score. `handle` is also
user-chosen with no uniqueness/format constraint, so a user can squat or impersonate another person's real
name as their handle (the spec wants pseudonymous handles, the DB doesn't enforce non-PII).
**Fix rec:** Don't let clients write `leaderboard_stats` directly — revoke `INSERT/UPDATE/DELETE` from
`authenticated` on that table (keep `SELECT` of own row), and let only `refresh_leaderboard_stats`
(service-role/cron) populate it. Move `opted_in`/`handle` to a separate user-writable opt-in table that the
refresh job reads. Add a `UNIQUE(handle)` + a check that handle isn't an email.

### SEC-B — `my_rank` cohort includes non-opted-in users (aggregate privacy) — P2
**Where:** `public.my_rank(dimension)` body — the cohort CTE is `from public.leaderboard_stats l` with **no
`where opted_in`** filter (contrast `leaderboard_top`, which *does* filter `opted_in=true and handle is not
null`). Migration `0012`.
**Impact:** `my_rank` returns `count`, `avg`, `p50`, `p90` over **all** users with a row, including those who
never opted into ranking. It returns no identifiable row, so this is not a direct leak — but for a small
cohort the aggregates are inferential (e.g. total=2 ⇒ the caller learns the other, non-consenting user's
value via `avg`). Spec §9.4 requires ranking to be opt-in and anonymized; the aggregate side ignores opt-in.
**Fix rec:** Add `where opted_in = true` to the `my_rank` cohort (matching `leaderboard_top`), and suppress
aggregates when the opted-in cohort size is below a small-N threshold (e.g. `< 5`).

### SEC-C — `gdpr_delete` uses wildcard CORS — P3
**Where:** `supabase/functions/gdpr_delete/index.ts` — `cors = { "Access-Control-Allow-Origin": "*", … }`.
**Impact:** Low. The function authenticates from the `Authorization: Bearer <jwt>` header (Supabase tokens
are bearer, not cookies), so a cross-site page cannot silently attach a victim's token — no ambient-authority
CSRF. But `*` lets any origin invoke it with a token it already holds, and is inconsistent with the bridge's
strict origin allowlist. Account-deletion is irreversible, so it deserves a tight origin.
**Fix rec:** Echo a single allowlisted origin (the Pages site + localhost) instead of `*`; keep `verify_jwt`.

### SEC-D — Dual-write hydrate race on rapid account switch — P3 (low confidence)
**Where:** `frontend/src/lib/persist/useTableSync.ts:81-90` (hydrate adopts `itemsRef.current` as the
baseline and upserts it when the remote table is empty) vs `syncedStore.setIdentity`
(`syncedStore.ts:103-120`, resets the in-memory blob synchronously per identity).
**Impact:** Theoretical. On a fast A-signout → B-signin, if `useTableSync`'s `[table,uid]` hydrate effect
runs before `useSyncedState` re-renders B's (reset) list, and B's table is empty, the hook could upsert
whatever `items` are momentarily in memory under B's uid. `syncedStore` resetting the blob synchronously on
`setIdentity` and dropping stale in-flight cloud pulls makes this very unlikely, and RLS keeps any written
rows owner-scoped to B (non-PII list items: applications/roadmap steps) — so worst case is B seeing a couple
of A's list entries, not a cross-tenant *read*. Could not reproduce statically; flagged for a focused test.
**Fix rec:** Gate `useTableSync`'s reconcile/hydrate on `useSyncHydrated()` so it never acts before the
per-identity blob has settled; clear `items` to `[]` on `uid` change before first reconcile.

### SEC-E — Sensitive PII stored in plaintext (golden-rule / §9.2 compliance gap) — P2
**Where:** `profiles` (email, full_name), `intake_submissions.parsed` (full parsed resume/LinkedIn JSON),
`work_experiences` (company/title/description), `education_timeline` (institution/degree/grade). No
column-level encryption: `pgsodium` is not installed; `pgcrypto`/`supabase_vault` exist but are unused for
these columns (verified via `pg_extension`).
**Impact:** Not an exploitable leak — RLS (verified) prevents cross-user and anon access, and Supabase
encrypts storage at rest at the disk level. But CLAUDE.md golden rule #7 and Section 9 §9.2/§9.6 explicitly
require "encrypt sensitive PII at rest" (application/column-level). The literal requirement is unmet, so any
DoD/compliance sign-off claiming it is satisfied is inaccurate.
**Fix rec:** Either (a) implement column encryption (pgsodium/Vault) for the highest-sensitivity columns
(`intake_submissions.parsed`, contact fields), or (b) record an explicit ADR that "encryption at rest" is
satisfied by Supabase's platform-level encryption + RLS and downgrade the §9.2 wording accordingly. Pick one;
don't leave the doc asserting something the schema doesn't do.

### SEC-F — `rls_forced` is OFF on ~20 older tables — P3
**Where:** `pg_class.relforcerowsecurity=false` for `profiles, settings, documents, deadlines,
notifications, roadmap_items, intake_submissions, exam_attempts, …` (the migration-0001–0007 tables). Newer
Section-9 tables (`{authenticated}` policies) have `relforcerowsecurity=true`.
**Impact:** Low. `FORCE ROW LEVEL SECURITY` only affects the **table-owner** role; anon/authenticated are
already non-owners, so RLS applies to them regardless (confirmed by tests #1–#4). The gap matters only if a
future SECURITY DEFINER function owned by the table owner queries these tables without its own `auth.uid()`
guard — it would bypass RLS. A consistency/defense-in-depth hardening item, not a present leak.
**Fix rec:** `ALTER TABLE … FORCE ROW LEVEL SECURITY` on all public user tables for uniformity.

### SEC-G — Extensions in `public` schema (advisor lint) — P3
**Where:** `get_advisors(security)`: `vector` and `pg_trgm` installed in `public`.
**Impact:** Cosmetic/best-practice. Lets unprivileged roles reference extension objects; no direct exploit
here. Note all app SECURITY DEFINER functions correctly pin `SET search_path=public`, and anon/authenticated
do **not** have `CREATE` on `public` in Supabase's default grants, so the classic search_path-hijack of these
definer functions is not reachable.
**Fix rec:** Move extensions to a dedicated `extensions` schema (Supabase's documented remediation).

### SEC-H — Auth: leaked-password protection disabled — P3
**Where:** `get_advisors(security)` → `auth_leaked_password_protection`.
**Impact:** Email/password sign-ups can use known-breached passwords (HaveIBeenPwned check is off). Low for a
primarily Google-OAuth app, but free to enable.
**Fix rec:** Enable in Supabase Auth settings.

### SEC-I — `exam-audio` bucket exists despite "no audio blobs" + policy targets `public` role — P3
**Where:** `storage.buckets` has `exam-audio` (private); its policy `exam-audio own files` has `roles=NULL`
(applies to the `public` role = anon+authenticated). Spec §9.3 says "No audio blobs (TTS is client-side)."
**Impact:** None exploitable — the policy still requires `(storage.foldername(name))[1] = auth.uid()::text`,
which is false for anon (uid NULL), so anon gets nothing (same effective protection as the `{authenticated}`
generated-docs policy). It's a spec inconsistency (a bucket that shouldn't exist) plus a stylistic
role-scoping mismatch vs the newer bucket.
**Fix rec:** Remove `exam-audio` if unused, or restrict its policy `TO authenticated` for consistency.

---

## What was verified SAFE (positive controls — do not regress these)
- **RLS on all 46 tables**, every policy owner-scoped (`auth.uid()=user_id`, profiles `auth.uid()=id`);
  `programs` is the only `USING(true)` and it is **SELECT-only** (anon write blocked, test #7).
- **Cross-user read/write closed** for both anon and a forged-JWT authenticated user (tests #1–#4).
- **Ranking RPCs leak-safe:** `dimension` is a CASE whitelist → no `format()` injection (test #5);
  `leaderboard_top` returns only pseudonymous `handle`+value filtered to `opted_in`; both **revoked from
  anon** (test #6); granted only to `authenticated`/service_role.
- **`gdpr_delete`**: uid from caller JWT only (no body uid), `verify_jwt`, service role server-side only,
  generic error body (`delete_failed` — no internals), deletes **all 46 user tables + profiles + both
  buckets + auth user**. Deletion table-list diff vs live schema = **complete** (0 missing).
- **GDPR export** (`userData.ts`) enumerates the same complete table+bucket set through the user's RLS client.
- **No secret in deployed bundle** — only the anon JWT (`"role":"anon"`), public by design (test #8).
- **BYOK keys** per-user `scopedKey`; legacy keys migrated to `:anon`, never into a signed-in account;
  browser-only, never bundled/logged.
- **Owner-Mode bridge** (`tools/claude-bridge/server.mjs`): loopback bind default, strict origin allowlist
  (no wildcards; exact tunnel-host pin), optional shared-secret token, strips `ANTHROPIC_API_KEY` to force
  subscription billing, no bundled secret, path-traversal containment in static serving.
- **SECURITY DEFINER functions** all pin `SET search_path=public`; cron jobs call only service-role-granted
  definer functions; keep-alive is `select 1`.

## Evidence index (re-runnable)
- RLS/grants: `pg_class.relrowsecurity/relforcerowsecurity`, `pg_policies`, `information_schema.role_table_grants`.
- Definer bodies: `pg_get_functiondef` for `my_rank`, `leaderboard_top`, `refresh_leaderboard_stats`, etc.
- Live attacks: `SET LOCAL ROLE {anon,authenticated}` + `SET LOCAL request.jwt.claims` inside `BEGIN…ROLLBACK`.
- Bundle: `curl https://golden007-prog.github.io/Bruhdeutschland/assets/index-BqlDPAq2.js` → grep secrets.
- Edge fn: `mcp__supabase__get_edge_function gdpr_delete`. Advisors: `get_advisors(security)`.
