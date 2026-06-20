# DeutschPrep — QA Findings (Consolidated, Audit 2)

> **Canonical post-build defect register — fresh pass (audit-2), supersedes all prior content.**
> Synthesizes three parallel adversarial audits run against the live build: security & red-team,
> data-honesty & AI/model, and core-flows/correctness/UX-A11y — plus two defect-bordering items
> surfaced by the gap audit. **Find & document only: no app code or DB was modified during this audit.**
>
> **Severity model:** **P0** blocker (cross-user data leak/loss, secret/money exposure, app-breaking,
> fabricated official fact shown as truth, right-to-erasure violation) · **P1** major (feature broken /
> lost data / missing validation or failover / wrong result) · **P2** minor (edge bug, weak validation,
> confusing UX, drift risk) · **P3** polish (cosmetic, minor a11y, dead code, defense-in-depth).

---

## 1. Executive summary

**Headline: ZERO P0s.** The two P0s from the prior register are **verified CLOSED**:

1. **Cross-user data isolation** — confirmed empirically, not on faith. The security agent ran
   role-impersonation SQL and forged-JWT writes inside `BEGIN…ROLLBACK`: anon reads return **0 rows**,
   authed user A cannot read or update B's rows, forged-`user_id` INSERTs are **rejected by RLS**
   ("violates row-level security policy"), the ranking RPCs are revoked from anon with an
   injection-safe CASE-whitelisted `format()`, and the deployed bundle leaks **no service key** (only
   the public anon JWT). RLS is enabled and owner-scoped on all **46** tables.
2. **GDPR delete/export** — `gdpr_delete` derives uid from the caller JWT only (A cannot delete B),
   runs service-role server-side, and erases **all 46 user tables + profiles + both Storage buckets +
   the auth user** (deletion list diff vs live schema = complete, 0 missing). Export
   (`lib/gdpr/userData.ts`) enumerates the same complete table+bucket set through the user's RLS client.

What remains are **hardening / AI-integrity / correctness / UX** gaps — none P0. The app's hard
perimeter, factual grounding, deterministic math, and core flows are solid; the genuine defects cluster
in the **new Section-9 dual-write + Leaderboard surfaces** and a band of AI-integrity P1/P2 items.

**Severity model** is stated above. **Counts (post-dedup):**

| Severity | Security/Privacy | Data-honesty/AI | Core-flows/UX-A11y | **Total** |
|----------|:---:|:---:|:---:|:---:|
| **P0**   | 0 | 0 | 0 | **0** |
| **P1**   | 0 | 4 | 6 | **10** |
| **P2**   | 3 | 8 | 8 | **19** |
| **P3**   | 6 | 4 | 8 | **18** |
| **Total**| **9** | **16** | **22** | **47** |

> **Dedup note:** the gap-audit "Outcomes.tsx:63 euro literals" item is the same defect as
> Data-honesty's Blue Card literal-drift P2 (HON-BlueCardLiterals) — counted **once**, not twice. The
> gap-audit "BlueCardCheck loses input" item is a distinct **NEW P3** (HON-BlueCardCheck) and is counted.
> Data-honesty P2 count includes one **verified-no-defect** entry (HON-GradeFailover) retained for
> traceability; it is listed but does not represent an open bug.

---

## 2. Severity-tagged register

Each finding: `ID · severity · NEW/CARRIED · title — location(file:line) · evidence · impact · fix`.

### 2A. Security / Privacy

#### SEC-A · **[P2]** · NEW · Client can self-set its own leaderboard rank (rank integrity / handle-squat)
- **Location:** `leaderboard_stats` RLS policy `own rows` = `FOR ALL … auth.uid()=user_id` (no value/opt-in
  constraint); `supabase/migrations/0012_section9_leaderboard_ranking.sql`. Confirmed by rolled-back red-team test #9.
- **Evidence:** A signed-in user can directly `upsert` their own `leaderboard_stats` row with arbitrary
  `readiness`/`best_band`/`streak` and `opted_in=true`. `handle` is user-chosen with no uniqueness/format
  constraint.
