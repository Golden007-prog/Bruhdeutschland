# DeutschPrep — Gap Analysis (v2 Backlog)

> **Read this first.** The journey is **shipped.** Every journey feature exists as a
> route-registered page in `frontend/src/lib/nav.tsx` (~125 routes) — the pathway engine routes all
> three personas correctly (Class-10 → blocked, India/Bangladesh Class-12 → Studienkolleg with the
> raised-70% WS-2026/27 note, non-linear diploma/lateral routes), and the recent **Section-9
> persistence layer** is in place (`useSyncedState` → `syncedStore` is localStorage-first **and**
> mirrors to a per-user `settings.data` JSONB blob in Supabase when signed in; `applications`,
> `roadmap_items` and `deadlines` additionally dual-write to typed tables). **A page existing is not
> "done."** This document is therefore **not** a missing-feature register — it is a **v2 backlog**,
> split into:
>
> - **Section A — Genuinely missing (NEW).** Surfaces with **no page at all** today — each verified
>   against `nav.tsx` and the `frontend/src/pages/**` tree.
> - **Section B — Depth / integration / failure-path refinement on shipped pages.** Every item names
>   the live route it `refines:`.
>
> **Persona framing (least-served first):** **Class-12 India school-leaver** (the journey's headline
> "from scratch" student, today the thinnest-served on dataset + route-aware planning) · **Class-10
> student** (must stay honestly blocked) · **Bangladesh Master's applicant** (no APS) ·
> **career-switcher with work experience** (often 30+) · **Medicine/NC/TMS aspirant** · a **student
> already settling in Germany**. A page that already covers a need is not a gap; refinements say what
> the shipped page still lacks.
>
> **Grounding discipline (CLAUDE.md §2/§3):** any item surfacing an official German fact (visa rules,
> deadlines, thresholds, fees, processing/appeal windows) must be **grounded (source +
> `needs_verification`)** — never assert an official number without provenance. This audit found **no
> fabricated official fact** anywhere in the shipped journey; grounding routes through
> `frontend/src/lib/facts.ts` / `lib/seed/*` as `OfficialFact`s with a `FACTS_RETRIEVED_AT` stamp.

---

## 1. Executive summary

This register is the second, independent audit pass (audit-2). It judges **depth, integration, and
failure paths — not existence**. Of **55** items, **9 are genuinely-missing NEW surfaces** and **46
are refinements** on shipped pages. The journey's happy path is broad and, in phases 7–9, deep; the
backlog concentrates where a real student hits a **wall the app doesn't yet handle** (refusal,
no-appointment, no-job-in-18-months, no-address) or a **re-entry / drift seam** between tools that
should share state.

**Standout structural themes** (each spans several gaps):

1. **Shared programme identity across stores.** Document, application and offer stores
   (`programme:requirements`, `tracker:apps`, `OFFERS_KEY`) don't reference one another, so the
   spine **apply → admit → accept → enrol** is re-entered at every step (G4-01/03, G5-01/03/04,
   G2-5).
2. **One reconciled money total.** The three money tools (application costs, journey budget, funding
   gap) each hold their own numbers; nothing computes "total need" once (G6-03/05), and a literal
   `992` silently duplicates `SPERRKONTO_MONTH_EUR` instead of importing it (finance euro-literal
   drift, G6-03).
3. **Route-aware planners (Studienkolleg).** Timeline and Budget treat every route as a
   direct-admission Master's and hide the school-leaver's extra ~12–14 months + FSP/Semesterbeitrag
   (G0-1/2).
4. **Failure / contingency paths.** The single most damaging boundaries are unhandled: visa refusal
   (G7-01), no-appointment-available (G7-02), no-job-in-18-months (G9-01), permit-loss/out-of-status
   recovery (G9-03), entry-gap insurance (G7-03).
5. **The German job-search execution layer.** The app helps you *qualify* (Blue Card check,
   outcomes) and *network academically*, but has **no surface for finding and applying for a German
   job** (G9-02).
6. **Professional recognition (Approbation).** The largest missing surface in the tail: regulated
   professions (medicine/nursing/law) can finish a degree, clear the salary check, and still be
   legally unable to practise without recognition (G8-01).
7. **The Bachelor / Studienkolleg dataset gap.** Verified **6 Bachelor of 35** seed programmes and
   **zero Studienkolleg entries**; the headline Class-12 persona has almost nothing to discover or
   list (G2-1, G1-2).

### Counts by phase

| Phase | Surface | Items | NEW | refine |
|---|---|---:|---:|---:|
| 0 | Orientation | 5 | 1 | 4 |
| 1 | Foundations | 5 | 1 | 4 |
| 2 | Discovery & shortlist | 5 | 0 | 5 |
| 3 | Tests | 6 | 3 | 3 |
| 4 | Documents & application | 7 | 0 | 7 |
| 5 | Offers & enrolment | 6 | 0 | 6 |
| 6 | Finance & funding | 5 | 0 | 5 |
| 7 | Visa & pre-departure | 6 | 1 | 5 |
| 8 | Arrival & settling | 6 | 2 | 4 |
| 9 | Ongoing | 5 | 1 | 4 |
| **Total** | | **55** | **9** | **46** |

### Counts by priority

| Priority | Total | NEW | refine |
|---|---:|---:|---:|
| **must** | 11 | 2 | 9 |
| **should** | 31 | 6 | 25 |
| **could** | 13 | 1 | 12 |
| **Total** | **55** | **9** | **46** |

**must IDs (11):** **G0-1, G0-2, G1-2, G2-1, G3-1, G6-01, G7-01, G7-02, G7-03, G8-01, G9-01.** Of
these the highest-stakes are the NEW / failure-path items — G7-01 (refusal), G7-02 (no slot), G8-01
(Approbation), G9-01 (no job in 18 months), G7-03 (entry-gap insurance) — plus G6-01 (irreversible
insurance default, defect-adjacent). Two of the eleven are NEW surfaces (G7-01, G8-01); the rest are
refinements.

> **Cross-link to `qa-findings`:** three items border on defects rather than feature gaps and are
> tracked there too — **G9-05** (BlueCardCheck inputs use plain `useState`, lost on navigation; +
> `Outcomes.tsx:63` hardcodes the Blue Card euro literals instead of importing
> `BLUE_CARD_SHORTAGE_EUR`/`_STANDARD_EUR`), **G6-01** (HealthInsurance `under30` defaults to a manual
> `useState(true)`, wrong for the 30+ career-switcher on an *irreversible* choice, never reads
> `profile.dateOfBirth`), and the **finance euro-literal drift** (G6-03, the `992` duplicate of
> `SPERRKONTO_MONTH_EUR`).

---

## Severity / priority & effort key

- **must** = a real persona is *blocked* or *materially misled* without it.
  **should** = significant friction or a depth shortfall that pushes the user out of the app.
  **could** = nice-to-have polish/coverage.
- **Effort:** **S** ≤ ~½ day (mostly seed + copy) · **M** ~1–3 days (new page / stateful tracker) ·
  **L** > 3 days (new dataset/engine work).

---

## Section A — Genuinely missing (NEW surfaces, no page today)

Each verified absent in `nav.tsx`. Note: `/profile/recognition` exists but is **academic** recognition
(anabin / HZB) — distinct from the NEW **`/arrival/recognition`** (professional / Approbation) below.
`/language/testas` and `/language/tms` exist as **guide** pages but have **no mock** route.

