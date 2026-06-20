# Fresh gap analysis — Journey phases 4–6 (Documents · Offers/Enrolment · Finance)

> **Independent audit pass (audit2).** Scope: phase 4 (Documents & application), phase 5 (Offers &
> enrolment), phase 6 (Finance & funding). Method: every journey feature is a real page in
> `frontend/src/lib/nav.tsx` (~125 routes), so a page existing is **not** completion — each item below
> is a missing surface, a real partial, or an integration/failure-path boundary on a *shipped* page,
> judged against three personas: **Bangladesh Master's (no APS)**, **career-switcher with work
> experience**, **Medicine/NC/TMS aspirant**. Official facts cross-checked against `lib/facts.ts`
> (Sperrkonto €11,904, APS, scholarship/insurance figures). All paths absolute-citable as `file:line`.

## How persistence actually works (corrects a common mis-read)

`useSyncedState` → `syncedStore` (`frontend/src/lib/persist/syncedStore.ts`) is **localStorage-first and
ALSO mirrors to a per-user `settings.data` JSONB blob in Supabase when signed in** (`flushCloud`,
`syncedStore.ts:158`). So tracker data **does survive a device switch for a signed-in user** — it is
*not* "lost on refresh/device". What it is *not* is a **typed, queryable per-user table**: only
`applications` (Tracker), `roadmap_items` (Roadmap) and `deadlines` (Calendar) got the SEC-3
typed-table dual-write via `useTableSync`/`useRoadmapSync` (`frontend/src/lib/persist/useTableSync.ts`).
Every other phase-4/5/6 store — **offers, all document trackers, scholarship tracker, funding inputs,
sperrkonto progress** — lives only in the opaque blob. The genuine consequences are: (a) that data is
invisible to any server-side/cross-feature logic, (b) **signed-out** users keep it only on the device,
and (c) it never reaches the typed schema the data model targets. Findings below reflect this; none
claims false data-loss for signed-in users.

---

## Phase 4 — Documents & application

### G4-01 · SOP studio is generic, not per-program · refines `/documents/sop`
- **Why a student needs it.** The nav promises a "tailored SOP, not generic" and the page header says
  "tailored". In reality `Sop.tsx` collects one free-text program/university pair and one motivation
  blob (`useSyncedState("doc:sop:form")`, `Sop.tsx:119`); a Bangladesh applicant or career-switcher
  applying to 6–10 programs must retype the target each time and keep a single draft. There is no per-
  program draft set and no read from the applications/offers/requirements stores.
- **Downstream data.** `applications` (Tracker `tracker:apps`), `offers` (`OFFERS_KEY`), per-program
  `programme:requirements`, `profile` (already read for experience).
- **Priority** should · **Effort** M · **Deps** Tracker/Requirements stores.
- **Acceptance.** Pick a target from the applications/offers list → a per-program SOP draft is created
  and stored keyed by application id; switching target loads/saves its own draft; AI generation seeds
  from that program's captured requirements.
- **Grounding.** N/A (user-authored content).

### G4-02 · LOR tracker has no reminder/referee surface its nav promises · refines `/documents/lor-tracker`
- **Why.** Nav text: "who you asked, when, deadlines, and whether each letter is in." `LorTracker.tsx`
  is a 3-state checkbox list (Asked → Reminded → Received) in `useSyncedState("lor:requests")`. There
  is **no due-date urgency surface** (no soon/overdue badge from the deadline it stores), no `.ics`/
  reminder export, and no referee-facing artefact. "Reminded" is a manual toggle, not a prompt. A
  career-switcher chasing a busy manager gets no nudge.
- **Downstream data.** Per-request `deadline`; central `/deadlines` + `/reminders` (.ics).
- **Priority** should · **Effort** S–M · **Deps** deadline/severity util (`lib/calc/deadlines.ts`,
  already used elsewhere), reminders export.
- **Acceptance.** Each request shows deterministic days-left + overdue/urgent styling; due requests feed
  the central deadline list and the .ics export; an optional "draft a reminder email" action.
- **Grounding.** N/A.

