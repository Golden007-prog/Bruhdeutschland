# DeutschPrep — Gap Analysis (v2 Backlog)

> **Read this first.** The first build is **shipped**: all 51 first-build features (G01–G51) exist
> as route-registered pages in `frontend/src/lib/nav.tsx` — each carries its `G##` id in the page
> eyebrow there (e.g. `/profile/studienkolleg` → "G06 · Foundations", `/visa/appointment` →
> "G34 · Visa", `/arrival/family-reunion` → "G45 · Ongoing", `/reminders` → "G51 · Overview").
> This document is therefore **not** a "missing-feature" register. It is the **v2 backlog**, split into:
>
> - **Section A — Genuinely missing (NEW).** Surfaces that have **no page at all** today — verified
>   against `nav.tsx` and the `frontend/src/pages/**` tree. These cluster in failure/contingency paths
>   and the German job-search / career-execution layer.
> - **Section B — Depth / refinement on shipped pages.** Integration and quality gaps **on top of
>   pages that already exist**. Every Section-B item names the live route it `refines:`.
>
> **Method (unchanged):** walked the journey as real personas — Class-12 India school-leaver, Class-10
> student (honestly blocked, verified), Bangladesh Master's applicant (no APS), career-switcher with
> work experience, Medicine/NC aspirant, and a student already settling in Germany. A page that already
> covers a need is not a gap; refinements say what the shipped page still lacks.
>
> **Grounding discipline (CLAUDE.md §2/§3):** any item surfacing an official German fact (visa rules,
> deadlines, thresholds, fees, processing windows) must be **grounded (source + `needs_verification`)**
> — never assert an official number without provenance.

---

## 0. Status & counts

**Shipped (v1):** 51 features, all route-registered in `nav.tsx` (G01–G51). Confirmed present, not re-listed here.

**v2 backlog:** 16 NEW surfaces (Section A) + 31 depth/refinements on shipped pages (Section B) = **47 backlog items.**

| Section | Items | must | should | could |
|---|---:|---:|---:|---:|
| A — Genuinely missing (NEW) | 16 | 4 | 9 | 3 |
| B — Depth / refinement on shipped pages | 31 | 6 | 19 | 6 |
| **Total** | **47** | **10** | **28** | **9** |

**Moved out of this backlog (not feature gaps):**

- **Per-user isolation re-verification** (was `GAP-412`) — a defect/verification task, not a feature.
  → see **`qa-findings.md` (SEC-3)**: log-in-as-A-then-B repro across every Phase 4–6 synced key.
- **One real grounding defect:** `FamilyReunion.tsx:14-17` states income/housing/A1 expectations as bare
  prose with no figure and no `needsVerification`, violating CLAUDE.md §2/§3.
  → logged in **`qa-findings.md` (HON-FamilyReunion)**. The *feature* side (a deterministic
  income/housing helper) remains here as refinement **R28**; the grounding fix is the qa-findings item.

---

## Section A — Genuinely missing (NEW surfaces, no page today)

> Each verified absent: no eyebrow in `nav.tsx` and no dedicated page in `frontend/src/pages/**`.
> Where a topic is *mentioned in passing* on an existing page (Fiktionsbescheinigung is named on
> `arrival/ResidencePermit.tsx`, Haftpflicht on `arrival/Rundfunkbeitrag.tsx`, exmatrikulation on
> `arrival/Renewals.tsx`), it is still NEW because no surface actually *walks* it — but the spec notes
> the page it should link from.

### A — register

| ID | Phase | Feature (no page today) | Why a student needs it | Pri | Eff | Deps · scratch ref |
|---|---|---|---|---|---|---|
| N01 | 7 | Visa refusal & appeal (remonstration) pathway | Every visa page stops dead at a decision; a refused non-EU applicant has zero in-app guidance at peak stress | **must** | M | `seed/visa.ts`, `sources.ts` · 7A |
| N02 | 7 | Embassy/VFS slot-acquisition strategy + no-slot fallback | #1 real bottleneck is *getting* the slot; `visa/Appointment.tsx` assumes you already have one | should | M | N03; `seed/visa.ts` · 7B |
| N03 | 7→8 | Travel/entry health insurance for the coverage gap | A few weeks in Germany with no active German cover; the visa often requires incoming insurance for entry | **must** | M | links `finance/health-insurance` · 7C |
| N04 | 8 | Anmeldung "no-appointment-available" fallback | Anmeldung gates bank/permit/tax-ID; big-city slots vanish for months → student blocked on everything downstream | **must** | S | links `arrival/anmeldung-runbook` · 8C |
| N05 | 8 | Fiktionsbescheinigung interim-certificate walkthrough | When the entry visa lapses before the permit issues, this is the only thing keeping the student legal; only *named* on ResidencePermit today | should | S | `arrival/residence-permit` · 8D |
| N06 | 8 | Liability insurance (Privathaftpflicht) guide (+ add source) | Landlords/WGs expect it; cheap + near-universal; only name-dropped on Rundfunkbeitrag; no `haftpflicht` source exists | should | S | add `sources.ts` entry · 8B |
| N07 | 8 | Finding a Hausarzt + how the health system works (116117/112) | No page covers *using* the system after buying insurance — meds, mental health, sick notes (AU) | should | M | N03 · 8E |
| N08 | 8 | Emergency / support directory + buddy/community connect | Work-order §3 #50 explicitly; nothing in the cluster provides it; isolation is a top struggle reason | should | S | — · 8F |
| N09 | 8 | SCHUFA / no-credit-history explainer + bank contingency | SCHUFA gates phone contracts and rentals; foreign students start with no history; `arrival/bank-account` is happy-path | should | S | `arrival/bank-account` · 8G |
| N10 | 8 | Handyvertrag vs prepaid + prerequisites | Contract needs Anmeldung + bank + often SCHUFA; min-term/cancellation traps; only "get SIM" checklist lines exist | could | S | N09 · 8H |
| N11 | 9 | German job-search execution kit (market CV + Anschreiben + portals) | The long-game depends on landing a qualified job; app explains the 18-mo window but gives no tool to apply | **must** | L | `lib/profile/experience.ts`, doc-gen, LLM · 9A |
| N12 | 9 | Regulated-profession recognition (Approbation/Anerkennung) tracker | Medicine/nursing/etc can't practise without it; `approbation` source exists but no page uses it | should | M | `sources.ts`, `career/outcomes` · 9D |
| N13 | 9 | Permit-loss / exmatrikulation risk explainer | `arrival/renewals` tracks dates but never explains consequences of missing them (exmatrikuliert → permit at risk) | should | S | `arrival/renewals` · 9E |
| N14 | 9 | Pension/social-security + payslip (Lohnabrechnung) explainer | Working students get a payslip shock; underpins the pension contribution behind PR; `tax-id` doesn't read a payslip | could | S | `arrival/tax-id` · 9F |
| N15 | 9 | Tax-return (Steuererklärung) helper + deadline reminder | `tax-id` says refunds exist but gives no deadline/reminder/how-to; pairs with the existing `DeadlineReminder` | could | S | `arrival/tax-id` · 9G |
| N16 | 9 | Networking-events / career-fairs finder | `campus/networking` exists but `job-seeker-permit` links to no events surface; completes the career-execution band | should | M | N11 · 9H |

