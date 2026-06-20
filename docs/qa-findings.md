# DeutschPrep — QA / Defect & Loophole Register

Deep adversarial audit, 2026-06-20, via 5 parallel read-only subagents (security/red-team · data-honesty/
grounding · core-flows/correctness · a11y/edge/perf/i18n) + golden-rule cross-check. Severity model:
**P0** blocker (privacy/security/fabricated-fact-as-truth/money risk/app-break) · **P1** major (feature
broken / dead button / wrong result / data lost) · **P2** minor (edge bug / confusing UX / weak
validation) · **P3** polish.

## Executive summary

The app is **well-built and unusually honest by design**: the known **P0 data-isolation bug is verified
FIXED** (per-user namespaced storage + hard reset on every auth transition), keys never enter the bundle
(CI secret-scan), the Owner-Mode bridge strips `ANTHROPIC_API_KEY` and has no command injection, RLS is
owner-only on every table, deterministic maths is correct/tested, official 2026 facts (Sperrkonto
**€11,904/yr**, Deutschlandticket €63, work limit 140/280, TOEFL-2026) are centralised with provenance +
`needs_verification`, and the advisory disclaimer is on all 13 finance/visa pages.

The defects that remain are **2 P0 honesty leaks**, a cluster of **P1 data-loss + one broken advertised
feature + one a11y blocker**, and a long tail of **P2/P3** correctness, a11y, perf, locale, and bridge-
hardening items. None is a security/data-leak P0. **Nothing should block private use; the Top-10 below
should be fixed before sharing publicly.**

