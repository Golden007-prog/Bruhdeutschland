# Gap Analysis — Journey Phases 4–6 (Documents · Offers/Enrollment · Finance)

> **Scope:** Phase 4 (Documents & application), Phase 5 (Offers & enrollment), Phase 6 (Finance & funding).
> **Method:** Walked three personas end-to-end — (a) Master's applicant (Bangladesh, no APS), (b) career-switcher with work experience, (c) Medicine aspirant (NC/TMS/Studienkolleg realism). FIND & DOCUMENT ONLY — no code or DB modified.
> **Verdict legend:** EXISTS (fully covered) · PARTIAL (present but incomplete) · MISSING.
> **Key structural finding:** Phase 4–6 is feature-rich but the data is **siloed**. The application Tracker, the Offers store, the Requirements records, the Document Vault, and the Calendar/Reminders system are five separate per-user stores that do not cross-reference. The biggest gaps are *integration & per-program scoping*, not missing screens.

---

## How current coverage maps to the persona journey

| Persona | Phase 4 pain | Phase 5 pain | Phase 6 pain |
|---|---|---|---|
| (a) Bangladesh Master's, no APS | APS correctly flagged "no office" (good), but cannot keep a tailored SOP per program; requirements are free text only | Offers board OK, but it's a *second* list separate from the Tracker they already built | Scholarship finder doesn't pre-filter to Bangladesh-eligible schemes; funding plan needs manual re-entry |
| (b) Career-switcher w/ experience | SOP AI weaves experience arc (good), but no per-program version; gap-explanation only in SOP, not surfaced in tracker | No place to record *why* an offer fits their career pivot | Over-30 health-insurance branch is prose-only; work-day income cap not linked to funding plan |
| (c) Medicine aspirant (NC/TMS) | DoSV walkthrough exists, but Tracker/Offers have no NC/Studienkolleg/Hochschulstart awareness; no Studienkolleg→FSP→enrolment document chain | Admission-letter interpreter is generic; no Hochschulstart-specific seat-acceptance semantics (Koordinierungsphase / clearing) | Same finance gaps; plus no NC-specific cost note (Studienkolleg year extends Sperrkonto/CoL months) |

---

# PHASE 4 — Documents & application

### GAP-401 · Phase 4 · Per-program document studio (SOP/CV/LOR are single global drafts)
- **Why needed:** A real applicant targets 3–6 programs and must tailor the SOP/motivation letter to each (named modules, professors, why-this-program). The career-switcher especially needs a distinct narrative per target.
- **Current state — MISSING.** `Sop.tsx:119-120` persists one global draft (`doc:sop:draft`) + one form (`doc:sop:form`). `Cv.tsx` → single `doc:cv:form`; `Lor.tsx` → single `doc:lor:program`/`doc:lor:university`. Tailoring for program #2 overwrites program #1's draft. `Vault.tsx:88-93` shows only one "Drafted" badge per type, confirming a single artifact.
- **Data used:** keys `doc:sop:*`, `doc:cv:*`, `doc:lor:*`; would key off Offers/Tracker program ids (`offers:list`, `tracker:apps`).
- **Priority:** MUST · **Effort:** M · **Dependencies:** GAP-405 (one canonical program list).
- **Acceptance criteria:**
  - SOP/CV/LOR drafts are stored per program id (e.g. `doc:sop:draft:{appId}`), not globally.
  - The studio offers a program picker pre-filled from the Tracker/Offers; switching programs loads that program's draft without clobbering others.
  - Vault lists each program's drafted documents separately with a per-program "Drafted/Not started" badge.
  - Migration: an existing single global draft is preserved (e.g. attached to a "General" bucket), never silently dropped.
- **Grounding needs:** none (user content); ensure the existing "edit before sending / verify every detail" guidance persists per draft.