**Section A: 16 NEW · must 4 (N01, N03, N04, N11) · should 9 · could 3 (N10, N14, N15).**

### A — full specs

#### N01 · Phase 7 · Visa refusal & appeal (remonstration) pathway — *(scratch 7A)* · **MUST**
- **Why:** `visa/Overview.tsx`, `visa/Checklist.tsx`, `visa/Appointment.tsx` walk submission → decision
  but stop dead at a refusal. A refused first-time non-EU applicant — a common, high-stress outcome — has
  no in-app guidance. The single biggest contingency hole in Phase 7.
- **Acceptance:** lists common refusal grounds (insufficient funds, doubt about intent, document gaps) as
  *general guidance*; states the remonstration/appeal concept and that the **deadline + procedure are
  mission-specific**, rendered with `needs_verification` + a mission link — never a hard number; provides a
  resubmission checklist reusing `VISA_DOCS`; carries the visa/finance disclaimer.
- **Grounding:** remonstration deadline is official + mission-specific → `needs_verification`. No fabricated appeal windows.

#### N02 · Phase 7 · Embassy/VFS slot-acquisition strategy + no-slot fallback — *(scratch 7B)*
- **Why:** `visa/Appointment.tsx` (G34) tracks a *booked* slot but assumes you have one. The #1 real
  bottleneck for Indian/Bangladeshi students is **getting** the slot; the app says waits "run months" but
  offers no strategy.
- **Acceptance:** explains slot-release patterns generically (no fabricated release times); lists concrete
  fallbacks (alternate jurisdiction, VFS premium/Prime-Time where offered, waitlist); mission-specific timing
  is `needs_verification` + linked. Its slot reminders should feed the existing reminders/calendar surfaces.
- **Grounding:** no invented slot-release schedules; processing/lead times stay grounded (`VISA_PROCESSING`).

#### N03 · Phase 7→8 · Travel/entry health insurance for the coverage gap — *(scratch 7C)* · **MUST**
- **Why:** `finance/HealthInsurance.tsx` (Feature 19) covers *choosing* statutory vs private for the
  visa/enrolment, but nothing covers the **gap period** — a few weeks in Germany with no active German
  cover. The visa itself often requires incoming-travel insurance for entry; `campus/PreDeparture.tsx`
  lists "insurance" as a bare checklist item.
- **Acceptance:** distinguishes **entry/travel insurance** from statutory student insurance; explains the
  activation gap and that public cover starts on enrolment (verify); no fabricated premiums; disclaimer.
- **Grounding:** activation timing `needs_verification`; no invented coverage amounts.

#### N04 · Phase 8 · Anmeldung "no-appointment-available" fallback — *(scratch 8C)* · **MUST**
- **Why:** `visa/Anmeldung.tsx` (Feature 26) and `arrival/AnmeldungRunbook.tsx` (G42) assume you can book
  an appointment. In Berlin/Munich/Hamburg slots vanish for months. Anmeldung gates the bank account,
  residence permit, and tax ID — a student who can't get a slot is **blocked on everything downstream**.
- **Acceptance:** section covering walk-in/Spontantermine hours, alternate districts, and documenting your
  attempts; keeps the 14-day window grounded; states enforcement is practice-dependent (`needs_verification`).
  Add as a fallback section on / linked from `arrival/anmeldung-runbook`.
- **Grounding:** registration window stays grounded; no fabricated city-specific wait times.

#### N05 · Phase 8 · Fiktionsbescheinigung interim-certificate walkthrough — *(scratch 8D)*
- **Why:** `arrival/ResidencePermit.tsx` (G39) *warns* to "request a Fiktionsbescheinigung" but never
  explains how/when (verified: the term appears only as a mention). Given months-long ABH waits, the entry
  visa frequently lapses first — this certificate is the only thing keeping the student in status.
- **Acceptance:** explains the trigger (visa expiring pre-permit), how to request it, what it permits
  (work/travel caveats `needs_verification`); disclaimer. Link from `residence-permit` and `auslaenderbehoerde`.
- **Grounding:** legal effect `needs_verification`.

#### N06 · Phase 8 · Liability insurance (Privathaftpflicht) guide — *(scratch 8B)*
- **Why:** `arrival/Rundfunkbeitrag.tsx` (G43) name-drops liability insurance in a checklist line but there
  is **no dedicated guidance** (verified). It's one of the first things a settled student is told to get.
  No `haftpflicht` source exists in `sources.ts` — a source must be added too.
- **Acceptance:** explains coverage + norms; no fabricated premiums; disclaimer where cost is discussed.
- **Grounding:** add a cited source; no invented prices.

#### N07 · Phase 8 · Finding a Hausarzt + how the health system works (116117/112) — *(scratch 8E)*
- **Why:** no page covers *using* the health system after you've bought insurance.
  `arrival/UniversityOnboarding.tsx` (G41) has no health entry. For a student needing ongoing meds,
  mental-health support, or a sick note (AU), this is a real blocker.
- **Acceptance:** covers GP registration, the two phone numbers (116117 urgent vs 112 emergency), sick-note
  basics; emergency numbers correct/verifiable; "not medical advice" disclaimer.
- **Grounding:** emergency numbers must be correct (116117 / 112); no fabricated wait times.

#### N08 · Phase 8 · Emergency / support directory + buddy/community connect — *(scratch 8F)*
- **Why:** work-order §3 #50 explicitly calls for an "emergency/health/contacts directory + buddy/community
  connect" and **nothing in the cluster provides it** (verified). Culture-shock and isolation are top
  reasons students struggle.