| ID | NEW surface | Suggested route | Phase | Priority | Effort |
|---|---|---|---|---|---|
| G0-3 | Class-10 orientation landing (blocked persona's "what now") | — (links from Feasibility/Overview) | 0 | should | S |
| G1-1 | Grade-scenario simulator (% → German grade → which programmes open) | — | 1 | should | M |
| G3-3 | TestAS mock (timed core-module, scored) | `/language/testas` (mock) | 3 | should | L |
| G3-4 | TMS mock (≥1 timed subtest, scored) | `/language/tms` (mock) | 3 | could | L |
| G3-5 | Test-center locator + booking-date reminders | NEW | 3 | should | M |
| G7-01 | Visa refusal & remonstration (appeal) path | `/visa/refusal` | 7 | **must** | M |
| G8-01 | Professional recognition / Approbation (regulated professions) | `/arrival/recognition` | 8 | **must** | M |
| G8-05 | Emergency / health / community directory + buddy connect | `/arrival/support` | 8 | should | S |
| G9-02 | Active German job-search toolkit (CV/Anschreiben/portals/networking) | `/career/job-search` | 9 | should | M |

### G0-3 · Class-10 orientation landing — the blocked persona's "what now" · NEW
- **Why.** Eligibility correctly returns `blocked` with three steps for Class-10 (`pathway.ts:363-379`),
  but Phase-0 hub (`start/Overview.tsx`) and Feasibility offer no Class-10-specific surface — the only
  blocked-persona experience is one red card, a dead-end after the verdict. P2 needs a short "finish
  Class 12 → then which route" runway, with a clear statement that there is **no Studienkolleg entry on
  Class 10**.
- **Data.** Pathway `blocked` route; A1→B1 German runway copy.
- **Acceptance.** A blocked verdict links to a Class-10 explainer (finish 12th → German A1→B1 → re-run
  eligibility) instead of terminating.
- **Grounding.** N/A (no official numbers). · **Priority** should · **Effort** S · **Deps** none.

### G1-1 · Grade-scenario simulator (% → German grade → which programmes open) · NEW
- **Why.** `Evaluate.tsx` converts the user's *own* entered grade (`lib/calc/gpa.ts`, Modified Bavarian)
  — there is no "what if I score X%" explorer. A Class-12 student planning results, or a Bangladesh
  applicant estimating a final CGPA, cannot see how 60% vs 75% changes their German grade and programme
  tier. Pathway shows only an indicative HZB grade.
- **Data.** `gpa.ts` (deterministic, exists) + programme grade-tier mapping.
- **Acceptance.** A slider/input over % yields the German grade and an indicative tier band, all flagged
  "indicative; binding = university/anabin."
- **Grounding.** Tiers are indicative — label as non-binding. · **Priority** should · **Effort** M ·
  **Deps** programmes dataset.

### G3-3 · TestAS mock · NEW (`refines:/language/testas`)
- **Why.** `TestAs.tsx` is a guide that explicitly says there's no TestAS mock; no exam route, no seed,
  no spec entry (mock routes confirmed to exclude TestAS). TestAS is the single most pathway-critical
  test for the Class-12 school-leaver (Studienkolleg/Bachelor routes expect it) — yet it is the one with
  no practice.
- **Data.** Exam runner (exists) + TestAS item bank (offline seed + optional LLM generation).
- **Acceptance.** A timed core-module mock with scoring; offline seed + optional LLM generation.
- **Grounding.** N/A (practice items, not official facts). · **Priority** should · **Effort** L ·
  **Deps** exam runner.

### G3-4 · TMS mock · NEW (`refines:/language/tms`)
- **Why.** `Tms.tsx` is guide-only; no mock route/seed (confirmed). For a Medicine aspirant the TMS
  materially lifts the application, and there's nowhere to practise the subtests in-app.
- **Data.** Exam runner + TMS subtest bank.
- **Acceptance.** At least one timed TMS subtest mock with scoring.
- **Grounding.** N/A. · **Priority** could · **Effort** L · **Deps** exam runner.

### G3-5 · Test-center locator + booking-date reminders · NEW
- **Why.** Nothing locates IELTS/TOEFL/TestDaF/Goethe/TestAS centres or sets booking-window reminders.
  After a student is "ready" there is no in-app path to the actual sitting — the bridge from practice to
  a booked exam is absent.
- **Data.** Reminders/.ics infra (exists at `/reminders`); official booking links per test; centre data.
- **Acceptance.** Official booking links per test + a reminder the student can add to their calendar;
  centre data flagged `needs_verification`.
- **Grounding.** Centre/booking data `needs_verification`. · **Priority** should · **Effort** M ·
  **Deps** reminders/.ics infra.

### G7-01 · Visa refusal & remonstration (appeal) path · NEW (`/visa/refusal`) — **MUST**
- **Why.** Refusals are common (insufficient funds, doubts about intent/return, document gaps). The
  entire visa cluster assumes approval; a refused student today hits a dead end with **no next step** —
  the single most damaging boundary in phase 7. Repo-wide grep for
  `refus|appeal|Remonstration|Widerspruch|Ablehnung` across `pages/` returns zero visa-refusal coverage.
- **Data.** Seed of refusal reason-codes → remedy; the one-month Remonstration window (mission-specific);
  deferral cross-link to the reverse-timeline planner. Link from `visa/Checklist.tsx`,
  `visa/Appointment.tsx`, `visa/Simulator.tsx`.
- **Acceptance.** A refused-visa persona reaches a page that names remonstration, gives the (flagged)
  window, and offers a concrete decision (object / re-apply / defer) with official source links.
- **Grounding.** Remonstration window and procedure are mission-specific — **must** be
  `needs_verification` with a source link to the relevant German mission / Auswärtiges Amt. Do **not**
  state a fixed appeal deadline as fact. · **Priority** **must** · **Effort** M · **Deps** none.

### G8-01 · Professional recognition / Approbation (regulated professions) · NEW (`/arrival/recognition`) — **MUST**
- **Why.** The largest missing surface in the tail. A Medicine persona or a career-switcher into a
  regulated field (medicine/Approbation, nursing, pharmacy, law, teaching, chamber-regulated
  engineering/architecture) can finish a degree, clear the Blue Card salary check, and still be **legally
  unable to work** — recognition adds 6–24 months and gates income/Blue Card planning. The immigration
  ladder (`ImmigrationPathway.tsx`), `Outcomes.tsx` and `JobSeekerPermit.tsx` never mention it; repo-wide
  grep for `Approbation`/"regulated profession"/chamber returns zero.
- **Data.** Seed mapping profession → regulated? → recognising authority + steps; the anabin/ZAB
  distinction (academic recognition vs. professional licence); the
  **Defizitbescheid → Kenntnisprüfung/Anpassungslehrgang** path and the **C1 / Fachsprachprüfung** bar.
  Cross-link from `career/Outcomes.tsx`, `arrival/JobSeekerPermit.tsx`, `arrival/BlueCard.tsx`, the
  medicine pathway.
- **Acceptance.** A medicine/nursing/law persona reaches a page explaining recognition is mandatory,
  naming the recognising-authority class, the language bar, and the deficit-exam path, with official
  links.
- **Grounding.** Authorities and language bars are state/profession-specific — `needs_verification`,
  cite anerkennung-in-deutschland.de / ZAB / relevant Landesärztekammer. Do not invent timelines or
  fees. · **Priority** **must** · **Effort** M · **Deps** none.

### G8-05 · Emergency / health / community directory + buddy connect · NEW (`/arrival/support`)
- **Why.** The arrival cluster is all admin (Anmeldung, bank, permit) — there is **no "if something goes
  wrong / who do I call / how do I see a doctor"** surface. A settling student has nowhere to turn for
  non-bureaucratic help.
- **Data.** Seed of emergency numbers (112/110, stable) + Hausarzt / after-hours (Bereitschaftsdienst)
  basics + university psychological counselling + international-office buddy programmes + crisis lines.
- **Acceptance.** A new arrival finds emergency numbers, how to see a doctor, and where to get
  peer/mental support.
- **Grounding.** Emergency numbers are stable facts; counselling/buddy links per-university → generic +
  "find yours." · **Priority** should · **Effort** S · **Deps** none.

### G9-02 · Active German job-search toolkit (CV/Anschreiben/portals/networking) · NEW (`/career/job-search`)
- **Why.** The app helps you *qualify* for a job (Blue Card check, outcomes) and *network academically*
  (`campus/Networking.tsx`), but has **no surface for actually finding and applying for a German job** —
  the core need of the career-switcher and the graduating student.
- **Data.** Seed of portals (Bundesagentur für Arbeit, StepStone, LinkedIn, university career service)
  + German-CV-vs-Europass and **Anschreiben** templates (editable, like the networking-templates
  pattern) + Arbeitszeugnis literacy + Werkstudent→permanent conversion + visa-sponsorship signalling.
- **Acceptance.** A graduating persona finds where to search, a German-CV/Anschreiben scaffold, and
  conversion tactics.
- **Grounding.** None official; practical framework. · **Priority** should · **Effort** M ·
  **Deps** none.

---

## Section B — Depth / integration / failure-path refinement on shipped pages

| ID | Refinement | refines | Phase | Priority | Effort |
|---|---|---|---|---|---|
| G0-1 | Route-aware reverse timeline (Studienkolleg / FSP arc) | `/start/timeline-planner` | 0 | **must** | M |
| G0-2 | Route- & Studienkolleg-aware budget (months + FSP/Semesterbeitrag) | `/start/budget` | 0 | **must** | M |
| G0-4 | Feasibility hard-gates impossible level/qual combos | `/start/feasibility` | 0 | should | S |
| G0-5 | Country-aware Phase-0 defaults (Bangladesh APS=0, flight origin) | `/start/budget` | 0 | could | S |
| G1-2 | Studienkolleg finder actually lists colleges | `/profile/studienkolleg` | 1 | **must** | L |
| G1-3 | ECTS / credit gap analyzer for direct entry | `/profile/ects` | 1 | should | M |
| G1-4 | German A1→C1 plan: milestones + persisted per-user progress | `/language/german-plan` | 1 | should | M |
| G1-5 | Recognition pre-filter (country + cert → likely HZB category) | `/profile/recognition` | 1 | could | M |
| G2-1 | Bachelor & Studienkolleg programme coverage (dataset) | `/profile/matching` | 2 | **must** | L |
| G2-2 | Per-programme requirement extractor (auto-checklist) | `/documents/requirements` | 2 | should | M |
| G2-3 | Profile-less learners get an eligibility nudge | `/profile/matching` | 2 | should | S |
| G2-4 | City explorer job-market / English-friendliness depth | `/profile/cities` | 2 | could | M |
| G2-5 | Universities explorer → add-to-shortlist (unify datasets) | `/universities` | 2 | could | M |
| G3-1 | Unified, pathway-driven test dashboard | `/language/exams` (+`/language/exam-progress`) | 3 | **must** | M |
| G3-2 | "Ready to book" readiness gate | `/language/exam-progress` | 3 | should | S |
| G3-6 | Writing/Speaking offline / no-LLM fallback rubric | `/language/exams/*` | 3 | should | M |
| G4-01 | SOP studio per-program (not one generic draft) | `/documents/sop` | 4 | should | M |
| G4-02 | LOR tracker: due-date urgency + referee/reminder surface | `/documents/lor-tracker` | 4 | should | S–M |
| G4-03 | Requirements ↔ applications/offers link (no double entry) | `/documents/requirements` | 4 | should | M |
| G4-04 | Admission-letter interpreter actually interprets a letter | `/offers/interpret` | 4 | could | M |
| G4-05 | Auto-derive translation/VPD/APS need per programme + country | `/documents/translation-tracker`, `/documents/vpd`, `/visa/aps` | 4 | should | M |
| G4-06 | VaultMatrix can't mark a non-existent doc "sent" | `/documents/vault-matrix` | 4 | could | S |
| G4-07 | Submission record for uni-assist / DoSV / VPD | `/documents/uni-assist`, `/documents/dosv` | 4 | could | S–M |
| G5-01 | Offers store dual-writes + feeds central deadlines/.ics | `/offers/compare`, `/offers/seat-deadlines` | 5 | should | M |
| G5-02 | Seat-deadline tracker stops hiding dateless offers | `/offers/seat-deadlines` | 5 | should | S |
| G5-03 | Accept/decline/conditional workflow on an offer | `/offers/compare`, `/offers/interpret` | 5 | should | M |
| G5-04 | Connect applications ↔ offers ↔ enrolment (one spine) | `/process`, `/tracker`, `/arrival/enrolment` | 5 | should | M–L |
| G5-05 | Enrolment scoped to the accepted offer | `/arrival/enrolment` | 5 | could | M |
| G5-06 | Set deadlines raise a notification / .ics, not just on-page | `/offers/seat-deadlines`, `/arrival/renewals` | 5 | could | M |
| G6-01 | Health-insurance under-30 defaults from `profile.dateOfBirth` | `/finance/health-insurance` | 6 | **must** | S |
| G6-02 | Scholarship finder filters by nationality/eligibility | `/finance/scholarships` | 6 | should | S–M |
| G6-03 | Funding-gap planner imports constants (no `992` literal) | `/finance/funding-plan` | 6 | should | S–M |
| G6-04 | Cost-of-living pre-selects the student's city | `/finance/cost-of-living` | 6 | could | S |
| G6-05 | One reconciled total-need across the three money tools | `/finance/application-costs`, `/finance/funding-plan`, `/start/budget` | 6 | should | M |
| G7-02 | No-appointment-available fallback at the mission | `/visa/appointment` | 7 | **must** | S |
| G7-03 | Travel / incoming insurance for the entry gap | `/finance/health-insurance`, `/campus/pre-departure` | 7 | **must** | S |
| G7-04 | Travel / forex / flights planning surface | `/campus/pre-departure` | 7 | should | S |
| G7-05 | Accommodation: scam-victim recovery + no-address fallback | `/visa/accommodation` | 7 | should | S |
| G7-06 | Visa simulator German-language mode | `/visa/simulator` | 7 | could | S |
| G8-02 | Bank-account rejection / no-Anmeldung-yet fallback | `/arrival/bank-account` | 8 | should | S |
| G8-03 | Rundfunkbeitrag exemption (Befreiung) & dispute how-to | `/arrival/rundfunkbeitrag` | 8 | should | S |
| G8-04 | Enrolment deadline reminder + conditional-admission failure | `/arrival/enrolment` | 8 | should | S |
| G8-06 | Anmeldung structural no-appointment deadlock | `/arrival/anmeldung-runbook` | 8 | could | S |
| G9-01 | Job-seeker permit "no job within 18 months" failure path | `/arrival/job-seeker-permit` | 9 | **must** | S |
| G9-03 | Permit-loss / out-of-status & exmatrikulation recovery | `/arrival/renewals` (or `/arrival/out-of-status`) | 9 | should | S |
| G9-04 | Family reunion: income-sufficiency check + A1-exemption | `/arrival/family-reunion` | 9 | could | M |
| G9-05 | BlueCardCheck persistence + Outcomes single-source euros | `/arrival/blue-card-check`, `/career/outcomes` | 9 | could | S |

---

### Phase 0 — Orientation

**Maturity:** strong routing core, thin route-aware follow-through. Eligibility + Feasibility route all
three personas correctly and are grounded. The downstream planners (Timeline, Budget) treat every route
as a *direct-admission Master's* and silently understate the Studienkolleg school-leaver's reality.

#### G0-1 · Route-aware reverse timeline (Studienkolleg / FSP arc) · `refines:/start/timeline-planner` — **MUST**
- **Why.** `TIMELINE_MILESTONES` is a single hard-coded 14→0-month arc for direct admission
  (`lib/calc/reverseTimeline.ts:30-40`); `reverseTimeline()` takes only `(season, year)` — no `route`
  parameter (`reverseTimeline.ts:68`). A Class-12 student routed to Studienkolleg is handed the *same*
  arc as a direct-Master's applicant — no Aufnahmeprüfung, no 1-year Studienkolleg, no FSP. Real lead is
  ~12–14 months longer; the planner hides it.
- **Data.** `profile` route from `evaluatePathway`; per-route milestone sets.
- **Acceptance.** For a Studienkolleg route the planner inserts B1→entrance-exam, Studienkolleg year, and
  FSP milestones ahead of "apply"; Medicine lengthens further; direct routes unchanged.
- **Grounding.** Studienkolleg/FSP durations flagged `needs_verification` (vary by college). ·
  **Effort** M · **Deps** pathway engine (exists).

#### G0-2 · Route- & Studienkolleg-aware budget (months + FSP/Semesterbeitrag) · `refines:/start/budget` — **MUST**
- **Why.** `computeJourneyBudget` has no Studienkolleg cost line and `months` is caller-supplied
  (`lib/calc/journeyBudget.ts:38,94-102`); `Budget.tsx` sets `months` from `targetLevel` only, not route.
  A Studienkolleg student under-budgets ~12 extra months of living + the Studienkolleg Semesterbeitrag and
  any private-Kolleg fees. The one-time list (94-101) has no Studienkolleg/FSP/Aufnahmeprüfung line.
- **Acceptance.** When route = studienkolleg, `months` includes the prep+Kolleg year and a
  "Studienkolleg / FSP" one-time line appears (public ≈ Semesterbeitrag, private flagged).
- **Grounding.** Fees `needs_verification`; public-vs-private distinction surfaced. · **Effort** M ·
  **Deps** G0-1 route signal.

#### G0-4 · Feasibility hard-gates impossible level/qual combos · `refines:/start/feasibility`
- **Why.** `Feasibility.tsx` computes a score for whatever profile exists; it does not hard-stop a
  Class-10 + Medicine selection beyond a low score. The pathway engine knows this is blocked
  (`pathway.ts:363`) but Feasibility shows a number, not "not yet eligible — finish Class 12." A
  Class-10 persona can read a "challenging" score as "possible."
- **Acceptance.** When route = blocked, Feasibility shows the blocked state (already wired for
  `band==="blocked"` at lines 85-92) for *every* blocking combo, driven by the pathway route, not only the
  heuristic band. · **Priority** should · **Effort** S · **Deps** route already in the page.

#### G0-5 · Country-aware Phase-0 defaults (Bangladesh APS=0, flight origin) · `refines:/start/budget`
- **Why.** Budget defaults are India-shaped (APS fee default; flight estimate). A Bangladesh applicant
  needs APS = 0 pre-filled (country logic already knows APS is not required for Bangladesh) and an
  origin-appropriate flight hint, instead of editing India defaults.
- **Acceptance.** APS line pre-zeros for non-APS countries; flight default keyed to home country. ·
  **Priority** could · **Effort** S · **Deps** `lib/country` (exists).

---

### Phase 1 — Foundations

**Maturity:** honest but operationally thin / external-link-heavy. Every claim is grounded and correctly
frames "anabin decides, we orient." The gap is *next action*: a school-leaver routed to Studienkolleg
lands on a concept page + one external link with nothing to *do* in the app. Deterministic math (GPA,
ECTS) is correct.

#### G1-2 · Studienkolleg finder actually lists colleges · `refines:/profile/studienkolleg` — **MUST**
- **Why.** `Studienkolleg.tsx` explains streams (`kurs.ts`) and the apply-through-a-university flow but
  does not *list* any Studienkollegs — it links out. For the Class-12 persona this is the single most
  important Phase-1 surface, and the app can't answer "which public Studienkolleg offers a T-Kurs and
  where." The biggest school-leaver dead-end.
- **Data.** Curated seed of public Studienkollegs (state, host university, Kurse offered, public/private).
- **Acceptance.** A filterable list by Kurs/state with host university and an official link; each entry
  `needs_verification`. · **Effort** L · **Deps** new seed dataset + grounding.

#### G1-3 · ECTS / credit gap analyzer for direct entry · `refines:/profile/ects`
- **Why.** `Ects.tsx` + `lib/calc/ects.ts` sum and normalize credits but never compute the *gap* to a
  target (120 held vs 180 expected → "60 short; bridge options"). The pathway engine documents the
  3-year-Bachelor <180 ECTS bridges (`pathway.ts:206-213`) but ECTS doesn't quantify the shortfall. The
  Bangladesh persona (possibly 3-yr degree) needs this.
- **Acceptance.** User enters/derives held ECTS + a target; tool shows the deficit and links the
  documented bridges, flagged per-programme `needs_verification`. · **Priority** should · **Effort** M ·
  **Deps** `ects.ts` (exists).

#### G1-4 · German A1→C1 plan: milestones + persisted per-user progress · `refines:/language/german-plan`
- **Why.** `GermanPlan.tsx` content is static level/hours text; progress is a local checklist with no
  checkpoints, no study-hour log, no estimated completion date, and (per the per-user-storage rule)
  progress should be per-user. A Class-12 student lives here ~12 months; static text isn't a plan they can
  *track*.
- **Acceptance.** Per-level checkpoints, an hours/target tracker, and a derived completion-date estimate;
  progress persists per user. · **Priority** should · **Effort** M · **Deps** synced store (exists).

#### G1-5 · Recognition pre-filter (country + cert → likely HZB category) · `refines:/profile/recognition`
- **Why.** `Recognition.tsx` is a correct, honest "go look it up on anabin yourself" workflow with zero
  pre-filtering. A lightweight country+cert→*likely* category hint (clearly non-binding) would cut
  cognitive load for all personas before they leave for anabin.
- **Acceptance.** Returns a *likely* HZB category with a prominent "anabin/ZAB is binding" caveat and
  `needs_verification`. · **Priority** could · **Effort** M · **Deps** curated anabin-category seed.

---

### Phase 2 — Discovery & shortlisting

**Maturity:** solid search/rank/eligibility engine for Master's-with-profile; thin for school-leavers and
for requirement capture. Matching, facets, shortlist tiers, and the deterministic `eligibility()` rollup
(`lib/programs/eligibility.ts`) are genuinely good. The gaps are dataset breadth (Bachelor) and the
manual-only requirement workflow.

#### G2-1 · Bachelor & Studienkolleg programme coverage (dataset) · `refines:/profile/matching` — **MUST**
- **Why.** Verified **6 Bachelor of 35** seed programmes (`grep courseType programs.ts`), no
  regional/field spread, and **no Studienkolleg entries** to match toward. The headline Class-12 persona
  has almost nothing to discover. Matching is built for Master's (24) and Medicine (5).
- **Acceptance.** A materially larger Bachelor set across fields/cities/tuition status; each programme
  links to its official page and carries `needs_verification`. · **Effort** L · **Deps** dataset
  expansion + grounding.

#### G2-2 · Per-programme requirement extractor (auto-checklist) · `refines:/documents/requirements`
- **Why.** `Requirements.tsx` is a manual paste form — the student transcribes the deadline and raw
  requirement text for every programme by hand. No parse/extract into a structured per-programme
  checklist. Across a shortlist this is heavy friction for all personas.
- **Acceptance.** Paste a programme page → structured fields (deadline, language, tests, docs) + a
  generated checklist; nothing fabricated (empty = `needs_verification`). · **Priority** should ·
  **Effort** M · **Deps** LLM extract path (BYOK/owner-mode exists).

#### G2-3 · Profile-less learners get an eligibility nudge · `refines:/profile/matching`
- **Why.** `Matching.tsx` only renders eligibility when `hasProfile` is true; a profile-less Class-12
  school-leaver sees plain cards with no "add your Class-12 % to compare" nudge — whereas the same
  `eligibility()` already emits friendly `unknown` + `gapHref` criteria (`eligibility.ts:57-76`) that
  would guide them.
- **Acceptance.** Profile-less users still see the eligibility scaffold with "add X" prompts. ·
  **Priority** should · **Effort** S · **Deps** `eligibility.ts` (exists).

#### G2-4 · City explorer job-market / English-friendliness depth · `refines:/profile/cities`
- **Why.** `Cities.tsx` draws from ~9 hard-coded city cost lines (`lib/calc/costOfLiving.ts`) —
  rent/food/transport only. No Werkstudent availability by field, post-study prospects, or
  English-friendliness data, which is what a Bangladesh applicant weighing cities needs.
- **Acceptance.** Each city adds grounded job-market/language signals or an honest "research this"
  pointer; no invented figures. · **Priority** could · **Effort** M · **Deps** city dataset (grounded).

#### G2-5 · Universities explorer → add-to-shortlist (unify datasets) · `refines:/universities`
- **Why.** `Universities.tsx` runs off its own `UNIVERSITY_PROGRAMS` seed with no path to add a found
  programme into the matching shortlist — the student must re-find it in Matching. Two parallel datasets,
  no sync.
- **Acceptance.** "Add to shortlist" from the explorer feeds the same store Matching/Shortlist use. ·
  **Priority** could · **Effort** M · **Deps** unify program data sources.

---

### Phase 3 — Tests

**Maturity:** good single-exam mock runner for 6 English/German exams; missing the connective tissue — no
pathway-driven "which tests *you* need," no readiness gate, and two school-leaver/medicine-critical exams
(TestAS, TMS) have guide pages but no mock (see Section A: G3-3, G3-4). Reading/Listening auto-score;
Writing/Speaking depend on a live LLM and degrade with no offline fallback.

#### G3-1 · Unified, pathway-driven test dashboard · `refines:/language/exams` (+`/language/exam-progress`) — **MUST**
- **Why.** No language page imports `evaluatePathway` (grep) — the test layer can't tell a student
  *which* tests their route requires, target scores, or order. `Overview`/`ExamsHub` are link lists;
  `ExamTracker` aggregates *taken* mocks but isn't pathway-aware. Class-12 (TestAS + German) and
  Bangladesh (IELTS/TOEFL ± German) each need a personalized "your tests, targets, dates, readiness"
  board.
- **Acceptance.** The dashboard reads route + target programmes and lists required tests with target
  bands and a per-test readiness state. · **Effort** M · **Deps** pathway engine + exam metadata (exist).

#### G3-2 · "Ready to book" readiness gate · `refines:/language/exam-progress`
- **Why.** `ExamTracker` predicts a band but has no go/no-go checkpoint ("6.0, target 7.0 — keep
  practising" vs "consistently above target — book it"). Grep for ready/book/gate/threshold returns
  nothing. Students risk booking the real, expensive exam too early.
- **Acceptance.** Per-test gate compares rolling predicted band to target and renders a clear
  ready/not-ready verdict with the gap. · **Priority** should · **Effort** S · **Deps** examProgress
  predicted band (exists).

#### G3-6 · Writing/Speaking offline / no-LLM fallback rubric · `refines:/language/exams/*`
- **Why.** Reading/Listening auto-score, but Writing and Speaking are evaluated only when an LLM provider
  is connected; with no key/offline the user gets "AI feedback wasn't available" and *no* feedback or
  rubric. Speaking captures a transcript only — no pronunciation/pace signal. The Bangladesh persona's
  hardest sections (IELTS Writing/Speaking) thus have the weakest support exactly where it matters.
- **Acceptance.** With no LLM, Writing/Speaking still show a band-descriptor rubric and self-check
  checklist instead of a dead end. · **Priority** should · **Effort** M · **Deps** static
  rubric/exemplar bank.

---

### Phase 4 — Documents & application

> **Persistence note.** Every phase-4/5/6 store except `applications`, `roadmap_items` and `deadlines`
> lives only in the per-user JSONB blob (synced for signed-in users, on-device for signed-out) — not in a
> typed, queryable table. Findings below reflect this; **none** claims false data-loss for signed-in
> users.

#### G4-01 · SOP studio per-program (not one generic draft) · `refines:/documents/sop`
- **Why.** Nav promises a "tailored SOP, not generic"; `Sop.tsx` collects one free-text program/university
  pair and one motivation blob (`useSyncedState("doc:sop:form")`, `Sop.tsx:119`). A Bangladesh applicant
  or career-switcher applying to 6–10 programs retypes the target each time and keeps a single draft. No
  per-program draft set; no read from applications/offers/requirements.
- **Acceptance.** Pick a target from applications/offers → a per-program SOP draft keyed by application
  id; switching target loads/saves its own draft; AI generation seeds from that program's captured
  requirements. · **Grounding** N/A (user-authored). · **Priority** should · **Effort** M ·
  **Deps** Tracker/Requirements stores.

#### G4-02 · LOR tracker: due-date urgency + referee/reminder surface · `refines:/documents/lor-tracker`
- **Why.** Nav: "who you asked, when, deadlines, and whether each letter is in." `LorTracker.tsx` is a
  3-state checkbox list (Asked → Reminded → Received). No due-date urgency from the deadline it stores, no
  `.ics`/reminder export, no referee-facing artefact. "Reminded" is a manual toggle, not a prompt — a
  career-switcher chasing a busy manager gets no nudge.
- **Acceptance.** Each request shows deterministic days-left + overdue/urgent styling; due requests feed
  the central deadline list and the .ics export; an optional "draft a reminder email" action. ·
  **Grounding** N/A. · **Priority** should · **Effort** S–M · **Deps** `lib/calc/deadlines.ts`,
  reminders export.

#### G4-03 · Requirements ↔ applications/offers link (no double entry) · `refines:/documents/requirements`
- **Why.** `Requirements.tsx` stores `programme:requirements` with no cross-reference to `tracker:apps`
  or `OFFERS_KEY`. The student maintains the same programme twice, and nothing turns a captured "needs
  TestAS / APS / VPD" line into a checklist item, a tracker flag, or an SOP input. This is the connective
  tissue the whole document phase is missing.
- **Acceptance.** A captured requirement links to (or creates) an application; a parsed "requires
  VPD/APS/translation" toggle pre-seeds the matching tracker; no double entry. · **Grounding** N/A. ·
  **Priority** should · **Effort** M · **Deps** shared programme identity across stores.

#### G4-04 · Admission-letter interpreter actually interprets a letter · `refines:/offers/interpret`
- **Why.** Despite the name, `AdmissionLetter.tsx` is a static decoder (checklist + glossary + one shared
  `DeadlineReminder`); it never accepts the letter text. A student with a German `Zulassungsbescheid`
  still hand-finds the conditions and the Immatrikulationsfrist — the thing the page claims to do.
- **Acceptance.** Paste letter text → surfaced enrolment deadline + flagged conditions, written into an
  offer record; manual fallback preserved; nothing fabricated (model output schema-validated, low
  confidence flagged). · **Grounding** extracted dates/conditions are user-data; if AI used,
  schema-validate, never assert. · **Priority** could · **Effort** M · **Deps** extract step (AI
  optional).

#### G4-05 · Auto-derive translation/VPD/APS need per programme + country · `refines:/documents/translation-tracker`, `/documents/vpd`, `/visa/aps`
- **Why.** Translation, VPD and APS trackers are standalone lists. For the Bangladesh (no-APS) persona the
  app should *not* surface an APS tracker at all, yet nothing keys these off `profile.homeCountry` or the
  captured per-programme requirement. The student decides manually which trackers even apply.
- **Acceptance.** Trackers gated/seeded by country (`APS_REQUIRED_COUNTRIES`) + captured requirements; a
  no-APS-country student isn't told to track APS. · **Grounding** APS country logic from
  `APS_REQUIRED_COUNTRIES`, not hardcoded prose. · **Priority** should · **Effort** M ·
  **Deps** G4-03, country logic.

#### G4-06 · VaultMatrix can't mark a non-existent doc "sent" · `refines:/documents/vault-matrix`
- **Why.** `VaultMatrix.tsx` reads `tracker:apps` for columns (good) but its 8 doc rows are hardcoded and
  a checkbox can be ticked for "SOP → App X" even when the SOP draft (`doc:sop:draft`) is empty. A
  checklist of *intent* presented as *fact*; a stressed applicant can believe a document went out that was
  never written.
- **Acceptance.** A doc row reflects whether the underlying draft/file exists; "sent" for an empty doc is
  warned or disallowed. · **Grounding** N/A. · **Priority** could · **Effort** S · **Deps** read
  generator/vault state.

#### G4-07 · Submission record for uni-assist / DoSV / VPD · `refines:/documents/uni-assist`, `/documents/dosv`
- **Why.** `UniAssist.tsx` and `Dosv.tsx` are purely educational (no state). A real applicant needs to
  record their uni-assist applicant number, submitted date, fees paid, response date; the Medicine/NC
  persona needs the hochschulstart BID/priorities for DoSV. None is captured, so these processes don't
  appear on any status board.
- **Acceptance.** Each walkthrough can persist a small structured record (account id, submitted-on,
  response-on) that surfaces on the status/tracker views. · **Grounding** uni-assist fee/processing facts
  already `needs_verification` — keep. · **Priority** could · **Effort** S–M · **Deps** application store.

---

### Phase 5 — Offers & enrolment

#### G5-01 · Offers store dual-writes + feeds central deadlines/.ics · `refines:/offers/compare`, `/offers/seat-deadlines`
- **Why.** `OFFERS_KEY` backs the comparison board and seat-deadline tracker but, unlike
  applications/roadmap/deadlines, is **not** wired through `useTableSync`, and its accept-by dates never
  flow into central `/deadlines` or the `.ics` export. The single most time-critical date in the journey
  (seat acceptance) lives in an isolated widget the student must remember to revisit.
- **Acceptance.** Offers dual-write to a typed table; each `acceptBy` appears in `/deadlines` and the .ics
  export with correct deterministic urgency. · **Grounding** N/A. · **Priority** should · **Effort** M ·
  **Deps** `useTableSync` mapper for offers; deadline merge.

#### G5-02 · Seat-deadline tracker stops hiding dateless offers · `refines:/offers/seat-deadlines`
- **Why.** `SeatDeadlines.tsx:25` filters to `offers.filter(o => o.acceptBy)`; an offer entered without an
  accept-by date vanishes and the empty state reads "No accept-by dates yet." A student who logged an
  admit but hasn't filled the date sees a calm screen on the very item that forfeits a place if missed.
- **Acceptance.** Offers lacking an accept-by date are shown as a distinct "needs a date" group rather
  than hidden; the empty state distinguishes "no offers" from "offers missing dates." · **Grounding**
  N/A. · **Priority** should · **Effort** S · **Deps** none.

#### G5-03 · Accept/decline/conditional workflow on an offer · `refines:/offers/compare`, `/offers/interpret`
- **Why.** `Offer` has only a boolean `conditional` and a single `acceptBy`; no accepted/declined state,
  no separate deposit/enrolment-fee deadline, no condition text. The student can't record "accepted TU
  Munich, declined RWTH," track a deposit due before enrolment, or clear a condition. The offer→enrolment
  hand-off is narrative.
- **Acceptance.** An offer carries status (received→accepted/declined), an optional deposit deadline, and
  a condition list with a clear/met action; accepting one offer can prompt declining others. ·
  **Grounding** N/A. · **Priority** should · **Effort** M · **Deps** offer schema extension.

#### G5-04 · Connect applications ↔ offers ↔ enrolment (one spine) · `refines:/process`, `/tracker`, `/arrival/enrolment`
- **Why.** `/process` is a read-only seed board (`Process.tsx` renders static `APPLICATION_STAGES`) while
  `/tracker` is the real Kanban (`tracker:apps`, dual-written). They share no state, and neither links an
  "accepted" application to an offer record or the enrolment guide. The journey's spine has no continuous
  thread; each step is re-entered.
- **Acceptance.** Moving an application to "decision/accepted" can create/link an offer; the offer links
  to the enrolment guide; `/process` reflects real state or is folded into the tracker. · **Grounding**
  N/A. · **Priority** should · **Effort** M–L · **Deps** shared programme identity; possibly retire/merge
  static `/process`.

#### G5-05 · Enrolment scoped to the accepted offer · `refines:/arrival/enrolment`
- **Why.** `Enrolment.tsx` shows the generic 5-step Immatrikulation flow + a local checklist, with the
  Semesterbeitrag shown globally as "~€70–€430." It doesn't know which university the student accepted (no
  offer read), so it can't show that university's contribution, deadline, or document list; no
  Matrikelnummer/payment record. Correct as orientation; thin as a do-it tool.
- **Acceptance.** Enrolment reads the accepted offer to scope its steps/deadline; captures the
  Semesterbeitrag actually paid and the Matrikelnummer. · **Grounding** Semesterbeitrag stays
  `needsVerification:true` and per-university (`facts.ts:76`) — do not assert one figure. · **Priority**
  could · **Effort** M · **Deps** G5-03 offer status.

#### G5-06 · Set deadlines raise a notification / .ics, not just on-page · `refines:/offers/seat-deadlines`, `/arrival/renewals`
- **Why.** `DeadlineReminder` and the seat/renewal surfaces compute days-left deterministically but there
  is no browser notification, email, or push when a date arrives; the Rückmeldung warning on
  `UniversityOnboarding.tsx` has no persistent reminder at all. A student who doesn't reopen the page
  isn't reminded.
- **Acceptance.** Any user-set deadline (offer, Rückmeldung, renewal) can be exported to .ics / raised as
  a notification, not just rendered. · **Grounding** N/A. · **Priority** could · **Effort** M ·
  **Deps** reminders/notification mechanism.

---

### Phase 6 — Finance & funding

#### G6-01 · Health-insurance under-30 defaults from `profile.dateOfBirth` · `refines:/finance/health-insurance` — **MUST** (defect-adjacent; see `qa-findings`)
- **Why.** The statutory-vs-private decision hinges on the under-30 / ~14th-semester rule, and the choice
  is **irreversible** (the page warns so, `HealthInsurance.tsx:132-140`). Yet `under30` is `useState(true)`
  (`:55`), set only by a manual radio; `profile.dateOfBirth` exists in the schema and is documented as
  driving this tier but is never read. The career-switcher (often 30+) is shown "statutory, the standard
  route" by default — the wrong answer — until they correct a toggle they may not understand.
- **Acceptance.** `under30` defaults from `profile.dateOfBirth` vs estimated enrolment; the manual toggle
  remains an override; the irreversibility warning stays. · **Grounding** `HEALTH_INSURANCE` fact already
  `needs_verification` — keep; label the age rule as guidance (already done). · **Effort** S ·
  **Deps** profile read.

#### G6-02 · Scholarship finder filters by nationality/eligibility · `refines:/finance/scholarships`
- **Why.** `Scholarships.tsx` filters only by category buttons (`:49-62`); it reads the profile for
  *experience* matching but never for `homeCountry`. A Bangladesh student sees nationality-restricted
  schemes with only a generic "Eligibility restricted" badge and no personalised "you likely qualify /
  likely don't." The finder lists; it doesn't match the one axis (nationality) that most often
  disqualifies.
- **Acceptance.** Schemes sorted/badged against the student's nationality; clearly out-of-scope ones
  de-emphasised, never asserted ineligible without the scheme's own rule. · **Grounding** amounts already
  grounded; eligibility text from seed sources — keep "confirm in the official call." · **Priority**
  should · **Effort** S–M · **Deps** eligibility metadata per scheme.

#### G6-03 · Funding-gap planner imports constants (no `992` literal) · `refines:/finance/funding-plan` — defect-adjacent; see `qa-findings`
- **Why.** `FundingPlan.tsx:29-31` seeds `oneTime=15000`, `monthly=992`, `months=24` as bare literals.
  `992` silently duplicates `SPERRKONTO_MONTH_EUR` (`facts.ts:29`) instead of importing it, so a yearly
  Sperrkonto change drifts the default; `15000` has no source shown; the "prefill from the journey budget"
  note (`:65`) is a plain link, not a data feed. The student re-enters cost-of-living and application-cost
  figures the app already computed.
- **Acceptance.** Living default imports the fact constant; one-time default is derived/sourced or
  prefilled from the journey budget; values flow in from CoL/application-costs with editable overrides. ·
  **Grounding** defaults must derive from `facts.ts` constants, not literals (golden-rule 4). ·
  **Priority** should · **Effort** S–M · **Deps** import the constant; surface budget/CoL totals.

#### G6-04 · Cost-of-living pre-selects the student's city · `refines:/finance/cost-of-living`
- **Why.** `CostOfLiving.tsx` is a sound deterministic calculator with a clear disclaimer, but the city is
  always manually picked even when the intake/shortlist already implies a study city. Minor re-entry the
  app could avoid; a small honesty win (the baseline shown first matches the actual target).
- **Acceptance.** City defaults from profile/shortlist when present; manual override preserved. ·
  **Grounding** deterministic math + disclaimer already correct. · **Priority** could · **Effort** S ·
  **Deps** intake city field.

#### G6-05 · One reconciled total-need across the three money tools · `refines:/finance/application-costs`, `/finance/funding-plan`, `/start/budget`
- **Why.** `ApplicationCosts.tsx` reads `programs:shortlist` length and `profile.homeCountry` for APS, and
  `/start/budget` does the total-journey math, but the three money tools each hold their own numbers;
  nothing reconciles "total need." A student can't see one coherent figure, so the funding-gap answer can
  silently contradict the budget page.
- **Acceptance.** One total-need figure computed once and consumed by funding-gap and the budget view;
  changing the shortlist updates all three consistently. · **Grounding** all euro inputs sourced from
  `facts.ts` constants (partly done in ApplicationCosts) — extend to the others. · **Priority** should ·
  **Effort** M · **Deps** G6-03; a shared cost source.

> **Also blob-only (not lost for signed-in users), not separately ID'd:** sperrkonto progress, scholarship
> tracker, loans, work-days persist via `useSyncedState` but reach no typed table and feed neither the
> single funding view nor `/deadlines`. Folded into the structural themes (shared identity / one money
> total) above.

---

### Phase 7 — Visa & pre-departure

> Phases 7–9 are broad and, on the happy path, deep — grounding is disciplined and several failure
> boundaries are already handled (Fiktionsbescheinigung `ResidencePermit.tsx:36-42`, irreversible
> insurance opt-out `HealthInsurance.tsx:132-140`, rental-scam alert `Accommodation.tsx:25-38`, Anmeldung
> walk-in fallback `AnmeldungRunbook.tsx:17`). The gaps below are therefore mostly **unhandled failure
> paths** plus the NEW surfaces in Section A.

#### G7-02 · No-appointment-available fallback at the mission · `refines:/visa/appointment` — **MUST**
- **Why.** `Appointment.tsx` correctly frames the appointment wait as *the* bottleneck and says "book
  early / check often" — but offers **no path when there is nothing to book** (`:12-18,52-58` assume a
  slot exists). This blocks the applicant persona hard and is a known reality at high-volume missions.
