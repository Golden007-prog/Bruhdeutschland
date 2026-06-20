# DeutschPrep — Fresh Gap Analysis, Journey Phases 0–3

> Independent audit (Orientation → Foundations → Discovery → Tests). Findings formed from a
> direct read of the shipped code, not from any prior register. Personas walked: **P1** Class-12
> India school-leaver, **P2** Class-10 student (must be honestly blocked), **P3** Bangladesh
> Master's applicant (no APS). A page existing is not "done" — every item below is either a
> **missing surface** or a **real partial / depth / failure-path boundary** on a shipped page,
> with `file:line` evidence.

## Method & ground truth

- Route map confirmed in `frontend/src/lib/nav.tsx` (~125 routes). Phase 0–3 surfaces all exist
  as real pages.
- The **pathway engine** (`lib/pathway/pathway.ts`) is genuinely deep and persona-correct:
  Class-10 → `blocked` (pathway.ts:363), India/Bangladesh Class-12 → Studienkolleg with the
  WS-2026/27 raised-70% note (pathway.ts:69, 406), non-linear diploma/lateral routes wired
  (pathway.ts:342). This is **not** a gap area — it is the strongest part of phases 0–3.
- **Verified dataset facts:** 35 seed programmes = **6 Bachelor / 24 Master / 5 Medicine**
  (`grep courseType` on `lib/seed/programs.ts`). Mock-exam routes are only IELTS, TOEFL,
  TOEFL-legacy, TestDaF, Goethe, GRE, GMAT (`nav.tsx`) — **no TestAS, no TMS**. No language page
  imports `evaluatePathway` (grep) → the test layer is **not** linked to the user's pathway.

## Severity / priority key

- **must** = a real student in one of the three personas is *blocked* or *materially misled*
  without it. **should** = significant friction or a depth shortfall that pushes the user out of
  the app. **could** = nice-to-have polish/coverage.
- Effort: **S** ≤ ~½ day, **M** ~1–3 days, **L** > 3 days (new dataset/engine work).

---

## PHASE 0 — Orientation ("can I even?")

Maturity: **strong routing core, thin route-aware follow-through.** Eligibility + Feasibility
route all three personas correctly and are grounded. The downstream planners (Timeline, Budget)
treat every route as a *direct-admission Master's* and silently understate the Studienkolleg
school-leaver's reality.

### G0-1 · Route-aware reverse timeline (Studienkolleg / FSP arc) · refines:/start/timeline-planner
- **Why:** `TIMELINE_MILESTONES` is a single hard-coded 14→0-month arc for direct admission
  (`lib/calc/reverseTimeline.ts:30-40`). `reverseTimeline()` takes only `(season, year)` —
  there is no `route` parameter (`reverseTimeline.ts:68`). A P1 Class-12 student routed to
  Studienkolleg is handed the *same* arc as a P3 direct-Master's applicant, with no
  Aufnahmeprüfung, no 1-year Studienkolleg, no FSP milestone. Real lead is ~12–14 months longer;
  the planner hides that.
- **Data:** `profile` route from `evaluatePathway`; per-route milestone sets.
- **Priority:** must · **Effort:** M · **Deps:** pathway engine (exists)
- **Acceptance:** for a Studienkolleg route the planner inserts B1→entrance-exam, Studienkolleg
  year, and FSP milestones ahead of "apply"; for Medicine it lengthens further; direct routes
  unchanged. Total span reflects the route.
- **Grounding:** Studienkolleg/FSP durations flagged `needs_verification` (vary by college).

### G0-2 · Route- & Studienkolleg-aware budget (months + FSP/Semesterbeitrag lines) · refines:/start/budget
- **Why:** `computeJourneyBudget` has no Studienkolleg cost line and `months` is caller-supplied
  (`lib/calc/journeyBudget.ts:38,94-102`); `Budget.tsx` sets `months` from `targetLevel` only,
  not route. A Studienkolleg student under-budgets ~12 extra months of living + the
  Studienkolleg Semesterbeitrag and any private-Kolleg fees. The one-time list (lines 94-101) has
  no Studienkolleg/FSP/Aufnahmeprüfung line at all.
- **Priority:** must · **Effort:** M · **Deps:** G0-1 route signal
- **Acceptance:** when route = studienkolleg, `months` includes the prep+Kolleg year and a
  "Studienkolleg / FSP" one-time line appears (public ≈ Semesterbeitrag only, private flagged).
- **Grounding:** fees `needs_verification`; public-vs-private distinction surfaced.