- **Acceptance:** lists 112/116117/110, generic international-office + counselling pointers, buddy-programme
  concept; no fabricated phone numbers; "guidance, verify locally."
- **Grounding:** emergency numbers verifiable; institution-specific contacts are user-supplied.

#### N09 · Phase 8 · SCHUFA / no-credit-history explainer + bank contingency — *(scratch 8G)*
- **Why:** `arrival/BankAccount.tsx` (G38) is happy-path with no named-bank comparison and no SCHUFA
  concept. SCHUFA gates phone contracts and many rentals; foreign students start with no German history,
  which surprises them.
- **Acceptance:** explains SCHUFA + no-history reality; lists fallbacks (prepaid, deposit-based); no
  fabricated bank fees; disclaimer where relevant. Add to / link from `arrival/bank-account`.
- **Grounding:** no invented fees; SCHUFA description generic.

#### N10 · Phase 8 · Handyvertrag vs prepaid + prerequisites — *(scratch 8H)*
- **Why:** complements N09; multiple arrival pages reference "mobile" but none explain the contract path or
  its prerequisites (Anmeldung + bank + often SCHUFA; cancellation/min-term traps).
- **Acceptance:** explains prerequisites + min-term/cancellation caveats; no fabricated tariffs.
- **Grounding:** none beyond avoiding fabricated prices.

#### N11 · Phase 9 · German job-search execution kit — *(scratch 9A)* · **MUST**
- **Why:** `career/Outcomes.tsx` and `arrival/JobSeekerPermit.tsx` (G44) tell a student the 18-month window
  exists and which fields are in demand, but give **no tool to actually apply for work**. The Europass CV
  builder (Feature 07) is admissions-oriented, not job-market-oriented (German employers expect a different
  CV + Anschreiben + often a photo). The biggest Phase-9 hole: the long-game depends on landing a qualified
  job and the app stops at "here's the permit."
- **Acceptance:** generates a German-market CV + Anschreiben draft from the profile via a **validated
  schema** (reuse the SOP/LOR structured-output pattern; no free-form parse downstream); explains German
  application norms (no fabricated employer claims); links official portals (Bundesagentur für Arbeit,
  StepStone, XING/LinkedIn-DE); labels AI drafts as starting points; no fabricated salary/hiring statistics.
- **Grounding:** any market figure grounded or omitted; AI output validated.

#### N12 · Phase 9 · Regulated-profession recognition (Approbation/Anerkennung) tracker — *(scratch 9D)*
- **Why:** `career/Outcomes.tsx` says some fields "require licensure" as prose only. The `approbation`
  source already exists in `sources.ts` but **no page uses it** (verified). A medicine/nursing graduate has
  no in-app guide to the single most important gate on their career — practising legally.
- **Acceptance:** lists regulated professions, the recognition steps, Fachsprachprüfung concept; process
  timing `needs_verification`; disclaimer.
- **Grounding:** recognition steps cite `approbation`/`anabin`; no fabricated timelines/fees.

#### N13 · Phase 9 · Permit-loss / exmatrikulation risk explainer — *(scratch 9E)*
- **Why:** `arrival/Renewals.tsx` (G46/G47) tracks the renewal/Rückmeldung *dates* but never explains the
  **consequences of missing them** (exmatrikuliert → permit at risk; verified the term appears only as a
  mention). No page covers the failure modes for a student whose studies go sideways.
- **Acceptance:** lists triggers (failing exams/exmatrikulation, dropping below progress thresholds, losing
  health insurance, missing Rückmeldung) + consequences + first recovery steps; specifics are
  university/ABH-dependent (`needs_verification`); disclaimer.
- **Grounding:** consequences are institution/ABH-specific → `needs_verification`.

#### N14 · Phase 9 · Pension/social-security + payslip (Lohnabrechnung) explainer — *(scratch 9F)*
- **Why:** `arrival/TaxId.tsx` (G49) mentions tax class and Werkstudent rules as static cards but never
  shows how to *read a payslip* or what social contributions are. Working students need this; it underpins
  the pension-contribution requirement behind PR.
- **Acceptance:** annotated example payslip; Werkstudent exemption explained; no fabricated rates (or rates
  `needs_verification`); disclaimer.
- **Grounding:** contribution rates `needs_verification` or omitted.

#### N15 · Phase 9 · Tax-return (Steuererklärung) helper + deadline reminder — *(scratch 9G)*
- **Why:** `arrival/TaxId.tsx` (G49) mentions refunds exist but offers no deadline, no reminder, no how-to.
  Pairs naturally with the existing `DeadlineReminder` component.
- **Acceptance:** explains who should file + a `needs_verification` deadline + a reminder; no fabricated
  refund amounts; disclaimer.
- **Grounding:** filing deadline `needs_verification`.

#### N16 · Phase 9 · Networking-events / career-fairs finder — *(scratch 9H)*
- **Why:** `campus/Networking.tsx` (Feature 28) exists but `arrival/JobSeekerPermit.tsx` links to no events
  surface; there's no way to discover or track actual events. Completes the career-execution band started by N11.
- **Acceptance:** lets a user add/track events with reminders; no fabricated event listings.
- **Grounding:** no fabricated event data.

---

## Section B — Depth / refinement on shipped pages

> These improve pages that **already exist**. Each names the live route it `refines:`. Full specs preserved
> from the scratch audits, lightly edited. The scratch ref is kept for traceability.

### B — register