### GAP-402 · Phase 4 · Per-program requirement → auto-checklist (extractor stores free text only)
- **Why needed:** Each German program states different requirements (VPD vs direct, GRE/GMAT or not, language threshold, # LORs). Students must turn that into an actionable, trackable checklist instead of re-reading portals.
- **Current state — PARTIAL/MISSING.** `Requirements.tsx` stores a record `{ programme, deadline, requirements }` where `requirements` is a raw textarea (`programme:requirements` key); there is no parsing, no structured checklist, and no link to the Vault matrix, Tracker, or Calendar.
- **Data used:** `programme:requirements`; should emit checklist items consumed by `VaultMatrix.tsx` and Tracker.
- **Priority:** MUST · **Effort:** M · **Dependencies:** GAP-405.
- **Acceptance criteria:**
  - Pasted requirements produce a structured, editable checklist (language cert, transcript, # LORs, GRE y/n, VPD y/n, translations) — AI-assisted extraction is acceptable but must be user-confirmable, never authoritative.
  - The generated checklist is attached to the matching program and surfaces in the Vault matrix ("for TU München you still need X").
  - Deadlines captured here flow into the unified deadline surface (see GAP-411).
  - Empty/edit/delete states handled; nothing fabricated — extractor only restructures the user's own pasted text.
- **Grounding needs:** none for the user's pasted text; if AI infers a requirement not in the text, mark it as a suggestion to verify, never a fact.

### GAP-403 · Phase 4 · Document vault has no versioning or submission provenance
- **Why needed:** Students iterate documents (transcript v1 → updated, SOP v2 after feedback) and must know *which version went to which program on what date* — critical if a university queries a submission.
- **Current state — MISSING.** `Vault.tsx:62-68` `VaultItem` = `{ id, name, kind, note, url }` — no version, no timestamp, no submitted-to mapping. `VaultMatrix.tsx` records sent/not-sent booleans against a fixed 8-row doc list with no date or version.
- **Data used:** `vault:items`, `vault:matrix`; Supabase `documents` table (has `content`, `item_key`, `kind`, `updated_at` but no version column per the subagent read of `database.types.ts`).
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** none.
- **Acceptance criteria:**
  - A vault item can hold multiple dated versions; the active version is clearly marked.
  - The doc-per-application matrix records *which version* was sent and *when* (timestamp), not just a boolean.
  - History is per-user scoped and survives refresh + auth switch (per the P0 isolation rule).
  - Privacy stance preserved: still metadata/links only, no binary upload, no PII logged.
- **Grounding needs:** none.

### GAP-404 · Phase 4 · No academic-integrity / AI-content check on generated documents
- **Why needed:** German universities are strict on plagiarism (the app's own `campus/Culture.tsx` stresses this). Students who "Generate with AI" then submit verbatim risk integrity flags; they need a guardrail/warning and a self-check.
- **Current state — MISSING.** `Sop.tsx` produces an AI draft with only an `AiGeneratedBadge` (line 321). No similarity/AI-content self-check, no "rewrite in your own voice" gate, no integrity checklist tied to the document.
- **Data used:** SOP/CV/LOR drafts.
- **Priority:** SHOULD · **Effort:** S · **Dependencies:** GAP-401.
- **Acceptance criteria:**
  - After AI generation, the student sees an explicit integrity notice + a short self-check ("Have you rewritten this in your own voice? Verified every fact?") they must acknowledge before export.
  - A lightweight originality nudge (e.g. flag long passages still identical to the AI output) — heuristic only, clearly labeled "not a plagiarism scanner."
  - Links to `campus/culture` plagiarism guidance.
- **Grounding needs:** none; must NOT claim to be a certified plagiarism detector.

### GAP-405 · Phase 4 · Two parallel "my applications" stores (Tracker `tracker:apps` vs Offers `offers:list`) never reconcile
- **Why needed:** A student adds programs to the Tracker Kanban while applying, then re-types the *same* programs into the Offers board when admits arrive. One program now lives in two stores with no link, doubling data entry and risking divergence.
- **Current state — MISSING (integration).** `Tracker.tsx:34` uses `tracker:apps` (`{university, program, stage, deadline?, url?}`); `offers/offers.ts:23` uses `offers:list` (`{programme, university, city, language, tuitionPerSem, acceptBy, conditional}`). Both keys are read across `Dashboard.tsx`, `NextActions.tsx`, `Matching.tsx`, but nothing maps a Tracker app to its Offer.
- **Data used:** `tracker:apps`, `offers:list`.
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** none (enables GAP-401/402/411).
- **Acceptance criteria:**
  - A single canonical program identity links a Tracker card → its Offer → its Requirements checklist → its documents.
  - Promoting a Tracker card to "Decision/Admit" can seed an Offer without re-typing university/program.
  - No regression to the existing per-page UX; backfill is non-destructive.
- **Grounding needs:** none.

### GAP-406 · Phase 4 · Tracker has a `deadline` field but no UI to set it, and it never reaches the calendar
- **Why needed:** Application deadlines are the most time-critical Phase-4 data. The schema anticipates them but the student cannot enter them, and even the Offers `acceptBy` (which *is* enterable) only reaches Reminders, not the month Calendar.
- **Current state — PARTIAL.** `Tracker.tsx:14-21` declares `deadline?` and `url?` but the add form (`Tracker.tsx:72-95`) and card render (`117-162`) expose neither — the field is dead. Separately, `Calendar.tsx` only merges `SEED_EVENTS` + manual `calendar:deadlines`; it does not read `offers:list` or `tracker:apps`.
- **Data used:** `tracker:apps.deadline`, `offers:list.acceptBy`, `calendar:deadlines`.
- **Priority:** MUST · **Effort:** S · **Dependencies:** GAP-411 (unified deadlines).
- **Acceptance criteria:**
  - Tracker cards expose deadline + URL inputs that persist.
  - Application deadlines and offer accept-by dates appear on the month Calendar and in the Reminders/.ics export.
  - Urgency is computed deterministically with the existing `deadlines.ts` helpers (no model math).
- **Grounding needs:** none.

### GAP-407 · Phase 4 · uni-assist / VPD / APS tracking is manual status-cycling, with no honest "we can't see the portal" framing gaps
- **Why needed:** Students worry whether uni-assist actually forwarded their file. The trackers are fine as *self-reported* status, but the medicine/Hochschulstart and VPD flows need clearer stage semantics and the honest caveat that status is user-entered, not portal-synced.
- **Current state — PARTIAL.** `Vpd.tsx` cycles `requested → processing → received` manually (`doc:vpd:entries`); `UniAssist.tsx` is a static walkthrough; APS tracking is country-logic + checklist. None claim live sync (correct), but the student gets no guidance on *expected* processing times or what to do when stuck.
- **Data used:** `doc:vpd:entries`, APS/uni-assist checklists.
- **Priority:** COULD · **Effort:** S · **Dependencies:** none.
- **Acceptance criteria:**
  - Each manual tracker states plainly "status is what you record — we don't read the portal."
  - Adds grounded typical-processing-window guidance (uni-assist VPD weeks; APS timelines) with provenance + `needs_verification`.
  - A "stuck / overdue" nudge when a stage exceeds its typical window.
- **Grounding needs:** uni-assist VPD turnaround, APS processing times — must be grounded (uni-assist / APS official) or flagged `needs_verification`; never invent week counts.

---

# PHASE 5 — Offers & enrollment

### GAP-501 · Phase 5 · Offer comparison ignores total cost of ownership (only tuition/sem, no CoL/city/funding context)
- **Why needed:** German public tuition is mostly €0, so "cheapest by tuition" is nearly meaningless. The real decision drivers are city cost-of-living, Semesterbeitrag, language, and funding fit. The board badges "cheapest" purely on `tuitionPerSem`, which can mislead.
- **Current state — PARTIAL.** `OfferComparison.tsx:24-28` computes `cheapest` from `tuitionPerSem` only; it captures `city` but never pulls the city's CoL (`costOfLiving.ts` has per-city profiles) or the Semesterbeitrag. No link to funding-gap.
- **Data used:** `offers:list`, `costOfLiving.ts` CITY_PROFILES, `SEMESTERBEITRAG` fact.
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** GAP-505 (CoL→funding wiring).
- **Acceptance criteria:**
  - Each offer optionally shows the city's estimated monthly CoL (deterministic, from `costOfLiving.ts`) and the typical Semesterbeitrag, clearly labeled illustrative.
  - "Cheapest" / decision badges reflect total monthly cost, not tuition alone, or the misleading badge is removed.
  - Disclaimer present (advisory, not financial advice).
- **Grounding needs:** Semesterbeitrag + CoL figures already carry source/illustrative labels; preserve them.

### GAP-502 · Phase 5 · Enrollment (Immatrikulation) is a static guide, not a per-program tracked workflow
- **Why needed:** After an admit, enrollment is a hard-deadline, multi-step sequence (accept → pay Semesterbeitrag → insurance confirmation → submit docs → Matrikelnummer). A student juggling multiple admits needs a *tracked* enrollment per accepted offer, not one shared checklist.
- **Current state — PARTIAL.** `Enrolment.tsx` shows a single shared `Checklist` (`arrival-enrolment`) + a 5-step prose list + the `SEMESTERBEITRAG` official fact (well grounded). It's not tied to a specific accepted offer and can't track two enrollments.
- **Data used:** `arrival-enrolment` checklist, `ENROLMENT_DOCS`, `SEMESTERBEITRAG`, `offers:list`.
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** GAP-405.
- **Acceptance criteria:**
  - Enrollment checklist + Semesterbeitrag-paid + insurance-confirmation status can be tracked per accepted offer.
  - The enrollment deadline is the same date object surfaced on the Calendar/Reminders.
  - Medicine/Studienkolleg variant: notes the Studienkolleg → FSP → degree enrollment chain where the pathway flags it.
- **Grounding needs:** Semesterbeitrag already grounded; keep provenance.

### GAP-503 · Phase 5 · Admission-letter interpreter and seat-deadlines lack NC / Hochschulstart (DoSV) semantics for the Medicine persona
- **Why needed:** For NC/Medicine places allocated via Hochschulstart's DoSV, "accepting a seat" works differently (coordination phase, clearing/Koordinierungsphase, ranked priorities). The generic Zulassungsbescheid interpreter and seat tracker don't reflect this, so the Medicine aspirant gets advice that doesn't match their procedure.
- **Current state — MISSING.** `AdmissionLetter.tsx` is a generic checklist of letter contents; `SeatDeadlines.tsx` treats all offers identically (one `acceptBy` per offer). A DoSV walkthrough exists at `/documents/dosv` but is not linked from the offers/enrollment flow, and offers carry no "central allocation" flag.
- **Data used:** `offers:list`, DoSV content.
- **Priority:** COULD · **Effort:** M · **Dependencies:** GAP-403/505 minimal.
- **Acceptance criteria:**
  - An offer can be flagged "centrally allocated (Hochschulstart/DoSV)"; that flag surfaces DoSV-specific accept/clearing guidance and links `/documents/dosv`.
  - Seat-deadline copy distinguishes a direct university accept-by from a DoSV coordination-phase date.
  - Medicine realism preserved (no implied guarantee of a place).
- **Grounding needs:** DoSV phase rules/dates — grounded (hochschulstart) or `needs_verification`.

---

# PHASE 6 — Finance & funding

### GAP-601 · Phase 6 · Scholarship "finder" doesn't match to the student profile (static category filter only)
- **Why needed:** Eligibility is country/field/level/recency-specific (DAAD EPOS country list & 2-yr work + recency rules; Deutschlandstipendium; Erasmus+). The Bangladesh applicant and the career-switcher should see *their* eligible schemes surfaced, not the same nine for everyone.
- **Current state — PARTIAL.** `Scholarships.tsx` filters a static 9-item `SCHOLARSHIPS` list by manual category (all/open-to-all/merit/mobility/needs-experience) and shows an experience-match note; it does **not** read `profile.homeCountry`, `targetLevel`, or field. Facts themselves are grounded (DAAD/EPOS notes carry source + "verify against official EPOS criteria").
- **Data used:** `SCHOLARSHIPS` (`seed/finance.ts`), profile (`homeCountry`, level, field, experience).
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** none.
- **Acceptance criteria:**
  - Schemes are ranked/flagged by the student's country, level, field, and experience/recency, with an explicit "you may be eligible / likely not eligible / verify" state per scheme.
  - Eligibility logic is transparent and grounded; where the rule is uncertain it shows `needs_verification`, never a hard yes/no.
  - Existing grounded facts and the advisory disclaimer are retained.
- **Grounding needs:** EPOS country list + 2-yr/6-yr rules, Deutschlandstipendium amount, Erasmus+ — grounded or `needs_verification`.

### GAP-602 · Phase 6 · Funding-gap planner requires manual re-entry instead of pulling the journey total + tracked Sperrkonto progress
- **Why needed:** The student already computed application costs, CoL, and Sperrkonto progress elsewhere. Re-typing `oneTime`/`monthly` into the funding plan is error-prone and breaks the flow; the "Prefill totals" link only navigates, it doesn't prefill.
- **Current state — MISSING (integration).** `FundingPlan.tsx` has manual `oneTime`/`monthly` inputs; `journeyBudget.ts` (`computeJourneyBudget`) and `SperrkontoProviders.tsx` tracked progress exist but are not imported into the planner. The "Prefill from the journey budget" copy implies auto-fill that doesn't happen.
- **Data used:** `journeyBudget.ts`, application-costs state, `costOfLiving.ts`, Sperrkonto-providers tracked total.
- **Priority:** SHOULD · **Effort:** M · **Dependencies:** GAP-505.
- **Acceptance criteria:**
  - Funding plan can pull the computed one-time total (APS + uni-assist + translations + visa + flights + deposit) and monthly CoL from the journey budget, with the student able to override.
  - Tracked Sperrkonto progress counts toward the funded side automatically.
  - All math stays deterministic (`fundingGap.ts` / `journeyBudget.ts`), unit-tested; no model-computed totals.
- **Grounding needs:** underlying official figures already grounded; preserve provenance.

### GAP-603 · Phase 6 · Health-insurance selector and CoL ignore the profile; over-30 branch is prose-only
- **Why needed:** The selector asks the student to re-toggle under-30/agreement that the profile/intake may already know; and the over-30 → private/voluntary outcome (a real cost jump for the career-switcher) is asserted only in prose without a grounded figure or threshold citation.
- **Current state — PARTIAL.** `HealthInsurance.tsx:28-51` `recommend()` correctly branches under-30 / over-30 / agreement, but state is local `useState` (manual), not read from profile/intake; the over-30 path (`45-50`) cites no figure and the `HEALTH_INSURANCE` fact (~€120–140) doesn't model the over-30 voluntary rate. CoL is deterministic & per-city but city figures lack per-line provenance and don't auto-feed funding.
- **Data used:** profile/intake (age/country), `HEALTH_INSURANCE` fact, `costOfLiving.ts`.
- **Priority:** COULD · **Effort:** S · **Dependencies:** GAP-602.
- **Acceptance criteria:**
  - Selector pre-fills under-30/agreement from the profile when available (still overridable).
  - The over-30 / >14-semester case shows a grounded range (or `needs_verification`) for voluntary-statutory/private, not just prose.
  - CoL city baselines carry an "illustrative, source/year" label per the golden rules.
- **Grounding needs:** statutory student rate, over-30 voluntary rate, age/semester threshold — grounded (TK/official) or `needs_verification`.

### GAP-604 · Phase 6 · Work-day allowance (140/280) isn't connected to the funding plan's "work income" line
- **Why needed:** Students often over-estimate part-time earnings. The app computes the legal day budget deterministically but the funding plan's work-income field is a free number with no sanity bound, so a student can plan on income their permit doesn't allow.
- **Current state — MISSING (integration).** `WorkDays.tsx` + `workDays.ts` correctly compute the 140/280 budget (grounded `WORK_LIMIT`); `FundingPlan.tsx` accepts an arbitrary monthly work-income with no link to that limit.
- **Data used:** `workDays.ts` budget, `FundingPlan` work-income input.
- **Priority:** COULD · **Effort:** S · **Dependencies:** GAP-602.
- **Acceptance criteria:**
  - Funding plan shows an indicative maximum realistic work income derived from the 140/280 budget, with the student able to override.
  - The figure is clearly "indicative, depends on wage/role"; no invented hourly wage stated as fact.
  - 140/280 rule remains grounded.
- **Grounding needs:** 140/280 already grounded; any assumed wage must be user-entered or flagged, never asserted.

### GAP-605 · Phase 6 · No single cost source of truth: Sperrkonto amount, application costs, and CoL are computed in three places that don't share state
- **Why needed:** A coherent "what will this cost and am I covered?" answer requires one number. Today the Sperrkonto requirement, the application-cost estimator, the CoL calc, and the funding plan each hold their own inputs, so the student can see inconsistent totals.
- **Current state — PARTIAL.** `SPERRKONTO_YEAR_EUR` (€11,904) is a single grounded constant (good, `facts.ts`), used by SperrkontoProviders; but `ApplicationCosts.tsx`, `CostOfLiving.tsx`, `journeyBudget.ts`, and `FundingPlan.tsx` don't converge on one persisted budget object.
- **Data used:** `SPERRKONTO_YEAR_EUR`, application-costs state, CoL state, `journeyBudget.ts`, funding-plan state.
- **Priority:** SHOULD · **Effort:** L · **Dependencies:** GAP-602.
- **Acceptance criteria:**
  - One persisted journey-budget object is the source for the budget page, funding plan, offer comparison, and Sperrkonto target.
  - Changing an input in one place is reflected everywhere (or clearly shown as an override).
  - Deterministic, tested; every official figure retains provenance.
- **Grounding needs:** Sperrkonto €11,904 + per-fact `retrieved_at` (currently module-level only — add per-fact retrieval metadata).

---

# CROSS-PHASE (spans 4–6)

### GAP-411 · Cross · No unified deadline surface — three disconnected deadline systems
- **Why needed:** A student's worst failure mode is missing a date. Today dates live in (1) `Calendar.tsx` (`calendar:deadlines` + seed), (2) `Reminders.tsx` (`reminder:*` keys + offers `acceptBy`), and (3) the Tracker's unused `deadline` field. Application deadlines and requirement deadlines reach *none* of these.
- **Current state — PARTIAL.** Calendar reads seed + `calendar:deadlines` only; Reminders reads 7 fixed `reminder:*` keys + offers; Tracker/Requirements deadlines are stranded. There is good `.ics` export, but it only sees reminders + offers.
- **Data used:** `calendar:deadlines`, `reminder:*`, `offers:list`, `tracker:apps.deadline`, `programme:requirements.deadline`, `SEED_EVENTS`.
- **Priority:** MUST · **Effort:** M · **Dependencies:** GAP-405/406.
- **Acceptance criteria:**
  - One deadline aggregator feeds the Calendar grid, the Reminders list, and the `.ics` export from a single source.
  - Application, offer accept-by, requirement, enrollment, visa, and renewal dates all appear in all three views.
  - Deterministic urgency/severity via `deadlines.ts`; timezone-safe; survives refresh + auth switch.
- **Grounding needs:** none (user dates); seed official dates keep their verification flags.

### GAP-412 · Cross · Per-user persistence & isolation must be re-verified for every Phase 4–6 store
- **Why needed:** Project P0 rule: personal data must be namespaced per user and reset on auth change. Phase 4–6 introduces many `useSyncedState` keys (`doc:*`, `vault:*`, `offers:list`, `tracker:apps`, `programme:requirements`, `lor:requests`, `translation:tracker`, `attestation:tracker`, `reminder:*`, `calendar:deadlines`, funding/sperrkonto inputs). Any one leaking across accounts is a P0.
- **Current state — NEEDS VERIFICATION.** All use `useSyncedState` (which the memory notes is the scoped/per-user path), but this audit did not execute the log-in-as-A-then-B repro; it must be confirmed for each key above.
- **Data used:** all Phase 4–6 synced keys.
- **Priority:** MUST · **Effort:** S (verification) · **Dependencies:** none.
- **Acceptance criteria:**
  - For each key, log in as A → enter data → log in as B → B sees nothing of A's; log back in as A → A's data intact.
  - No data flash of A's content before B's loads.
  - Documented evidence per store (or a bug filed with severity).
- **Grounding needs:** n/a (security/privacy).

---

## Notes on things that are GOOD (not gaps) — to avoid re-flagging
- **APS country logic** is grounded and correct: Bangladesh = no APS office / not required; India/China/Vietnam/Mongolia/Pakistan handled (`country.ts`, `visa/Aps.tsx`). Persona (a) is served well here.
- **Sperrkonto €11,904** is a single grounded constant with source + `needsVerification` (only weakness: per-fact `retrieved_at` is module-level — see GAP-605).
- **Work-day 140/280 rule** is grounded and computed deterministically (`workDays.ts`, tested).
- **Cost-of-living & funding-gap math** are deterministic and unit-tested (`costOfLiving.ts`, `fundingGap.ts`, `journeyBudget.ts`).
- **Loan comparison** correctly refuses to invent interest rates (`Loans.tsx`).
- **Attestation & translation trackers** are functional per-document status tools.
- **Offers `.ics` export** works and is a nice touch (the gap is only that more sources should feed it — GAP-411).