### G0-3 · Class-10 orientation landing (the blocked persona's "what now") · NEW
- **Why:** Eligibility correctly returns `blocked` with three steps for Class-10
  (`pathway.ts:363-379`), but Phase-0 hub (`start/Overview.tsx`) and Feasibility offer no
  Class-10-specific surface — the only blocked-persona experience is one red card. P2 needs a
  short "finish Class 12 → then which route" runway (and a clear statement that there is no
  Studienkolleg entry on Class 10). Today they hit a dead-end after the verdict.
- **Priority:** should · **Effort:** S · **Deps:** none
- **Acceptance:** a blocked verdict links to a Class-10 explainer (12th → German A1→B1 → then
  re-run eligibility) instead of terminating.

### G0-4 · Feasibility doesn't gate impossible level/qual combos · refines:/start/feasibility
- **Why:** `Feasibility.tsx` computes a score for whatever profile exists; it does not hard-stop
  a Class-10 + Medicine selection beyond a low score. The pathway engine knows this is blocked
  (`pathway.ts:363`) but Feasibility shows a number, not "not yet eligible — finish Class 12."
  Risk: a P2 persona reads a "challenging" score as "possible."
- **Priority:** should · **Effort:** S · **Deps:** route already computed in the page
- **Acceptance:** when route = blocked, Feasibility shows the blocked state (already wired for
  `band==="blocked"` at lines 85-92) for *every* blocking combo, driven by the pathway route, not
  only the heuristic band.

### G0-5 · Country-aware Phase-0 defaults (Bangladesh APS = 0, flights origin) · refines:/start/budget
- **Why:** Budget defaults are India-shaped (APS fee default; flight estimate). A P3 Bangladesh
  applicant needs APS = 0 pre-filled (country logic already knows APS is not required for
  Bangladesh) and an origin-appropriate flight hint, instead of editing India defaults.
- **Priority:** could · **Effort:** S · **Deps:** `lib/country` (exists)
- **Acceptance:** APS line pre-zeros for non-APS countries; flight default keyed to home country.

---

## PHASE 1 — Foundations (school-leaver prerequisites)

Maturity: **honest but operationally thin / external-link-heavy.** Every claim is grounded and
correctly frames "anabin decides, we orient." The gap is *next action*: a school-leaver who is
routed to Studienkolleg lands on a concept page + one external link and has nothing to *do* in
the app. The deterministic math (GPA, ECTS) is correct.

### G1-1 · Grade-scenario simulator (% → German grade → which programmes open) · NEW
- **Why:** `Evaluate.tsx` converts the user's *own* entered grade
  (`lib/calc/gpa.ts`, Modified Bavarian) — there is no "what if I score X%" explorer. A P1 student
  planning Class-12 results (or a P3 estimating a final CGPA) cannot see how 60% vs 75% changes
  their German grade and their programme tier. Pathway shows only an indicative HZB grade.
- **Data:** `gpa.ts` (deterministic, exists) + programme grade-tier mapping.
- **Priority:** should · **Effort:** M · **Deps:** programmes dataset
- **Acceptance:** a slider/input over % yields the German grade and an indicative tier band, all
  flagged "indicative, binding = university/anabin."

### G1-2 · Studienkolleg finder actually lists colleges · refines:/profile/studienkolleg
- **Why:** `Studienkolleg.tsx` explains streams (`kurs.ts`) and the apply-through-a-university
  flow, but does not *list* any Studienkollegs — it links to an external site
  (`Studienkolleg.tsx` source link). For P1, the single most important Phase-1 surface, the app
  cannot answer "which public Studienkolleg offers a T-Kurs and where." This is the biggest
  school-leaver dead-end.
- **Data:** curated seed of public Studienkollegs (state, university, Kurse offered, public/private).
- **Priority:** must · **Effort:** L · **Deps:** new seed dataset + grounding
- **Acceptance:** a filterable list by Kurs/state with the host university and an official link;
  each entry `needs_verification`.

### G1-3 · ECTS / credit gap analyzer for direct entry · refines:/profile/ects
- **Why:** `Ects.tsx` + `lib/calc/ects.ts` sum and normalize credits but never compute the *gap*
  to a target (e.g. 120 ECTS held vs 180 expected → "60 short; bridge options"). The pathway
  engine documents the 3-year-Bachelor <180 ECTS bridges (`pathway.ts:206-213`) but ECTS itself
  doesn't quantify the shortfall. P3 (Bangladesh, possibly 3-yr degree) needs this.
- **Priority:** should · **Effort:** M · **Deps:** ects.ts (exists)
- **Acceptance:** user enters/derives held ECTS + a target; tool shows the deficit and links the
  documented bridges, flagged per-programme `needs_verification`.

