# Section 9 — Supabase Persistence Coverage Report

> Audit deliverable for `DeutschPrep_DeepAnalysis_Supabase_Persistence_Section.md` §9.6.
> Maps every Section-9 requirement to **current live state** (built / partial / missing) with evidence,
> and the **planned build action**. Live project inspected 2026-06-20 via Supabase MCP (`list_tables`,
> `pg_policies`, `get_advisors`, `list_edge_functions`, `list_extensions`). This report is also the
> build checklist for Phase 3.

Legend: ✅ built & correct · 🟡 partial · ❌ missing.

---

## 9.1 Auth & profile capture
| Item | State | Evidence / Gap |
|---|---|---|
| `on_auth_user_created` trigger → mirror to `profiles` | ✅ | `0001_init.sql:137-148` `handle_new_user()` (SECURITY DEFINER, EXECUTE revoked in `0003`). Acceptable substitute for the `on_signup` Edge Function. |
| Google OAuth + email magic-link | 🟡 verify | Client enables `detectSessionInUrl` (`client.ts:15`); `AuthCard.tsx` exists. Provider enablement in the Supabase dashboard must be confirmed — flag, don't assume. |
| `profiles` carries `email, full_name, avatar_url, locale, provider, last_login, consent_version, consent_at` | ❌ | Live `profiles` columns: `id, display_name, home_country, current_degree, current_grade, target_intake, target_field, german_level, created_at, updated_at`. The Section-9 identity/consent columns are absent. |
| `sessions` / login-event tracking | ❌ | No `sessions` table; `events` exists but isn't login-scoped. |

**Build action:** extend `profiles` (add identity + consent columns), enrich `handle_new_user()` to copy `email/full_name/avatar_url/provider/locale` from `auth.users`, add `last_login` update + `sessions` table (or reuse `events` with a `login` kind).

## 9.2 Full schema — present vs missing
**Present (22 user tables + `programs`):** `profiles · settings · exam_forms · exam_attempts · answers · srs_cards · roadmap_items · documents · seen_topics · applications · deadlines · notifications · audit_log · intake_submissions · account_memory · progress_snapshots · events · programs(public-read) · user_shortlist · saved_searches · study_plan_items · goals_streaks`. All have RLS enabled + an owner-scoped `own rows` policy (`auth.uid()=user_id`, both `USING` and `WITH CHECK`; `profiles` keys on `id`).

**Near-equivalents (no new table needed):** `goals_streaks` ≈ Section-9 `streaks`; `study_plan_items` ≈ `study_plan`; `srs_cards`, `audit_log`, `notifications`, `intake_submissions`, `saved_searches`, `user_shortlist`, `applications`, `progress_snapshots` already match.

**Missing Section-9 tables (~22):** `consents · api_keys(encrypted BYOK) · work_experiences · education_timeline · documents_meta · pathway_results · eligibility_checks · grade_conversions · tasks · checklists · question_type_stats · skill_progress · assessments · comparisons · cost_profiles · budgets · scholarship_matches · sperrkonto_status · visa_checklists · document_vault · generated_docs · outcomes · leaderboard_stats · achievements · reminders`.

**Build action:** one migration per logical group (account/background/pathway/roadmap/practice/discovery/finance/visa-docs/outcomes/comms), each table created with `user_id … references auth.users(id) on delete cascade`, indexes on `user_id`, RLS enabled **and forced**, and the house-style `own rows` policy — matching `0001_init.sql` conventions.

## 9.3 Generated-document storage (+ optional Drive)
| Item | State | Evidence / Gap |
|---|---|---|
| Private docs bucket (owner-only RLS), path `userId/type/uuid-vN.ext` | ❌ | Only bucket is `exam-audio` (private, owner-folder RLS `(storage.foldername(name))[1]=auth.uid()` — a good template). No `generated-docs` bucket. |
| `generated_docs` metadata (type, version, storage_path, model_provenance, source_inputs_hash, drive_file_id?) | ❌ | No such table. `documents`(jsonb content) is not file-metadata/versioned. |
| Versioning (never overwrite) | ❌ | n/a until built. |
| Optional Google Drive (`drive.file` scope only) | ❌ | No Drive integration; no GIS token client. |

**Build action:** create private `generated-docs` bucket + owner-folder Storage policy (mirror exam-audio); `generated_docs` table; `persist_generated_doc` Edge Function; client "Connect Drive" flow using **`drive.file` scope only** (token client-side, never bundled).

## 9.4 Cross-user ranking
❌ **Entirely missing.** No `leaderboard_stats`, no ranking RPC, no opt-in pseudonymous handle, `pg_cron` not installed.