- **Acceptance.** From the tracker, a stuck applicant finds ≥3 concrete fallback actions (waitlist/
  auto-refresh, VFS vs direct mission, third-country, email escalation, proof-of-attempt) and a "what if I
  can't get a slot before my intake" deferral branch. · **Grounding** tactics are practical guidance with
  mission source links; invent no SLAs. · **Effort** S · **Deps** ideally G7-01 (deferral).

#### G7-03 · Travel / incoming insurance for the entry gap · `refines:/finance/health-insurance`, `/campus/pre-departure` — **MUST**
- **Why.** Incoming/travel health insurance covering the gap between landing on the D-visa and statutory
  student insurance activating at enrolment (typically several weeks). `HealthInsurance.tsx` handles
  under-30/over-30/agreement/opt-out but **never the entry gap** (`:28-51`); the pre-departure list says
  only "Health-insurance documents" (`seed/checklists.ts:46`) and arrival only "Activate statutory health
  insurance" (`:35`). A student can land **uninsured** for the gap and not know.
- **Acceptance.** The health-insurance flow explicitly surfaces the entry gap and tells a new arrival they
  need interim cover before statutory insurance starts. · **Grounding** qualitative; cite
  make-it-in-germany / mission; any duration `needs_verification`. · **Effort** S · **Deps** none.