| ID | Phase | Refinement | refines: (live route) | Why it matters | Pri | Eff | scratch ref |
|---|---|---|---|---|---|---|---|
| R01 | 0 | Programme-data freshness / curated-sample banner + DAAD deep links | `/profile/matching` | Curated 35-row set reads as exhaustive; zero hits ≠ "no such programme" | should | S | GAP-0-01 |
| R02 | 0 | Persist & share the orientation verdict (eligibility/feasibility/timeline) | `/start/eligibility` (+ feasibility, timeline-planner) | All three are stateless; refresh loses the verdict; can't share with a funder | should | M | GAP-0-02 |
| R03 | 0 | "Process risk / time" commitment briefing | `/start/feasibility` | Money + years are covered; process-risk (slot waits, refusal, gap-year) is not | could | S | GAP-0-03 |
| R04 | 0 | Wire interest self-check → profile + emit first-5-actions | `/career/counseling` (→ `/next-actions`) | Outputs *fields*, not "your 5 next clicks"; doesn't seed the profile | should | S | GAP-0-04 |
| R05 | 1 | Country-specific recognition deep-dive (India/Bangladesh HSC) | `/profile/recognition` | Logic exists in `pathway.ts` but only via routing flow, not a browsable per-country guide | should | M | GAP-1-01 |
| R06 | 1 | Dataset-backed Studienkolleg directory (colleges/Kurs/where) | `/profile/studienkolleg` | Page explains the *concept* + Kurs but lists no real state Studienkollegs to act on | **must** | L | GAP-1-02 |
| R07 | 1 | Interactive German exercises (graded), not just plan + phrases | `/language/german` (+ german-plan) | Static can-do + 12-card deck; no graded practice; app only *tracks* a plan | should | L | GAP-1-03 |
| R08 | 1 | ECTS shortfall verdict wired to the 180-ECTS bridge | `/profile/ects` | Math exists; the "168 → your three documented bridges" verdict for direct entry doesn't | should | M | GAP-1-04 |
| R09 | 2 | Auto-extract per-programme requirements → checklist | `/documents/requirements` | Manual paste box; a student with 8 targets won't transcribe 8 requirement blobs | should | M | GAP-2-01 |
| R10 | 2 | Per-programme/city employability signal (groundable only) | `/profile/matching` (Compare) | Field-level demand exists; no programme/city outcome signal where groundable | could | M | GAP-2-02 |
| R11 | 2 | Shortlist count → application-cost → budget loop | `/finance/application-costs` | Shortlist size doesn't feed the Phase-0 budget; estimator & budget diverge | should | S | GAP-2-03 → R31 |
| R12 | 3 | Unified test dashboard (test · target · sit-by · readiness gate) | `/language/exam-progress` (+ `/language/exams`) | Three surfaces (`ExamsHub`, `ExamTracker`, `recommendedTests`) never converge into one cockpit | **must** | L | GAP-3-01 |
| R13 | 3 | Test requirement resolver ("does MY shortlist need this test?") | `/profile/shortlist` | `recommendedTests` is heuristic; per-programme waive/require flags aren't aggregated | should | M | GAP-3-02 |
| R14 | 3 | Live multi-turn AI speaking examiner (vs one-shot STT capture) | `/language/exams` (SpeakingTask) | Today is one-shot capture, not an interactive Part-3/TestDaF examiner | should | L | GAP-3-03 |
| R15 | 3 | TestAS practice items + expand TestDaF/Goethe banks | `/language/testas` (+ `/language/exams`) | TestAS is guide-only; the mock centre has no TestAS runner at all | should | L | GAP-3-04 |
| R16 | 3 | Test-center locator + exam-sitting reminders | `/language/exams` (+ `/reminders`) | No surface to find where/when to sit, or remind for the sitting itself | should | M | GAP-3-05 |
| R17 | 3 | Aufnahmeprüfung / FSP readiness gate | `/language/aufnahmepruefung` (+ `/language/fsp`) | Guides/trackers exist; no go/no-go readiness verdict tying German level + subject prep | could | M | GAP-3-06 |
| R18 | 4 | Per-program document studio (SOP/CV/LOR are single global drafts) | `/documents/sop` (+ `/cv`, `/lor`) | Tailoring SOP for program #2 overwrites #1; one draft per type | **must** | M | GAP-401 |
| R19 | 4 | Structured requirement → auto-checklist feeding Vault/Tracker | `/documents/requirements` (+ vault-matrix) | Requirements stored as raw text; no structured, trackable checklist | **must** | M | GAP-402 |
| R20 | 4 | Document vault versioning + submission provenance | `/vault` (+ `/documents/vault-matrix`) | `VaultItem` has no version/timestamp/submitted-to; matrix is sent/not-sent booleans | should | M | GAP-403 |
| R21 | 4 | Academic-integrity / AI-content self-check on generated docs | `/documents/sop` | AI draft has only a badge; no integrity gate before export; unis are strict on plagiarism | should | S | GAP-404 |
| R22 | 4 | Reconcile Tracker vs Offers into one program identity | `/tracker` (+ `/offers/*`) | Same program lives in `tracker:apps` and `offers:list` with no link — double entry | should | M | GAP-405 |
| R23 | 4 | uni-assist/VPD/APS honest framing + processing windows | `/documents/vpd` (+ uni-assist, `/visa/aps`) | Self-reported status is fine but no expected-timeline or stuck/overdue guidance | could | S | GAP-407 |
| R24 | 4 | Tracker deadline UI → calendar **(also a defect)** | `/tracker` (+ `/calendar`) | `deadline` field exists in schema but has no input and never reaches the calendar | **must** | S | GAP-406 |
| R25 | 5 | Per-accepted-offer enrollment workflow (not one shared checklist) | `/arrival/enrolment` | Single shared checklist; can't track two enrollments per accepted offer | should | M | GAP-502 |
| R26 | 5 | NC/Hochschulstart (DoSV) semantics in letter interpreter + seat deadlines | `/offers/interpret` (+ seat-deadlines, dosv) | Generic accept-by ignores DoSV coordination/clearing; offers carry no central-allocation flag | should | M | GAP-503 |
| R27 | 5 | Offer comparison by total cost (CoL + Semesterbeitrag), not tuition alone | `/offers/compare` | "Cheapest by tuition" misleads when public tuition ≈ €0 | should | M | GAP-501 → R31 |
| R28 | 6 | Profile-matched scholarships + family-reunion income/housing helper | `/finance/scholarships` (+ `/arrival/family-reunion`) | Static 9-item filter ignores country/level/field; family-reunion helper supports the qa grounding fix | should | M | GAP-601 (+ 9B helper) |
| R29 | 6 | Health-insurance selector reads profile; ground the over-30 branch | `/finance/health-insurance` | Ignores known profile age/country; over-30 voluntary cost is prose-only without a figure | could | S | GAP-603 |
| R30 | 6 | Funding-gap planner auto-pulls totals + Sperrkonto + 140/280 bound **(also a defect)** | `/finance/funding-plan` (+ sperrkonto-providers, work-days) | "Prefill totals" only navigates; manual re-entry; work-income has no 140/280 bound | should | M | GAP-602 (+ 604) |
| R31 | 4–6 | Single cost source-of-truth + unified deadline surface | `/start/budget`, `/calendar`, `/reminders` | Cost computed in 3+ places (inconsistent totals); deadlines live in 3 disconnected systems | **must** | L | GAP-605 + GAP-411 |

