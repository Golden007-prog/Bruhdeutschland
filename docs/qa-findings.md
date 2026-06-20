# DeutschPrep — QA Findings (Consolidated)

> Canonical post-build defect register. Synthesizes three parallel audits — security & red-team,
> data-honesty & AI/model, and core-flows/correctness/UX-A11y — plus one grounding defect surfaced by
> the gap audit. **Find & document only: no app code or DB was modified during this audit.**
>
> **Severity model:** **P0** blocker (data leak/loss, secret/money exposure, app-breaking, fabricated
> official fact shown as truth, right-to-erasure violation) · **P1** major (feature broken / lost data /
> missing validation or failover / wrong result) · **P2** minor (edge bug, weak validation, confusing UX) ·
> **P3** polish (cosmetic, minor a11y, dead code).

---

## 1. Executive summary

**Verdict:** the app's hard perimeter, factual grounding, deterministic math, and core user flows are
**solid**. The adversarial security pass found no cross-user data leak, no secret in the deployed bundle, a
hardened Owner-Mode bridge, and 22/22 public tables with owner-only RLS. Official figures consistently
carry provenance and `needsVerification`; GPA/ECTS/cost/deadline math is in tested TypeScript (191 tests
pass); the spine — signup → onboarding → dashboard → matching → mock test → finance → visa → roadmap — is
complete with no dead-ends, honest empty states, and per-user persistence that closes the known
data-isolation bug at the storage layer.

The material risks fall in three clusters. **(a) Two persistence/GDPR P0s:** "delete & sign out" erases
only `settings` + `profiles`, leaving exam history, answers, events, streaks, and `exam-audio` Storage
files permanently bound to the user; and **localStorage is the de-facto source of truth** for ~16 per-user
tables that the app never writes — which is the root cause of both the incomplete delete and the partial
export. **(b) Section-9 capabilities not yet built:** no edge functions (`gdpr_export`/`gdpr_delete`/
`compute_leaderboard`/etc.), no generated-document Storage, no cross-user ranking. **(c) A cluster of
AI-integrity + UX P1/P2 polish:** model provenance computed then discarded, unsandboxed user text in
prompts, unverified AI answer keys, empty-template SOP/CV filler, unlimited Listening replay, and exam
`timeLeft` autosave staleness. There is **no fabricated official fact shown as truth** anywhere in the app.

**Counts:** **36 findings — P0 = 2 · P1 = 9 · P2 = 15 · P3 = 10** (Security/Privacy 11 · Data-honesty/AI 8 ·
Core-flows/UX-A11y 17). Both P0s are scheduled into the Section-9 persistence build (see §5), not tracked
as a separate remediation workstream.

---

## 2. Severity-tagged register

Each finding: `ID · severity · title — location (file:line) · evidence/repro · impact · fix`.

### 2A. Security / Privacy

#### SEC-1 · **[P0]** · GDPR "delete" leaves most user data in Supabase (and all Storage files)
- **Location:** `frontend/src/features/settings/DataControls.tsx:42-59`.
- **Evidence:** `deleteData()` deletes only `settings` (`:51`) and `profiles` (`:55`), then signs out and
  calls `clearLocalPersonal()` (local only). It never touches `exam_attempts`, `answers`, `events`,
  `goals_streaks`, or the `exam-audio` Storage bucket — all of which the app DOES write
  (`lib/exam/attempts.ts:127,165,168,182`; `lib/speech/cache.ts:63`). Confirmed live: `exam_attempts`
  holds rows (`SELECT count(*) … = 1`).
- **Impact:** Right-to-erasure not honored. A "deleted" user leaves practice history, per-answer detail,
  an event trail, streaks, and audio blobs permanently bound to their `user_id`. Violates §9.6 "delete
  erases everything (incl. Storage)" and the CLAUDE.md GDPR golden rule.
- **Fix:** `gdpr_delete` Edge Function (service role) that deletes every per-user row across all tables +
  removes `exam-audio/<uid>/*`, then deletes the auth user; interim: client deletes from every written
  table + Storage prefix before sign-out.

#### SEC-3 · **[P0 per §9.6]** · localStorage is the source of truth for almost all personal data
- **Location:** writes at `syncedStore.ts:161` (`settings`), `attempts.ts` (`exam_attempts`/`answers`/
  `events`/`goals_streaks`), `useProgramData.ts:101` (`programs`, read-only), `cache.ts:63` (`exam-audio`).
