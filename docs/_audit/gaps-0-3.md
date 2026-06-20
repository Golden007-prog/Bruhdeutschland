# Gap Analysis — Journey Phases 0–3 (Orientation → Foundations → Discovery → Tests)

> Scope: Phase 0 (Orientation), Phase 1 (Foundations / school-leavers), Phase 2 (Discovery & shortlisting),
> Phase 3 (Tests). Walked end-to-end as three personas: (a) Class-12 India school-leaver, (b) Class-10
> student (must be honestly blocked — verified), (c) Master's applicant from Bangladesh (no APS).
> **Find & document only — no code changed.** Every "exists/partial/missing" verdict cites `file:line`.

## Method & persona walk (what already works — do NOT re-build)

The app is unusually complete for Phases 0–3. Confirmed working before declaring any gap:

- **Phase 0 eligibility quick-check** — real, deterministic, no-signup, grounded. `pages/start/Eligibility.tsx`
  drives `lib/pathway/pathway.ts:338` (`evaluatePathway`). (Work-order #1 — DONE.)
- **Reverse timeline planner** — `pages/start/TimelinePlanner.tsx` + `lib/calc/reverseTimeline.ts`. (#2 — DONE.)
- **Total-journey budget** — grounded one-time + recurring, seeded with official constants
  (`pages/start/Budget.tsx:13,26-32`; `lib/calc/journeyBudget.ts:77-117`). (#3 — DONE.)
- **Field → career-outcome explorer** — `pages/career/Outcomes.tsx`, qualitative + Blue-Card-anchored,
  no fabricated salaries. (#4 — DONE.)
- **Uni-type explainer (Uni/TU/FH/private)** — `pages/career/EducationSystem.tsx:9-13`. (#5 — DONE.)
- **Starting-point assessment → first actions** — interest self-check `pages/career/Counseling.tsx:53-102`
  + deterministic next-3-actions `pages/overview/NextActions.tsx:36-49`. (#6 — DONE, see GAP-0-04 nuance.)
- **Feasibility "reality check"** — `pages/start/Feasibility.tsx` + `lib/calc/feasibility.ts`.
- **Recognition (anabin/HZB)** — `pages/profile/Recognition.tsx`. (#7 — DONE as orientation.)
- **Studienkolleg finder + Kurs selector** — `pages/profile/Studienkolleg.tsx` + `lib/pathway/kurs.ts`. (#8 — partial; see GAP-1-02.)
- **German A1→C1 plan + placement self-check** — `pages/language/GermanPlan.tsx`, `Placement.tsx`. (#9 — partial; see GAP-1-03.)
- **TestAS guide** — `pages/language/TestAs.tsx` (guide only; see GAP-3-04).
- **Grade-scenario / GPA→German grade** — `pages/profile/Evaluate.tsx` + `lib/calc/gpa` (Modified Bavarian).
- **Reach/Match/Safety shortlist** — `pages/profile/Shortlist.tsx` on honest `eligibility()` rollup
  (`lib/programs/eligibility.ts:137-148`). (#13 — DONE.)
- **Per-programme requirement capture** — `pages/documents/Requirements.tsx` (#14 — manual paste; see GAP-2-01).
- **Supervisor/lab finder** — `pages/profile/Supervisors.tsx`. (#15 — DONE.)
- **City explorer** — `pages/profile/Cities.tsx` on `CITY_PROFILES`. (#16 — DONE.)
- **Application-cost estimator** — `pages/finance/ApplicationCosts.tsx`. (#17 — DONE.)
- **Mock exam centre + post-hoc analytics** — `pages/language/ExamsHub.tsx`, `ExamTracker.tsx`. (#19 partial; see GAP-3-01.)
- **Speaking capture (STT) feeding AI rubric in mocks** — `features/mock/SpeakingTask.tsx`. (#21 partial; see GAP-3-03.)

**Persona verdicts:**
- **Class-12 India** — correctly routed to Studienkolleg+FSP by default with direct-entry carve-outs
  (`pathway.ts:406-414`). The orientation tools all fire. Gaps are downstream (test scheduling, Studienkolleg
  shortlist, TestAS practice, Aufnahmeprüfung readiness).
- **Class-10** — **honestly blocked**, verified: `pathway.ts:363-380` returns `route:"blocked"`, "Finish Class
  12 first", with `tone:"block"`; `feasibility.ts:62-71` returns score 0 / band "blocked". No false hope. (PASS.)
- **Master's, Bangladesh (no APS)** — APS correctly *not required* for Bangladesh
  (`lib/country/country.ts` `apsStatusFor`; APS doc dropped in `lib/intake/derive.ts:46`); direct-entry note is
  Bangladesh-specific (`pathway.ts:123,133`). Gaps are the missing English-test scheduling and the
  Bangladesh-specific document/recognition nuances (see GAP-1-01, GAP-3-02).

---

## GAPS

### GAP-0-01 · Phase 0 · Programme-data freshness & coverage banner ("can I even find MY field?")
- **Why a real student needs it:** Orientation tools promise routes, but Discovery runs on a **curated 35-row**
  program set (`pages/profile/Matching.tsx:241` shows "bundled curated set"). A Bangladesh data-science applicant
  who searches an unusual field gets few/zero hits and cannot tell whether that means "no such programme in
  Germany" or "our sample is small." That ambiguity erodes trust at the exact moment a student decides to commit.
- **Data used:** existing `programs` table / `useProgramData`; add a count + "sample vs. authoritative directory"
  callout and deep links to DAAD/Hochschulkompass scoped to the user's `targetField`.
- **Priority:** should · **Effort:** S · **Deps:** none.
- **Acceptance:** (1) empty/low-result state explains the curated-sample limitation; (2) offers a one-click
  DAAD/Hochschulkompass search pre-filled with field + level + language; (3) never implies the 35 rows are
  exhaustive; (4) provenance/"verify on official directory" preserved.
- **Grounding:** DAAD & Hochschulkompass are the cited authoritative directories — link, don't assert counts.

### GAP-0-02 · Phase 0 · Save/share the orientation verdict (eligibility + feasibility + timeline)
- **Why:** All three Phase-0 tools are **stateless** — `Eligibility.tsx` keeps result in component `useState`
  only; refresh loses it, and there's no way to carry the verdict into the signed-in plan or share it with a
  parent/agent who funds the journey. Real students re-run the same four answers repeatedly.
- **Data used:** persist last eligibility/feasibility inputs+verdict to profile/account (`intake_submissions` or
  `account_memory`); render a shareable read-only summary.
- **Priority:** should · **Effort:** M · **Deps:** auth/profile persistence.
- **Acceptance:** (1) verdict persists across refresh for a signed-in user; (2) "use these answers in my plan"
  pre-fills Settings; (3) export/print or copyable summary; (4) per-user isolation respected (no cross-account leak).
- **Grounding:** none (echoes the already-grounded pathway notes).

### GAP-0-03 · Phase 0 · "What will this realistically cost in stress/time?" — risk & commitment briefing
- **Why:** Budget covers money and Feasibility covers years, but no tool sets honest expectations on **process
  risk**: visa-appointment waits (months), Studienkolleg competitiveness, APS lead time, refusal/gap-year
  scenarios. A Class-12 applicant routinely under-budgets *time risk* and applies for an intake that's already
  impossible. Feasibility hints at this in caveats but there's no consolidated "before you commit" briefing.
- **Data used:** existing pathway caveats + reverse-timeline overdue logic; surface a single "commitment reality"
  panel combining route risk + earliest viable intake.
- **Priority:** could · **Effort:** S · **Deps:** GAP-0-02 helps.
- **Acceptance:** (1) shows earliest *viable* intake given today's date (reuse `reverseTimeline` overdue);
  (2) lists the top 3 process risks for the user's route; (3) all framed as heuristics, not predictions.
- **Grounding:** appointment-wait/APS-lead-time figures must be `needs_verification` or omitted.

### GAP-0-04 · Phase 0 · Personalised "first 5 concrete actions" output from the interest self-check
- **Why:** Work-order #6 asks the starting-point assessment to output **first 5 actions**. `Counseling.tsx:81-102`
  outputs ranked *fields*; `NextActions.tsx` outputs *milestones* but only after a profile exists. A brand-new
  visitor who just did the interest check gets fields, not "here are your 5 next clicks." The two are not wired:
  Counseling → fields, but doesn't seed the profile so NextActions can personalise.
- **Data used:** write `Counseling` results (suggested field, demand flag) into profile so `NextActions`/Matching
  pick them up; emit a 5-step starter list inline.
- **Priority:** should · **Effort:** S · **Deps:** profile write.
- **Acceptance:** (1) interest check offers "save these fields to my profile"; (2) shows 5 concrete next actions
  immediately; (3) Matching default subject group reflects the chosen field; (4) deterministic, no fabrication.
- **Grounding:** none.

### GAP-1-01 · Phase 1 · Country-specific recognition deep-dive (India HSC / Bangladesh HSC vs. anabin)
- **Why:** Recognition is the make-or-break Phase-1 fact. `Recognition.tsx` + `pathway.ts` explain the HZB
  categories generically and link anabin, but a real Class-12 India / Bangladesh applicant needs the
  **country-specific** read: "Indian HSC is generally not Abitur-equivalent → Studienkolleg unless carve-out";
  "Bangladesh HSC similar; ~2 yrs uni for direct." The pathway engine *has* this logic (`pathway.ts:123,133,
  406-414`) but it's only reachable through the routing flow, not as a browsable per-country recognition guide,
  and there's no India-specific raised-70%-from-WS2026/27 prominence outside the Studienkolleg branch.
- **Data used:** `lib/country/country.ts`, `pathway.ts` notes; a per-country recognition page keyed off
  `homeCountry`.
- **Priority:** should · **Effort:** M · **Deps:** none.
- **Acceptance:** (1) per-country card (India, Bangladesh at minimum) with HSC→HZB verdict; (2) anabin self-check
  steps; (3) the WS2026/27 raised-minimum warning shown for India with `needs_verification`; (4) every threshold
  carries provenance or `needs_verification`.
- **Grounding:** anabin category, India ~70% WS2026/27, Bangladesh ~2-yr rule — all `needs_verification`/cited.

### GAP-1-02 · Phase 1 · Actual Studienkolleg directory (which colleges, where, which Kurs, how to apply)
- **Why:** `Studienkolleg.tsx` + `kurs.ts` explain the *concept* and pick the right Kurs stream, but a school-leaver
  cannot act without a **list of real state Studienkollegs**, their locations, Kurs offered, and that you apply
  *through a university/uni-assist* not the college. Without this the "route" is theory; the student googles blindly.
- **Data used:** a seeded, provenance-stamped Studienkolleg list (public/uni-affiliated), filterable by Kurs +
  Bundesland; reuse the program-card/eligibility UI pattern.
- **Priority:** must · **Effort:** L · **Deps:** seed data + provenance.
- **Acceptance:** (1) browsable list of state Studienkollegs with city/Bundesland/Kurs; (2) "apply via the
  university, not the college" stated; (3) each entry links to its official page; (4) public-vs-private flagged;
  (5) entries carry `{source_name, source_url, retrieved_at}` or `needs_verification`.
- **Grounding:** every college entry must cite an official source; do not fabricate Kurs availability.

### GAP-1-03 · Phase 1 · Interactive German learning (exercises/quizzes), not just a plan + phrase list
- **Why:** `German.tsx` is a static can-do + example-phrase reference with TTS (`German.tsx:62-119`); `GermanPlan.tsx`
  is a plan with hours/milestones; `Flashcards.tsx` has a 12-card seed deck (`seed/language.ts:125-138`). There is
  **no graded practice** (fill-in, listening comprehension, grammar drills, progress-gated lessons). A real A1→B1
  learner needs actual exercises to progress; the app currently sends them elsewhere to learn and only *tracks* a plan.
- **Data used:** new exercise content (seeded) + per-item progress in `srs_cards`/a lessons table; optional AI-generated
  drills via the existing `useGenerate` path with Zod validation.
- **Priority:** should · **Effort:** L · **Deps:** content authoring or AI generation guardrails.
- **Acceptance:** (1) at least one interactive exercise type per CEFR level; (2) immediate feedback; (3) progress
  persists per user; (4) AI-generated items validated + labelled; (5) no claim of certification-equivalence.
- **Grounding:** none (practice content); keep "B2/C1 is the bar" facts grounded as today.

### GAP-1-04 · Phase 1 · ECTS / credit-gap analyzer wired to the 180-ECTS Master's bridge
- **Why:** `pages/profile/Ects.tsx` totals/normalises credits, and `pathway.ts:206-213` (`ECTS_BRIDGE_NOTE`) explains
  the three bridges when a 3-year Bachelor is <180 ECTS — but the two aren't connected. A Bangladesh/India 3-year-degree
  Master's applicant (the #1 real blocker) isn't told *"your computed total is 168 → here are your three documented
  options"*. The math exists; the actionable verdict for direct entry does not.
- **Data used:** `ECTSCalculator` output + `ECTS_BRIDGE_NOTE`; compute shortfall vs. 180 and surface bridges.
- **Priority:** should · **Effort:** M · **Deps:** ECTS calc.
- **Acceptance:** (1) when ECTS < 180, show the gap and the three bridges; (2) per-programme acceptance framed as
  verify-only; (3) deterministic shortfall math; (4) `needs_verification` on the 180 expectation.
- **Grounding:** 180-ECTS expectation is per-programme → `needs_verification`/cited.

### GAP-2-01 · Phase 2 · Auto-extract per-programme requirements into a checklist (not manual paste)
- **Why:** `Requirements.tsx` is a manual paste box (`Requirements.tsx:64-66`). Work-order #14 wants a per-programme
  **auto-checklist**: from the shortlisted programme's known fields (language, tests, degree, deadline) generate the
  document/task checklist automatically, with manual paste only for the rest. A student with 8 shortlisted programmes
  will not hand-transcribe 8 requirement blobs; they need the structured fields pre-filled from program data.
- **Data used:** `programs` row fields + `eligibility()` criteria → seed a per-app checklist; merge with shortlist/tracker.
- **Priority:** should · **Effort:** M · **Deps:** shortlist + program data.
- **Acceptance:** (1) selecting a shortlisted programme pre-fills known requirements; (2) generates a checklist of
  documents/tests with status; (3) manual notes still allowed; (4) official page remains source of truth; (5) per-user persisted.
- **Grounding:** indicative requirements only — link the official programme page; no invented thresholds.

### GAP-2-02 · Phase 2 · Per-programme / city outcomes where groundable (alumni / employability signal)
- **Why:** Work-order #18. `Outcomes.tsx` gives **field-level** demand, but Discovery offers no programme- or
  city-level outcome signal (e.g. "this TU has strong industry links in <field>") even where a groundable signal
  exists. Students choosing between two admits want more than tuition/city; right now Compare (`Matching.tsx:386-401`)
  shows only logistics. Honest scope: qualitative + cited only.
- **Data used:** optional per-program note field + city job-market qualitative tags (reuse `career/fields`).
- **Priority:** could · **Effort:** M · **Deps:** seed data.
- **Acceptance:** (1) any outcome claim is qualitative + cited or omitted; (2) no fabricated salaries/placement rates;
  (3) absence shown honestly ("no grounded outcome data for this programme").
- **Grounding:** strict — only `make-it-in-germany`/official signals; otherwise show nothing.

### GAP-2-03 · Phase 2 · Application-cost & feasibility loop closes back to the budget
- **Why:** `Shortlist.tsx:128` and `ApplicationCosts.tsx` exist, but the **shortlist size doesn't feed the
  Phase-0 total-journey budget**. A student who shortlists 10 programmes (uni-assist + APS fees scale per app)
  never sees the budget update; the orientation budget and the real shortlist diverge. The pieces exist but the
  data isn't joined.
- **Data used:** shortlist count + `ApplicationCosts` → `journeyBudget` one-time line.
- **Priority:** could · **Effort:** S · **Deps:** GAP-0-02 persistence helps.
- **Acceptance:** (1) budget reflects actual shortlist count for uni-assist/APS fees; (2) deterministic; (3) all
  fee constants grounded as today.
- **Grounding:** uni-assist/APS fees already grounded — reuse, don't re-assert.

### GAP-3-01 · Phase 3 · Unified test dashboard: every test the student needs, with target + date + readiness gate
- **Why:** **The biggest Phase-3 gap.** Three separate surfaces exist — `ExamsHub.tsx` (launches mocks),
  `ExamTracker.tsx` (post-hoc analytics, manual single target band at `ExamTracker.tsx:118-129`), and
  `recommendedTests()` (`lib/intake/derive.ts:68-94`, returns *which* tests, no date/target). **No single page**
  says: *"For your pathway you need (a) IELTS — target 6.5, sit by <date>, you're 60% ready; (b) TestAS — by
  <date>, not started."* Work-order #19 and #23 (readiness gate). A real applicant juggling IELTS + TestDaF +
  TestAS with different deadlines has no consolidated cockpit and will miss a sitting.
- **Data used:** `recommendedTests(profile)` + per-test target (from program eligibility) + `reverseTimeline` test
  dates + `ExamTracker` predicted readiness → one dashboard. Persist targets/dates per user.
- **Priority:** must · **Effort:** L · **Deps:** recommendedTests, reverseTimeline, exam analytics.
- **Acceptance:** (1) lists every test the pathway requires with status (not-started/practising/ready); (2) each has
  an editable target + a planned sit-by date derived from the chosen intake; (3) a readiness signal per test from
  mock analytics; (4) a "ready to book" gate when readiness ≥ target; (5) deterministic; predictions carry the
  standing disclaimer; (6) per-user persisted.
- **Grounding:** target thresholds are per-programme → `needs_verification`; no fabricated "official" pass marks.

### GAP-3-02 · Phase 3 · Test requirement resolver: "does MY shortlist actually need this test?"
- **Why:** `recommendedTests()` is heuristic from level + medium-of-instruction. It can't tell a Bangladesh
  English-medium Master's applicant whether their specific shortlist **waives IELTS** (many do for English-medium
  degrees) or demands it. Students over-prepare (waste money on a test their programmes waive) or under-prepare.
  The eligibility engine knows per-programme test flags (`eligibility.ts:65-69`) but that isn't aggregated into a
  "across your shortlist, X require IELTS, Y waive it" answer.
- **Data used:** `eligibility()` per-program test criteria aggregated over the shortlist.
- **Priority:** should · **Effort:** M · **Deps:** shortlist + eligibility.
- **Acceptance:** (1) per-test "required by N of your M shortlisted programmes; waived by K"; (2) medium-of-instruction
  waiver flagged as verify-per-programme; (3) deterministic; (4) official page is source of truth.
- **Grounding:** waiver rules per-programme → `needs_verification`.

### GAP-3-03 · Phase 3 · Live AI speaking examiner (interactive back-and-forth), distinct from in-mock STT capture
- **Why:** Work-order #21 ("Live AI speaking examiner"). Today `SpeakingTask.tsx` records a single answer + STT
  transcript that *later* feeds an AI rubric inside a mock — it's one-shot capture, not an **interactive examiner**
  that asks a follow-up, reacts, and conducts an IELTS-style Part-3 / TestDaF speaking conversation. Speaking is the
  hardest section to self-prepare; one-shot capture under-serves it.
- **Data used:** existing TTS (`lib/speech/tts.ts`) + STT (`lib/speech/stt.ts`) + an AI turn-loop with Zod-validated
  rubric; reuse mock band descriptors.
- **Priority:** should · **Effort:** L · **Deps:** AI provider + STT/TTS (Chrome/Edge; Firefox fallback to typed).
- **Acceptance:** (1) multi-turn spoken exchange with follow-ups; (2) per-criterion feedback validated by Zod;
  (3) graceful no-STT / no-AI-provider fallbacks; (4) no claim it predicts the official score; (5) audio handled
  per the existing autoplay/once rules.
- **Grounding:** none (practice); keep band-descriptor facts as today.

### GAP-3-04 · Phase 3 · TestAS / TestDaF / Goethe actual practice items (not guide-only)
- **Why:** `TestAs.tsx` is a guide with no practice questions; for non-EU Bachelor/Medicine applicants TestAS is
  often **mandatory** (`derive.ts:87-89`). The mock centre covers IELTS/TOEFL/TestDaF/Goethe/GRE/GMAT
  (`ExamsHub.tsx:21-70`) but **not TestAS** at all, and the TestDaF/Goethe seed sets may be thin. A Studienkolleg-
  bound Class-12 India applicant has nowhere to practise TestAS in-app.
- **Data used:** seeded TestAS core+subject practice items into the existing `EXAM_SPECS`/seed-forms pipeline;
  expand TestDaF/Goethe banks.
- **Priority:** should · **Effort:** L · **Deps:** content authoring within the mock framework.
- **Acceptance:** (1) a TestAS practice runner exists in the mock centre; (2) core + ≥1 subject module modelled;
  (3) "study aid, not real test" disclaimer as elsewhere; (4) scoring mapped to the right scale.
- **Grounding:** practice items original; format/scale facts cited as in other exams.

### GAP-3-05 · Phase 3 · Test-center locator + exam-date reminders (sittings, not personal deadlines)
- **Why:** Work-order #20. No surface helps a student **find where/when to sit** IELTS/TOEFL/TestDaF/TestAS or set
  a reminder for the sitting itself. `Reminders.tsx` tracks personal deadlines (visa, enrolment, renewals) but not
  exam sittings. A real applicant must book a physical/centre slot weeks ahead; missing the window slips a whole
  intake.
- **Data used:** link out to official test-center finders (IELTS/TestDaF/TestAS) by city/country; add an
  exam-sitting reminder type to the existing reminders/deadlines store.
- **Priority:** should · **Effort:** M · **Deps:** reminders/deadlines store.
- **Acceptance:** (1) official test-center finder links per test, scoped by user country/city where possible;
  (2) user can add a "sit IELTS on <date>" reminder that flows into the calendar/.ics export; (3) lead-time guidance
  framed as `needs_verification`; (4) no fabricated center lists.
- **Grounding:** center locations/dates come from the official test owner — link, don't assert.

### GAP-3-06 · Phase 3 · Aufnahmeprüfung / FSP readiness gate tied to the Studienkolleg route
- **Why:** For the Class-12 school-leaver, the **Aufnahmeprüfung** (Studienkolleg entrance) and later the **FSP**
  are the real Phase-1/3 exams — `pages/language/Aufnahmepruefung.tsx` and `Fsp.tsx` exist as guides/trackers, but
  there's no **readiness gate** ("you're at B1, the Aufnahmeprüfung expects B1–B2 + subject basics → not ready")
  that ties German level + subject prep to a go/no-go, the way GAP-3-01 does for international tests. The
  school-leaver's most important test has the weakest readiness signal.
- **Data used:** German placement level + FSP/Aufnahmeprüfung subject trackers → a readiness verdict.
- **Priority:** could · **Effort:** M · **Deps:** placement + FSP tracker.
- **Acceptance:** (1) readiness verdict from German level + subject-prep progress; (2) honest "not ready / on track";
  (3) deterministic; (4) thresholds `needs_verification`.
- **Grounding:** entrance-exam level expectations per college → `needs_verification`.

---

## Summary
16 genuine gaps across Phases 0–3 (GAP-0-01..04, GAP-1-01..04, GAP-2-01..03, GAP-3-01..06). None duplicate an
existing feature (each cites where the partial/absent boundary is). The highest-leverage **must-fix** items are
GAP-1-02 (real Studienkolleg directory — the school-leaver route is currently theory) and GAP-3-01 (unified test
dashboard with target+date+readiness — the Phase-3 cockpit is missing).
