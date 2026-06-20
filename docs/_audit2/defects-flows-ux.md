# DeutschPrep — Core-Flows + Feature-Correctness + UX/A11y Defect Audit

**Audit type:** Fresh, independent walk of core flows, feature correctness, edge/UX, accessibility (WCAG 2.1 AA), perf, and i18n.
**Method:** Read code before claiming; verified every "dead button / missing state / wrong result" assertion in source. New surfaces (dual-write on Tracker/Roadmap/Calendar, Leaderboard, ConsentBanner, GDPR controls) were read line-by-line by the lead, including the backing SQL migrations and RPCs.
**Scope reference:** `frontend/src` (~125 routes in `lib/nav.tsx`), shared UI in `components/common` + `components/ui`, Vitest/Playwright suites, Supabase migrations under `supabase/migrations`.
**Verdict:** The app is architecturally mature — shared UI kit and the LLM hook bake in focus/ARIA/loading/error/empty states, so most per-page risk classes are eliminated by construction. The genuine defects cluster in the **new dual-write + Leaderboard surfaces**, where the data-flow has real correctness gaps.

Severity key: **P0** broken core flow / app-breaking · **P1** feature broken / dead button / wrong result / missing loading-empty-error / data lost on refresh · **P2** edge / weak validation / confusing UX · **P3** polish / a11y / dead code.

---

## P0 — none found

The signup → onboarding → dashboard → matching → mock → finance → visa → roadmap path is fully wired. Every `navigate()` / `to=` target resolves to a real route in `lib/nav.tsx`. No crash-on-mount, no broken router, no 404 dead-end on a core path. The per-user isolation P0 (the original "one account reads another's data" bug) is **fixed and regression-tested** (`lib/persist/syncedStore.test.ts`), verified by reading the store.

---

## P1 — feature broken / wrong result / data loss

### P1-1 — Leaderboard "Readiness" dimension is permanently 0 for everyone (primary dimension is dead)
**Files:** `frontend/src/pages/overview/Leaderboard.tsx:85-99` · `supabase/migrations/0013_section9_scheduled_jobs.sql:10-32` · `supabase/migrations/0012_section9_leaderboard_ranking.sql:13`
**Repro:** Sign in → open `/leaderboard`. The "Readiness score" card shows "Not ranked yet" (or rank tied at the cohort floor) no matter how complete your profile/roadmap is; the opt-in public board (`leaderboard_top(dimension: "readiness")`, Leaderboard.tsx:79) ranks every opted-in user at value 0.
**Why:** `readiness` is computed deterministically on the client (`readinessScore`, `lib/progress/progress.ts:82`, surfaced on the Dashboard), but **nothing ever writes it into `leaderboard_stats`**. The client `saveOptIn` upsert (Leaderboard.tsx:89-94) only writes `user_id`, `opted_in`, `handle`, `updated_at`. The nightly server job `refresh_leaderboard_stats()` deliberately refreshes only `roadmap_pct`, `best_band`, `streak` — its header comment states "readiness stays client-computed (tested TS)" — so the column keeps its `default 0`. The one dimension the public board sorts on, and the first card users see, is inert.
**Fix:** Have the Leaderboard page (or the Dashboard, where `readinessScore` is already computed) upsert `readiness` into `leaderboard_stats` alongside the other dims; OR move the readiness formula into `refresh_leaderboard_stats()`. Until then the readiness card overstates how "leak-safe ranking" works because it ranks on a constant.

### P1-2 — Dual-write hydrate on sign-in silently discards data added while signed out
**Files:** `frontend/src/lib/persist/useTableSync.ts:81-91` (and `useRoadmapSync` 142-148) · consumed by `pages/overview/Tracker.tsx:38`, `Calendar.tsx:71`, `Roadmap.tsx:41`
**Repro:** Signed out, add programmes on `/tracker` (or deadlines on `/calendar`) on device A. Separately you already have rows in the `applications` table from device B. Now sign in on device A. The hydrate runs `loadRows(...)` → because `rows.length > 0` it calls `setItems(mapped)`, **replacing** local state with the table rows. The programmes you just added while signed out are gone (they were only in localStorage / the `settings.data` blob, never reconciled before the replace).
**Why:** The hook's comment claims it "keeps the data the user built up while signed out instead of wiping it" — but that guarantee only holds for a **first-ever** sign-in where the table is empty (the `rows.length === 0` branch). When the table already has rows, hydrate is a hard replace, not a merge. This is exactly the "dual-write wipes local data on sign-in" risk the brief flagged. Note: the `settings.data` blob path (`syncedStore.pullFromCloud`) DOES merge (`{...this.blob, ...cloud}`), so the two persistence layers have inconsistent merge semantics for the same user action.
**Fix:** Merge local + remote on hydrate (union by client id / `stableUuid`), or upsert local rows to the table before adopting remote, instead of `setItems(mapped)` wholesale. At minimum, document the "remote wins on sign-in" behavior so it isn't mistaken for a merge.