#### G7-04 · Travel / forex / flights planning surface · `refines:/campus/pre-departure`
- **Why.** Currently scattered as single checklist items ("Some euros in cash", "Get a German SIM",
  `seed/checklists.ts:37,48`) with no guidance on sequencing flights against visa risk or moving money — a
  real cost-risk for every persona.
- **Acceptance.** A pre-departure persona sees explicit "don't book non-refundable flights before visa
  approval" guidance and a money-transfer comparison scaffold (provider, fee, FX-margin, speed — no rates
  shipped). · **Grounding** none official; pure framework. · **Priority** should · **Effort** S ·
  **Deps** none.

#### G7-05 · Accommodation: scam-victim recovery + no-address fallback · `refines:/visa/accommodation`
- **Why.** `Accommodation.tsx` warns about scams (`:25-38`) but stops at prevention; it never handles the
  victim (stop payment, police/Schufa report, evidence) nor the common "I have an admission but nowhere to
  live yet, and I can't register without an address" deadlock (`Wohnungsgeberbestätigung` hard requirement
  `seed/arrival.ts:46`).
- **Acceptance.** The page covers both "I got scammed" and "I have no address yet but must register"
  (temporary-address / hostel / sublet bridging; cross-link `AnmeldungRunbook`). · **Grounding**
  practical; link Studierendenwerk / police-reporting. · **Priority** should · **Effort** S · **Deps**
  none.