### G4-03 · Per-programme requirements is an island — no link to applications/offers · refines `/documents/requirements`
- **Why.** `Requirements.tsx` stores `programme:requirements` as its own list with no cross-reference to
  `tracker:apps` or `OFFERS_KEY`. The student maintains the same programme twice (here and in the
  tracker), and nothing turns a captured "needs TestAS / needs APS / VPD required" line into a checklist
  item, an application-tracker flag, or an SOP input. This is the connective tissue the whole document
  phase is missing.
- **Downstream data.** `tracker:apps`, `OFFERS_KEY`, derived checklists, SOP (G4-01), VPD/translation
  trackers.
- **Priority** should · **Effort** M · **Deps** shared programme identity across stores.
- **Acceptance.** A captured requirement record links to (or creates) an application; a parsed
  "requires VPD/APS/translation" toggle pre-seeds the matching tracker; no double entry.
- **Grounding.** N/A (user-pasted text).

### G4-04 · "Admission-letter interpreter" does not interpret a letter · refines `/offers/interpret`
- **Why.** Despite the name, `AdmissionLetter.tsx` is a static decoder: a fixed "what to look for"
  checklist + a German-terms glossary + one shared `DeadlineReminder`. It never accepts the letter text.
  A student with a real (often German-language) `Zulassungsbescheid` still has to find the conditions
  and the Immatrikulationsfrist by hand — exactly the thing the page claims to do. (Listed under phase 5
  in nav but is the document-reading bridge into enrolment.)
- **Downstream data.** `offers` (could populate `acceptBy`, `conditional`), enrolment deadline.
- **Priority** could · **Effort** M · **Deps** an extract step (paste → highlight deadline/conditions),
  AI optional with schema + needs_verification.
- **Acceptance.** Paste letter text → surfaced enrolment deadline + flagged conditions, written into an
  offer record; manual fallback preserved; nothing fabricated (model output validated, low confidence
  flagged).
- **Grounding.** Any extracted date/condition is user-data, not an official fact — fine; but if AI is
  used, schema-validate and never assert.

### G4-05 · No certified-translation/VPD/APS need is auto-derived per programme · refines `/documents/translation-tracker`, `/documents/vpd`, `/visa/aps`
- **Why.** Translation, VPD and APS trackers are all standalone lists. For the **Bangladesh (no APS)**
  persona the app should *not* surface an APS tracker at all (APS Bangladesh status differs from
  India/China) yet nothing keys these off `profile.homeCountry` or the captured per-programme
  requirement. The student decides manually which trackers even apply.
- **Downstream data.** `profile.homeCountry` (+ `APS_REQUIRED_COUNTRIES` in `lib/country`),
  `programme:requirements`.
- **Priority** should · **Effort** M · **Deps** G4-03, country logic.
- **Acceptance.** Trackers are gated/seeded by country + captured requirements; a no-APS-country student
  isn't told to track APS.
- **Grounding.** APS country logic must come from `APS_REQUIRED_COUNTRIES`, not hardcoded prose.

### G4-06 · VaultMatrix lets you mark a document "sent" that does not exist · refines `/documents/vault-matrix`
- **Why.** `VaultMatrix.tsx` reads `tracker:apps` for columns (good) but its 8 doc rows are hardcoded
  and a checkbox can be ticked for "SOP → App X" even when the SOP draft (`doc:sop:draft`) is empty.
  It's a checklist of *intent* presented as a checklist of *fact*; a stressed applicant can believe a
  document went out that was never written.
- **Downstream data.** Generator draft state (`doc:sop:draft`, `doc:cv:form`, `doc:lor:*`), Vault items.
- **Priority** could · **Effort** S · **Deps** read generator/vault state.
- **Acceptance.** A doc row reflects whether the underlying draft/file exists; "sent" for an empty doc is
  warned or disallowed.
- **Grounding.** N/A.

### G4-07 · No submission record for uni-assist / DoSV / VPD walkthroughs · refines `/documents/uni-assist`, `/documents/dosv`
- **Why.** `UniAssist.tsx` and `Dosv.tsx` are purely educational (no state). A real applicant needs to
  record their uni-assist applicant number, the date submitted, fees paid, and the response date; the
  **Medicine/NC** persona needs to track the hochschulstart BID/priorities for DoSV. None is captured,
  so these processes don't appear on any status board.