**Build action:** `leaderboard_stats` (derived) + opt-in handle on `profiles`/`settings`; a `SECURITY DEFINER` RPC `my_rank()` that returns **only** the caller's rank/percentile + anonymized cohort aggregates (internal `auth.uid()` guard, never another user's row); deterministic percentile math in **tested TS**; refresh via `compute_leaderboard` on `pg_cron`. Red-team must re-attempt row-leakage post-build.

## 9.5 Edge Functions
❌ **None deployed** (`list_edge_functions` = []). `pg_cron` not installed.
| Function | State | Note |
|---|---|---|
| `on_signup` | ✅ (as DB trigger) | `handle_new_user` covers it; will enrich. |
| `compute_leaderboard` · `recompute_progress` · `deadline_scan` · `persist_generated_doc` · `gdpr_export` · `gdpr_delete` · `keep_alive` | ❌ | All to build. Service-role key lives **only** inside Edge Functions, never bundled. Scheduled ones need `pg_cron` + `pg_net` (or scheduled function invocations). |

## 9.6 Audit points (the §9.6 checklist)
| Check | Verdict | Evidence |
|---|---|---|
| Every feature persists per-user in Supabase; **no localStorage as source of truth** | ❌ **P0** (SEC-3) | ~16 user tables never written; intake/roadmap/apps/finance/visa/docs live only in `settings.data` JSONB. Root cause of the GDPR gaps. |
| RLS **enabled + forced** on every table | 🟡 | `ENABLE` confirmed on all (advisors show no `rls_disabled` error). `FORCE ROW LEVEL SECURITY` **not** set — fine for API-role access (roles aren't table owners) but Section 9 asks for forced; add as defense-in-depth. |
| Storage bucket owner-only | 🟡 | `exam-audio` ✅ owner-folder RLS; docs bucket not yet created. |
| Ranking RPC leaks nothing | n/a | Not built; must be verified post-build. |
| Drive uses `drive.file` only; tokens never bundled/logged | n/a | Not built. |
| GDPR export returns **everything** (rows + files) | ❌ **P1** (SEC-2) | `DataControls.tsx:21-23` exports only the local `settings` blob. |
| GDPR delete erases **everything** (rows + Storage + Drive link) | ❌ **P0** (SEC-1) | `DataControls.tsx:42-59` deletes only `settings`+`profiles`; `exam_attempts/answers/events/goals_streaks` + `exam-audio` objects survive — right-to-erasure broken. |
| Consent captured + versioned | 🟡 **P2** (SEC-9) | `ConsentBanner.tsx:12` stores a dismissible `consent:v1` bool; no `consent_version/consent_at`, no `consents` table. |
| Sensitive PII encrypted | ❌ **P2** (SEC-7/8) | BYOK keys (`keys.ts`) + résumé/intake text stored plaintext in localStorage/`settings.data`; no encrypted `api_keys` table. `pgcrypto`/`supabase_vault` are available. |
| No PII in logs | ✅ | Verified by honesty-ai + security agents (`useGenerate.messageFor` never logs raw errors/PII). |

## 9.7 Definition of Done — status
| DoD | Status |
|---|---|
| Google login → `profiles`; all activity persists per-user with RLS | 🟡 → build |
| Every generated doc in Storage with versions + provenance; optional Drive | ❌ → build |
| Fair opt-in anonymized ranking via SECURITY DEFINER aggregate; percentile math tested; red-team confirms no leak | ❌ → build |
| Edge Functions (signup✅, leaderboard, progress, deadlines, doc-persist, GDPR export/delete, keep-alive) idempotent, service-role server-side only | 🟡 → build |
| GDPR export/delete cover everything; consent + encryption + no-PII-logs; `security-review` passes | ❌ → build |

---

## Verified-correct (do not re-flag)
- DB-layer cross-user isolation is correct: owner-scoped RLS (`USING` + `WITH CHECK`) on all 22 user tables; `programs` is the only public-read table; red-team cross-user read returned 0 rows.
- No secret in the deployed bundle (CI greps `dist`; only the public anon JWT present).
- Owner-Mode Claude bridge is hardened (loopback bind, server-side Origin allowlist, pinned tunnel, strips `ANTHROPIC_API_KEY`, build-excluded).
- Frontend storage layer already namespaces per user id and resets on auth change (`syncedStore.ts`, `userScope.ts`) — the isolation bug is closed in the client; the remaining issue is that personal data isn't *promoted* to its own Supabase tables (SEC-3), not that it leaks.