#### G7-06 · Visa simulator German-language mode · `refines:/visa/simulator`
- **Why.** Speech-to-text is hardcoded `lang: "en-US"` (`Simulator.tsx` ~line 66). Some missions
  interview partly in German; the persona prepping for a German-medium programme gets no German rehearsal.
- **Acceptance.** A language toggle switches dictation locale and question language. · **Grounding** N/A. ·
  **Priority** could · **Effort** S · **Deps** none.

---

### Phase 8 — Arrival & settling

#### G8-02 · Bank-account rejection / no-Anmeldung-yet fallback · `refines:/arrival/bank-account`
- **Why.** `BankAccount.tsx` is happy-path only (4-step success + "confirm with the bank"). The
  Anmeldung↔bank↔address circular dependency (bank refuses without Anmeldung, but you need a bank to pay
  rent) is a real, frequently-hit wall for new arrivals.
- **Acceptance.** The page covers "bank says no without Anmeldung" and offers ≥1 address-free neobank /
  blocked-account-provider bridge + ordering guidance. · **Grounding** practical; no invented bank
  policies. · **Priority** should · **Effort** S · **Deps** relates to G7-05.

#### G8-03 · Rundfunkbeitrag exemption (Befreiung) & dispute how-to · `refines:/arrival/rundfunkbeitrag`
- **Why.** `Rundfunkbeitrag.tsx` states the fee is per-household and that exemption exists "but most
  international students don't qualify" — then stops (`:47-49`). The how-to-apply, **WG duplicate-billing**
  (one fee per dwelling), and **back-dated demand / Festsetzungsbescheid** response paths are missing and
  genuinely blindside arrivals.