- **Downstream data.** `tracker:apps` status, `/process` board, application-cost tally.
- **Priority** could · **Effort** S–M · **Deps** application store.
- **Acceptance.** Each walkthrough can persist a small structured record (account id, submitted-on,
  response-on) that surfaces on the status/tracker views.
- **Grounding.** uni-assist fee/processing facts already flagged needs_verification (`UniAssist.tsx`) —
  keep.

---

## Phase 5 — Offers & enrolment

### G5-01 · Offers store is blob-only and feeds nothing downstream · refines `/offers/compare`, `/offers/seat-deadlines`
- **Why.** `OFFERS_KEY` (`lib/offers/offers.ts`) backs the comparison board and seat-deadline tracker
  but, unlike applications/roadmap/deadlines, it is **not** wired through `useTableSync`, and its
  accept-by dates never flow into the central `/deadlines` list or the `/reminders` `.ics` export. So
  the single most time-critical date in the journey (seat acceptance) lives in an isolated widget the
  student has to remember to revisit.
- **Downstream data.** `deadlines` typed table, central deadline list, reminders/.ics.
- **Priority** should · **Effort** M · **Deps** `useTableSync` mapper for offers; deadline merge.
- **Acceptance.** Offers dual-write to a typed table; each `acceptBy` appears in `/deadlines` and the
  .ics export with correct deterministic urgency.
- **Grounding.** N/A.

### G5-02 · Seat-deadline tracker silently drops dateless offers (false all-clear) · refines `/offers/seat-deadlines`
- **Why.** `SeatDeadlines.tsx:25` filters to `offers.filter(o => o.acceptBy)`; an offer entered without
  an accept-by date vanishes and the empty state reads "No accept-by dates yet." A student who logged an
  admit but hasn't filled the date sees a calm screen on the very item that forfeits a place if missed.
- **Downstream data.** `OFFERS_KEY`.
- **Priority** should · **Effort** S · **Deps** none.
- **Acceptance.** Offers lacking an accept-by date are shown as a distinct "needs a date" group rather
  than hidden; the empty state distinguishes "no offers" from "offers missing dates."
- **Grounding.** N/A.

### G5-03 · No accept/decline/conditional workflow on an offer · refines `/offers/compare`, `/offers/interpret`
- **Why.** `Offer` (`offers.ts`) has only a boolean `conditional` and a single `acceptBy`; there is no
  state for accepted/declined, no separate deposit/enrolment-fee deadline, and no condition text. The
  student can't record "accepted TU Munich, declined RWTH," can't track a deposit due before
  enrolment, and can't clear a condition ("final transcript submitted"). The whole offer→enrolment
  hand-off is narrative.
- **Downstream data.** `offers`, enrolment guide, `/deadlines`.
- **Priority** should · **Effort** M · **Deps** offer schema extension.
- **Acceptance.** An offer carries status (received→accepted/declined), an optional deposit deadline,
  and a condition list with a clear/met action; accepting one offer can prompt declining others.
- **Grounding.** N/A.

### G5-04 · Applications, offers and enrolment are three disconnected islands · refines `/process`, `/tracker`, `/arrival/enrolment`
- **Why.** `/process` is a **read-only seed board** (`Process.tsx` renders static `APPLICATION_STAGES`,
  no user state) while `/tracker` is the real Kanban (`tracker:apps`, dual-written). They share no
  state, and neither links an "accepted" application to an offer record or to the enrolment guide. The
  journey's spine (apply → admit → accept → enrol) has no continuous thread; each step is re-entered.
- **Downstream data.** `tracker:apps`, `OFFERS_KEY`, enrolment checklist.
- **Priority** should · **Effort** M–L · **Deps** shared programme identity; possibly retire/merge the
  static `/process` board into the live tracker.
- **Acceptance.** Moving an application to "decision/accepted" can create/link an offer; the offer links
  to the enrolment guide; `/process` reflects real state or is folded into the tracker.
- **Grounding.** N/A.

