# DeutschPrep — Unified Build + Fix Roadmap

One prioritized sequence merging the defect register (`qa-findings.md`) and the missing-feature register
(`gap-analysis.md`) along the student journey. Rule of order: **P0 defects → journey-critical P1 → "must"
gaps that unblock a real student → P2 correctness/a11y/perf → P3 polish.** Each line shows id + rough
effort (S<½d · M~1–3d · L~1wk+).

## Wave 0 — Honesty & data-integrity P0s (do first; ~½ day total)
- **QA P0-1** SkillGap: gate/relabel so a fresh user never sees the Jane-Doe mock as their own gaps. (S)
- **QA P0-2** APS-India: make `apsStatusFor` carry `needsVerification:true` (render unstamped) and
  re-ground/remove the explicit "≥70%" cited-as-truth. (S)

## Wave 1 — Journey-critical P1 (data loss + broken/inaccessible features; ~2–3 days)
- **QA P1-1** Add `storageKey` to the visa / VPD / translation checklists (distinct keys); make
  `storageKey` required to prevent recurrence. (S)
- **QA P1-2** IELTS overall band: relabel "objective (L+R) band" or fold rubric W/S bands into the mean. (S/M)
- **QA P1-4** WorkExperienceEditor: real labels on every input (a11y blocker). (S)
- **QA P1-3** Visa simulator: wire `createRecognizer` (STT) with typed fallback, or fix the "dictate"
  copy. (S/M)
- **QA P2 (correctness, fold in here)** exam double-submit guard; speaking-answer append-not-replace;
  empty-section `superRefine`; "Add to tracker" dedupe + confirmation; Parse 8 MB enforce + reset-confirm;
  ExamTracker/model-config re-read on `onScopeChange`. (each S)

## Wave 2 — Orientation top-of-funnel "must" gaps (turn visitors into users; ~1 wk)
- **G01** Instant eligibility quick-check (reuse `evaluatePathway`, no signup). (S)
- **G03** Reverse timeline planner (target intake+year → back-dated milestones from the pathway steps). (M)
- **G04** Total-journey budget calculator (one-time fees + Sperrkonto + CoL; needs a grounded fee dataset). (M)
- **G02** Reality-score / years-to-finish feasibility gate. (M)
- *(Supports the data-engine: these consume fields already collected.)*

## Wave 3 — Foundations for school-leavers (the thinnest persona path; ~2 wk)
- **G05** anabin / HZB recognition checker (new dataset). (L)
- **G06** Studienkolleg finder (colleges + Kurs + public/private + deadlines; new dataset). (M)
- **G09** Structured German A1→C1 plan with progress (extend beyond static phrase cards; reach C1). (L)
- **G07/G08/G10** Aufnahmeprüfung + FSP prep + German placement test. (M each)
- **G11** TestAS prep module (the mock centre has no TestAS). (M)

## Wave 4 — Discovery & application depth ("must" gaps; ~2 wk)
- **G14** Reach/match/safety shortlist builder (on top of the eligibility rollup). (M)
- **G20** LOR request tracker (uses the recommender counts already collected). (S)
- **G25** Admission-letter (Zulassungsbescheid) interpreter + **G26** offer comparison board. (M each)
- **G27** Enrolment / Immatrikulation guide (closes the offer→arrival gap). (M)
- **G29** Education-loan comparison (#1 path for Indian students). (M)

## Wave 5 — The Arrival → Ongoing tail (largest contiguous gap; ~3 wk)
The roadmap currently ends at "relocate". Build the tail every persona needs after arrival:
- **G38** German bank-account guide · **G39** Residence-permit (Aufenthaltstitel) conversion tracker ·
  **G40** Ausländerbehörde appointment/doc tracker · **G42** Anmeldung booker / city runbook ·
  **G41** University onboarding checklist. (S–M each)
- **G44** 18-month job-seeker permit planner · **G45** Family-reunion guide (uses `dependents`) ·
  **G46** renewal reminders · **G47** Rückmeldung reminders. (S–M each)
- **G51** Notification/reminder delivery (email/push) — unblocks every tracker/deadline above. (M)

## Wave 6 — Correctness, a11y, perf, locale P2s (harden before scale; ~1 wk)
- A11y: exam timer milestone announcements; MathText `role=math`+label; focus management on section/pill/
  start; Checklist focus ring; modal semantics for the mobile drawer + compare dialog; AiSettings
  `role=alert`; contrast + tap-target fixes.
- Perf: move KaTeX CSS import into `MathText`; swap the shell framer-motion animation for CSS.
- Grounding rigor: drop `retrievedAt` on hardcoded program constants; single-source the €1,500 BW; label
  the generic rubric "internal heuristic"; remove the dead `tdn` scale or add a TDN branch.
- Locale: one shared locale-aware number/date/currency formatter (fix "€11,904" → "11.904 €").

## Wave 7 — P3 polish + strategic bets (ongoing)
- Bridge hardening: `listen(PORT,"127.0.0.1")`, pin the tunnel hostname, résumé-injection delimiter guard.
- The remaining "should/could" gaps (G12–G13, G15–G24, G28, G30–G37, G43, G48–G50) and the P3 polish list.
- **i18n**: if EN/DE is to be real, adopt an i18n library + catalogs (currently cosmetic) — a strategic,
  app-wide effort, not a quick fix.

## Sequencing notes
- **Waves 0–1 are pre-share gating** (the Top-10). Everything after is value/coverage growth.
- The data-engine already collects the fields most of these gaps consume (`UserProfile`, `Program`), so
  many "must" gaps are UI + grounded-dataset work, not model changes.
- Class-10 needs **no** new features (correctly blocked). The career-switcher's collected `workExperiences`
  only get a real destination once **Wave 5** (G44/G48/G49) lands.