### G1-4 · German A1→C1 plan: milestones + persisted progress, not static hours · refines:/language/german-plan
- **Why:** `GermanPlan.tsx` content is static level/hours text; progress is a local checklist
  with no checkpoints, no study-hour log, no estimated completion date, and (per
  [[per-user-client-storage]]) progress should be per-user. P1 lives in this plan for ~12 months;
  static text isn't a plan they can *track*.
- **Priority:** should · **Effort:** M · **Deps:** synced store (exists)
- **Acceptance:** per-level checkpoints, an hours/target tracker, and a derived completion-date
  estimate; progress persists per user.

### G1-5 · Recognition pre-filter (country + cert type → likely HZB category) · refines:/profile/recognition
- **Why:** `Recognition.tsx` is a correct, honest "go look it up on anabin yourself" workflow but
  offers zero pre-filtering. A lightweight country+cert→*likely* category hint (clearly
  non-binding) would cut the cognitive load for all three personas before they leave for anabin.
- **Priority:** could · **Effort:** M · **Deps:** curated anabin-category seed
- **Acceptance:** returns a *likely* HZB category with a prominent "anabin/ZAB is binding" caveat
  and `needs_verification`.

---

## PHASE 2 — Discovery & shortlisting

Maturity: **solid search/rank/eligibility engine for Master's-with-profile; thin for
school-leavers and for requirement capture.** The matching, facets, shortlist tiers, and the
deterministic `eligibility()` rollup (`lib/programs/eligibility.ts`) are genuinely good. The gaps
are dataset breadth (Bachelor) and the manual-only requirement workflow.

### G2-1 · Bachelor & Studienkolleg programme coverage is stub-level · refines:/profile/matching (dataset)
- **Why:** Verified **6 Bachelor of 35** seed programmes (`grep courseType programs.ts`), no
  regional/field spread, and **no Studienkolleg entries** to match toward. The entire P1 persona
  — the journey's headline "from scratch" student — has almost nothing to discover. Matching is
  built for Master's (24 entries) and Medicine (5).
- **Priority:** must · **Effort:** L · **Deps:** dataset expansion + grounding
- **Acceptance:** a materially larger Bachelor set across fields/cities/tuition status; each
  programme links to its official page and carries `needs_verification`.

### G2-2 · Per-programme requirement *extractor* (auto-checklist) · refines:/documents/requirements
- **Why:** `Requirements.tsx` (G15) is a manual paste form — the student transcribes the deadline
  and raw requirement text for every programme by hand. There is no parse/extract into a
  structured per-programme checklist. Across a shortlist this is heavy friction for all personas.
- **Priority:** should · **Effort:** M · **Deps:** LLM extract path (BYOK/owner-mode exists)
- **Acceptance:** paste a programme page → structured fields (deadline, language, tests, docs) +
  a generated checklist the student can tick; nothing fabricated (empty = `needs_verification`).

### G2-3 · Bachelor learners get no eligibility hint without a profile · refines:/profile/matching
- **Why:** `Matching.tsx` only renders eligibility when `hasProfile` is true; a profile-less P1
  school-leaver sees plain cards with no "add your Class-12 % to compare" nudge — whereas the
  same `eligibility()` already emits friendly `unknown` + `gapHref` criteria
  (`lib/programs/eligibility.ts:57-76`) that would guide them.
- **Priority:** should · **Effort:** S · **Deps:** eligibility.ts (exists)
- **Acceptance:** profile-less users still see the eligibility scaffold with "add X" prompts.

### G2-4 · City explorer lacks job-market / English-friendliness depth · refines:/profile/cities
- **Why:** `Cities.tsx` draws from ~9 hard-coded city cost lines (`lib/calc/costOfLiving.ts`) —
  rent/food/transport only. No Werkstudent availability by field, post-study prospects, or
  English-friendliness data, which is what a P3 applicant weighing cities actually needs.
- **Priority:** could · **Effort:** M · **Deps:** city dataset expansion (grounded)
- **Acceptance:** each city adds grounded job-market/language signals or an honest "research
  this" pointer; no invented figures.

### G2-5 · Universities explorer is disconnected from matching/shortlist · refines:/universities
- **Why:** `Universities.tsx` runs off its own `UNIVERSITY_PROGRAMS` seed with no path to add a
  found programme into the matching shortlist — the student must re-find it in Matching. Two
  parallel datasets, no sync.
- **Priority:** could · **Effort:** M · **Deps:** unify program data sources
- **Acceptance:** "add to shortlist" from the explorer feeds the same store Matching/Shortlist use.

---

## PHASE 3 — Tests