### G5-05 · Enrolment is a static checklist, not student/offer-specific · refines `/arrival/enrolment`
- **Why.** `Enrolment.tsx` shows the generic 5-step Immatrikulation flow and a local checklist
  (`storageKey="arrival-enrolment"`), with the Semesterbeitrag shown globally as "~€70–€430" from the
  `SEMESTERBEITRAG` fact. It doesn't know which university the student accepted (no offer read), so it
  can't show that university's contribution, deadline, or document list, and there's no Matrikelnummer/
  payment record. Correct as orientation; thin as a do-it tool.
- **Downstream data.** Accepted `offer` (university, deadline), `SEMESTERBEITRAG` fact (kept flagged).
- **Priority** could · **Effort** M · **Deps** G5-03 offer status.
- **Acceptance.** Enrolment reads the accepted offer to scope its steps/deadline; captures the
  Semesterbeitrag actually paid and the Matrikelnummer.
- **Grounding.** Semesterbeitrag stays `needsVerification:true` and per-university (`facts.ts:76`) —
  do not assert a single figure.

### G5-06 · Set deadlines have no notification, only on-page display · refines `/offers/seat-deadlines`, `/arrival/renewals`
- **Why.** `DeadlineReminder` and the seat/renewal surfaces compute days-left deterministically but
  there is no browser notification, email, or push when a date arrives; the Rückmeldung warning on
  `UniversityOnboarding.tsx` has no persistent reminder at all. A student who doesn't reopen the page
  isn't reminded. (Cross-cuts with G5-01: even the .ics path doesn't include offer dates.)
- **Downstream data.** central `/deadlines`, `/reminders` .ics.
- **Priority** could · **Effort** M · **Deps** reminders/notification mechanism.
- **Acceptance.** Any user-set deadline (offer, Rückmeldung, renewal) can be exported to .ics / raised as
  a notification, not just rendered.
- **Grounding.** N/A.

---

## Phase 6 — Finance & funding

### G6-01 · Health-insurance selector ignores profile age (manual under/over-30 gate) · refines `/finance/health-insurance`
- **Why.** The statutory-vs-private decision hinges on the under-30 / ~14th-semester rule, and the choice
  is **irreversible** (the page itself warns so, `HealthInsurance.tsx:132-140`). Yet `under30` is
  `useState(true)` (`:55`) and set only by a manual radio; `profile.dateOfBirth` exists in the schema
  and is documented as driving this tier, but is never read. The **career-switcher** persona (often 30+)
  is shown "statutory, the standard route" by default — the wrong answer for them — until they correct a
  toggle they may not understand.
- **Downstream data.** `profile.dateOfBirth`, an estimated enrolment date.
- **Priority** must · **Effort** S · **Deps** profile read.
- **Acceptance.** `under30` defaults from `profile.dateOfBirth` vs estimated enrolment; the manual toggle
  remains an override; the irreversibility warning stays.
- **Grounding.** `HEALTH_INSURANCE` fact already flagged needs_verification — keep; the age rule is
  structural guidance, label it as guidance (already done).

### G6-02 · Scholarship finder doesn't filter by nationality/eligibility · refines `/finance/scholarships`
- **Why.** `Scholarships.tsx` filters only by category buttons (open-to-all / merit / mobility /
  experience, `:49-62`); it reads the profile for *experience* matching but never for `homeCountry`. A
  **Bangladesh** student sees nationality-restricted schemes with only a generic "Eligibility
  restricted" badge and no personalised "you likely qualify / likely don't." The finder lists; it
  doesn't match the one axis (nationality) that most often disqualifies.
- **Downstream data.** `profile.homeCountry`/`nationality`, scheme eligibility metadata
  (`lib/seed/finance.ts`).
- **Priority** should · **Effort** S–M · **Deps** eligibility metadata per scheme.
- **Acceptance.** Schemes are sorted/badged against the student's nationality; clearly out-of-scope ones
  are de-emphasised, never asserted ineligible without the scheme's own rule.
- **Grounding.** Amounts already grounded/flagged; eligibility text comes from seed sources — keep
  "confirm in the official call."

### G6-03 · Funding-gap planner hardcodes cost defaults and re-types other tools' numbers · refines `/finance/funding-plan`
- **Why.** `FundingPlan.tsx:29-31` seeds `oneTime=15000`, `monthly=992`, `months=24` as bare literals.
  `992` silently duplicates `SPERRKONTO_MONTH_EUR` (`facts.ts:29`) instead of importing it, so a yearly
  Sperrkonto change drifts the default; `15000` has no source or derivation shown; the "prefill from the
  journey budget" note (`:65`) is a plain link, not a data feed. The student re-enters cost-of-living and
  application-cost figures the app already computed elsewhere.