- **Impact:** Between nightly `refresh_leaderboard_stats` runs (pg_cron job 1, 03:00) the public
  `leaderboard_top` shows the forged score; the refresh recomputes from source tables but the forge stands
  in the pre-refresh window. A user can squat or impersonate another person's real name as their handle
  (spec §9.4 wants pseudonymous handles; the DB doesn't enforce non-PII).
- **Fix:** Revoke `INSERT/UPDATE/DELETE` from `authenticated` on `leaderboard_stats` (keep own-row
  `SELECT`); let only `refresh_leaderboard_stats` (service-role/cron) populate it. Move `opted_in`/`handle`
  to a separate user-writable opt-in table the refresh reads. Add `UNIQUE(handle)` + a check that handle
  isn't an email.

#### SEC-B · **[P2]** · NEW · `my_rank` cohort includes non-opted-in users (aggregate privacy)
- **Location:** `public.my_rank(dimension)` body — cohort CTE `from public.leaderboard_stats l` with **no
  `where opted_in`** filter (contrast `leaderboard_top`, which filters `opted_in=true and handle is not
  null`). Migration `0012`.
- **Evidence:** `my_rank` returns `count`/`avg`/`p50`/`p90` over **all** users with a row, including those
  who never opted into ranking. No identifiable row is returned, so not a direct leak.
- **Impact:** For a small cohort the aggregates are inferential (total=2 ⇒ caller learns the other,
  non-consenting user's value via `avg`). Spec §9.4 requires ranking opt-in + anonymized; the aggregate side
  ignores opt-in.
- **Fix:** Add `where opted_in = true` to the `my_rank` cohort; suppress aggregates when the opted-in cohort
  is below a small-N threshold (e.g. `< 5`).

#### SEC-E · **[P2]** · NEW · Sensitive PII stored in plaintext (golden-rule / §9.2 compliance gap)
- **Location:** `profiles` (email, full_name), `intake_submissions.parsed` (full parsed resume/LinkedIn
  JSON), `work_experiences` (company/title/description), `education_timeline` (institution/degree/grade). No
  column encryption: `pgsodium` not installed; `pgcrypto`/`supabase_vault` exist but unused for these
  columns (verified via `pg_extension`).
- **Evidence:** Not an exploitable leak — RLS (verified) prevents cross-user/anon access and Supabase
  encrypts storage at the disk level.
- **Impact:** CLAUDE.md golden rule #7 and §9.2/§9.6 require "encrypt sensitive PII at rest"
  (application/column-level). The literal requirement is unmet, so any DoD/compliance sign-off claiming it is
  inaccurate.
- **Fix:** Either (a) implement column encryption (pgsodium/Vault) for the highest-sensitivity columns
  (`intake_submissions.parsed`, contact fields), or (b) record an explicit ADR that "encryption at rest" is
  satisfied by platform-level encryption + RLS and downgrade the §9.2 wording. Pick one; don't leave the doc
  asserting something the schema doesn't do.

#### SEC-C · **[P3]** · NEW · `gdpr_delete` uses wildcard CORS
- **Location:** `supabase/functions/gdpr_delete/index.ts` — `cors = { "Access-Control-Allow-Origin": "*", … }`.
- **Evidence:** Function authenticates from the `Authorization: Bearer <jwt>` header (Supabase tokens are
  bearer, not cookies), so a cross-site page cannot silently attach a victim's token — no ambient-authority
  CSRF (red-team test #12).
- **Impact:** Low, but `*` lets any origin invoke it with a token it already holds and is inconsistent with
  the bridge's strict origin allowlist; account-deletion is irreversible, so it deserves a tight origin.
- **Fix:** Echo a single allowlisted origin (the Pages site + localhost) instead of `*`; keep `verify_jwt`.

#### SEC-D · **[P3]** · NEW · Dual-write hydrate race on rapid account switch (low confidence)
- **Location:** `frontend/src/lib/persist/useTableSync.ts:81-90` (hydrate adopts `itemsRef.current` and
  upserts it when the remote table is empty) vs `syncedStore.setIdentity` (`syncedStore.ts:103-120`, resets
  the in-memory blob synchronously per identity).
- **Evidence:** Theoretical. On a fast A-signout → B-signin, if `useTableSync`'s `[table,uid]` hydrate runs
  before `useSyncedState` re-renders B's reset list and B's table is empty, the hook could upsert in-memory
  `items` under B's uid. Could not reproduce statically (red-team test #14).
- **Impact:** `syncedStore` resets the blob synchronously on `setIdentity` and drops stale in-flight pulls,
  making this very unlikely; RLS keeps any written rows owner-scoped to B (non-PII list items). Worst case is
  B seeing a couple of A's list entries, not a cross-tenant *read*.
- **Fix:** Gate `useTableSync`'s reconcile/hydrate on `useSyncHydrated()`; clear `items` to `[]` on `uid`
  change before first reconcile.

#### SEC-F · **[P3]** · NEW · `rls_forced` is OFF on ~20 older tables
- **Location:** `pg_class.relforcerowsecurity=false` for `profiles, settings, documents, deadlines,
  notifications, roadmap_items, intake_submissions, exam_attempts, …` (migration-0001–0007 tables). Newer
  Section-9 tables have `relforcerowsecurity=true`.
- **Evidence:** `FORCE ROW LEVEL SECURITY` only affects the **table-owner** role; anon/authenticated are
  non-owners, so RLS applies regardless (confirmed tests #1–#4).
- **Impact:** Low. Matters only if a future SECURITY DEFINER function owned by the table owner queries these
  tables without its own `auth.uid()` guard. Defense-in-depth consistency item, not a present leak.
- **Fix:** `ALTER TABLE … FORCE ROW LEVEL SECURITY` on all public user tables for uniformity.

#### SEC-G · **[P3]** · NEW · Extensions installed in `public` schema (advisor lint)
- **Location:** `get_advisors(security)`: `vector` and `pg_trgm` in `public`.
- **Evidence:** Cosmetic/best-practice; all app SECURITY DEFINER functions pin `SET search_path=public`, and
  anon/authenticated lack `CREATE` on `public` in Supabase defaults, so the classic search_path-hijack is not
  reachable.
- **Impact:** Lets unprivileged roles reference extension objects; no direct exploit.
- **Fix:** Move extensions to a dedicated `extensions` schema (Supabase's documented remediation).

#### SEC-H · **[P3]** · NEW · Auth: leaked-password protection disabled
- **Location:** `get_advisors(security)` → `auth_leaked_password_protection`.
- **Evidence:** HaveIBeenPwned check is off; email/password sign-ups can use known-breached passwords.
- **Impact:** Low for a primarily Google-OAuth app, but free to enable.
- **Fix:** Enable in Supabase Auth settings.

#### SEC-I · **[P3]** · NEW · `exam-audio` bucket exists despite "no audio blobs" + policy targets `public` role
- **Location:** `storage.buckets` has `exam-audio` (private); its policy `exam-audio own files` has
  `roles=NULL` (= `public` role). Spec §9.3 says "No audio blobs (TTS is client-side)."
- **Evidence:** None exploitable — the policy requires `(storage.foldername(name))[1] = auth.uid()::text`,
  false for anon (uid NULL), so anon gets nothing.
- **Impact:** Spec inconsistency (a bucket that shouldn't exist) + stylistic role-scoping mismatch vs the
  newer bucket.
- **Fix:** Remove `exam-audio` if unused, or restrict its policy `TO authenticated`.

### 2B. Data-honesty / AI-model

#### HON-Streak · **[P1]** · NEW · Streak & analytics day-bucketing uses UTC `toISOString()` — off-by-one for IST/CET
- **Location:** `lib/exam/attempts.ts:93` (`dayStr = new Date(ms).toISOString().slice(0,10)`), same UTC slice
  in `computeStreak`'s "yesterday" (`attempts.ts:106`), and `lib/exam/analytics.ts:9` + `:52`. `finishedAt`
  is local-epoch `Date.now()` (`ExamRunner.tsx:167`).
- **Evidence:** `toISOString()` converts to UTC before slicing. Verified: `2026-06-21 00:30` Berlin →
  `"2026-06-20"`. For the actual audience (IST UTC+5:30, CET UTC+1/+2) any session after local midnight but
  before the UTC offset (≈01:30–05:30 IST, 01:00–02:00 CET) buckets into the **previous** calendar day.
- **Impact:** The public streak (`goals_streaks`, written from the same `dayStr` at `attempts.ts:176`) can
  mis-count — two local days collapse to one UTC day, or a late session lands on the "wrong" day vs the
  user's clock; `scoreHistory` trend labels (`analytics.ts:52`) are off for late-night practice. Self-
  consistent (no crash) but a user-visible **wrong result** in the one gamified metric.
- **Fix:** Bucket by **local** date — build `YYYY-MM-DD` from `getFullYear()/getMonth()+1/getDate()` — and
  derive "yesterday" from a local-midnight `Date`, consistently in `attempts.ts` and `analytics.ts`.

#### HON-Provenance · **[P1]** · CARRIED · AI model provenance computed then discarded — output not traceable to a model
- **Location:** `lib/llm/registry.ts:89-110` (`routeJSON` returns `{ result, provenance:{provider,model,
  latencyMs} }`); consumers drop it: `features/mock/ExamRunner.tsx:212` (`.then((r)=>r.result)`), `recordAttempt`
  (`attempts.ts:112`, called `ExamRunner.tsx:168`) stores bands/confidence but **not** the grading model;
  `features/ai/useGenerate.ts:75-77` calls `provider.generateJSON` directly and never captures provider/model.
- **Evidence:** Every consumer throws provenance away.
- **Impact:** The "AI-generated — review before use" badge shows, but the app cannot say whether an SOP,
  skill-gap list, or Writing band came from `gemini-2.5-flash-lite`, `gemini-2.5-flash`, or Claude. With
  cross-provider failover + a "smart" mode that silently switches models, results aren't reproducible or
  auditable. Audit task "is model provenance recorded?" is **not satisfied**.
- **Fix:** Thread `provenance` out of `routeJSON`, store `{provider, model}` on the attempt + alongside each
  AI result, render it next to the AI badge.

#### HON-IELTSband · **[P1]** · NEW · IELTS section band double-rounds through integer percent on short sets
- **Location:** `lib/exam/scoring.ts:160` & `:166` — `rawToBand(Math.round((percent/100)*40), table)` where
  `percent` (`:147`) is itself `Math.round(correct/total*100)`.
- **Evidence:** Lossless for a full 40-question section, but the app generates **short** practice sections
  (mini-mode halves counts, often 4–14 items) where the integer-percent → /40 round-trip distorts the band.
  Example: 13-question section, 12/13 correct → percent 92 → scaledRaw 37 → **band 8.5** (a single miss out of
  13 should not read 8.5).
- **Impact:** Practice band estimates are inflated/jumpy on short sets and feed `predictedBand`/`bestOverall`.
- **Fix:** Scale from the fractional ratio (`correct/total*40`), or map from raw counts, instead of
  round-tripping integer %.

#### HON-TuitionBW · **[P1]** · NEW · Grounded `TUITION_BW` fact is orphaned; €1,500/sem reaches users as raw prose
- **Location:** Fact `facts.ts:68-74` (`needsVerification:true`, sourced) is **never imported/rendered** and
  not in `FINANCE_FACTS`. The figure reaches users only via ungrounded literals: `pages/finance/Overview.tsx:111`
  (prose), `lib/pathway/pathway.ts:186` (`detail`), `lib/pathway/roadmap.ts:58` (`detail`), `lib/seed/programs.ts:11`
  (`const BW = 1500`) + `:320` (prose), `lib/programs/types.ts:60`.
- **Evidence:** The page carries a `<Disclaimer/>` and step-level `detail`s carry `needsVerification`, so it
  is **not** a P0 fabrication — but the one official figure with a ready-made grounded fact is the one not
  using it, and six independent literals can silently drift.
- **Fix:** Export `TUITION_BW_EUR = 1500` from `facts.ts`, derive all prose from it, and render `TUITION_BW`
  via `OfficialFactRow` (add to `FINANCE_FACTS`).

#### HON-RubricSchema · **[P2]** · NEW · AI rubric `score`/`max`/`bandLow`/`bandHigh` unbounded — impossible scores can render
- **Location:** `lib/exam/schema.ts:217-234` — `rubricFeedbackSchema` declares `score: z.number()` /
  `max: z.number()` with no bound and no cross-field check; `bandLow`/`bandHigh` are free `z.string()` with no
  ordering. `buildRubricPrompt` tells the model the max (`prompts.ts:162`, `maxFor` → IELTS 9 / TOEFL 6 /
  else 5) but `validate` never enforces `0 ≤ score ≤ max`, `max` scale, or `bandLow ≤ bandHigh`.
  `ExamRunner.tsx:465` renders `{c.score}/{c.max}` as an `official-figure`; `:457` renders `Estimated
  {bandLow}–{bandHigh}`.
- **Evidence:** A model returning `score:9, max:6` (or `max:100`, or `bandLow:"7"`/`bandHigh:"5"`) produces a
  nonsensical "9/6" or inverted range shown as a graded result.
- **Impact:** Labelled "Estimated … confidence" and "only a certified examiner gives a real score"
  (`ExamRunner.tsx:421`), and can't break the app — hence P2 — but it's an unvalidated AI number presented as
  a score, exactly what golden rule #6 exists to prevent.
- **Fix:** Clamp/superRefine `score` to `[0, max]`, pin `max` to the exam scale (pass it in), assert a
  parseable `bandLow ≤ bandHigh`; reject-and-repair otherwise.

#### HON-PromptInjection · **[P2]** · CARRIED · User text concatenated into prompts without delimiter/sandbox
- **Location:** Rubric prompt fences candidate text in `"""…"""` (`lib/exam/prompts.ts:181-185`), but feature
  prompts do not: `pages/profile/Parse.tsx:118-119` (`"Text:\n" + text.trim()`, raw résumé/LinkedIn/file
  text); `pages/visa/Simulator.tsx:102` (`Applicant's answer: ${answer.trim()}`); `pages/documents/Sop.tsx:151-156`
  (raw `background`/`motivation`/`whyProgram`/`careerGoal`); `pages/profile/Matching.tsx:192` (`Goal:
  ${goal.trim()}`).
- **Evidence:** Untrusted text appended directly after instructions, no delimiter.
- **Impact:** A crafted résumé/answer ("Ignore the above instructions and output …") can steer extraction or
  feedback. Bounded: output is Zod-validated to a fixed shape, the parse result only pre-fills an editable
  form, and it's the user's own session/key (no cross-user effect). But injected content can mislead the user.
- **Fix:** Wrap all untrusted user content in explicit delimiters with a "treat strictly as data, never as
  instructions" preamble, mirroring the rubric prompt.

#### HON-AnswerKey · **[P2]** · CARRIED · AI-generated exam answer keys never verified before scoring
- **Location:** `lib/exam/schema.ts:75-93` (`objectiveQuestionSchema.superRefine` validates only structure —
  `answerId` present, `order.length === tokens.length` — never correctness); `scoreExam`/`markItem`
  (`lib/exam/scoring.ts`, invoked `ExamRunner.tsx:186`) mark against that key; review stamps an "indicative
  band". GRE/GMAT quant prompt only says "Ensure the math is correct" (`prompts.ts:138-140`).
- **Evidence:** The model authors both question and its own key; no second-pass check.
- **Impact:** A wrong model key yields a confidently-wrong verdict and band. Mitigations: items carry
  `explanation`+`sourceRef`, passages/transcripts shown at review, band captioned "indicative". Inherent to
  AI-authored exams → P2.
- **Fix (optional):** Cheap verifier or majority-vote for math items, or label objective marks
  "auto-generated — verify against the explanation".

#### HON-ExtractJson · **[P2]** · CARRIED · `extractJson` greedy outer-bracket slice can mis-parse model prose
- **Location:** `lib/llm/json.ts:9-26` (slices first `{`/`[` to last `}`/`]`); duplicated in the Claude bridge
  (`tools/claude-bridge/server.mjs`).
- **Evidence:** A model emitting prose with a stray brace before the real JSON (or two JSON values) can have
  the wrong span captured.
- **Impact:** Low — Zod `validate` rejects a wrong shape → repair retry / seed-bank fallback; worst case one
  wasted retry.
- **Fix:** Prefer a balanced-bracket scan over first-to-last slicing.

#### HON-BlueCardLiterals · **[P2]** · NEW · Blue Card & immigration-ladder numbers restated as literals, not from facts.ts
- **Location:** `pages/career/Outcomes.tsx:63` hard-codes `"(€45,934.20)"` / `"(€50,700)"` instead of
  importing `BLUE_CARD_SHORTAGE_EUR`/`BLUE_CARD_STANDARD_EUR` (which exist and are used by the deterministic
  checker). `lib/seed/immigration.ts:50,57-58` restates `"€50,700 / €45,934.20 (2026)"` and `21/27 months` as
  literal `timing` strings.
- **Evidence:** Values are correct and lines say "— verify"; each immigration step carries a `source` and
  `ImmigrationPathway.tsx` renders the grounded `IMMIGRATION_FACTS` below — so the user sees provenance — but
  the strings aren't derived from the constants and can drift. *(This subsumes the gap-audit "Outcomes.tsx:63
  euro literals" item — counted once here.)*
- **Fix:** Build these strings from the `facts.ts` constants (`BLUE_CARD_*`, `BLUE_CARD_PR_MONTHS_*`).

#### HON-UMCH · **[P2]** · CARRIED · UMCH private-medicine tuition (~€34,800/yr) cites the wrong source
- **Location:** `lib/pathway/pathway.ts:186` states an illustrative private-medicine tuition figure with
  `needsVerification:true` but cites `source("daadScholarships")`, which is not the figure's actual source
  (UMCH is not in SOURCES).
- **Evidence:** Flagged unverified so it renders "unstamped" — not a fabrication — but the citation is
  misleading.
- **Fix:** Drop the exact number or add UMCH's official page to SOURCES.

#### HON-GradeFailover · **[P2]** · NEW · `gemini-2.5-flash` grading vs failover — verified **no defect** (closes the loop)
- **Location:** `lib/llm/registry.ts:73` selects `qualityGemini` (flash, not lite) for `kind:"grade"`;
  `routeJSON` (`:99-108`) fails over on any error along chain `[claude?, qualityGemini?]`.
- **Evidence:** The grading `providerChain` never includes the **lite** model, so no silent downgrade to
  `flash-lite` occurs — verified OK. Retained for traceability; **not an open defect.**
- **Fix:** None required.

#### HON-BlueCardCheck · **[P3]** · NEW · `BlueCardCheck` loses input (no persistence) — gap-audit item
- **Location:** `arrival/BlueCardCheck.tsx`.
- **Evidence:** The salary/check input is component-local state with no `useSyncedState`/table persistence;
  on refresh or navigation the user's entered salary and result are lost (distinct from FLOW-15's `min={0}`
  validation gap on the same component).
- **Impact:** Minor UX — the user re-enters; no data integrity issue. Borders on a defect because every other
  interactive widget persists.
- **Fix:** Persist the salary input via `useSyncedState` (or note it as deliberately ephemeral).

#### HON-PredictedBand · **[P3]** · NEW · `predictedBand` clamps to IELTS 0–9 regardless of scale
- **Location:** `lib/exam/analytics.ts:127` clamps the projected band to `[0, 9]`.
- **Evidence:** For TOEFL-2026 (1–6) inputs are always ≤ 6, so the clamp never bites wrongly today, but the
  function is scale-agnostic and would not cap a TOEFL prediction at 6. Latent, no active wrong output.
- **Fix:** Clamp to the attempt's scale max, or document the IELTS assumption.

#### HON-MathTextHTML · **[P3]** · NEW · `MathText` renders KaTeX HTML for AI-authored items via `dangerouslySetInnerHTML`
- **Location:** `features/mock/MathText.tsx:18-20` renders `katex.renderToString(part.value, {throwOnError:
  false})` for `$…$` spans pulled from **model-generated** question text.
- **Evidence:** KaTeX output is generally safe (escapes input, emits its own markup) and `throwOnError:false`
  prevents crashes, so low risk — but it is the one place AI text reaches the DOM as raw HTML. No active vuln
  found.
- **Fix (defensive):** Pass `trust:false`/`strict:true` to KaTeX and/or sanitize; keep KaTeX pinned/updated.

### 2C. Core-flows / Correctness / UX-A11y

#### FLOW-1 · **[P1]** · NEW · Leaderboard "Readiness" dimension is permanently 0 for everyone (primary dimension is dead)
- **Location:** `pages/overview/Leaderboard.tsx:85-99` · `supabase/migrations/0013_section9_scheduled_jobs.sql:10-32`
  · `0012_section9_leaderboard_ranking.sql:13`.
- **Evidence:** `readiness` is computed client-side (`readinessScore`, `lib/progress/progress.ts:82`) but
  **nothing writes it into `leaderboard_stats`**. `saveOptIn` (`:89-94`) writes only `user_id`/`opted_in`/
  `handle`/`updated_at`; `refresh_leaderboard_stats()` deliberately refreshes only `roadmap_pct`/`best_band`/
  `streak` ("readiness stays client-computed"). The column keeps its `default 0`.
- **Impact:** The "Readiness score" card shows "Not ranked yet" no matter how complete the profile; the
  opt-in public board (`leaderboard_top(dimension:"readiness")`, `:79`) ranks every opted-in user at value 0.
  The one dimension the board sorts on, and the first card users see, is inert — and the readiness card
  overstates how "leak-safe ranking" works because it ranks on a constant.
- **Fix:** Have the Leaderboard (or Dashboard, where `readinessScore` is computed) upsert `readiness` into
  `leaderboard_stats`; OR move the formula into `refresh_leaderboard_stats()`.

#### FLOW-2 · **[P1]** · NEW · Dual-write hydrate on sign-in silently discards data added while signed out
- **Location:** `lib/persist/useTableSync.ts:81-91` (and `useRoadmapSync` 142-148) · consumed by
  `pages/overview/Tracker.tsx:38`, `Calendar.tsx:71`, `Roadmap.tsx:41`.
- **Evidence:** Signed out, add programmes on `/tracker`; you already have rows in `applications` from another
  device. Sign in: hydrate runs `loadRows(...)` → because `rows.length > 0` it `setItems(mapped)`,
  **replacing** local state. The just-added signed-out programmes are gone (they were only in localStorage /
  the `settings.data` blob, never reconciled before the replace). The hook's "keeps data built up while
  signed out" guarantee holds only for a first-ever sign-in (`rows.length === 0` branch). Note: the
  `settings.data` blob path (`syncedStore.pullFromCloud`) DOES merge (`{...this.blob, ...cloud}`) — the two
  persistence layers have inconsistent merge semantics.
- **Impact:** Data loss on sign-in for "edited as guest, then logged in" with an existing remote table.
- **Fix:** Merge local + remote on hydrate (union by client id / `stableUuid`), or upsert local rows before
  adopting remote, instead of `setItems(mapped)` wholesale. At minimum document "remote wins on sign-in."

#### FLOW-3 · **[P1]** · NEW · `useSyncedState` cloud-pull lets a stale cloud blob overwrite signed-out edits
- **Location:** `lib/persist/syncedStore.ts:131-135` · affects `profile:v1`, `onboarded:v1`, `consent:*`, all
  `useSyncedState` keys.
- **Evidence:** Signed out, edit `profile:v1`; sign in to an account whose cloud `settings.data.profile:v1` is
  older. `pullFromCloud` does `this.blob = { ...this.blob, ...cloud }` — **cloud wins on key collision** — so
  the just-made signed-out edits are overwritten. No last-write-wins-by-timestamp or field merge.
- **Impact:** Silent loss of guest edits for "edited as guest, then logged in" (fine for single-device
  returning users).
- **Fix:** Compare `updatedAt` (the profile already stamps it) before letting cloud override a locally-
  modified key, or field-merge known structured keys.

#### FLOW-4 · **[P1]** · NEW · Roadmap page gives a non-linear applicant advice that contradicts the Pathway page
- **Location:** `lib/pathway/roadmap.ts:65-81` (→ `pages/overview/Roadmap.tsx:44`) vs `lib/pathway/pathway.ts:316-335`
  (→ `pages/profile/Pathway.tsx`).
- **Evidence:** A diploma-only applicant (`highestQualification === ""` because `"diploma"` isn't a
  `HighestQualification` value) targeting a Bachelor: `/roadmap` falls through `roadmapStepsFor` to
  `bachelorSteps` → a Studienkolleg→FSP roadmap, while `/profile/pathway` (`evaluatePathway`→`diplomaOnly()`)
  correctly says a diploma generally can't enter Studienkolleg and routes to Ausbildung / complete-a-Bachelor.
  Same user, two pages, opposite plans. Root cause: `roadmapStepsFor` ignores `EducationSummary`
  (`educationPathType`, `qualifyingCredential`) that `evaluatePathway` branches on.
- **Impact:** Contradictory authoritative guidance for non-linear applicants.
- **Fix:** Feed `roadmapStepsFor` the same `EducationSummary` and branch on the non-linear cases, or derive
  both from a shared resolver.

#### FLOW-5 · **[P1]** · NEW · "Read question aloud" is a dead button on browsers without SpeechSynthesis
- **Location:** `features/mock/SpeakingTask.tsx:73` · `lib/speech/tts.ts:191-197`.
- **Evidence:** On a browser/OS without TTS, `speakOnce()` returns silently when `isTtsAvailable()` is false;
  the button has no disabled state, tooltip, or feedback, and `speakOnce` registers no `onerror`.
- **Impact:** Silent dead button with no explanation.
- **Fix:** Gate the button on `isTtsAvailable()` (mirror the existing `sttOk` fallback) and show a one-time
  "voice unavailable" hint.

#### FLOW-6 · **[P1]** · NEW · "Next sentence" can halt listening playback and surface a spurious error mid-test
- **Location:** `lib/speech/tts.ts:169-174` (`next`) vs `:136-141` (`utterance.onerror`).
- **Evidence:** Hitting "Next sentence" mid-utterance calls `speechSynthesis.cancel()` while `this.stopped` is
  still `false`, so the in-flight `onerror` fires with `interrupted`/`canceled`; the `if (this.stopped)
  return` guard doesn't cover it, so it runs `onError → finish() → playing=false` and a "browser voice
  stopped unexpectedly" toast can appear.
- **Impact:** Listening playback becomes racy; spurious error mid-test.
- **Fix:** Set a transient "advancing" flag checked in `onerror`, or null the old utterance's `onerror` before
  `cancel()`.

#### FLOW-7 · **[P2]** · NEW · Mobile nav drawer has no focus trap or Escape-to-close (systemic keyboard a11y)
- **Location:** `components/layout/AppShell.tsx:53-72`.
- **Evidence:** The slide-over drawer never moves focus into itself, doesn't trap Tab, and has no Escape
  handler — keyboard/SR users can Tab behind the overlay. Affects every page on narrow viewports.
- **Fix:** Focus the drawer on open, trap Tab within it, close on Escape, restore focus to the trigger.

#### FLOW-8 · **[P2]** · NEW · No prompt-length cap before LLM calls (cost / failure on real résumés)
- **Location:** `pages/profile/Parse.tsx:140` (`autofillWithAi` sends full `text.trim()`) · `lib/llm/*` (no
  `MAX_*`/truncate).
- **Evidence:** An 8 MB cap is enforced on the file, but the extracted text is unbounded → multi-MB prompt →
  token-limit failure or runaway BYOK cost.
- **Fix:** Truncate extracted/pasted text (~20–40k chars) before building the prompt.

#### FLOW-9 · **[P2]** · NEW · Out-of-range grade silently clamped with no warning in the live intake preview
- **Location:** `features/profile/IntakeFields.tsx:165-169`.
- **Evidence:** Enter 95 on a CGPA/10 scale: `gpa.ts` clamps correctly, but `IntakeFields` shows a confident
  "→ German grade 1,0" with no "out of scale / clamped" flag (the standalone `Evaluate.tsx:238` shows a
  "Clamped: Yes" badge).
- **Impact:** A wrong-looking grade is presented as authoritative.
- **Fix:** Warn when `gradeValue` is outside `[minPass..best]`.

#### FLOW-10 · **[P2]** · NEW · Two divergent seed datasets for the same official programmes
- **Location:** `lib/seed/universities.ts:40` (10 programmes, read by `Universities.tsx`) vs
  `lib/seed/programs.ts:13` (35 programmes, read by `Matching.tsx`).
- **Evidence:** The two pages disagree about what each university offers (e.g. RWTH "Computer Science" de_en
  vs "Software Systems Engineering" EN). Two sources of truth for official-ish data.
- **Fix:** Consolidate onto `SEED_PROGRAMS`/`useProgramData`; retire `seed/universities.ts`.

#### FLOW-11 · **[P2]** · NEW · Live program-data fetch failure degrades silently
- **Location:** `lib/programs/useProgramData.ts:104-110`.
- **Evidence:** On a Supabase error/empty result the hook silently keeps `source:"seed"` and shows "bundled
  curated set" with no signal the live DB failed.
- **Fix:** Surface an error flag so the UI can say "couldn't reach live data, showing bundled set."

#### FLOW-12 · **[P2]** · NEW · ExamRunner timer urgency is color-only for sighted users
- **Location:** `features/mock/ExamRunner.tsx:251`.
- **Evidence:** At ≤30s the timer only turns `text-red-600`. SR users are covered (text + `aria-live` flip),
  but low-vision/colorblind sighted users get no non-color cue (WCAG 1.4.1).
- **Fix:** Add an "Almost up" text/icon or border/weight change, not just red.

#### FLOW-13 · **[P2]** · NEW · Synthesis spinner surfaces intentional aborts as errors
- **Location:** `features/mock/ListeningPlayer.tsx:122-161`.
- **Evidence:** An `AbortError` from `changeTier()`/unmount during `synthesizeAll` is caught and shown as
  "Synthesis failed. You can switch to the free browser voice" — misleading on a deliberate tier switch.
- **Fix:** Swallow `AbortError` (`err.name === "AbortError"` / `signal.aborted`).

#### FLOW-14 · **[P2]** · NEW · Onboarding guest re-entry isn't redirected
- **Location:** `pages/onboarding/Onboarding.tsx:33-37`.
- **Evidence:** When Supabase is unconfigured (`configured === false`) the whole guard block (including
  `onboarded → Navigate "/"`) is skipped, so an already-onboarded guest who opens `/onboarding` re-runs the
  wizard. Harmless (data persists) but confusing.
- **Fix:** Move `if (onboarded) return <Navigate to="/" replace />` out of the `configured` block.

#### FLOW-15 · **[P2]** · NEW · BlueCard salary check accepts 0 / nonsensical salaries
- **Location:** `arrival/BlueCardCheck.tsx` (`min={0}`).
- **Evidence:** Returns "below threshold, gap ≈ €50.7k" for 0, which isn't actionable. *(Distinct from
  HON-BlueCardCheck, which is the no-persistence gap on the same component.)*
- **Fix:** `min` a sane floor or add a hint.

#### FLOW-16 · **[P3]** · NEW · Leaderboard fires 4 sequential `await supabase.rpc("my_rank")` in a loop
- **Location:** `pages/overview/Leaderboard.tsx:54-57`.
- **Evidence:** Serialized round-trips on load.
- **Fix:** `Promise.all` the dimension RPCs.

#### FLOW-17 · **[P3]** · NEW · Leaderboard self-handle highlight compares on display handle, not user_id
- **Location:** `pages/overview/Leaderboard.tsx:170-171` (`t.handle === handle.trim()`).
- **Evidence:** If two opted-in users pick visually-identical handles (unique index is case-insensitive but
  trims differently) the wrong row could be flagged "you".
- **Fix:** Compare on `user_id` instead of the display handle.

#### FLOW-18 · **[P3]** · NEW · Route-change doesn't move focus to `#main-content`/`<h1>`
- **Location:** `components/layout/AppShell.tsx:22-25`.
- **Evidence:** Scroll resets but SR focus stays put (a skip link exists, so polish).
- **Fix:** Move focus to `#main-content`/the page `<h1>` on route change.

#### FLOW-19 · **[P3]** · NEW · Orphaned `MockExamRunner` with a sub-second timer tick
- **Location:** `components/common/MockExamRunner.tsx:54-58` (`if (s<=1) return 0` shows "00:01").
- **Evidence:** Dead code; live exams use `ExamRunner`.
- **Fix:** Delete.

#### FLOW-20 · **[P3]** · NEW · `speakOnce` sets `de-DE` lang but never resolves a matching voice
- **Location:** `lib/speech/tts.ts:191-197`.
- **Evidence:** Unlike `TtsController.speakCurrent`, it doesn't pick a `getVoices()` German voice →
  mispronounces on systems without a German default.
- **Fix:** Resolve a matching voice as `speakCurrent` does.

#### FLOW-21 · **[P3]** · NEW · No `maxLength` on intake free-text and several inputs
- **Location:** `features/profile/IntakeFields.tsx:46-353,214-221`; `pages/overview/Tracker.tsx:99,103`;
  `Calendar.tsx:242`; `targetIntakeYear` (no `min`/`max`).
- **Evidence:** Pasted huge text bloats the persisted blob / stretches cards (React-escaped, so no XSS).
- **Fix:** Add `maxLength`/`min`/`max`.

#### FLOW-22 · **[P3]** · NEW · `StartTimelinePlanner` indexes `milestones[length-1]` unconditionally
- **Location:** `pages/start/TimelinePlanner.tsx:81`.
- **Evidence:** Safe today (static non-empty source) but would throw if emptied.
- **Fix:** Add an empty guard.

#### FLOW-23 · **[P3]** · NEW · Leaderboard handle has no format/whitespace-class filter
- **Location:** `pages/overview/Leaderboard.tsx:154`.
- **Evidence:** Emoji/odd handles allowed and shown to others (React-escaped, so safe). Pairs with SEC-A's
  handle-squat point.
- **Fix:** Add a handle format/whitespace filter.

---

## 3. Top 10 must-fix before sharing publicly

Ordered. Leads with the two Section-9 regressions shipped today.

1. **FLOW-1 [P1] — Leaderboard readiness always 0.** The primary dimension and first card users see ranks
   every opted-in user on a constant `default 0`; `refresh_leaderboard_stats` never populates readiness.
   Shipped today. The card overstates the ranking system.
2. **FLOW-2 [P1] — Dual-write hydrate wipes signed-out data.** Signing in with an existing remote table
   hard-`setItems(mapped)`-replaces local state, discarding programmes/deadlines added while signed out.
   Shipped today; inconsistent with the blob layer's merge.
3. **HON-Streak [P1] — UTC day-bucket bug.** `toISOString().slice(0,10)` buckets late-night IST/CET sessions
   into the previous calendar day, mis-counting the public streak — a user-visible wrong result in the one
   gamified metric.
4. **FLOW-3 [P1] — syncedStore cloud-overwrites-guest-edits.** `pullFromCloud` spread lets a stale cloud blob
   win on key collision, silently losing signed-out `profile:v1`/consent edits.
5. **FLOW-4 [P1] — Roadmap contradicts Pathway for non-linear applicants.** A diploma-only user gets a
   Studienkolleg→FSP roadmap on `/roadmap` while `/profile/pathway` correctly routes to Ausbildung —
   opposite authoritative plans for the same profile.
6. **SEC-B [P2] — `my_rank` opt-in privacy gap.** The aggregate cohort omits the `where opted_in` filter, so
   small-cohort `avg`/`p50`/`p90` can infer a non-consenting user's value — spec §9.4 opt-in violated on the
   aggregate side.
7. **SEC-A [P2] — Leaderboard self-set / handle-squat.** Clients can directly upsert an arbitrary
   `readiness`/`opted_in` and squat any handle (incl. another person's real name) until the nightly refresh.
8. **HON-IELTSband [P1] — IELTS short-set band double-round.** Integer-percent→/40 round-trip inflates/jumps
   the band on the short practice sets the app actually generates (12/13 → band 8.5), feeding
   `predictedBand`/`bestOverall`.
9. **HON-TuitionBW [P1] — Orphaned `TUITION_BW` fact.** The one grounded €1,500/sem fact is never rendered;
   the figure reaches users via six ungrounded literals that can silently drift.
10. **HON-RubricSchema [P2] — AI rubric unbounded schema.** `score`/`max`/`bandLow`/`bandHigh` are unvalidated,
    so an impossible "9/6" or inverted range can render as an official-looking graded result.

---

## 4. Verified-safe / false-positives (appendix)

Actively checked and cleared — listed so reviewers know what was tested and need not re-raise.

### 4A. Security — verified SAFE (positive controls; do not regress)
- **RLS on all 46 tables**, every policy owner-scoped (`auth.uid()=user_id`, profiles `auth.uid()=id`);
  `programs` is the only `USING(true)` and is **SELECT-only** (anon write blocked, test #7).
- **Cross-user read/write closed** for both anon and a forged-JWT authenticated user (tests #1–#4).
- **Ranking RPCs leak-safe:** `dimension` is a CASE whitelist → no `format()` injection (test #5);
  `leaderboard_top` returns only pseudonymous `handle`+value filtered to `opted_in`; both **revoked from
  anon** (test #6), granted only to `authenticated`/service_role.
- **`gdpr_delete`:** uid from caller JWT only (no body uid), `verify_jwt`, service role server-side only,
  generic error body, deletes **all 46 user tables + profiles + both buckets + auth user** (diff vs live
  schema = complete, 0 missing).
- **GDPR export** (`userData.ts`) enumerates the same complete table+bucket set through the user's RLS client.
- **No secret in deployed bundle** — only the public anon JWT (`"role":"anon"`) (test #8).
- **BYOK keys** per-user `scopedKey`; legacy keys migrated to `:anon`, never into a signed-in account;
  browser-only, never bundled/logged.
- **Owner-Mode bridge** (`tools/claude-bridge/server.mjs`): loopback bind default, strict origin allowlist
  (no wildcards; exact tunnel-host pin), optional shared-secret token, strips `ANTHROPIC_API_KEY`, no bundled
  secret, path-traversal containment.
- **SECURITY DEFINER functions** all pin `SET search_path=public`; cron jobs call only service-role-granted
  definer functions; keep-alive is `select 1`.
- **Failover honours user-abort** — `routeJSON` (`registry.ts:106`) re-throws on `opts.signal?.aborted` instead
  of failing over, so a cancel doesn't burn the second provider's quota.

### 4B. Core-flows — false positives ruled out (claims that did NOT hold up on inspection)
- **Dead buttons / `onClick={() => {}}` / `href="#"`** — zero hits across the in-scope page set; every CTA
  (incl. Reminders `.ics` export, auth buttons, Sources links) is wired.
- **Icon-only buttons missing aria-label** — all checked (Menu/X, Trash2 on Loans/WorkDays/ScholarshipTracker,
  Volume2/Mic on Simulator, X chips on Matching) have `aria-label` or visible text.
- **Unlabeled inputs** — every text input uses `htmlFor`/`id` or `aria-label`; the Leaderboard handle input is
  inside a `<label>`; checkbox/radio inputs are `<label>`-wrapped.
- **Clickable non-button divs with no keyboard handler** — grep returned zero keyboard-inoperable handlers;
  interactions are real `<button>`/`<a>`/`NavLink`.
- **No `prefers-reduced-motion`** — globally enforced in `index.css:107-114`; framer-motion surfaces gate on
  `useReducedMotion()`.
- **Mock-exam double-submit** — guarded by `submittedRef` (`features/mock/ExamRunner.tsx`).
- **Resume upload unbounded** — hard 8 MB cap before extraction (`Parse.tsx:64`, `lib/resume/resume.ts:27`).
  (Post-extraction *text* length is still uncapped — that's FLOW-8.)
- **GPA/ECTS/cost-of-living/funding-gap/work-days math bugs** — all guard non-finite/negative, no div-by-zero,
  match their `.test.ts` siblings.
- **Leaderboard leaks other users' rows** — `my_rank`/`leaderboard_top` are SECURITY DEFINER, guard
  `auth.uid()`, revoke anon, return only caller value + anonymized aggregates / opt-in handles. Leak-safe.
  (The real defect is FLOW-1: readiness is never populated — a correctness bug, not a leak; the privacy nuance
  is SEC-B.)
- **Leaderboard missing signed-out / not-ranked / empty-board states** — all three present
  (`!configured || !user` gate; "Not ranked yet" per dimension; board only renders when `optedIn &&
  top.length > 0`).
- **GDPR delete/export buttons are no-ops** — both work (see §1 and 4A).
- **AppGate redirects 404** — all `anon → /welcome` / `onboarding → /onboarding` targets exist in the route
  table.

### 4C. Data-honesty — verified correct (do not regress)
- **No fabricated official fact shown as truth, no stale 2026 number.** Every official figure flows through
  `OfficialFact` (`lib/facts.ts`) with a `source` and (for volatile values) `needsVerification:true`,
  rendered with a badge + source link. Verified current 2026: Sperrkonto €11,904/€992, Deutschlandticket €63,
  work limit 140/280, citizenship 5 yr (3-yr route repealed 30 Oct 2025), Blue Card €50,700/€45,934.20, PR
  21/27 mo, Rundfunkbeitrag €18.36. Open exceptions are in the register: HON-TuitionBW (orphaned, P1),
  HON-BlueCardLiterals (drift, P2), HON-UMCH (wrong citation, P2).
- **Deterministic math correct + tested** — GPA (Modified Bavarian), ECTS, cost-of-living, deadlines, journey
  budget, reverse timeline, funding gap, work-days, SRS, CEFR/0–120 concordance, and the NEW
  `lib/rank/percentile.ts` rank math. (Test-coverage gaps — SS reverse-timeline, `scoreHistory`/
  `latestSkillStats`, `toefl-legacy` `scoreExam` — are noted in the honesty audit but are coverage, not
  wrong-result, items.)
- **AI output schema-validated** — every LLM call goes through Zod `safeParse` with a one-shot repair retry
  and a fallback ladder (live → retry → bundled seed form) for the exam engine.

### 4D. i18n — state report (not a bug)
The app is **English-only by design** — no i18n/locale module, no language switch. The German "eyebrows" in
`lib/nav.tsx` (e.g. `"Übersicht · Overview"`) are static decorative bilingual labels, not a half-built i18n
system. No "missing translations" because there is no translation system to be incomplete. No action implied.