**Section B: 31 refinements · must 6 (R06, R12, R18, R19, R24, R31) · should 19 · could 6 (R03, R10, R17, R23, R29 — and R30 is should). The per-row Pri column is authoritative.**

### B — full specs

#### R01 · refines `/profile/matching` · *(GAP-0-01)*
- **Why:** Discovery runs on a curated **35-row** program set (`Matching.tsx:241` "bundled curated set").
  A student searching an unusual field gets few/zero hits and can't tell "no such programme in Germany"
  from "our sample is small."
- **Acceptance:** empty/low-result state explains the curated-sample limitation; one-click
  DAAD/Hochschulkompass search pre-filled with field + level + language; never implies the 35 rows are
  exhaustive; provenance preserved.
- **Grounding:** DAAD & Hochschulkompass are the cited directories — link, don't assert counts.

#### R02 · refines `/start/eligibility` (+ feasibility, timeline-planner) · *(GAP-0-02)*
- **Why:** All three Phase-0 tools keep their result in component `useState`; refresh loses it and the
  verdict can't be carried into the signed-in plan or shared with a funder.
- **Acceptance:** verdict persists across refresh for a signed-in user; "use these answers in my plan"
  pre-fills Settings; export/print/copyable summary; per-user isolation respected.
- **Grounding:** none (echoes already-grounded pathway notes).

#### R03 · refines `/start/feasibility` · *(GAP-0-03)*
- **Why:** No tool sets honest expectations on **process risk** (appointment waits, Studienkolleg
  competitiveness, APS lead time, refusal/gap-year). Applicants under-budget *time risk*.
- **Acceptance:** shows earliest *viable* intake given today's date (reuse `reverseTimeline` overdue);
  lists top 3 process risks for the route; framed as heuristics.
- **Grounding:** appointment-wait/APS-lead-time figures `needs_verification` or omitted.

#### R04 · refines `/career/counseling` (→ `/next-actions`) · *(GAP-0-04)*
- **Why:** `Counseling.tsx:81-102` outputs ranked *fields*; `NextActions.tsx` outputs milestones only
  after a profile exists. A new visitor gets fields, not "your 5 next clicks," and the two aren't wired.
- **Acceptance:** "save these fields to my profile"; shows 5 concrete next actions immediately; Matching
  default subject group reflects the chosen field; deterministic.
- **Grounding:** none.

#### R05 · refines `/profile/recognition` · *(GAP-1-01)*
- **Why:** `Recognition.tsx` + `pathway.ts` explain HZB categories generically; a Class-12 India/Bangladesh
  applicant needs the country-specific read. The engine has the logic (`pathway.ts:123,133,406-414`) but
  only via the routing flow, and the India raised-70%-from-WS2026/27 note isn't prominent outside the
  Studienkolleg branch.
- **Acceptance:** per-country card (India, Bangladesh min.) with HSC→HZB verdict; anabin self-check steps;
  WS2026/27 raised-minimum warning for India with `needs_verification`; every threshold carries provenance.
- **Grounding:** anabin category, India ~70% WS2026/27, Bangladesh ~2-yr rule — all `needs_verification`/cited.

#### R06 · refines `/profile/studienkolleg` · *(GAP-1-02)* · **MUST**
- **Why:** The page explains the *concept* and picks the right Kurs, but a school-leaver cannot act without
  a **list of real state Studienkollegs**, locations, Kurs offered, and the "apply through a
  university/uni-assist not the college" fact. Without it the route is theory.
- **Acceptance:** browsable list with city/Bundesland/Kurs; "apply via the university, not the college"
  stated; each entry links to its official page; public-vs-private flagged; entries carry
  `{source_name, source_url, retrieved_at}` or `needs_verification`.
- **Grounding:** every college entry cites an official source; do not fabricate Kurs availability.

#### R07 · refines `/language/german` (+ `/language/german-plan`) · *(GAP-1-03)*
- **Why:** `German.tsx` is a static can-do + phrase reference with TTS; `Flashcards.tsx` has a 12-card seed
  deck. There is **no graded practice** (fill-in, listening, grammar drills, progress-gated lessons).
- **Acceptance:** ≥1 interactive exercise type per CEFR level; immediate feedback; progress persists per
  user; AI-generated items validated + labelled; no certification-equivalence claim.
- **Grounding:** none (practice); keep "B2/C1 is the bar" facts grounded as today.

#### R08 · refines `/profile/ects` · *(GAP-1-04)*
- **Why:** `Ects.tsx` totals/normalises credits and `pathway.ts:206-213` (`ECTS_BRIDGE_NOTE`) explains the
  three <180-ECTS bridges — but the two aren't connected. A 3-year-degree Master's applicant isn't told
  "your computed total is 168 → here are your three documented options."
- **Acceptance:** when ECTS < 180, show the gap and the three bridges; per-programme acceptance framed as
  verify-only; deterministic shortfall math; `needs_verification` on the 180 expectation.
- **Grounding:** 180-ECTS expectation per-programme → `needs_verification`/cited.

#### R09 · refines `/documents/requirements` · *(GAP-2-01)*
- **Why:** `Requirements.tsx:64-66` is a manual paste box. A per-programme **auto-checklist** from known
  fields (language, tests, degree, deadline) would save students transcribing 8 requirement blobs.
- **Acceptance:** selecting a shortlisted programme pre-fills known requirements; generates a doc/test
  checklist with status; manual notes still allowed; official page is source of truth; per-user persisted.
- **Grounding:** indicative only — link the official programme page; no invented thresholds.

#### R10 · refines `/profile/matching` (Compare) · *(GAP-2-02)*
- **Why:** `Outcomes.tsx` gives field-level demand, but Compare (`Matching.tsx:386-401`) shows only
  logistics — no programme/city outcome signal even where groundable.
- **Acceptance:** any outcome claim qualitative + cited or omitted; no fabricated salaries/placement rates;
  absence shown honestly.
- **Grounding:** strict — only `make-it-in-germany`/official signals; otherwise show nothing.