- **Downstream data.** `SPERRKONTO_MONTH_EUR`, journey-budget output (`lib/calc/journeyBudget.ts`),
  cost-of-living + application-cost results.
- **Priority** should · **Effort** S–M · **Deps** import the constant; surface budget/CoL totals.
- **Acceptance.** Living default imports the fact constant; one-time default is derived/sourced or
  prefilled from the journey budget; values flow in from CoL/application-costs with editable overrides.
- **Grounding.** Defaults must derive from `facts.ts` constants, not literals (golden-rule 4: no drifting
  hardcoded official figure).

### G6-04 · Cost-of-living doesn't pre-select the student's city · refines `/finance/cost-of-living`
- **Why.** `CostOfLiving.tsx` is a sound deterministic calculator with a clear "not an official figure"
  disclaimer, but the city is always manually picked even when the intake/shortlist already implies a
  study city. Minor, but it's a re-entry the app could avoid and a small honesty win (the baseline the
  student sees first would match their actual target).
- **Downstream data.** intake/shortlist city, `lib/calc/costOfLiving.ts` baselines.
- **Priority** could · **Effort** S · **Deps** intake city field.
- **Acceptance.** City defaults from profile/shortlist when present; manual override preserved.
- **Grounding.** Deterministic math + disclaimer already correct.

### G6-05 · Application-cost & funding figures don't reconcile into one money view · refines `/finance/application-costs`, `/finance/funding-plan`, `/start/budget`
- **Why.** `ApplicationCosts.tsx` correctly reads `programs:shortlist` length and `profile.homeCountry`
  for APS, and `/start/budget` does the total-journey math, but the three money tools (application costs,
  journey budget, funding gap) each hold their own numbers; nothing reconciles "total need" across them.
  A student can't see one coherent figure, so the funding-gap answer can silently contradict the budget
  page.
- **Downstream data.** `programs:shortlist`, journey-budget output, funding-gap inputs, the euro
  constants in `facts.ts`.
- **Priority** should · **Effort** M · **Deps** G6-03; a shared cost source.
- **Acceptance.** One total-need figure is computed once and consumed by funding-gap and the budget view;
  changing the shortlist updates all three consistently.
- **Grounding.** All euro inputs sourced from `facts.ts` constants (already partly done in
  ApplicationCosts) — extend to the others.

### G6-06 · Sperrkonto progress, scholarship tracker, loan & work-day data are blob-only · refines `/finance/sperrkonto-providers`, `/finance/scholarship-tracker`, `/finance/loans`, `/finance/work-days`
- **Why.** All four persist via `useSyncedState` (so they sync to the signed-in blob — not lost), but
  none reaches a typed table the way SEC-3 mandated for the other personal records, and none feeds the
  single funding view (G6-05) or the deadline system (scholarship deadlines don't reach `/deadlines`).
  The work-day tracker (140/280) and sperrkonto-funded progress are exactly the kind of compliance/goal
  data that should be queryable, not buried in JSONB.
- **Downstream data.** typed tables (future), `/deadlines` (scholarship deadlines), funding view.
- **Priority** could · **Effort** M · **Deps** `useTableSync` mappers; deadline merge.
- **Acceptance.** Scholarship application deadlines surface in `/deadlines`/.ics; funded-progress and
  work-day tallies are available to the unified funding view; typed-table dual-write where the data model
  expects it.
- **Grounding.** Figures already grounded (`SPERRKONTO_YEAR_EUR`, `WORK_LIMIT`) — keep flags.

---

## Register summary

18 items: **1 must**, **10 should**, **7 could**. The spine problem (phases 4→5) is the lack of a shared
programme identity across the document, application and offer stores (G4-01/03, G5-01/03/04); the spine
problem in phase 6 is that the money tools don't share one grounded total (G6-03/05). The single highest-
risk correctness item is **G6-01** (irreversible insurance choice defaulting wrong for 30+ students).