- **Acceptance.** Page explains how to apply for exemption and how to resolve a duplicate-billing/WG
  demand. · **Grounding** cite rundfunkbeitrag.de; keep €18.36 as the existing `needs_verification` fact
  (`seed/arrival.ts:84-90`). · **Priority** should · **Effort** S · **Deps** none.

#### G8-04 · Enrolment deadline reminder + conditional-admission failure · `refines:/arrival/enrolment`
- **Why.** `Enrolment.tsx` says "Miss it and the place can be withdrawn — diarise the enrolment deadline
  immediately" but ships **no reminder component** (unlike Auslaenderbehoerde/Renewals which do), so the
  very thing it warns about isn't trackable. No path for a conditional offer's unmet conditions.
- **Acceptance.** Enrolment page has a working `DeadlineReminder` (storageKey `enrolment-deadline`) and
  addresses unmet conditional-admission conditions. · **Grounding** Semesterbeitrag already grounded
  (`facts.ts:76-82`). · **Priority** should · **Effort** S · **Deps** none. (Overlaps G5-05's offer-scoped
  enrolment.)

#### G8-06 · Anmeldung structural no-appointment deadlock · `refines:/arrival/anmeldung-runbook`
- **Why.** `AnmeldungRunbook.tsx:17` offers a one-line walk-in fallback, but the structural "the city has
  released no slots and my 14 days are running out" reality (Berlin/Munich) isn't addressed, and
  `ANMELDUNG_DAYS=14` reads as a hard penalty.
