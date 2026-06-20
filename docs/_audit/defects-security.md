# DeutschPrep — Security & Red-Team Audit (FIND & DOCUMENT ONLY)

> Scope: React+Vite SPA on GitHub Pages (`https://golden007-prog.github.io/Bruhdeutschland/`, HashRouter)
> + Supabase backend (project `dxfjstgnokncqabnumkr`). No code or DB was modified. Adversarial pass:
> each red-team attempt below was actually executed (Supabase MCP `execute_sql`/`get_advisors`,
> `WebFetch`/`curl` of the live bundle, source review).
> Severity model: **P0** leak/secret/money/app-breaking · **P1** feature broken/lost-data ·
> **P2** edge/weak-validation · **P3** polish.

---

## Executive summary

The hard perimeter is **solid**: every one of the 22 public tables has RLS enabled with an
`auth.uid() = user_id` owner-only policy (`programs` is the only public-read table, SELECT-only);
the deployed JS bundle leaks **no** secret (only the public `role:anon` JWT); the Owner-Mode Claude
bridge is loopback-bound, origin-allowlisted, holds no key, and is excluded from the build; the CI
gate greps `dist/` for provider/service keys; no PII or keys are logged. No cross-user read was
achievable.

The real problems are **persistence completeness and GDPR**, not a perimeter breach:

1. **GDPR delete does not erase most data (P0/P1).** "Delete & sign out" removes only `settings` +
   `profiles`. The other per-user rows that DO get written — `exam_attempts`, `answers`, `events`,
   `goals_streaks` — and all `exam-audio` Storage files survive forever. Violates §9.6 "delete erases
   everything."
2. **GDPR export is partial (P1).** Export dumps only the local `settings` blob; it omits
   `exam_attempts`/`answers`/`events`/`goals_streaks` rows and Storage files. Violates §9.6 "export
   returns everything."
3. **localStorage is the source of truth for almost all personal data (P0 per §9.6).** ~16 of the
   per-user tables the schema defines (`intake_submissions`, `documents`, `roadmap_items`,
   `applications`, `progress_snapshots`, `saved_searches`, `user_shortlist`, `srs_cards`,
   `study_plan_items`, `deadlines`, `notifications`, `audit_log`, `account_memory`, `seen_topics`,
   `exam_forms`) are **never written by the app** (confirmed empty). Intake, profile eval, roadmap,
   shortlist, applications, finance, visa, and generated documents live ONLY inside the
   `settings.data` JSONB blob mirrored from localStorage. It is per-user and cross-device (isolation
   is fine), but it is not the queryable, individually-RLS'd, per-feature persistence §9.2/§9.6
   require, and it is exactly why GDPR export/delete miss data.
4. **Section 9 infra is unbuilt (P1/P2).** No edge functions exist (`gdpr_export`, `gdpr_delete`,
   `compute_leaderboard`, `recompute_progress`, `deadline_scan`, `persist_generated_doc`,
   `keep_alive`). No leaderboard/ranking RPC or table. No encrypted `api_keys` table. No versioned
   consent capture.

Nothing here is a remote attacker reading another user's data. The exposure is **data-loss / right-
to-erasure / data-minimization**, plus weaker-than-spec secret handling for BYOK keys.

---

## Red-team attempts (attempt → result → severity)