Maturity: **good single-exam mock runner for 6 English/German exams; missing the connective
tissue** — no pathway-driven "which tests *you* need," no readiness gate, and two
school-leaver/medicine-critical exams (TestAS, TMS) have guide pages but **no mock**. Reading and
Listening auto-score; Writing/Speaking depend on a live LLM and degrade with no offline fallback.

### G3-1 · Unified, pathway-driven test dashboard · refines:/language/exams (+ /language/exam-progress)
- **Why:** No language page imports `evaluatePathway` (grep) — the test layer can't tell a
  student *which* tests their route requires, target scores, or order. `Overview.tsx`/`ExamsHub`
  are link lists; `ExamTracker` aggregates *taken* mocks but isn't pathway-aware. P1 (TestAS +
  German), P3 (IELTS/TOEFL ± German) each need a personalized "your tests, targets, dates,
  readiness" board.
- **Priority:** must · **Effort:** M · **Deps:** pathway engine + exam metadata (exist)
- **Acceptance:** the dashboard reads route + target programmes and lists the required tests with
  target bands and a readiness state per test.

### G3-2 · "Ready to book" readiness gate · refines:/language/exam-progress
- **Why:** `ExamTracker` predicts a band but has no go/no-go checkpoint ("you're at 6.0, target
  7.0 — keep practising" vs "you're consistently above target — book it"). Grep for
  ready/book/gate/threshold in ExamTracker returns nothing. Students risk booking the real,
  expensive exam too early.
- **Priority:** should · **Effort:** S · **Deps:** examProgress predicted band (exists)
- **Acceptance:** per-test gate compares rolling predicted band to the target and renders a clear
  ready / not-ready verdict with the gap.

### G3-3 · TestAS mock · NEW (refines:/language/testas)
- **Why:** `TestAs.tsx` is a guide that explicitly says there's no TestAS mock; no exam route, no
  seed, no spec entry (confirmed: mock routes exclude TestAS). TestAS is the single most
  pathway-critical test for the P1 Class-12 school-leaver (Studienkolleg/Bachelor routes expect
  it) — yet it's the one with no practice.
- **Priority:** should · **Effort:** L · **Deps:** exam runner (exists) + TestAS item bank
- **Acceptance:** a timed core-module mock with scoring; offline seed + optional LLM generation.

### G3-4 · TMS mock · NEW (refines:/language/tms)
- **Why:** `Tms.tsx` is guide-only; no mock route/seed (confirmed). For a Medicine aspirant the
  TMS materially lifts the application, and there's nowhere to practise the subtests in-app.
- **Priority:** could · **Effort:** L · **Deps:** exam runner + TMS subtest bank
- **Acceptance:** at least one timed TMS subtest mock with scoring.

### G3-5 · Test-center locator + booking-date reminders · NEW
- **Why:** Nothing locates IELTS/TOEFL/TestDaF/Goethe/TestAS centres or sets booking-window
  reminders. After a student is "ready" there's no in-app path to the actual sitting; this is the
  bridge from practice to a booked exam, and it's absent.
- **Priority:** should · **Effort:** M · **Deps:** reminders/.ics infra (exists at /reminders)
- **Acceptance:** official booking links per test + a reminder the student can add to their
  calendar; centre data flagged `needs_verification`.

### G3-6 · Writing/Speaking have no offline/no-LLM fallback · refines:/language/exams/*
- **Why:** Reading/Listening auto-score, but Writing and Speaking are only evaluated when an LLM
  provider is connected; with no key/offline the user gets "AI feedback wasn't available" and
  *no* feedback or rubric. Speaking captures a transcript only — no pronunciation/pace signal.
  P3's hardest sections (IELTS Writing/Speaking) thus have the weakest support exactly where it
  matters.
- **Priority:** should · **Effort:** M · **Deps:** static rubric/exemplar bank
- **Acceptance:** when no LLM is available, Writing/Speaking still show a band-descriptor rubric
  and self-check checklist instead of a dead end.

---

## Out of scope confirmed-strong (not gaps)

- Pathway routing for all three personas incl. Class-10 block, non-linear diploma/lateral, India
  vs Bangladesh APS, raised-70% note (`lib/pathway/pathway.ts`).
- Eligibility rollup with honest `unknown`/`needs_verification` and deterministic GPA/ECTS
  (`lib/programs/eligibility.ts`, `lib/calc/gpa.ts`, `lib/calc/ects.ts`).
- Search/rank/facets and reach/match/safety tiering (`lib/programs/search.ts`,
  `pages/profile/Shortlist.tsx`).
- The single-exam mock runner, scoring, and progress analytics for the 6 supported exams.