- **Acceptance.** The runbook addresses a genuine no-slots-before-deadline situation (proof you tried,
  neighbouring-Bürgeramt strategy, reassurance grounded to Bundesmeldegesetz reality). · **Grounding**
  keep the 14-day fact (`facts.ts:21-22,160-166`); add nuance, don't restate a penalty. · **Priority**
  could · **Effort** S · **Deps** none.

---

### Phase 9 — Ongoing

#### G9-01 · Job-seeker permit "no job within 18 months" failure path · `refines:/arrival/job-seeker-permit` — **MUST**
- **Why.** `JobSeekerPermit.tsx` is happy-path only (apply → search → work → settle). The career-switcher
  who doesn't land a role is exactly who needs the cliff-edge guidance, and there's none. The
  highest-stakes phase-9 boundary.
- **Acceptance.** The page covers the window expiring with no job and gives ≥3 honest options (further
  study, lower-qualified work bridge, leave & re-enter, switch permit type), the no-extension reality, and
  how to avoid falling out of status. · **Grounding** `needs_verification`; cite make-it-in-germany /
  Ausländerbehörde; no invented extensions. · **Effort** S · **Deps** G8-01 (recognition can be the
  blocker).

#### G9-03 · Permit-loss / out-of-status & exmatrikulation recovery · `refines:/arrival/renewals` (or `/arrival/out-of-status`)
- **Why.** `Renewals.tsx` (`:26-27`) and `UniversityOnboarding.tsx` (`:26-29`) say "miss this and you're
  de-registered / out of status" but offer **no recovery** once it happens (permit lapsed, exmatrikuliert
  for a missed Rückmeldung, renewal refused).