| # | Attempt | Method | Result | Severity |
|---|---------|--------|--------|----------|
| 1 | Cross-user read via anon Data API | Inspected `role_table_grants` + `pg_policies` + `pg_class.relrowsecurity`; reasoned about anon JWT | All 22 tables RLS-enabled; every user table policy `auth.uid()=user_id` (profiles `=id`); anon's `auth.uid()` is null → 0 rows. No `null` user_id rows exist (`intake/exam/docs/account_memory` checked). Only `programs` (public SELECT, `qual=true`) reachable. **No leak.** | — (pass) |
| 2 | Secret in deployed bundle | `curl` live `index.html` + 845 KB `index-jJTrGwBv.js`; grep `AIza`/`sk-`/`sk-ant-`/`service_role`/`BEGIN…PRIVATE KEY`; decode every embedded JWT | Only 1 credential present: Supabase URL + JWT whose payload is `{"role":"anon"…}` (public by design). No Google/OpenAI/Anthropic key, no service role, no private key. `.js.map` → HTTP 404 (source not shipped). **No leak.** | — (pass) |
| 3 | Steal BYOK key (storage / network / XSS) | Read `lib/llm/keys.ts`, `gemini.ts`, `userScope.ts` | Gemini key sent only to Google's own endpoint (official SDK → `x-goog-api-key`). Stored plaintext in **global** (un-scoped) `localStorage` key `deutschprep:key:gemini`. Reachable by any XSS or any co-located account on the same browser. Inherent to BYOK-in-browser but un-encrypted and shared. | **P2** (SEC-7) |
| 4 | Call Owner-Mode bridge from a foreign origin / drive-by quota burn | Read `tools/claude-bridge/server.mjs` | `/generate` enforces an Origin allowlist (localhost, 127.0.0.1, exact Pages origin; pinned tunnel host only via env — no wildcard) **before** doing work; loopback-bind by default; PNA preflight handled; optional `X-Bridge-Token`; strips `ANTHROPIC_API_KEY`; excluded from Pages build; holds no secret. Foreign origin → 403. **Blocked.** | — (pass) |
| 5 | Reach the ranking RPC and read others' rows | Searched `pg_proc` for SECURITY DEFINER + RPCs; `list_edge_functions` | No leaderboard/ranking RPC, table, or materialized view exists at all. Only SECURITY DEFINER fn is `handle_new_user` (signup trigger), EXECUTE granted to `postgres`+`service_role` only — **not** callable by anon/authenticated. `search_programs` is not SECURITY DEFINER and reads only `programs`. **No leak; feature simply absent.** | P1 (gap, SEC-9) |
| 6 | Hit a deep link unauthenticated | Read `RequireAuth.tsx`, `AppGate.tsx` | Anon → redirected to `/welcome`; account-bound surfaces render a sign-in gate, not the data; even if a route rendered, RLS returns 0 rows for anon. **No data exposure.** | — (pass) |
| 7 | Find a table without RLS / in an exposed schema | `pg_class.relrowsecurity` for all `public` tables; `get_advisors(security)` | 22/22 RLS-enabled. Advisor returns only WARN (extensions `vector`/`pg_trgm` in `public`; leaked-password protection off) — no `rls_disabled_in_public`/`policy_exists_rls_disabled` ERROR. | P3 (SEC-10/11) |
| 8 | Exhaust someone's free-tier quota | Reasoned over BYOK + bridge model | LLM calls use the visitor's OWN Gemini key or the OPERATOR's OWN Claude plan via the (gated) bridge. A visitor can only burn their own quota. No shared server-side LLM credit to exhaust. **No shared-quota risk.** | — (pass) |

---

## Findings

### SEC-1 — [P0] GDPR "delete" leaves most user data in Supabase (and all Storage files)
- **Evidence:** `frontend/src/features/settings/DataControls.tsx:42-59` — `deleteData()` deletes only
  `settings` (`:51`) and `profiles` (`:55`) rows, then signs out. It calls `clearLocalPersonal()`
  (local only). It never touches `exam_attempts`, `answers`, `events`, `goals_streaks`, or the
  `exam-audio` Storage bucket — all of which the app DOES write (`lib/exam/attempts.ts:127,165,168,182`;
  `lib/speech/cache.ts:63`). Confirmed live: `exam_attempts` currently holds rows
  (`SELECT count(*) … = 1`).
- **Impact:** Right-to-erasure is not honored. A user who "deletes" their data leaves practice
  history, per-answer detail, an event trail, streaks, and audio blobs permanently associated with
  their `user_id`. Directly violates §9.6 "delete erases everything (incl. Storage + Drive link)" and
  CLAUDE.md GDPR golden rule.
- **Fix:** Implement a `gdpr_delete` Edge Function (service role, server-side) that deletes every
  per-user row across all tables + lists & removes `exam-audio/<uid>/*`, then deletes the auth user;
  or, until then, have the client delete from every written table + Storage prefix before sign-out.

### SEC-2 — [P1] GDPR "export" returns only the localStorage blob, not Supabase rows or files
- **Evidence:** `DataControls.tsx:21-23` — `exportData()` serializes `syncedStore.snapshot()` (the
  `settings.data` blob) only. `exam_attempts`/`answers`/`events`/`goals_streaks` and `exam-audio`
  files are omitted.