### P1-3 — `useSyncedState` cloud-pull lets a stale cloud blob overwrite signed-out edits to the same key
**Files:** `frontend/src/lib/persist/syncedStore.ts:131-135` · affects `profile:v1`, `onboarded:v1`, `consent:*`, all `useSyncedState` keys
**Repro:** Signed out, edit your intake profile (key `profile:v1`) on this device. Sign in to an account whose cloud `settings.data.profile:v1` is older/different. `pullFromCloud` does `this.blob = { ...this.blob, ...cloud }` — **cloud wins on key collision** — so your just-made signed-out profile edits are overwritten by the older cloud copy.
**Why:** Same root cause as P1-2 in the other persistence layer: there's no last-write-wins-by-timestamp or field merge; the spread simply prefers cloud for any shared key. For single-device returning users it's fine; for "edited as guest, then logged in" it silently loses the guest edit.
**Fix:** Compare `updatedAt` (the profile already stamps it) before letting cloud override a locally-modified key, or merge at the field level for known structured keys.

### P1-4 — Roadmap page gives a non-linear applicant advice that contradicts the Pathway page
**Files:** `frontend/src/lib/pathway/roadmap.ts:65-81` (consumed by `pages/overview/Roadmap.tsx:44`) vs `lib/pathway/pathway.ts:316-335` (consumed by `pages/profile/Pathway.tsx`)
**Repro:** A diploma-only applicant (no Bachelor; `highestQualification === ""` because `"diploma"` isn't a `HighestQualification` value) targeting a Bachelor. `/roadmap` falls through `roadmapStepsFor` to `bachelorSteps` → a Studienkolleg → FSP roadmap. `/profile/pathway` (`evaluatePathway` → `diplomaOnly()`) correctly says a diploma generally can't enter Studienkolleg and routes to Ausbildung / complete-a-Bachelor. Same user, two pages, opposite plans.
**Why:** `roadmapStepsFor` accepts only `{country, targetLevel, highestQualification}` and ignores the `EducationSummary` (`educationPathType`, `qualifyingCredential`) that `evaluatePathway` branches on. The two were not derived from one engine.
**Fix:** Feed `roadmapStepsFor` the same `EducationSummary` and branch on the non-linear cases (`diploma_only` / lateral / ongoing) as `evaluatePathway`, or derive both from a shared resolver.

### P1-5 — "Read question aloud" is a dead button on browsers without SpeechSynthesis
**Files:** `frontend/src/features/mock/SpeakingTask.tsx:73` · `lib/speech/tts.ts:191-197`
**Repro:** On a browser/OS without TTS (some Firefox/Linux configs), click the speaker button on a speaking task. `speakOnce()` returns silently when `isTtsAvailable()` is false; the button has no disabled state, tooltip, or feedback, and `speakOnce` registers no `onerror`. Nothing happens, with no explanation.
**Fix:** Gate the button on `isTtsAvailable()` (mirror the existing `sttOk` fallback pattern) and show a one-time "voice unavailable" hint.

### P1-6 — "Next sentence" can halt listening playback and surface a spurious error mid-test
**Files:** `frontend/src/lib/speech/tts.ts:169-174` (`next`) vs `136-141` (`utterance.onerror`)
**Repro:** During a listening section, hit "Next sentence" while audio is mid-utterance. `next()` calls `speechSynthesis.cancel()` while `this.stopped` is still `false`, so the in-flight utterance's `onerror` fires with `interrupted`/`canceled`; the `if (this.stopped) return` guard doesn't cover it, so it runs `onError → finish() → playing=false` and a "browser voice stopped unexpectedly" toast can appear. Listening playback becomes racy.
**Fix:** Set a transient "advancing" flag checked in `onerror`, or null the old utterance's `onerror` before `cancel()`.

---

## P2 — edge / weak validation / confusing UX

### P2-1 — Mobile nav drawer has no focus trap or Escape-to-close (systemic, keyboard a11y)
**File:** `frontend/src/components/layout/AppShell.tsx:53-72`
**Impact:** The slide-over drawer is the app's only modal-like surface. It never moves focus into the drawer, doesn't trap Tab, and has no Escape handler — keyboard/SR users can Tab behind the overlay. Affects every page on narrow viewports.
**Fix:** Focus the drawer on open, trap Tab within it, close on Escape, restore focus to the trigger.

### P2-2 — No prompt-length cap before LLM calls (cost / failure on real résumés)
**Files:** `frontend/src/pages/profile/Parse.tsx:140` (`autofillWithAi` sends full `text.trim()`) · `lib/llm/*` (no `MAX_*`/truncate)
**Impact:** A large (8 MB cap is enforced on the file, but the extracted text is unbounded) résumé produces a multi-MB prompt → token-limit failure or runaway BYOK cost.
**Fix:** Truncate extracted/pasted text (~20–40k chars) before building the prompt.

### P2-3 — Out-of-range grade silently clamped with no warning in the live intake preview
**Files:** `frontend/src/features/profile/IntakeFields.tsx:165-169`
**Impact:** Enter 95 on a CGPA/10 scale (or 9.5 on GPA/4). `gpa.ts` clamps correctly, but `IntakeFields` shows a confident "→ German grade 1,0" with no "out of scale / clamped" flag (the standalone `Evaluate.tsx:238` at least shows a "Clamped: Yes" badge). A wrong-looking grade is presented as authoritative.
**Fix:** Warn when `gradeValue` is outside `[minPass..best]`.

### P2-4 — Two divergent seed datasets for the same official programmes
**Files:** `frontend/src/lib/seed/universities.ts:40` (10 programmes, read by `Universities.tsx`) vs `lib/seed/programs.ts:13` (35 programmes, read by `Matching.tsx`)
**Impact:** The two pages disagree about what each university offers (e.g. RWTH "Computer Science" de_en vs "Software Systems Engineering" EN). Two sources of truth for official-ish data → cross-page inconsistency.
**Fix:** Consolidate onto `SEED_PROGRAMS` / `useProgramData`; retire `seed/universities.ts`.

### P2-5 — Live program-data fetch failure degrades silently
**File:** `frontend/src/lib/programs/useProgramData.ts:104-110`
**Impact:** On a Supabase error/empty result the hook silently keeps `source: "seed"` and shows "bundled curated set" with no signal the live DB failed.
**Fix:** Surface an error flag so the UI can say "couldn't reach live data, showing bundled set."

### P2-6 — ExamRunner timer urgency is color-only for sighted users
**File:** `frontend/src/features/mock/ExamRunner.tsx:251`
**Impact:** At ≤30s the timer only turns `text-red-600`. SR users are covered (text + `aria-live` flip), but low-vision/colorblind sighted users get no non-color cue (WCAG 1.4.1).
**Fix:** Add an "Almost up" text/icon or border/weight change, not just red.

### P2-7 — Synthesis spinner surfaces intentional aborts as errors
**File:** `frontend/src/features/mock/ListeningPlayer.tsx:122-161`
**Impact:** An `AbortError` from `changeTier()`/unmount during `synthesizeAll` is caught and shown as "Synthesis failed. You can switch to the free browser voice" — misleading on a deliberate tier switch.
**Fix:** Swallow `AbortError` (`err.name === "AbortError"` / `signal.aborted`).

### P2-8 — Onboarding guest re-entry isn't redirected
**File:** `frontend/src/pages/onboarding/Onboarding.tsx:33-37`
**Impact:** When Supabase is unconfigured (`configured === false`), the whole guard block (including `onboarded → Navigate "/"`) is skipped, so an already-onboarded guest who opens `/onboarding` re-runs the wizard. Harmless (data persists) but confusing.
**Fix:** Move the `if (onboarded) return <Navigate to="/" replace />` out of the `configured` block.

---

## P3 — polish / a11y / dead code

- **P3-1** Leaderboard fires 4 sequential `await supabase.rpc("my_rank")` in a loop — `pages/overview/Leaderboard.tsx:54-57` — serialized round-trips on load; `Promise.all` the dimension RPCs.
- **P3-2** Leaderboard self-handle highlight uses `t.handle === handle.trim()` — `pages/overview/Leaderboard.tsx:170-171` — if two opted-in users pick visually-identical handles (the unique index is case-insensitive but trims differently) the wrong row could be flagged "you"; compare on `user_id` instead of the display handle.
- **P3-3** Route-change doesn't move focus to `#main-content`/`<h1>` — `components/layout/AppShell.tsx:22-25` — scroll resets but SR focus stays put (a skip link exists, so polish).
- **P3-4** Orphaned `MockExamRunner` with a sub-second timer tick (`if (s<=1) return 0` shows "00:01") — `components/common/MockExamRunner.tsx:54-58` — dead code; live exams use `ExamRunner`. Delete.
- **P3-5** `speakOnce` sets `u.lang="de-DE"` but never resolves a matching `getVoices()` voice (unlike `TtsController.speakCurrent`) — `lib/speech/tts.ts:191-197` — mispronounces on systems without a German default voice.
- **P3-6** No `maxLength` on intake free-text (name/institution/degree/target/goal), `targetIntakeYear` (no `min`/`max`), Tracker university/program, Calendar deadline title — `features/profile/IntakeFields.tsx:46-353,214-221`; `pages/overview/Tracker.tsx:99,103`; `Calendar.tsx:242` — pasted huge text bloats the persisted blob / stretches cards (React-escaped, so no XSS).
- **P3-7** `StartTimelinePlanner` indexes `milestones[milestones.length - 1].month` unconditionally — `pages/start/TimelinePlanner.tsx:81` — safe today (static non-empty source) but would throw if emptied; add a guard.
- **P3-8** Leaderboard handle has no format/whitespace-class filter (emoji/odd handles allowed, shown to others; React-escaped so safe) — `pages/overview/Leaderboard.tsx:154`.

---

## i18n — state report (not a bug)

**The app is English-only by design.** There is no i18n/locale/translations module and no language switch (theme handles only light/dark/system). The German "eyebrows" in `lib/nav.tsx` (e.g. `"Übersicht · Overview"`) are static decorative bilingual labels driven by a plain `string` field — not a half-built i18n system. There are no "missing translations" because there is no translation system to be incomplete. No action implied.

---

## False positives corrected (claims that did NOT hold up on inspection)

- **"Dead buttons / `onClick={() => {}}` / `href="#"`"** — zero hits across the in-scope page set; every CTA, including the Reminders `.ics` export (`buildIcs`/`toIcsStamp` are real), the auth buttons, and the Sources links, is wired.
- **"Icon-only buttons missing aria-label"** — all checked (Menu/X, Trash2 on Loans/WorkDays/ScholarshipTracker, Volume2/Mic on Simulator, X chips on Matching) have `aria-label` or visible text.
- **"Unlabeled inputs"** — every text input uses `htmlFor`/`id` or `aria-label`; the Leaderboard handle input is inside a `<label>`; checkbox/radio inputs are wrapped by `<label>`.
- **"Clickable non-button divs with no keyboard handler"** — repo grep returned zero keyboard-inoperable handlers; interactions are real `<button>`/`<a>`/`NavLink`.
- **"No `prefers-reduced-motion`"** — globally enforced in `index.css:107-114`; framer-motion surfaces additionally gate on `useReducedMotion()`.
- **"Mock-exam double-submit"** — guarded by `submittedRef` (`features/mock/ExamRunner.tsx`).
- **"Resume upload unbounded"** — hard 8 MB cap before extraction (`Parse.tsx:64`, `lib/resume/resume.ts:27`). (The *text* length post-extraction is still uncapped — that's P2-2.)
- **"GPA/ECTS/cost-of-living/funding-gap/work-days math bugs"** — all guard non-finite/negative, no div-by-zero, and match their `.test.ts` siblings. Verified against tests.
- **"Leaderboard leaks other users' rows"** — the `my_rank` / `leaderboard_top` RPCs are `SECURITY DEFINER`, guard `auth.uid()`, revoke `anon`, and return only the caller's own value + anonymized cohort aggregates (or opt-in handles). Leak-safe. (The defect is P1-1: the readiness column is never populated — a correctness bug, not a leak.)
- **"Leaderboard has no signed-out / not-ranked-yet / empty-board states"** — all three are present (`!configured || !user` gate; "Not ranked yet" per dimension; board only renders when `optedIn && top.length > 0`). Handled.
- **"GDPR delete/export buttons are no-ops"** — both work: export bundles every per-user table + Storage list + local snapshot (`lib/gdpr/userData.ts`); delete prefers the `gdpr_delete` Edge Function and falls back to client-side erase, then signs out (`features/settings/DataControls.tsx`).
- **"AppGate redirects 404"** — all `anon → /welcome` / `onboarding → /onboarding` targets exist in the route table.