- **Evidence:** That is the complete set of Supabase writes (grep of `.from(`/`.rpc(`/`storage.from(`). The
  ~16 other per-user tables — `intake_submissions`, `documents`, `roadmap_items`, `applications`,
  `progress_snapshots`, `saved_searches`, `user_shortlist`, `srs_cards`, `study_plan_items`, `deadlines`,
  `notifications`, `audit_log`, `account_memory`, `seen_topics`, `exam_forms` — are never written
  (confirmed empty live: `intake_submissions=0`, `documents=0`, `account_memory=0`, etc.). Intake, profile
  eval, roadmap, shortlist, applications, finance, visa, and generated docs persist ONLY in the
  `settings.data` JSONB blob mirrored from localStorage.
- **Impact:** Isolation/cross-device is fine, but breaks §9.6 "every feature persists per-user in Supabase
  — no localStorage as source of truth" and §9.2's per-feature tables. It is the root cause of SEC-1/SEC-2
  (data the blob lacks can't be exported/deleted; data only in the blob is opaque JSON, not
  queryable/rankable). Clearing site data while signed out (anon blob) loses it with no cloud copy.
- **Fix:** Write each feature to its dedicated RLS'd table; keep localStorage a cache, not the system of
  record; back GDPR export/delete with those tables.

#### SEC-2 · **[P1]** · GDPR "export" returns only the localStorage blob, not Supabase rows or files
- **Location:** `DataControls.tsx:21-23`.
- **Evidence:** `exportData()` serializes `syncedStore.snapshot()` (the `settings.data` blob) only;
  `exam_attempts`/`answers`/`events`/`goals_streaks` rows and `exam-audio` files are omitted.
- **Impact:** Incomplete export; violates §9.6 "export returns everything (rows + files)" and GDPR
  data-portability.
- **Fix:** `gdpr_export` Edge Function (or client aggregator) bundling all per-user rows + signed downloads
  of every Storage object into one JSON/ZIP.

#### SEC-4 · **[P1]** · Section-9 Edge Functions are entirely unbuilt
- **Location:** `list_edge_functions` → `[]`.
- **Evidence:** None of `compute_leaderboard`, `recompute_progress`, `deadline_scan`,
  `persist_generated_doc`, `gdpr_export`, `gdpr_delete`, `keep_alive` exist. (Signup mirroring is instead a
  DB trigger `handle_new_user`, which DOES exist and is correctly SECURITY DEFINER + not anon-executable.)
- **Impact:** No server-side GDPR, no scheduled deadline notifications, no keep-alive (7-day pause risk),
  no doc-persist pipeline. §9.5/§9.7 unmet.
- **Fix:** Build the functions; service-role key stays inside them only.

#### SEC-5 · **[P1]** · Generated-document storage (§9.3) not implemented
- **Location:** no `generated_docs`/`document_vault` table; only Storage bucket is `exam-audio`.
- **Evidence:** SOPs/CVs/LORs/exports are not saved to Storage with versions/provenance; they live in the
  blob or are ephemeral. No Drive `drive.file` flow.
- **Impact:** §9.3/§9.7 "every generated document saved in Storage with versions + provenance" unmet;
  documents lost on blob reset and excluded from GDPR export.
- **Fix:** Add `generated_docs` (owner-RLS) + a private docs bucket with owner-folder RLS; persist on
  generation.