- **Impact:** Export is incomplete; violates §9.6 "export returns everything (rows + files)" and the
  GDPR data-portability obligation.
- **Fix:** `gdpr_export` Edge Function (or client-side aggregator) that bundles all per-user rows from
  every table + signed download of every Storage object into one JSON/ZIP.

### SEC-3 — [P0 per §9.6] localStorage is the source of truth for almost all personal data
- **Evidence:** Every Supabase write in the app: `settings` (`syncedStore.ts:161`), `exam_attempts`
  + `answers` + `events` + `goals_streaks` (`attempts.ts`), `programs` read-only
  (`useProgramData.ts:101`), `exam-audio` Storage (`cache.ts:63`). That is the complete list
  (grep of `.from(`/`.rpc(`/`storage.from(`). The ~16 other per-user tables defined in the schema
  are never written — confirmed empty live: `intake_submissions=0`, `documents=0`,
  `account_memory=0`, `roadmap_items`/`applications`/etc. unused. Intake, profile eval, roadmap,
  shortlist, applications, finance, visa, generated docs persist ONLY in `settings.data` JSONB.
- **Impact:** Meets isolation/cross-device, but breaks §9.6 "every feature persists per-user in
  Supabase — no localStorage as a source of truth," §9.2's per-feature tables, and is the root cause
  of SEC-1/SEC-2 (data the blob doesn't contain can't be exported/deleted; data only in the blob is a
  giant opaque JSON, not queryable/rankable). If a user clears site data while signed out (anon blob),
  it's gone with no cloud copy.
- **Fix:** Write each feature's data to its dedicated RLS'd table (intake_submissions, roadmap_items,
  applications, …); keep localStorage as a cache, not the system of record; back GDPR export/delete
  with those tables.

### SEC-4 — [P1] Section-9 Edge Functions are entirely unbuilt
- **Evidence:** `list_edge_functions` → `[]`. None of `on_signup`*, `compute_leaderboard`,
  `recompute_progress`, `deadline_scan`, `persist_generated_doc`, `gdpr_export`, `gdpr_delete`,
  `keep_alive` exist. (*Signup mirroring is instead a DB trigger `handle_new_user`, which DOES exist
  and is correctly SECURITY DEFINER + not anon-executable.)
- **Impact:** No server-side GDPR, no scheduled deadline notifications, no keep-alive (7-day pause
  risk), no doc-persist pipeline. §9.5/§9.7 unmet.
- **Fix:** Build the functions; service-role key stays inside them only.

### SEC-5 — [P1] Generated-document storage (§9.3) not implemented
- **Evidence:** No `generated_docs` table, no `document_vault`; the only Storage bucket is
  `exam-audio` (TTS cache). SOPs/CVs/LORs/exports are not saved to Storage with versions/provenance;
  they live in the blob or are ephemeral. No Drive `drive.file` flow.
- **Impact:** §9.3/§9.7 "every generated document saved in Storage with versions + provenance" unmet;
  documents are lost on blob reset and excluded from GDPR export.
- **Fix:** Add `generated_docs` (owner-RLS) + a private docs bucket with owner-folder RLS; persist on
  generation.

### SEC-6 — [P1] Cross-user ranking system (§9.4) absent
- **Evidence:** No `leaderboard_stats`/`outcomes`/`achievements` tables, no `compute_leaderboard`
  RPC/cron, no opt-in pseudonymous handle. (Red-team #5: nothing to leak because nothing exists.)
- **Impact:** Feature missing. When built, it MUST be the SECURITY DEFINER aggregate described in §9.4
  (return only caller rank/percentile + anonymized cohort aggregates) and be red-teamed again.
- **Fix:** Build per §9.4; default-off, anonymized; percentile math in tested code.

### SEC-7 — [P2] BYOK keys stored unencrypted in a global (un-scoped) localStorage key
- **Evidence:** `lib/llm/keys.ts:8,51-58,89-97` store under bare `deutschprep:key:<provider>` /
  `deutschprep:svc:<svc>` with no user scope; `lib/persist/userScope.ts:6-9` documents this as
  intentional ("BYOK API keys deliberately stay global"). No encryption; no `api_keys` table.
- **Impact:** (a) Two different accounts on one shared/kiosk browser share the same Gemini/Cloud-TTS
  key and can spend each other's quota; (b) any XSS reads the key via `localStorage.getItem`.
  Plaintext-at-rest contradicts §9.0/§9.2 "api_keys (BYOK, encrypted)" and §9.6 "sensitive PII
  encrypted." (Key is only ever sent to the provider's own endpoint — `gemini.ts:46` — so no exfil to
  our backend.)