#### R11 · refines `/finance/application-costs` · *(GAP-2-03; rolls into R31)*
- **Why:** `Shortlist.tsx:128` + `ApplicationCosts.tsx` exist, but shortlist size doesn't feed the Phase-0
  budget; the orientation budget and real shortlist diverge.
- **Acceptance:** budget reflects actual shortlist count for uni-assist/APS fees; deterministic; fee
  constants grounded as today.
- **Grounding:** uni-assist/APS fees already grounded — reuse. **Implement under the R31 cost umbrella.**

#### R12 · refines `/language/exam-progress` (+ `/language/exams`) · *(GAP-3-01)* · **MUST**
- **Why:** Three surfaces — `ExamsHub.tsx` (launches mocks), `ExamTracker.tsx` (post-hoc analytics), and
  `recommendedTests()` (`derive.ts:68-94`, which tests, no date/target) — never converge. No single page
  says "IELTS — target 6.5, sit by <date>, 60% ready; TestAS — by <date>, not started."
- **Acceptance:** lists every required test with status; editable target + planned sit-by date from the
  chosen intake; readiness signal per test from mock analytics; a "ready to book" gate when readiness ≥
  target; deterministic; predictions carry the disclaimer; per-user persisted.
- **Grounding:** target thresholds per-programme → `needs_verification`; no fabricated official pass marks.

#### R13 · refines `/profile/shortlist` · *(GAP-3-02)*
- **Why:** `recommendedTests()` is heuristic from level + medium-of-instruction; it can't tell an
  English-medium Master's applicant whether their shortlist **waives** IELTS. Per-programme flags
  (`eligibility.ts:65-69`) aren't aggregated.
- **Acceptance:** per-test "required by N of M; waived by K"; medium-of-instruction waiver flagged
  verify-per-programme; deterministic; official page is source of truth.
- **Grounding:** waiver rules per-programme → `needs_verification`.

#### R14 · refines `/language/exams` (SpeakingTask) · *(GAP-3-03)*
- **Why:** `SpeakingTask.tsx` records a single answer + STT transcript feeding an AI rubric *later* — a
  one-shot capture, not an interactive examiner that asks follow-ups (IELTS Part-3 / TestDaF).
- **Acceptance:** multi-turn spoken exchange with follow-ups; per-criterion Zod-validated feedback;
  graceful no-STT / no-AI fallbacks; no claim it predicts the official score; audio per existing autoplay rules.
- **Grounding:** none (practice); band-descriptor facts as today.

#### R15 · refines `/language/testas` (+ `/language/exams`) · *(GAP-3-04)*
- **Why:** `TestAs.tsx` is a guide with no practice; for non-EU Bachelor/Medicine, TestAS is often
  mandatory (`derive.ts:87-89`). The mock centre lacks TestAS entirely; TestDaF/Goethe banks may be thin.
- **Acceptance:** a TestAS practice runner in the mock centre; core + ≥1 subject module; "study aid, not
  real test" disclaimer; scoring mapped to the right scale.
- **Grounding:** practice items original; format/scale facts cited as in other exams.

#### R16 · refines `/language/exams` (+ `/reminders`) · *(GAP-3-05)*
- **Why:** No surface helps a student find **where/when to sit** IELTS/TOEFL/TestDaF/TestAS or remind for
  the sitting. `Reminders.tsx` tracks personal deadlines, not exam sittings.
- **Acceptance:** official test-center finder links per test, scoped by country/city where possible; add a
  "sit IELTS on <date>" reminder that flows into the calendar/.ics export; lead-time `needs_verification`;
  no fabricated center lists.
- **Grounding:** center locations/dates from the official test owner — link, don't assert.