## Top 10 — must-fix before sharing publicly
1. **P0-1** Skill-gap shows a *mock person's* gaps as the new user's own ("3 gaps identified for this profile").
2. **P0-2** APS-India "≥70% Class XII (2026)" cited to a **2022** newsletter, and `needs_verification` dropped at the UI.
3. **P1-1** Visa / VPD / Translation checklist progress **not persisted** (missing `storageKey`) → lost on nav/reload.
4. **P1-2** IELTS "overall band" averages only **2 of 4 skills** (Listening+Reading) but is labelled as the full band.
5. **P1-3** Visa interview simulator (Feature 22, "voice") has **no mic/dictation** — advertised core feature missing.
6. **P1-4** Work-experience editor: ~9 **unlabelled inputs** per role (WCAG 4.1.2/3.3.2 blocker for SR users).
7. **P2** Mock-exam **double-submit** (timer-expiry + click both fire `submit()`) → duplicate recorded attempt.
8. **P2** Speaking answer **overwritten/lost** (type-then-record replaces; second take loses the first).
9. **P2** **Stale in-memory data on live account-switch** without reload (ExamTracker/model-config don't re-read on scope change).
10. **P2 (perf)** **KaTeX webfonts (~1.2 MB) + framer-motion** load for *every* user from the main bundle, defeating the lazy split; plus locale currency mis-format ("€11,904" vs German "11.904 €").

---

## P0 — Blockers

**P0-1 · Fabricated personal skill-gaps shown as the user's own** — `pages/profile/SkillGap.tsx:90,115,158`.
`SEED_GAPS` is the Jane-Doe mock from `lib/mockData.ts` (German B2 / Distributed Systems / Research
publication); with no AI run (default for any new user without a key) the page renders "**3** gaps
identified **for this profile**". `useProfile()` is read but never gates an empty state.
*Repro:* open `/profile/skill-gap` on a fresh account, no AI key → see Jane Doe's three gaps as yours.
*Rec:* when `aiGaps === null && !isProfileStarted(profile)` show an empty state, or relabel "Example gaps"
(as `profile/Overview.tsx` already does for its sample).

**P0-2 · APS-India 2026 rule grounded to a 2022 source + `needs_verification` dropped** —
`lib/country/country.ts:24,68` + `pages/visa/Aps.tsx`. The note asserts "New anabin criteria from 15 Mar
2026 (e.g. ≥70% in Class XII)" with `apsSource = source("apsIndia")` which resolves to an **Oct-2022**
newsletter (provenance mismatch, CLAUDE.md §3), and `apsStatusFor()` returns only `{status,note,source}`
— **dropping `needsVerification`** — so it renders as cited fact, not "unstamped". (The same 50→70 claim in
`pathway.ts:RAISED_70_NOTE` is handled better — it carries `needsVerification:true` + a warn tone.)
*Rec:* have `apsStatusFor` carry `needsVerification:true` (render unstamped); re-ground or remove the
explicit `≥70%` from cited-as-truth prose.

> **Data-isolation P0 — VERIFIED FIXED (not a defect).** `syncedStore` (profile/state), `attempts`,
> `examProgress`, `modelConfig`, and the audio cache are all per-user namespaced and reset on
> sign-in/switch/sign-out; the legacy global key is parked + removed; only theme/BYOK-keys/TTS prefs stay
> global (allowed). Storage never bleeds across accounts. (One residual *render* nit → P2 below.)

## P1 — Major

**P1-1 · Checklist progress not persisted (3 pages)** — `components/common/Checklist.tsx` only persists
when a `storageKey` prop is passed; it silently falls back to ephemeral `useState` otherwise. Missing on:
`pages/visa/Checklist.tsx:32` (visa docs), `pages/documents/Vpd.tsx:108` (VPD prerequisites),
`pages/documents/Translation.tsx:54,61` (×2 — also need *distinct* keys or their checked-maps collide).
*Repro:* tick items → navigate away/back → all unchecked. *Rec:* add unique `storageKey`s (sibling
`Anmeldung.tsx` does it right); consider making `storageKey` required.

**P1-2 · IELTS overall band uses only Listening+Reading** — `lib/exam/scoring.ts:178,186`. Sections with no
objective items (IELTS Writing/Speaking) are skipped, so `overallBand` is the mean of 2 of 4 skills yet
labelled "overall". *Rec:* relabel "objective-sections band (L+R only)" or fold rubric W/S bands in.

**P1-3 · Visa interview simulator has no voice/dictation** — `pages/visa/Simulator.tsx`. Feature 22 is the
"(voice)" simulator and the placeholder says "Type or **dictate**", but nothing from `lib/speech/stt.ts`
is imported (the exam's `SpeakingTask` uses `createRecognizer`); only the question is read aloud. *Rec:*
wire `createRecognizer` with the typed fallback, or drop "or dictate" from the copy.

**P1-4 · Work-experience editor inputs are unlabelled** — `features/profile/WorkExperienceEditor.tsx`
`Field` wrapper renders the label as a bare `<span>` with no `htmlFor`/`id`/`aria-label`; ~9 controls per
role row announce as "edit text, blank". Fails WCAG 4.1.2/3.3.2/1.3.1. *Rec:* generate an id in `Field`,
use a real `<label htmlFor>` (clone child with id) or pass `aria-label`.

## P2 — Minor (correctness / a11y / perf / locale)

**Correctness / flows**
- **Exam double-submit** — `features/mock/ExamRunner.tsx` `submit()` has no in-flight guard; the
  last-section timer-zero path and the "Submit exam" click can both fire → two `recordAttempt()` writes.
  *Rec:* `if (phase !== "run") return;` at the top of `submit()`.
- **Speaking answer overwrite/loss** — `features/mock/SpeakingTask.tsx:52` replaces the whole value and
  `stt.ts:86` resets `finalText=""` per `start()`; typing-then-recording or a second take loses earlier
  text. *Rec:* append/merge instead of replace, or warn.
- **Empty generated section renders dead** — `lib/exam/schema.ts` lets `objective`/`open`/`passages` all
  default `[]`; only exam-level `sections.min(1)` is enforced. A schema-valid empty section shows
  "0/0 answered" with a Next/Submit. *Rec:* `superRefine` requiring `objective.length + open.length ≥ 1`.
- **"Add to tracker" silent + duplicates** — `pages/profile/Matching.tsx:174`; appends with no dedupe/
  confirmation. *Rec:* dedupe on university+program (or toggle) + transient confirmation.
- **Parse "Start over" wipes draft, no confirm** — `pages/profile/Parse.tsx` `reset()`. *Rec:* confirm.
- **Parse 8 MB cap advertised but not enforced** — `Parse.tsx` `onFile` extracts unbounded. *Rec:* reject
  oversize before extraction.
- **Onboarding step-2 autosaves on each keystroke** — `pages/onboarding/Onboarding.tsx:136` binds
  `IntakeFields` to the persisted profile (no draft/undo). *Rec:* local draft, commit on Continue.
- **Visa Simulator TTS bypasses the tiered provider** — `Simulator.tsx:68` calls `window.speechSynthesis`
  directly (hardcoded `en-US`, no Chrome 15s watchdog). *Rec:* route through `TtsController`.
- **GPA out-of-scale silently clamped on the inline path** — `lib/profile/profile.ts:42` /
  `IntakeFields`/`ResumeAnalyzer` discard the `clamped`/`isPassing` flags `convertToGermanGpa` sets, so
  150% on a 100-scale shows a plausible "1,0". (The Evaluate page *does* surface them.) *Rec:* surface the
  flags inline or validate `gradeValue` against the scale.

**Security (lower-severity)**
- **Stale in-memory personal data on live account switch** — `pages/language/ExamTracker.tsx:45` (and any
  page reading `getModelConfig()`/`loadProgress()` synchronously) reads once on mount and doesn't subscribe
  to `userScope.onScopeChange`, so signing out→in as a different user *without reload* can briefly show the
  previous user's attempts/streak/model-config. Storage itself is correctly scoped — this is a render
  staleness, not a storage bleed. `speech/cache.ts` does it right (`onScopeChange(clearAudioMemoryCache)`).
  *Rec:* have these pages subscribe to `onScopeChange` and re-read.

**Accessibility**
- Exam **timer aria-live** flips `off`→`assertive` and updates every second → a 30s barrage burying
  content (`ExamRunner.tsx:245`). *Rec:* polite milestone announcements (5:00/1:00/0:30/0:10).
- **MathText** has no text alternative (`features/mock/MathText.tsx`) — add `role="math"` + `aria-label`.
- Recording/transcription/synthesis **state not announced** (`SpeakingTask`, `ListeningPlayer`).
- **No focus management** on section change / pill nav / exam start (`ExamRunner`) — move focus to the new
  `<h2 tabIndex={-1}>`.
- **Checklist** `sr-only` checkbox has **invisible keyboard focus** (`Checklist.tsx:73`) — add
  `focus-within:ring`.
- **Mobile drawer + Matching compare dialog** lack focus-trap/Escape/focus-move (modal semantics).
- **AiSettings** Gemini test-fail message has no `role="alert"` (`AiSettings.tsx:153`).
- **Contrast**: `text-red-600`/`text-amber-700` at `text-xs` are borderline (<4.5:1) in several spots.
- **Tap target**: Matching chip-remove `X` is ~12–16px (<24px).

**Performance**
- `main.tsx:6` imports `katex/dist/katex.min.css` at app entry → ~24 KB CSS + **~1.2 MB KaTeX webfonts for
  every visitor**, defeating the otherwise-correct lazy JS split. *Rec:* import it inside `MathText.tsx`.
- `AppShell.tsx:3` eagerly bundles **framer-motion** into the shell chunk for one cosmetic route-enter
  animation. *Rec:* CSS transition (reduced-motion aware); framer-motion then loads only with the mock feature.

**i18n / locale**
- **EN/DE is cosmetic** — no i18n library, no catalogs, no `t()`/locale state/switcher; "bilingual" is
  hardcoded `"Deutsch · English"` eyebrows shown simultaneously. Real localisation must be built. *(Counts
  as a P2 "advertised feature absent" — list honestly; not a defect in any single component.)*
- **Locale formatting inconsistent**: grades German ("1,9" ✓), but currency US (`costOfLiving.ts:72`
  `toLocaleString("en-US")` → "€11,904" vs German "11.904 €"), dates British (`deadlines.ts:50`). *Rec:*
  one shared locale-aware formatter.

**Grounding rigor (P1/P2 nits)**
- `lib/seed/programs.ts:11` stamps hardcoded constants with a same-day `retrievedAt` (no retrieval
  happened); €1,500 BW restated in 3 places (drift risk). *Rec:* don't stamp constants; single source.
- `data/band-descriptors.ts:77` GENERIC writing rubric has blank `source_url` but renders like a sourced
  one (fallback for TestDaF/Goethe/GRE/GMAT). *Rec:* label "internal heuristic, not an official rubric".
- `exam-specs.ts` declares a `"tdn"` scale with **no scoring branch** → TestDaF yields no TDN band (dead).

## P3 — Polish
- **Owner-Mode bridge** binds `0.0.0.0` (no host arg, `server.mjs:183`) not `127.0.0.1` → on an untrusted
  LAN another host can curl `:8787/generate` and spend the operator's Claude quota (CORS doesn't stop a
  non-browser client). *Rec:* `server.listen(PORT, "127.0.0.1")`. **(Operator-local, never deployed — but
  a real "burn money" vector on shared networks; arguably P2 for shared-network users.)**
- **Bridge tunnel allowlist** trusts the entire `*.trycloudflare.com` wildcard (`server.mjs:97`) — pin the
  exact tunnel hostname.
- **Résumé prompt-injection** is contained (Zod-validated output + mandatory human review + no tool-use/
  secrets in context) — *informational*; harden later with delimiter + "treat as data" guard.
- Dual identity sources (`syncedStore` + `userScope` both subscribe to auth) can momentarily disagree.
- Tracker user rows can't set url/deadline; Calendar deadlines can't pick a category; SOP placeholder
  references a nonexistent "Generate draft" button; LOR sr-only label says "(editable)" on a `readOnly`
  textarea; `DocActions` copy-toast `setTimeout` not cleared on unmount; split-divider lacks End/PageUp;
  ThemeToggle radiogroup lacks roving-tabindex; Dashboard bare emoji read aloud; the 404 page is
  unreachable while signed out (catch-all is inside AppGate).

---

## Verified CLEAN (do not re-report)
- **Data isolation**: per-user namespaced + reset on every auth transition; audio cache cleared on scope
  change; legacy key migrated/removed.
- **Keys/secrets**: BYOK keys only in localStorage, sent only to each provider's own endpoint; never
  logged; CI secret-scan fails the build on a leak; no `.env` with real secrets tracked.
- **Bridge**: `ANTHROPIC_API_KEY` deleted from child env; CLI args hardcoded (no command injection via
  model/prompt); path-traversal containment on static serve.
- **RLS/anon key**: only the public anon key client-side; no service-role anywhere; all writes attach
  `user_id` from `auth.getUser()`.
- **XSS/input**: React auto-escapes; no `dangerouslySetInnerHTML`/`eval`/`innerHTML`; résumé upload size-
  capped (8 MB) + type-restricted + client-side only.
- **Deterministic maths**: Modified Bavarian GPA, ECTS, cost-of-living, deadlines, raw→band/TOEFL-1–6/
  half-band all correct, tested, division-by-zero-safe; deadlines avoid the UTC off-by-one.
- **Stale-fact sweep**: all 2026 values current + grounded (Sperrkonto €11,904, Deutschlandticket €63,
  work 140/280, visa €75, TOEFL-2026). No 11,208/120/240/58 anywhere.
- **Empty states**: Dashboard gates on `isProfileStarted` (guarded by a build-failing no-placeholder test);
  Profile Overview labels its sample "Beispiel · Sample"; ExamTracker has an honest empty state.
- **Routing**: no AppGate redirect loop; HashRouter env-gated for Pages; global Suspense + ErrorBoundary.
- **AI**: outputs Zod-validated; uniform loading/error/no-provider; generation fallback ladder (live →
  retry → seed bank); AI-generate buttons guard double-submit (`disabled={ai.loading}` + aria-busy).
- **A11y primitives**: Progress/Tabs/Button/Alert well-built; IntakeFields fully labelled; Sidebar nav +
  skip-link; reduced-motion honoured across all framer-motion; icon-only buttons carry aria-labels.

## CLAUDE.md golden-rule cross-check
- **Never fabricate official facts** → 1 violation: **P0-2** (APS ≥70% to a 2022 source). All other
  official figures grounded + `needs_verification`.
- **Provenance on every official claim** → **P0-2** drops `needsVerification`; P2 nits (programs
  `retrievedAt`, generic rubric blank source).
- **Deterministic math, not model-computed** → ✅ clean.
- **Structured outputs only (Zod)** → ✅ clean.
- **PII never logged** → ✅ clean (ErrorBoundary logs message + stack only).
- **Disclaimer on visa/finance** → ✅ present on all 13 pages.
- **No secrets in code** → ✅ clean.
- **Honest empty states (no garbage)** → 1 violation: **P0-1** (SkillGap mock gaps); Dashboard/Overview
  clean.