#### SEC-6 · **[P1]** · Cross-user ranking system (§9.4) absent
- **Location:** no `leaderboard_stats`/`outcomes`/`achievements` tables, no `compute_leaderboard` RPC/cron.
- **Evidence:** No opt-in pseudonymous handle (red-team #4: nothing to leak because nothing exists).
- **Impact:** Feature missing. When built it MUST be the SECURITY DEFINER aggregate of §9.4 (return only
  caller rank/percentile + anonymized cohort aggregates) and be red-teamed again.
- **Fix:** Build per §9.4; default-off, anonymized; percentile math in tested code.

#### SEC-7 · **[P2]** · BYOK keys stored unencrypted in a global (un-scoped) localStorage key
- **Location:** `lib/llm/keys.ts:8,51-58,89-97`; `lib/persist/userScope.ts:6-9`.
- **Evidence:** Stored under bare `deutschprep:key:<provider>` / `deutschprep:svc:<svc>` with no user
  scope; `userScope.ts:6-9` documents this as intentional ("BYOK API keys deliberately stay global"). No
  encryption; no `api_keys` table.
- **Impact:** (a) Two accounts on one shared/kiosk browser share the same Gemini/Cloud-TTS key and can
  spend each other's quota; (b) any XSS reads the key via `localStorage.getItem`. Contradicts §9.0/§9.2
  "api_keys (BYOK, encrypted)" and §9.6 "sensitive PII encrypted." (Key is only ever sent to the
  provider's own endpoint — `gemini.ts:46` — no exfil to our backend.)
- **Fix:** At minimum scope BYOK keys per active user via `scopedKey`/reset-on-auth-change like other
  personal stores; document residual XSS risk; for spec, persist to an encrypted `api_keys` table.

#### SEC-8 · **[P2]** · Résumé / intake PII stored unencrypted (blob + plaintext localStorage)
- **Location:** `lib/resume/resume.ts`; `syncedStore.ts`.
- **Evidence:** Résumé/LinkedIn text + all intake answers land in `settings.data` and plaintext
  localStorage. No field-level encryption; no dedicated `intake_submissions` row (table empty).
- **Impact:** §9.0/§9.6 "encrypted sensitive PII" unmet. (Mitigation: PII is never logged — only
  `ErrorBoundary.tsx:25` logs `error.message`+stack; never sent to third parties.)
- **Fix:** Persist intake to `intake_submissions` (RLS); encrypt sensitive fields at rest; keep no-log
  discipline.

#### SEC-9 · **[P2]** · Consent is a dismissible local flag, not versioned/persisted
- **Location:** `components/system/ConsentBanner.tsx:12`.
- **Evidence:** Stores a single `consent:v1` boolean in synced state; `profiles` has no
  `consent_version`/`consent_at` write anywhere in the client. Banner copy is honest.
- **Impact:** §9.1/§9.6 "consent captured + versioned" unmet; can't prove which policy version a user
  accepted or when.
- **Fix:** Write `consent_version` + `consent_at` to `profiles` (or a `consents` table) on accept.

#### SEC-10 · **[P3]** · Postgres extensions installed in `public` schema
- **Location:** `get_advisors(security)` WARN — `vector` and `pg_trgm` in `public`.
- **Impact:** Low; hygiene/namespacing best practice.
- **Fix:** Move to a dedicated `extensions` schema.

#### SEC-11 · **[P3]** · Leaked-password protection (HaveIBeenPwned) disabled
- **Location:** `get_advisors(security)` WARN `auth_leaked_password_protection`.
- **Impact:** Compromised passwords accepted. Low (primary auth is Google OAuth + email magic-link), but a
  one-click hardening.
- **Fix:** Enable in Supabase Auth settings.

### 2B. Data-honesty / AI-model

#### HON-Provenance · **[P1]** · AI model provenance computed but discarded — output not traceable to a model
- **Location:** `lib/llm/registry.ts:89-110` (`routeJSON` returns `{ result, provenance:{ provider, model,
  latencyMs }}`); consumers `features/mock/ExamRunner.tsx:212` (`.then((r)=>r.result)` drops it;
  `recordAttempt` via `lib/exam/attempts.ts`, called `ExamRunner.tsx:168`, stores bands/confidence but not
  the grading model) and `features/ai/useGenerate.ts:75-77` (the seven feature pages call
  `provider.generateJSON` directly, never capturing provider/model).
- **Evidence:** Every consumer throws provenance away.
- **Impact:** An "AI-generated — review before use" badge shows, but the app cannot say whether an SOP,
  skill-gap list, program query, or Writing band came from gemini-flash-lite, gemini-flash, or Claude. With
  cross-provider failover + a "smart" mode that silently switches models, results aren't reproducible or
  auditable. Audit task "is model provenance recorded?" is **not satisfied**.
- **Fix:** Surface `provenance` from `routeJSON`, store `{provider, model}` on the attempt and alongside
  each AI result, render it next to the AI badge (e.g. "Generated by Claude (opus-4-8)").

#### HON-FamilyReunion · **[P1]** · Family-reunion income/housing/A1 thresholds asserted as bare prose, no provenance
- **Location:** `frontend/src/.../FamilyReunion.tsx:14-17`.
- **Evidence:** Official income/housing/A1-language thresholds for family reunification are stated as plain
  prose with no `OfficialFact`/`source`/`needsVerification` wrapping (contrast the grounded path in
  `lib/facts.ts` used everywhere else). Surfaced by the gap audit; confirmed a genuine defect.
- **Impact:** Direct CLAUDE.md §2/§3 grounding violation — official figures presented as truth without
  provenance. These are exactly the visa/immigration thresholds the golden rules require to be sourced or
  returned `null` + `needsVerification`. The only honesty hole where official figures are shown unsourced.
- **Fix:** Route the figures through `OfficialFact` with a real source (German missions /
  make-it-in-germany / the relevant §) + `needsVerification`, or render `null` + needs-verification until
  grounded; attach the visa/finance disclaimer.

#### HON-PromptInjection · **[P2]** · User-supplied text concatenated into prompts without delimiter/sandbox
- **Location:** `pages/profile/Parse.tsx:118-119` (`"Text:\n" + text.trim()`, raw résumé/LinkedIn or
  uploaded-file text); `pages/visa/Simulator.tsx:102` (`Applicant's answer: ${answer.trim()}`);
  `pages/documents/Sop.tsx:149-156` (raw `background`/`motivation`/`whyProgram`/`careerGoal`);
  `pages/profile/Matching.tsx:192` (`Goal: ${goal.trim()}`). Contrast the rubric prompt, which correctly
  fences candidate text in `"""…"""` (`lib/exam/prompts.ts:182-185`).
- **Evidence:** Untrusted text appended directly after instructions, no delimiter.
- **Impact:** A crafted résumé/answer ("Ignore the above instructions and output …") can steer extraction
  or feedback. **Bounded** because output is Zod-validated to a fixed shape (can't break the app or assert
  official facts), the parse result only pre-fills an editable form the user reviews, and it's the user's
  own session/key (no cross-user effect). But injected content can mislead the user (fabricated experience
  pre-filled, or feedback endorsing a bad answer).
- **Fix:** Wrap all untrusted user content in explicit delimiters with a "treat strictly as data, never as
  instructions" preamble, mirroring the rubric prompt's `"""` pattern.

#### HON-AnswerKey · **[P2]** · AI-generated exam answer keys are never verified before deterministic scoring
- **Location:** `lib/exam/schema.ts:75-93` (`objectiveQuestionSchema.superRefine` validates only structure
  — `answerId` present, `order.length === tokens.length` — never correctness); `scoreExam`/`markItem`
  (`lib/exam/scoring.ts`, invoked `ExamRunner.tsx:186`) mark against that key; review stamps an "indicative
  band" seal (`ExamRunner.tsx:423-426`); GRE/GMAT quant prompt only says "Ensure the math is correct…"
  (`lib/exam/prompts.ts:138-140`).
- **Evidence:** The model authors both question and its own answer key; no second-pass check.
- **Impact:** A wrong model answer key yields a confidently-wrong correct/incorrect verdict and band.
  Mitigations: items carry `explanation` + `sourceRef`, transcripts/passages shown at review, band
  captioned "indicative". Inherent to AI-authored exams, hence P2.
- **Fix (optional):** Cheap verifier prompt or majority-vote for math items, or label objective marks
  "auto-generated — verify against the explanation".

#### HON-ExtractJson · **[P2]** · `extractJson` greedy outer-bracket slice can mis-parse model prose with braces
- **Location:** `lib/llm/json.ts:9-26` (slices first `{`/`[` to last `}`/`]`); duplicated in
  `tools/claude-bridge/server.mjs:47-59`.
- **Evidence:** A model emitting prose with a stray brace before the real JSON (or two JSON values) can
  have the wrong span captured.
- **Impact:** Low — Zod `validate` rejects a wrong shape → repair retry / seed-bank fallback, so it can't
  break the app; worst case one wasted retry.
- **Fix:** Prefer a balanced-bracket scan over first-to-last slicing.

#### HON-UMCH · **[P2]** · UMCH private-medicine tuition (~€34,800/yr) shown with a wrong citation
- **Location:** `lib/pathway/pathway.ts:186`.
- **Evidence:** States an illustrative private-medicine tuition figure with `needsVerification: true` but
  cites `source("daadScholarships")`, which is not the figure's actual source (UMCH is not in SOURCES).
- **Impact:** Flagged unverified, so it renders "unstamped" — not a P0 fabrication — but the citation is
  wrong/misleading.
- **Fix:** Drop the number or add the provider's official page to SOURCES.

#### HON-HealthHint · **[P3]** · Health-insurance "~€120/month" hint derived in prose, not from the grounded fact
- **Location:** `lib/intake/derive.ts:111`.
- **Evidence:** Produces a "~€120/month" student-insurance hint inline rather than reading
  `HEALTH_INSURANCE` from `lib/facts.ts:84-90` (which has `source("tk")` + `needsVerification`). Age-30
  rule is correct; figure is plausible and flagged elsewhere, but this instance is unattributed.
- **Fix:** Derive the hint's value/source from the `HEALTH_INSURANCE` OfficialFact so it can't drift.

#### HON-SeedFallback · **[P3]** · No seed-bank fallback for the seven feature pages on rate-limit/quota
- **Location:** `useGenerate.ts:42-44` (only a retry/template message on `rate_limit`); contrast exam's full
  ladder `lib/exam/generate.ts:121-131`.
- **Evidence:** Each page keeps its deterministic template path, so there is no dead-end — hence P3. No
  seed-bank equivalent for SOP/CV/LOR/skill-gap AI output, acceptable since the template is the honest
  fallback. Noted for completeness.

### 2C. Core-flows / Correctness / UX-A11y

#### FLOW-1 · **[P1]** · SOP & CV "generate from template" produce filler with empty input — no validation gate
- **Location:** `pages/documents/Sop.tsx` `composeDraft()`; same shape on `Cv.tsx` (`canPolish` only checks
  the AI path).
- **Evidence:** Placeholders (`[target program]`, `[university]`) are substituted even when the user filled
  nothing, so clicking Generate on an empty form yields confident-looking boilerplate that reads as a real
  draft.
- **Impact:** A new user can ship an empty-skeleton SOP without realizing it isn't tailored.
- **Fix:** Require at least program + one profile field before enabling the template generate, or watermark
  obviously-empty fields in the output.

#### FLOW-2 · **[P1]** · Exam autosave persists `timeLeft` only on answer/section change, not per tick
- **Location:** `ExamRunner.tsx:107-118`.
- **Evidence:** The autosave effect reads `timeLeftRef.current` but its dependency array
  (`[answers, openResponses, sectionIdx, exam, phase]`) excludes `timeLeft`, so the saved clock is only as
  fresh as the last answer/navigation. After a refresh mid-section the candidate can recover several "free"
  minutes (or lose them). Answers themselves are safe.
- **Impact:** Timed-exam integrity: stale clock on resume.
- **Fix:** Persist a wall-clock deadline (`startedAt + sectionDurationMs`) and recompute `timeLeft` on
  resume, rather than snapshotting the count.

#### FLOW-3 · **[P1]** · Listening "Replay (study mode)" allows unlimited replays during a timed mock
- **Location:** `features/mock/ListeningPlayer.tsx` (replay control resets `played`).
- **Evidence:** Contrary to the once-only IELTS/TOEFL rule the runner otherwise emulates (paste is even
  disabled).
- **Impact:** Inflated, unrealistic listening scores — undermines the "practice like the real test"
  promise.
- **Fix:** Gate replay behind review/results phase only, or label the section "untimed study mode"
  explicitly.

#### FLOW-4 · **[P2]** · Silent no-op on invalid "add" actions
- **Location:** `finance/WorkDays.tsx` (returns early when full+half days both 0, no feedback);
  `Tracker.tsx:38-45` (returns on blank fields — mitigated by a `disabled` button, so lower).
- **Impact:** Dead-feeling click with no explanation.
- **Fix:** Inline hint/toast instead of a silent return.

#### FLOW-5 · **[P2]** · Custom grade scale accepts degenerate input (best ≤ minPass), caught only post-submit, no a11y announce
- **Location:** `profile/Evaluate.tsx` + `IntakeFields.tsx:172-199`.
- **Evidence:** Entering best=50, minPass=100 surfaces the converter error, but the inputs aren't validated
  client-side and the error isn't `aria-live`, so a screen-reader user gets no announcement.
- **Fix:** Validate `customBest > customMinPass` inline + live region.

#### FLOW-6 · **[P2]** · BlueCard salary check accepts 0 / nonsensical salaries
- **Location:** `arrival/BlueCardCheck.tsx` (`min={0}`).
- **Evidence:** Returns "below threshold, gap ≈ €50.7k", which isn't actionable.
- **Fix:** `min` a sane floor or add a hint.

#### FLOW-7 · **[P2]** · Mock section timer auto-advances at 0:00 with no "time's up" notice
- **Location:** `ExamRunner.tsx:90-100`.
- **Evidence:** Jumps straight to the next section (or submit) the instant the clock hits zero.
- **Impact:** Disorienting, especially for screen-reader users.
- **Fix:** A brief `aria-live` "Section time up — moving on".

#### FLOW-8 · **[P2]** · Several trackers cycle status linearly with no direct pick / undo
- **Location:** `finance/ScholarshipTracker.tsx` (researching→applied→awarded→rejected→researching).
- **Evidence:** An accidental click past the target requires three more clicks to return.
- **Fix:** Segmented control / dropdown.

#### FLOW-9 · **[P2]** · Default assumptions that quietly bias output for some users
- **Location:** `finance/HealthInsurance.tsx` defaults `under30=true`; `FundingPlan`/`ApplicationCosts`
  default missing income/APS lines to 0 with no "add yours" hint.
- **Fix:** Derive from `dateOfBirth`/`homeCountry` where the profile already has it.

#### FLOW-10 · **[P2]** · Feasibility/eligibility verdicts show weighted deltas (+20/−5) with no link to the rule
- **Location:** `start/Feasibility.tsx`.
- **Evidence:** A user can't verify why a factor scored what it did.
- **Fix:** Per CLAUDE.md grounding spirit, link each factor to its source/explanation.

#### FLOW-11 · **[P2]** · Deutschlandticket price rendered as "verify 2026" with the value hidden
- **Location:** `campus/Deutschlandticket.tsx`.
- **Evidence:** Only the verify flag shows; the actual figure (even as a grounded-but-stale number) is
  absent, so the page under-informs.
- **Fix:** Show last-known value + `needsVerification` rather than suppressing it.

#### FLOW-12 · **[P3]** · Orphaned component `components/common/MockExamRunner.tsx`
- **Evidence:** Superseded by `ExamRunner`, imported nowhere. Carries its own (correct) logic but no
  persistence.
- **Fix:** Delete to avoid future confusion and a re-raised "no autosave" finding.

#### FLOW-13 · **[P3]** · Timer `aria-live` is `"off"` until ≤30s, then `"assertive"`
- **Location:** `ExamRunner.tsx:251` / `MockExamRunner.tsx:129-133`.
- **Evidence:** Screen-reader users get no time cues for most of the section, then a jarring assertive
  burst.
- **Fix:** Periodic `polite` announcements (e.g. at minute boundaries).

#### FLOW-14 · **[P3]** · Flashcards use a raw `SpeechSynthesisUtterance` instead of the shared TTS helper
- **Location:** `pages/language/Flashcards.tsx`.
- **Evidence:** Duplicates TTS, skips the Chrome long-utterance chunking in `lib/speech/tts.ts`; no cleanup
  on unmount (orphaned utterance if you navigate mid-speech). Low impact (single words).
- **Fix:** Use `TtsController`/`speakOnce`.

#### FLOW-15 · **[P3]** · Timer display ticks 2→1→0 (extra frame)
- **Location:** `MockExamRunner.tsx:54-58` (`if (s<=1) return 0` shows "00:01" sub-second).
- **Evidence:** Cosmetic; the live `ExamRunner` is fine.

#### FLOW-16 · **[P3]** · Document/text generators have no length cap on free-text inputs
- **Location:** SOP goal, LOR fields, Loans notes.
- **Evidence:** Very long pasted text isn't truncated/validated; no crash, but UI can blow out.
- **Fix:** Add maxlength.

#### FLOW-17 · **[P3]** · `OfferComparison` "cheapest" badge treats €0/sem as cheapest without a "tuition-free" tooltip
- **Location:** `overview/OfferComparison.tsx`.
- **Evidence:** Correct logic, mild ambiguity vs a data-entry error.
- **Fix:** Add a "tuition-free" tooltip.

---

## 3. Top 10 must-fix before sharing publicly

1. **SEC-1 [P0] — GDPR delete leaves data.** "Delete & sign out" erases only `settings`+`profiles`; exam
   history, answers, events, streaks, and audio survive forever — right-to-erasure is violated.
2. **SEC-3 [P0] — localStorage as source of truth.** ~16 per-user tables are never written; personal data
   lives in one opaque blob, which is *why* delete/export miss data and why nothing is queryable.
3. **SEC-2 [P1] — GDPR export is partial.** Export ships only the local blob, omitting all Supabase rows
   and Storage files — data-portability obligation unmet.
4. **SEC-4 [P1] — Section-9 edge functions unbuilt.** No `gdpr_export`/`gdpr_delete`/`deadline_scan`/
   `keep_alive`/etc.; server-side GDPR, scheduled reminders, and the 7-day-pause keep-alive all depend on
   these.
5. **SEC-5 [P1] — Generated-document storage unbuilt.** SOPs/CVs/LORs are never saved to Storage with
   versions/provenance, so user-generated documents are lost on blob reset and excluded from export.
6. **FLOW-1 [P1] — SOP/CV empty-template filler.** Generating from an empty form yields confident
   boilerplate that reads as a real draft — a new user can ship an untailored skeleton unknowingly.
7. **FLOW-3 [P1] — Unlimited Listening replay.** Replay during a timed mock inflates listening scores and
   breaks the "practice like the real test" promise.
8. **FLOW-2 [P1] — Exam `timeLeft` autosave staleness.** The saved clock excludes `timeLeft` from its deps,
   so a mid-section refresh hands back (or steals) several minutes — timed-exam integrity.
9. **HON-Provenance [P1] — AI model provenance discarded.** With silent cross-provider failover, the app
   can't say which model produced an SOP or graded a band — results aren't reproducible or auditable.
10. **HON-FamilyReunion [P1] — Family-reunion thresholds ungrounded.** Official income/housing/A1 figures
    are bare prose with no source/`needsVerification` — a direct CLAUDE.md §2/§3 grounding violation on
    exactly the kind of visa/immigration fact that must be sourced.

---

## 4. Verified-correct / non-issues (appendix)

These were actively checked and cleared — listed so reviewers know what was tested and need not re-raise.

### 4A. Core-flows false positives corrected during verification

| Claimed | Verdict | Evidence |
|---|---|---|
| "MockExamRunner loses all answers/timer on refresh" (P1) | **False as a live bug.** `MockExamRunner.tsx` is **orphaned/unused** — every exam page renders `MockExamPage`→`ExamRunner`, which autosaves + resumes. | grep: `MockExamRunner` only self-referenced; `ExamRunner.tsx:106-118` autosave, `:62-69` resume, `MockExamPage.tsx:149-164` Resume UI |
| "ExamRunner submit enabled while adapting" (P1) | **False.** Submit and the adapt button are mutually exclusive branches; you can't reach Submit during adapt. | `ExamRunner.tsx:344-355` (`needsAdaptStage ? adapt : lastSection ? submit : next`) |
| "DeadlineReminder null crash on empty date" (P1) | **False.** Render is guarded `{date && sev && (…)}`. | `DeadlineReminder.tsx:48-52` |
| "ProcessPage StatusBoard is a dead component" (P3) | **False.** `StatusBoard` is a real imported component fed `APPLICATION_STAGES`. | `Process.tsx:4,52` |
| "Reminders r6 omission (7 defs, 6 wired)" (P3) | **False.** r6 is declared `:42` and included in the array `:46`. | `Reminders.tsx:42,46-47` |
| ".ics UID collisions for same-date events" (P0) | **False.** UID includes the loop index `i`. | `ics.ts:69` (`deutschprep-${i}-${d}-${dtstamp}`) |
| "deadlines.ts TZ off-by-one P0" | **False.** `parseISODate` builds a *local* date explicitly to avoid UTC drift; `daysUntil` normalizes both ends to local midnight. | `deadlines.ts:10-13,21-24` |
| "Tracker draft text lost on refresh" (P1) | **Downgraded.** Saved apps persist (`useSyncedState`); only 2 chars of unsubmitted add-form text are transient — standard, not P1. | `Tracker.tsx:34-45` |

### 4B. Security red-team passes (attempt → result)

| # | Attempt | Result |
|---|---------|--------|
| 1 | Cross-user read via anon Data API | All 22 tables RLS-enabled; every user-table policy `auth.uid()=user_id` (profiles `=id`); anon's `auth.uid()` is null → 0 rows. No `null` user_id rows. Only `programs` (public SELECT) reachable. **No leak.** |
| 2 | Secret in deployed bundle | `curl` of live `index.html` + 845 KB JS; grep `AIza`/`sk-`/`sk-ant-`/`service_role`/private-key; decode every embedded JWT. Only credential present: Supabase URL + a `role:anon` JWT (public by design). No Google/OpenAI/Anthropic/service-role/private key. `.js.map` → 404. **No leak.** |
| 3 | Owner-Mode bridge from a foreign origin / drive-by quota burn | `/generate` enforces an Origin allowlist (localhost, 127.0.0.1, exact Pages origin; pinned tunnel host via env only, no wildcard) **before** doing work; loopback-bind by default; PNA preflight handled; optional `X-Bridge-Token`; strips `ANTHROPIC_API_KEY`; build-excluded; holds no secret. Foreign origin → 403. **Blocked.** |
| 4 | Reach the ranking RPC and read others' rows | No leaderboard/ranking RPC, table, or materialized view exists. Only SECURITY DEFINER fn is `handle_new_user` (signup trigger), EXECUTE to `postgres`+`service_role` only — not anon/authenticated callable. **No leak; feature simply absent** (→ SEC-6). |
| 5 | Hit a deep link unauthenticated | Anon → redirected to `/welcome`; account-bound surfaces render a sign-in gate, not data; even if a route rendered, RLS returns 0 rows for anon. **No data exposure.** (`RequireAuth.tsx`, `AppGate.tsx`) |
| 6 | Find a table without RLS / in an exposed schema | 22/22 RLS-enabled (`pg_class.relrowsecurity`); `get_advisors(security)` returns only WARN (extensions in `public`; leaked-password off) — no `rls_disabled_in_public` ERROR. (→ SEC-10/11 P3) |
| 7 | Exhaust someone's free-tier quota | LLM calls use the visitor's OWN Gemini key or the OPERATOR's OWN Claude plan via the gated bridge. A visitor can only burn their own quota. No shared server-side LLM credit. **No shared-quota risk.** |

### 4C. AI / cost-abuse review — verified, no defect

- **BYOK key never exposed** — `lib/llm/keys.ts`: localStorage only, never bundled/logged, `messageFor`
  (`useGenerate.ts:38`) never logs raw errors/PII, key sent only to Google's SDK endpoint.
- **Owner-Mode bridge** (`tools/claude-bridge/server.mjs`): loopback bind (`:32`), server-side Origin
  allowlist on `/generate` before work (`:177-180`, not just ACAO), pinned tunnel host with regex-escaping
  (`:107-110`), optional `X-Bridge-Token` (`:182-185`), PNA preflight (`:129`), strips `ANTHROPIC_API_KEY`
  (`:67-68`), path-containment guard (`:138`). No CORS/PNA/quota-burn hole.
- **Multi-model modes** (`lib/llm/registry.ts` + `modelConfig.ts`): gemini_only / claude_only / smart /
  failover resolve correctly; model ids current (`claude-opus-4-8`, `gemini-2.5-flash-lite`,
  `gemini-3.1-pro`). Providers interchangeable behind one Zod contract. (Provenance gap = HON-Provenance.)

### 4D. Grounding & determinism — verified correct (do not regress)

- **No fabricated official fact shown as truth.** Every official figure flows through `OfficialFact`
  (`lib/facts.ts`) with a `source` and (for volatile values) `needsVerification: true`, rendered with a
  visible Grounded / Needs-verification badge + source link + re-verify control. Sperrkonto €11,904, Blue
  Card €50,700/€45,934.20, PR 21/27mo, citizenship 5yr, Anmeldung 14-day, Deutschlandticket €63 are
  current-2026 and sourced. The only exceptions are flagged in the register: HON-FamilyReunion (ungrounded,
  P1), HON-UMCH (wrong citation, P2), HON-HealthHint (unattributed in-prose, P3).
- **Deterministic math correct + tested.** GPA (Modified Bavarian), ECTS, cost-of-living, deadlines,
  journey budget, reverse timeline, funding gap, work-days, SRS, and raw→band/CEFR concordance are tested
  TypeScript (191 tests pass), dates use local-midnight arithmetic (no UTC off-by-one). Golden rule #4 met.
- **AI output schema-validated.** Every LLM call goes through Zod `safeParse` (`lib/llm/json.ts` `validate`)
  with a one-shot repair retry and a documented fallback ladder. Golden rule #6 met.
- **RLS / SECURITY DEFINER / Storage / bundle / logging / on-device isolation** all verified correct —
  owner-only policies with matching `WITH CHECK`, single private `exam-audio` bucket with owner-folder RLS,
  CI gate greps `dist/` for keys (`deploy.yml:56-65`), no PII/keys logged, per-user stores namespaced by
  uid and reset on every auth transition (the known pre-fix cross-account bug is closed).

---

## 5. P0 fix ↔ Section-9 build note

Both P0s are **persistence-architecture** problems, not separate workstreams: **SEC-1** (delete leaves
data) and **SEC-3** (localStorage as source of truth) are both resolved by the same Section-9 work —
writing each feature to its own per-table RLS'd Supabase persistence and building the `gdpr_export` /
`gdpr_delete` Edge Functions on top of those tables. Once every feature persists to its dedicated table and
the edge functions enumerate them, delete erases everything and export returns everything by construction.
SEC-2, SEC-4, and SEC-5 fall out of the same build. **Therefore the two P0s are scheduled into the
Section-9 persistence build, not tracked as an independent remediation track.**