#### R17 · refines `/language/aufnahmepruefung` (+ `/language/fsp`) · *(GAP-3-06)*
- **Why:** Guides/trackers exist, but no **readiness gate** ("you're at B1; Aufnahmeprüfung expects B1–B2 +
  subject basics → not ready") tying German level + subject prep to a go/no-go.
- **Acceptance:** readiness verdict from German level + subject-prep progress; honest "not ready / on
  track"; deterministic; thresholds `needs_verification`.
- **Grounding:** entrance-exam level expectations per college → `needs_verification`.

#### R18 · refines `/documents/sop` (+ `/cv`, `/lor`) · *(GAP-401)* · **MUST**
- **Why:** `Sop.tsx:119-120` persists one global draft (`doc:sop:draft`); `Cv.tsx`/`Lor.tsx` likewise.
  Tailoring for program #2 overwrites #1; `Vault.tsx:88-93` shows one badge per type.
- **Acceptance:** drafts stored per program id (`doc:sop:draft:{appId}`); program picker pre-filled from
  Tracker/Offers; switching loads that program's draft without clobbering others; Vault lists each
  program's drafts; migration preserves an existing global draft as "General," never silently dropped.
- **Grounding:** none (user content); keep the "edit before sending / verify every detail" guidance per draft.

#### R19 · refines `/documents/requirements` (+ `/documents/vault-matrix`) · *(GAP-402)* · **MUST**
- **Why:** `Requirements.tsx` stores `{ programme, deadline, requirements }` with `requirements` a raw
  textarea — no parsing, no checklist, no link to Vault/Tracker/Calendar.
- **Acceptance:** pasted requirements → structured, editable checklist (language cert, transcript, # LORs,
  GRE y/n, VPD y/n, translations) — AI-assisted extraction is user-confirmable, never authoritative;
  checklist attaches to the program and surfaces in the Vault matrix; deadlines flow into the unified
  surface (R31); nothing fabricated.
- **Grounding:** none for pasted text; AI-inferred items marked "suggestion to verify."

#### R20 · refines `/vault` (+ `/documents/vault-matrix`) · *(GAP-403)*
- **Why:** `Vault.tsx:62-68` `VaultItem` has no version/timestamp/submitted-to; `VaultMatrix.tsx` records
  sent/not-sent booleans only. Students must know which version went where, when.
- **Acceptance:** a vault item holds multiple dated versions, active one marked; the matrix records *which
  version* was sent and *when*; history per-user scoped, survives refresh + auth switch; metadata/links
  only, no binary upload, no PII logged.
- **Grounding:** none.

#### R21 · refines `/documents/sop` · *(GAP-404)*
- **Why:** `Sop.tsx` produces an AI draft with only `AiGeneratedBadge`; no integrity self-check before
  export. German unis are strict on plagiarism (`campus/Culture.tsx`).
- **Acceptance:** post-generation integrity notice + short self-check to acknowledge before export; a
  lightweight originality nudge (flag long passages identical to AI output) — heuristic, "not a plagiarism
  scanner"; links to `campus/culture`.
- **Grounding:** none; must NOT claim to be a certified plagiarism detector.

#### R22 · refines `/tracker` (+ `/offers/*`) · *(GAP-405)*
- **Why:** `Tracker.tsx:34` uses `tracker:apps`; `offers/offers.ts:23` uses `offers:list`. Both are read
  across Dashboard/NextActions/Matching, but nothing maps a Tracker app to its Offer — double entry, divergence.
- **Acceptance:** one canonical program identity links Tracker card → Offer → Requirements checklist →
  documents; promoting a Tracker card to "Admit" seeds an Offer without re-typing; no per-page UX
  regression; non-destructive backfill.
- **Grounding:** none. **Enables R18/R19/R31.**

#### R23 · refines `/documents/vpd` (+ `/documents/uni-assist`, `/visa/aps`) · *(GAP-407)*
- **Why:** `Vpd.tsx` cycles status manually; `UniAssist.tsx` is a static walkthrough; APS is country-logic
  + checklist. None claim live sync (correct), but students get no expected-processing-time or stuck advice.
- **Acceptance:** each tracker states "status is what you record — we don't read the portal"; adds grounded
  typical-processing-window guidance with provenance + `needs_verification`; a "stuck/overdue" nudge past
  the typical window.
- **Grounding:** uni-assist VPD turnaround, APS times — grounded or `needs_verification`; never invent week counts.

#### R24 · refines `/tracker` (+ `/calendar`) · *(GAP-406)* · **MUST** · **(also a defect)**
- **Why:** `Tracker.tsx:14-21` declares `deadline?`/`url?` but the add form (`72-95`) and card render
  (`117-162`) expose neither — the field is dead. `Calendar.tsx` merges only `SEED_EVENTS` +
  `calendar:deadlines`; it never reads `offers:list` or `tracker:apps`.
- **Acceptance:** Tracker cards expose persisting deadline + URL inputs; application deadlines and offer
  accept-by dates appear on the month Calendar and in Reminders/.ics; urgency via `deadlines.ts` (no model math).
- **Grounding:** none. **Depends on R31 (unified deadline surface).**

#### R25 · refines `/arrival/enrolment` · *(GAP-502)*
- **Why:** `Enrolment.tsx` shows a single shared `Checklist` + 5-step prose + the grounded `SEMESTERBEITRAG`
  fact. It's not tied to a specific accepted offer and can't track two enrollments.
- **Acceptance:** checklist + Semesterbeitrag-paid + insurance-confirmation status per accepted offer; the
  enrollment deadline is the same date object on Calendar/Reminders (R31); Medicine/Studienkolleg variant
  notes the Studienkolleg → FSP → degree chain where flagged.
- **Grounding:** Semesterbeitrag already grounded; keep provenance. **Depends on R22.**

#### R26 · refines `/offers/interpret` (+ `/offers/seat-deadlines`, `/documents/dosv`) · *(GAP-503)*
- **Why:** `AdmissionLetter.tsx` is a generic letter-contents checklist; `SeatDeadlines.tsx` treats all
  offers identically. The `/documents/dosv` walkthrough exists but isn't linked from offers/enrollment, and
  offers carry no central-allocation flag — wrong advice for the Medicine/NC persona.
- **Acceptance:** an offer can be flagged "centrally allocated (Hochschulstart/DoSV)," surfacing DoSV
  accept/clearing guidance + the `/documents/dosv` link; seat-deadline copy distinguishes a direct accept-by
  from a DoSV coordination-phase date; Medicine realism preserved (no implied guarantee).
- **Grounding:** DoSV phase rules/dates — grounded (hochschulstart) or `needs_verification`.

#### R27 · refines `/offers/compare` · *(GAP-501; rolls into R31)*
- **Why:** `OfferComparison.tsx:24-28` computes `cheapest` from `tuitionPerSem` only; it captures `city`
  but never pulls CoL or Semesterbeitrag. With public tuition ≈ €0 this misleads.
- **Acceptance:** each offer optionally shows the city's monthly CoL (deterministic) and typical
  Semesterbeitrag, labelled illustrative; "cheapest"/decision badges reflect total monthly cost, or the
  badge is removed; advisory disclaimer.
- **Grounding:** Semesterbeitrag + CoL already carry source/illustrative labels; preserve. **Under R31 umbrella.**

#### R28 · refines `/finance/scholarships` (+ `/arrival/family-reunion`) · *(GAP-601 + 9B helper)*
- **Why (scholarships):** `Scholarships.tsx` filters a static 9-item list by manual category and ignores
  `profile.homeCountry`/level/field. Eligibility is country/field/level/recency-specific.
- **Why (family-reunion helper):** the *feature* side of the family-reunion gap — a deterministic
  household income/housing-size estimator on `/arrival/family-reunion`. (The grounding *defect* —
  bare-prose thresholds at `FamilyReunion.tsx:14-17` — is logged in **qa-findings HON-FamilyReunion**, not here.)
- **Acceptance:** schemes ranked/flagged by country, level, field, experience/recency with an explicit "may
  be eligible / likely not / verify" state; eligibility logic transparent and grounded; uncertain rules
  show `needs_verification`, never a hard yes/no. Family-reunion helper estimates household income/housing
  need from family size, labelled an estimate, not the legal threshold; disclaimer.
- **Grounding:** EPOS country list + 2-yr/6-yr rules, Deutschlandstipendium amount, Erasmus+; family-reunion
  income/housing figures — grounded or `needs_verification`.

#### R29 · refines `/finance/health-insurance` · *(GAP-603)*
- **Why:** `HealthInsurance.tsx:28-51` `recommend()` branches under-30/over-30/agreement correctly, but
  state is local `useState`, not read from profile/intake; the over-30 path (`45-50`) cites no figure and
  `HEALTH_INSURANCE` (~€120–140) doesn't model the over-30 voluntary rate.
- **Acceptance:** pre-fills under-30/agreement from the profile (overridable); the over-30 / >14-semester
  case shows a grounded range (or `needs_verification`); CoL city baselines carry an "illustrative,
  source/year" label.
- **Grounding:** statutory student rate, over-30 voluntary rate, age/semester threshold — grounded
  (TK/official) or `needs_verification`. **Depends on R30.**

#### R30 · refines `/finance/funding-plan` (+ `/finance/sperrkonto-providers`, `/finance/work-days`) · *(GAP-602 + 604)* · **(also a defect)**
- **Why:** `FundingPlan.tsx` has manual `oneTime`/`monthly` inputs; `journeyBudget.ts`
  (`computeJourneyBudget`) and `SperrkontoProviders.tsx` tracked progress aren't imported; the "Prefill
  from the journey budget" copy implies auto-fill that doesn't happen. The work-income field has no 140/280
  sanity bound (`WorkDays.tsx` computes it but isn't linked).
- **Acceptance:** funding plan pulls the computed one-time total (APS + uni-assist + translations + visa +
  flights + deposit) and monthly CoL, with override; tracked Sperrkonto progress counts toward the funded
  side automatically; an indicative max realistic work income derived from the 140/280 budget, with
  override; all math deterministic (`fundingGap.ts`/`journeyBudget.ts`), unit-tested; no model-computed totals.
- **Grounding:** underlying official figures already grounded; preserve. 140/280 grounded; any assumed wage
  user-entered or flagged. **Implement under R31.**

#### R31 · refines `/start/budget`, `/calendar`, `/reminders` · *(GAP-605 + GAP-411)* · **MUST** · **umbrella for R11, R27, R30; R24 depends on it**
- **Why (single cost source):** `SPERRKONTO_YEAR_EUR` (€11,904) is one grounded constant, but
  `ApplicationCosts.tsx`, `CostOfLiving.tsx`, `journeyBudget.ts`, and `FundingPlan.tsx` don't converge on
  one persisted budget object → inconsistent totals.
- **Why (unified deadlines):** dates live in (1) `Calendar.tsx` (`calendar:deadlines` + seed), (2)
  `Reminders.tsx` (`reminder:*` + offers `acceptBy`), and (3) the Tracker's unused `deadline` field.
  Application and requirement deadlines reach *none*; `.ics` export sees only reminders + offers.
- **Acceptance (cost):** one persisted journey-budget object is the source for the budget page, funding
  plan, offer comparison, and Sperrkonto target; an input change reflects everywhere (or shows as an
  override); deterministic, tested; every official figure retains provenance (add per-fact `retrieved_at`).
- **Acceptance (deadlines):** one aggregator feeds the Calendar grid, Reminders list, and `.ics` export;
  application, offer accept-by, requirement, enrollment, visa, and renewal dates appear in all three views;
  deterministic urgency via `deadlines.ts`; timezone-safe; survives refresh + auth switch. Exam-sitting
  reminders (R16) and visa-slot reminders (N02) feed this aggregator.
- **Grounding:** Sperrkonto €11,904 + per-fact retrieval metadata; user dates ungrounded; seed official
  dates keep their verification flags.

---

## Journey-critical must-fix (all 10 `must` items), ordered by how blocked a real student is

1. **N04 · Anmeldung no-appointment fallback** (NEW, S) — Anmeldung gates bank/permit/tax-ID; a student
   who can't get a slot is blocked on everything downstream. Highest leverage for the least effort.
2. **N01 · Visa refusal / appeal pathway** (NEW, M) — every visa page stops at the decision; a refused
   applicant has zero guidance. Remonstration deadline mission-specific → `needs_verification`.
3. **N03 · Travel/entry health insurance for the coverage gap** (NEW, M) — a real money/health hole before
   German cover activates; the visa often requires entry insurance.
4. **R06 · Dataset-backed Studienkolleg directory** (refine `/profile/studienkolleg`, L) — the
   school-leaver route stays *theory* without a real list of state Studienkollegs + "apply via the
   university." Grounding: each entry cited or `needs_verification`.
5. **R12 · Unified test dashboard** (refine `/language/exam-progress`, L) — three existing surfaces never
   converge into a target+date+readiness cockpit; students juggling IELTS+TestDaF+TestAS miss a sitting.
6. **R31 · Single cost source-of-truth + unified deadline surface** (refine budget/calendar/reminders, L)
   — the worst failure mode is missing a date, and cost is computed in 3+ inconsistent places.
7. **R24 · Tracker deadline UI → calendar** (refine `/tracker`, S) — *(also a defect)* the `deadline` field
   is dead and never reaches the calendar; a quick high-value fix feeding R31.
8. **R18 · Per-program document studio** (refine `/documents/sop`, M) — tailoring the SOP for program #2
   silently overwrites #1.
9. **R19 · Per-program requirement auto-checklist** (refine `/documents/requirements`, M) — requirements
   are an unstructured paste box; no trackable per-program checklist.
10. **N11 · German job-search execution kit** (NEW, L) — the long-game depends on applying for work; the
    app explains the 18-month window but gives no market-CV / Anschreiben / portals. AI output validated.
    (N12 Approbation and N16 events finder are `should` items that complete this career band.)

---

## What is GOOD (do not re-flag)

- **All 51 v1 features are shipped** and route-registered in `nav.tsx` — this backlog builds on them.
- **APS country logic** grounded and correct (Bangladesh = no APS office; India/China/Vietnam/Mongolia/
  Pakistan handled — `country.ts`, `visa/Aps.tsx`).
- **Class-10 honest block** verified: `pathway.ts:363-380` → `route:"blocked"`; `feasibility.ts:62-71` →
  score 0 / "blocked." No false hope.
- **Sperrkonto €11,904** is a single grounded constant with source + `needsVerification` (weakness:
  per-fact `retrieved_at` is module-level — fixed under R31).
- **Work-day 140/280**, **cost-of-living**, and **funding-gap** math are deterministic + unit-tested
  (`workDays.ts`, `costOfLiving.ts`, `fundingGap.ts`, `journeyBudget.ts`).
- **Loan comparison** refuses to invent interest rates (`Loans.tsx`). **Attestation/translation trackers**
  are functional. **Offers `.ics` export** works (R31 just adds more sources).
- **Phase-7–9 immigration facts** grounded with sources + `needsVerification` (Blue Card €50,700/€45,934.20,
  PR 21/27 mo, citizenship 5 yr, Rundfunk €18.36, Deutschlandticket €63, Semesterbeitrag, permit validity).
  The lone exception is `FamilyReunion.tsx:14-17` → logged in **qa-findings (HON-FamilyReunion)**.