- **Fix:** At minimum scope BYOK keys per active user via `scopedKey`/reset-on-auth-change like other
  personal stores; document the residual XSS risk; for the spec, persist to an encrypted `api_keys`
  table rather than plaintext localStorage.

### SEC-8 — [P2] Résumé / intake PII stored unencrypted (blob + plaintext localStorage)
- **Evidence:** `lib/resume/resume.ts` parses résumé/LinkedIn text client-side to pre-fill intake;
  that text + all intake answers land in the `settings.data` blob (`syncedStore.ts`) and plaintext
  localStorage. No field-level encryption; no dedicated `intake_submissions` row (table empty).
- **Impact:** §9.0/§9.6 "encrypted sensitive PII" unmet. (Mitigations present: PII is never logged —
  only `ErrorBoundary.tsx:25` logs `error.message`+stack; never sent to third parties.)
- **Fix:** Persist intake to `intake_submissions` (RLS); encrypt sensitive fields at rest per spec;
  keep the no-log discipline.

### SEC-9 — [P2] Consent is a dismissible local flag, not versioned/persisted
- **Evidence:** `components/system/ConsentBanner.tsx:12` stores a single `consent:v1` boolean in
  synced state; `profiles` has no `consent_version`/`consent_at` write anywhere in the client. Banner
  copy is honest ("stores data in this browser — no tracking cookies").
- **Impact:** §9.1/§9.6 "consent captured + versioned" unmet; can't prove which policy version a user
  accepted or when.
- **Fix:** Write `consent_version` + `consent_at` to `profiles` (or a `consents` table) on accept.

### SEC-10 — [P3] Postgres extensions installed in `public` schema
- **Evidence:** `get_advisors(security)` WARN — `vector` and `pg_trgm` in `public`.
- **Impact:** Low; hygiene/namespacing best practice.
- **Fix:** Move to a dedicated `extensions` schema (Supabase guide linked in advisor).

### SEC-11 — [P3] Leaked-password protection (HaveIBeenPwned) disabled
- **Evidence:** `get_advisors(security)` WARN `auth_leaked_password_protection`.
- **Impact:** Compromised passwords accepted. Low here (primary auth is Google OAuth + email
  magic-link; password sign-up may be unused), but a one-click hardening.
- **Fix:** Enable in Supabase Auth settings.

---

## What is correct (do not regress)

- **RLS:** 22/22 public tables RLS-enabled; owner-only `auth.uid()=user_id` (profiles `=id`) ALL
  policies with matching `WITH CHECK`; `programs` public-read SELECT only (`qual=true`). No
  `null`-user_id rows. No view/materialized view (no security_invoker hole).
- **SECURITY DEFINER:** only `handle_new_user` (signup trigger), EXECUTE to `postgres`+`service_role`
  only — not anon/authenticated callable.
- **Storage:** single private bucket `exam-audio`, owner-folder RLS
  `(storage.foldername(name))[1] = auth.uid()`.
- **Bundle:** no provider/service key; only the public `role:anon` JWT; no sourcemap shipped; CI gate
  (`deploy.yml:56-65`) fails the build on `AIza|sk-|sk-ant-|service_role|SUPABASE_SERVICE` in `dist`.
- **Owner-Mode bridge:** loopback-bind, Origin allowlist enforced on `/generate`, no wildcard tunnel,
  optional shared secret, PNA preflight, path-traversal containment, strips `ANTHROPIC_API_KEY`,
  build-excluded, holds no secret.
- **Logging:** no PII or key logged anywhere (only `ErrorBoundary` `error.message`+stack; supabase-js
  realtime warn).
- **Per-user isolation on device:** `syncedStore.ts` + `userScope.ts` namespace every personal store
  by uid and reset on every auth transition; legacy global keys parked under `anon` and removed. The
  known pre-fix cross-account bug is addressed.