- **Acceptance.** A user who already missed a renewal/Rückmeldung finds concrete recovery steps
  (Fiktionsbescheinigung if mid-process, re-enrolment, leave/re-enter, legal-aid pointers), not just a
  warning. · **Grounding** `needs_verification`; cite Ausländerbehörde / BAMF; no invented grace periods.
  · **Priority** should · **Effort** S · **Deps** none.

#### G9-04 · Family reunion: income-sufficiency check + A1-exemption · `refines:/arrival/family-reunion`
- **Why.** `FamilyReunion.tsx` (`:15-16`) lists qualifying conditions and docs but has **no calculator**
  for the income bar (the thing that decides eligibility) and leaves the A1 exemption vague.
- **Acceptance.** The page offers a (deterministic, grounded) income/housing-sufficiency self-check for
  the household size and names the common A1-exemption categories. · **Grounding** income thresholds real
  but volatile → `needs_verification`, cite make-it-in-germany. · **Priority** could · **Effort** M ·
  **Deps** cross-link `finance/funding-plan`.

#### G9-05 · BlueCardCheck persistence + Outcomes single-source euros · `refines:/arrival/blue-card-check`, `/career/outcomes` — defect-adjacent; see `qa-findings`
- **Why.** (1) `BlueCardCheck` inputs use plain `useState` (`:20-23`), so the salary check is lost on
  navigation — should move to syncedState like `PrCitizenship`. (2) `Outcomes.tsx:63` hardcodes the
  literals "€45,934.20 / €50,700" in JSX instead of importing `BLUE_CARD_SHORTAGE_EUR`/`_STANDARD_EUR`,
  risking drift from the single source (`facts.ts:40-41`).
- **Acceptance.** BlueCardCheck persists; Outcomes imports the euro constants. · **Grounding** strengthens
  it (kills a drift risk). · **Priority** could · **Effort** S · **Deps** none.

---

## Out of scope — confirmed strong (not gaps)

- **Pathway routing** for all three personas incl. Class-10 block, non-linear diploma/lateral, India vs
  Bangladesh APS, the raised-70% WS-2026/27 note (`lib/pathway/pathway.ts`).
- **Eligibility rollup** with honest `unknown`/`needs_verification` and **deterministic GPA/ECTS**
  (`lib/programs/eligibility.ts`, `lib/calc/gpa.ts`, `lib/calc/ects.ts`).
- **Search/rank/facets** and reach/match/safety tiering (`lib/programs/search.ts`,
  `pages/profile/Shortlist.tsx`).
- **Single-exam mock runner**, scoring, and progress analytics for the 6 supported exams.
- **Grounding discipline** across phases 7–9: Blue Card €50,700 / €45,934.20, citizenship 5 years
  (3-yr fast-track repealed 30 Oct 2025), Rundfunkbeitrag €18.36, Sperrkonto €11,904 — all `OfficialFact`s
  with sources, `needsVerification`, and `FACTS_RETRIEVED_AT`. **No fabricated official fact found
  anywhere in the journey.**
- **Already-handled failure boundaries** (excluded deliberately): Fiktionsbescheinigung
  (`ResidencePermit.tsx:36-42`), insurance opt-out irreversibility (`HealthInsurance.tsx:132-140`),
  Rückmeldung/permit reminders (`Renewals.tsx`), rental-scam prevention (`Accommodation.tsx:25-38`),
  Anmeldung walk-in fallback (`AnmeldungRunbook.tsx:17`).
</content>
</invoke>
