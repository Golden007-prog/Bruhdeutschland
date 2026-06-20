# DeutschPrep — Gap Analysis (Canonical Register)

> **Status:** Canonical. Consolidates and supersedes the three phase-band scratch audits in
> `docs/_audit/` (`gaps-0-3.md`, `gaps-4-6.md`, `gaps-7-9.md`). Find-and-document only — no app
> code or DB was changed in producing this register.
> **Method:** each phase band was walked end-to-end as real personas (Class-12 India school-leaver,
> Class-10 student who must be honestly blocked, Bangladesh Master's applicant with no APS,
> career-switcher with work experience, Medicine/NC aspirant, and a student already settling in
> Germany). A page that already covers a need is **not** a gap; every gap cites where the
> partial/absent boundary is.
> **Grounding discipline (CLAUDE.md §2/§3):** where a gap surfaces an official German fact (visa
> rules, deadlines, thresholds, fees, processing windows), the spec says **"must be grounded
> (source + `needs_verification`)"** — never assert an official number without provenance.

---

## 1. Executive summary

DeutschPrep is unusually mature on the **happy path**: orientation tools (eligibility, reverse
timeline, total-journey budget) are deterministic and grounded; the pathway engine honestly routes
school-leavers to Studienkolleg and honestly *blocks* a Class-10 student; document drafting, the
mock-exam centre, the visa simulator, and the Blue-Card/PR immigration tools are real and well
grounded. The genuine gaps cluster in four bands: **(a) integration / cross-referencing of siloed
per-user stores** — the Tracker, Offers, Requirements, Vault, Calendar/Reminders, and the
finance calculators each hold their own state and never reconcile, so students re-enter the same
programs, deadlines, and costs; **(b) failure / contingency paths** — visa refusal, no-appointment
fallbacks, exmatrikulation, missed-deadline recovery are almost entirely absent; **(c) the German
job-search / career-execution layer** — Phase 9 is explained but not *actionable* (no market-CV /
Anschreiben / portals, no permit-switch timeline); and **(d) a few actionable-directory holes** —
a real Studienkolleg list, a unified test dashboard, and the Approbation/regulated-profession path.
One genuine grounding defect was found (family-reunion thresholds shown as bare prose).

> **Read this first.** All **51 first-build features (G01–G51 of the prior `roadmap-unified.md`) are
> already shipped** as route-registered pages in `frontend/src/lib/nav.tsx`. This register is therefore a
> **v2 backlog** — depth/integration refinements on those shipped pages, plus a smaller set of
> genuinely-missing **failure-path** surfaces (visa refusal/appeal, no-appointment fallbacks,
> entry-insurance gap, Haftpflicht, SCHUFA, Approbation, German job-search kit). It is **not** a list of
> missing pages. Each entry names the partial/absent boundary on the page it refines.

### Counts by journey phase

| Phase band | Phase(s) | Gaps | of which `must` |
|---|---|---:|---:|
| Orientation → Tests | 0 · 1 · 2 · 3 | 17 | 2 |
| Documents · Offers · Finance | 4 · 5 · 6 (+ cross 4–6) | 16 | 4 |
| Visa · Arrival · Ongoing | 7 · 8 · 9 | 22 | 6 |
| **Total** | **0–9** | **55** | **12** |

> Raw scratch total was 57 items. Two were folded out of the feature register: `GAP-412`
> (re-verify per-user isolation) is a **defect/verification task**, moved to `qa-findings` (SEC-3);
> and `GAP-9H` (career-fairs finder) is folded into `G50` as a sub-item of the job-search execution
> kit. All remaining 55 items are retained as genuine gaps.

### Counts by priority

| Priority | Count |
|---|---:|
| **must** | 12 |
| **should** | 30 |
| **could** | 13 |
| **Total** | **55** |

---

## 2. Reconciliation & dedup notes (read before using the register)

These overlaps were merged or cross-linked rather than double-counted:

- **Deadlines.** `G34` (ref `GAP-411`, unified deadline surface) is the **umbrella**. `G16`
  (ref `GAP-3-05`, test-center locator + exam-sitting reminders) and visa-slot reminders inside
  `G36`/`G38` (ref `GAP-7B`/`GAP-7D`) are **distinct sub-surfaces** that must feed the same
  aggregator — kept separately and cross-linked, not merged away.
- **Per-user isolation (was `GAP-412`).** This is a **defect/verification task, not a feature gap.**
  It is removed from this register. → **See `qa-findings` (SEC-3): re-verify per-user persistence &
  isolation for every Phase 4–6 synced key** (`doc:*`, `vault:*`, `offers:list`, `tracker:apps`,
  `programme:requirements`, `lor:requests`, `translation:tracker`, `attestation:tracker`,
  `reminder:*`, `calendar:deadlines`, funding/sperrkonto inputs) via the log-in-as-A-then-B repro.
- **Defect-bordering gaps kept as gaps.** `G24` (ref `GAP-406`, Tracker `deadline` field exists but
  has no UI and never reaches the calendar) and `G30` (ref `GAP-602`, the "Prefill totals" link only
  navigates — it doesn't prefill) are **kept as gaps but marked `(also logged as a defect)`**.
- **Budget / single cost source of truth.** `G33` (ref `GAP-605`, one persisted journey-budget
  object) is the **umbrella**. The shortlist→budget loop `G11` (ref `GAP-2-03`), the funding-gap
  prefill `G30` (ref `GAP-602`), and offer-comparison total-cost `G27` (ref `GAP-501`) all overlap it
  and are **cross-linked** to `G33`, not duplicated.

---

## 3. Canonical register

> Clean sequential IDs `G01…G56`, grouped by journey phase. The **ref** column preserves the original
> scratch id so the full spec below stays traceable. `must`/`should`/`could` = priority; `S/M/L` = effort.

### Phase 0 — Orientation

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G01 | 0 | Programme-data freshness & coverage banner | Tells the student the 35-row set is a *sample*, not the authoritative directory, so zero hits ≠ "no such programme" | `programs` / `useProgramData`; DAAD/Hochschulkompass deep links | should | S | — · GAP-0-01 |
| G02 | 0 | Save/share the orientation verdict | All three Phase-0 tools are stateless; refresh loses the verdict; can't share with a funding parent/agent | `intake_submissions`/`account_memory` | should | M | auth/profile persistence · GAP-0-02 |
| G03 | 0 | "Realistic stress/time" commitment & risk briefing | No tool sets honest expectations on process risk (slot waits, Studienkolleg competition, refusal/gap-year) | pathway caveats + reverse-timeline overdue | could | S | G02 · GAP-0-03 |
| G04 | 0 | Personalised "first 5 concrete actions" from the interest self-check | Interest check outputs *fields*, not "your 5 next clicks"; not wired into profile/NextActions | Counseling result → profile → NextActions/Matching | should | S | profile write · GAP-0-04 |

### Phase 1 — Foundations

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G05 | 1 | Country-specific recognition deep-dive (India/Bangladesh HSC vs anabin) | Recognition is the make-or-break Phase-1 fact; logic exists but only via routing flow, not a browsable per-country guide | `country.ts`, `pathway.ts` notes, `homeCountry` | should | M | — · GAP-1-01 |
| G06 | 1 | Actual Studienkolleg directory (colleges, location, Kurs, how to apply) | School-leaver route is theory without a real list of state Studienkollegs + "apply via the university" | seeded provenance-stamped Studienkolleg list | **must** | L | seed data + provenance · GAP-1-02 |
| G07 | 1 | Interactive German learning (graded exercises/quizzes) | A1→B1 learner needs real practice; app only tracks a plan + phrase list + 12-card deck | exercise content + `srs_cards`/lessons; `useGenerate` | should | L | content/AI guardrails · GAP-1-03 |
| G08 | 1 | ECTS / credit-gap analyzer wired to the 180-ECTS bridge | The #1 real Master's blocker: "your total is 168 → here are your three documented bridges" — math exists, verdict doesn't | `ECTSCalculator` + `ECTS_BRIDGE_NOTE` | should | M | ECTS calc · GAP-1-04 |

### Phase 2 — Discovery & shortlisting

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G09 | 2 | Auto-extract per-programme requirements into a checklist | Manual paste box today; a student with 8 shortlisted programmes won't transcribe 8 requirement blobs | `programs` fields + `eligibility()` → seeded checklist | should | M | shortlist + program data · GAP-2-01 |
| G10 | 2 | Per-programme / city employability signal (where groundable) | Choosing between two admits, students want more than tuition/city — qualitative + cited only | per-program note + city job-market tags | could | M | seed data · GAP-2-02 |
| G11 | 2 | Application-cost loop closes back to the budget | Shortlisting 10 programmes never updates the Phase-0 budget (uni-assist/APS scale per app) | shortlist count + `ApplicationCosts` → `journeyBudget` | could | S | G02; → umbrella **G33** · GAP-2-03 |

### Phase 3 — Tests

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G12 | 3 | Unified test dashboard (every test · target · sit-by date · readiness gate) | Biggest Phase-3 gap: no single cockpit for IELTS+TestDaF+TestAS with targets/dates → students miss a sitting | `recommendedTests` + program target + `reverseTimeline` + exam analytics | **must** | L | recommendedTests, reverseTimeline, analytics · GAP-3-01 |
| G13 | 3 | Test requirement resolver ("does MY shortlist need this test?") | English-medium Master's applicants over/under-prepare; eligibility knows per-program flags but doesn't aggregate | `eligibility()` test criteria over shortlist | should | M | shortlist + eligibility · GAP-3-02 |
| G14 | 3 | Live AI speaking examiner (multi-turn), distinct from in-mock STT capture | Speaking is hardest to self-prep; today is one-shot capture, not an interactive Part-3 examiner | TTS + STT + AI turn-loop, Zod rubric | should | L | AI provider + STT/TTS · GAP-3-03 |
| G15 | 3 | TestAS / TestDaF / Goethe actual practice items (not guide-only) | TestAS often mandatory for non-EU Bachelor/Medicine; mock centre lacks TestAS entirely | seeded items into `EXAM_SPECS`/seed-forms | should | L | content authoring · GAP-3-04 |
| G16 | 3 | Test-center locator + exam-sitting reminders (sittings, not personal deadlines) | No surface to find where/when to sit, or remind for the sitting; missing the window slips an intake | official test-center finders + new sitting reminder type | should | M | reminders store; feeds **G34** · GAP-3-05 |
| G17 | 3 | Aufnahmeprüfung / FSP readiness gate (Studienkolleg route) | The school-leaver's most important exam has the weakest readiness signal — no go/no-go | German placement + FSP/Aufnahme subject trackers | could | M | placement + FSP tracker · GAP-3-06 |

### Phase 4 — Documents & application

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G18 | 4 | Per-program document studio (SOP/CV/LOR are single global drafts) | Tailoring SOP for program #2 overwrites #1; career-switcher needs a distinct narrative per target | `doc:sop/cv/lor:*` keyed off `offers:list`/`tracker:apps` ids | **must** | M | G22 · GAP-401 |
| G19 | 4 | Per-program requirement → auto-checklist (stores free text only) | Students must turn portal requirements into a trackable checklist, not re-read portals | `programme:requirements` → checklist for VaultMatrix/Tracker | **must** | M | G22 · GAP-402 |
| G20 | 4 | Document vault versioning + submission provenance | Must know which version went to which program on what date if a university queries it | `vault:items`, `vault:matrix`; `documents` table | should | M | — · GAP-403 |
| G21 | 4 | Academic-integrity / AI-content self-check on generated docs | German unis are strict on plagiarism; verbatim AI submissions risk integrity flags | SOP/CV/LOR drafts | should | S | G18 · GAP-404 |
| G22 | 4 | Reconcile the two "my applications" stores (Tracker vs Offers) | Same program lives in `tracker:apps` and `offers:list` with no link — double data entry, divergence | `tracker:apps`, `offers:list` | should | M | — (enables G18/G19/G34) · GAP-405 |
| G23 | 4 | uni-assist / VPD / APS: honest "we can't see the portal" + processing windows | Self-reported status is fine but students get no expected-timeline or stuck/overdue guidance | `doc:vpd:entries`, APS/uni-assist checklists | could | S | — · GAP-407 |
| G24 | 4 | Tracker deadline UI → calendar **(also logged as a defect)** | `deadline` field exists in schema but has no input and never reaches the calendar | `tracker:apps.deadline`, `offers:list.acceptBy`, `calendar:deadlines` | **must** | S | **G34** · GAP-406 |

### Phase 5 — Offers & enrollment

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G25 | 5 | Enrollment (Immatrikulation) as a per-program tracked workflow | After an admit, enrollment is a hard-deadline multi-step sequence per accepted offer, not one shared checklist | `arrival-enrolment` checklist, `SEMESTERBEITRAG`, `offers:list` | should | M | G22 · GAP-502 |
| G26 | 5 | Admission-letter interpreter + seat-deadlines with NC/Hochschulstart (DoSV) semantics | Medicine/NC seats via DoSV accept differently (coordination/clearing); generic interpreter misleads | `offers:list`, DoSV content | could | M | G20/G33 minimal · GAP-503 |
| G27 | 5 | Offer comparison by total cost of ownership (not tuition/sem alone) | Public tuition is ~€0, so "cheapest by tuition" misleads; real drivers are CoL + Semesterbeitrag + funding | `offers:list`, `costOfLiving.ts`, `SEMESTERBEITRAG` | should | M | → umbrella **G33** · GAP-501 |

### Phase 6 — Finance & funding

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G28 | 6 | Scholarship finder that matches the profile (not a static category filter) | Eligibility is country/field/level/recency-specific; Bangladesh applicant + career-switcher need *their* schemes | `SCHOLARSHIPS`, profile (country/level/field/experience) | should | M | — · GAP-601 |
| G29 | 6 | Health-insurance selector reads profile; ground the over-30 branch | Selector ignores known profile age/country; over-30 voluntary cost is prose-only without a figure | profile/intake, `HEALTH_INSURANCE`, `costOfLiving.ts` | could | S | G30 · GAP-603 |
| G30 | 6 | Funding-gap planner auto-pulls journey total + Sperrkonto progress **(also logged as a defect)** | "Prefill totals" only navigates, doesn't prefill; manual re-entry is error-prone | `journeyBudget.ts`, app-costs, `costOfLiving.ts`, Sperrkonto total | should | M | → umbrella **G33** · GAP-602 |
| G31 | 6 | Work-day allowance (140/280) wired to the funding plan's work-income line | Funding plan accepts arbitrary work income with no legal-limit sanity bound | `workDays.ts` budget, `FundingPlan` work-income | could | S | G30 · GAP-604 |
| G33 | 6 | **Single cost source of truth** (one persisted journey-budget object) | Sperrkonto, app-costs, CoL, funding plan compute in 3+ places → inconsistent totals | `SPERRKONTO_YEAR_EUR`, app-costs, CoL, `journeyBudget.ts`, funding plan | should | L | G30; umbrella for G11/G27/G30 · GAP-605 |

> **ID note:** there is no `G32`. During dedup the budget/cost overlap collapsed into the single
> umbrella `G33`; the intermediate id was retired and IDs jump 31 → 33 to keep every other id stable
> and traceable to its scratch ref. (55 gaps total: G01–G31 = 31, then G33–G56 = 24.)

### Cross-phase (spans 4–6)

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G34 | 4–6 | **Unified deadline surface** (one aggregator → Calendar + Reminders + .ics) | Worst failure mode is missing a date; today dates live in 3 disconnected systems; app/requirement deadlines reach none | `calendar:deadlines`, `reminder:*`, `offers:list`, `tracker:apps.deadline`, `programme:requirements.deadline`, seed | **must** | M | G22/G24; sub-surfaces G16, G36, G38 · GAP-411 |

### Phase 7 — Visa & pre-departure

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G35 | 7 | Visa rejection / refusal & appeal pathway | Every visa surface is happy-path only; a refused applicant has zero in-app guidance at peak stress | refusal taxonomy; mission remonstration deadlines; `VISA_DOCS` | **must** | M | `seed/visa.ts`, `sources.ts` · GAP-7A |
| G36 | 7 | Embassy/VFS slot-acquisition strategy + no-slot fallback | #1 real bottleneck is *getting* the slot; app tracks a booked slot but offers no strategy when none exist | mission/VFS links; `VISA_PROCESSING` | should | M | G37; feeds **G34** · GAP-7B |
| G37 | 7→8 | Travel-health insurance for the entry→public-insurance coverage gap | A few weeks in Germany with no active German cover; visa often requires incoming insurance for entry | incoming-insurance providers; activation date logic | **must** | M | `HealthInsurance.tsx` · GAP-7C |
| G38 | 7 | Forex / Sperrkonto monthly-withdrawal + first-weeks cash planner | You can't draw the full balance — fixed monthly release; students arrive cash-short | grounded Sperrkonto monthly release; CoL output | should | S | `costOfLiving.ts`; feeds **G34** · GAP-7D |
| G39 | 7→8 | SIM / eSIM first-connectivity guide (prepaid-first ordering) | SIM needed for 2FA/banking/flat-hunting *before* Anmeldung; ordering matters and isn't explained | provider names (generic) | should | S | — · GAP-7E |
| G40 | 7 | Sponsor / proof-of-funds-beyond-Sperrkonto support | Students with a sponsor/scholarship have no path to assemble the alternative proof a mission accepts | `studyFinance` source | could | S | finance cluster · GAP-7F |

### Phase 8 — Arrival & settling

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G41 | 8 | Health-insurance **activation** tracker (post-arrival) | Enrolment is *blocked* until the Krankenkasse confirmation exists — core-flow, not polish | `ChecklistItemDef`; `krankenkassenZentrale`/`tk` | **must** | S | `HealthInsurance.tsx`, `Enrolment.tsx` · GAP-8A |
| G42 | 8 | Liability insurance (Privathaftpflicht) guide (+ add source) | Landlords/WGs effectively expect it; cheap + near-universal; app barely mentions it; no `haftpflicht` source | new source entry; static explainer | should | S | `sources.ts` · GAP-8B |
| G43 | 8 | Anmeldung "no-appointment-available" fallback | Anmeldung gates bank/permit/tax ID; in big cities slots vanish for months → student blocked on everything | `ANMELDUNG_WINDOW`; generic city strategies | **must** | S | `seed/visa.ts`, `AnmeldungRunbook.tsx` · GAP-8C |
| G44 | 8 | Fiktionsbescheinigung interim-certificate walkthrough | When the entry visa lapses before the permit issues, this keeps the student legal — under-explained | `residencePermit`/`auslaenderbehoerde` sources | should | S | `ResidencePermit.tsx` · GAP-8D |
| G45 | 8 | Finding a Hausarzt + how the health system works (116117/112) | No page covers *using* the system after buying insurance — meds, mental health, sick notes (AU) | static guide; emergency numbers | should | M | G41 · GAP-8E |
| G46 | 8 | Emergency / support directory + buddy/community connect | Work-order §3 #50 explicitly; nothing in the cluster provides it; isolation is a top struggle reason | static directory; `studentenwerk`; emergency numbers | should | S | — · GAP-8F |
| G47 | 8 | Bank contingency + SCHUFA / no-credit-history explainer | SCHUFA gates phone contracts and rentals; foreign students start with no history — surprises them | `bankAccount` source; static explainer | should | S | `BankAccount.tsx` · GAP-8G |
| G48 | 8 | Phone-contract (Handyvertrag) vs prepaid + prerequisites | Contract needs Anmeldung + bank + often SCHUFA; min-term/cancellation traps | provider names (generic) | could | S | G39, G47 · GAP-8H |
| G49 | 8 | Deutschland/Semesterticket coverage verifier + no-ticket fallback | Students risk double-paying for a ticket the Semesterbeitrag already includes, or assuming coverage they lack | `DEUTSCHLANDTICKET_PRICE`; `semesterticket`/`studentenwerk` | could | S | `Deutschlandticket.tsx` · GAP-8I |

### Phase 9 — Ongoing

| ID | Phase | Feature | Why a student needs it | Data it uses | Pri | Eff | Deps · ref |
|---|---|---|---|---|---|---|---|
| G50 | 9 | German job-search execution kit (Anschreiben + market-CV + portals + events) | The long-game depends on landing a qualified job; app stops at "here's the permit" — explained, not actionable | profile/experience; `jobMarket`/`jobSeekerPermit`; LLM (validated schema) | **must** | L | `experience.ts`, doc-gen pattern, LLM · GAP-9A (+ GAP-9H) |
| G51 | 9 | Family-reunion income & housing — close the grounding hole + helper | `FamilyReunion.tsx` asserts income/housing/A1 as bare prose with no figure or `needsVerification` — a grounding defect | `familyReunion`/`bamf` sources; household-size input; CoL | **must** | M | `costOfLiving.ts`, `seed/arrival.ts` · GAP-9B |
| G52 | 9 | Study→work / Blue-Card permit-switch deterministic timeline | Blue-Card/PR tools start *from* a job; the graduate→job-seeker→permit transition has no timeline tool | grounded Blue-Card/PR constants; `lib/calc` timeline | should | M | `PrCitizenship.tsx`, `facts.ts` · GAP-9C |
| G53 | 9 | Regulated-profession recognition (Approbation / Anerkennung) tracker | Medicine/nursing/etc can't practise without it; `approbation` source exists but no page uses it | `approbation`, `anabin` sources; static process | should | M | `sources.ts`, `Outcomes.tsx` · GAP-9D |
| G54 | 9 | Permit-loss / exmatrikulation risk explainer | `Renewals.tsx` tracks dates but never explains the consequences of missing them (exmatrikuliert → permit at risk) | `auslaenderbehoerde`/`residencePermit` sources | should | S | `Renewals.tsx` · GAP-9E |
| G55 | 9 | Pension/social-security + payslip (Lohnabrechnung) explainer | Working students get a payslip shock; underpins the pension-contribution requirement behind PR | `daadSideJobs`; `WORK_LIMIT_DAYS` | could | S | `TaxId.tsx` · GAP-9F |
| G56 | 9 | Tax-return (Steuererklärung) helper + deadline reminder | `TaxId.tsx` says refunds exist but offers no deadline/reminder/how-to; pairs with `DeadlineReminder` | `DeadlineReminder` pattern; static guide | could | S | `TaxId.tsx`, deadlines infra · GAP-9G |

---

## 4. Journey-critical must-fix (the `must` items), ordered by how blocked a real student is

1. **G43 · Anmeldung no-appointment fallback** (Phase 8, S) — Anmeldung gates the bank account,
   residence permit, and tax ID. A student who can't get a Bürgeramt slot (Berlin/Munich/Hamburg book
   out for months) is **blocked on everything downstream**. Highest leverage for the smallest effort.
2. **G35 · Visa refusal / appeal pathway** (Phase 7, M) — every visa surface stops dead at a decision.
   A refused non-EU applicant (a common, high-stress outcome) has zero in-app guidance. Grounding:
   remonstration deadline is mission-specific → `needs_verification`, never asserted.
3. **G41 · Health-insurance activation tracker** (Phase 8, S) — Immatrikulation is *blocked* until the
   Krankenkasse confirmation exists. No surface walks the activation sequence today.
4. **G37 · Travel-health insurance for the coverage gap** (Phase 7→8, M) — a real money/health hole in
   the window between landing and German cover activating; the visa itself often requires entry insurance.
5. **G06 · Real Studienkolleg directory** (Phase 1, L) — the entire school-leaver route is *theory*
   without a list of actual state Studienkollegs (city/Bundesland/Kurs) and the "apply via the
   university, not the college" fact. Grounding: every entry needs `{source_name, source_url,
   retrieved_at}` or `needs_verification`.
6. **G12 · Unified test dashboard** (Phase 3, L) — no single cockpit for the tests a pathway requires
   (IELTS + TestDaF + TestAS) with target + sit-by date + readiness gate. Students juggling multiple
   tests miss a sitting.
7. **G34 · Unified deadline surface** (Cross 4–6, M) — the worst failure mode is missing a date, yet
   application and requirement deadlines reach none of the three disconnected deadline systems.
8. **G24 · Tracker deadline UI → calendar** (Phase 4, S) — *(also a defect)* the `deadline` field
   exists but has no input and never reaches the calendar; a quick, high-value fix feeding G34.
9. **G18 · Per-program document studio** (Phase 4, M) — tailoring the SOP for program #2 silently
   overwrites program #1; a multi-application student can hold only one draft per type.
10. **G19 · Per-program requirement auto-checklist** (Phase 4, M) — without it, requirements are an
    unstructured paste box; a student with 6–8 targets has no actionable, trackable per-program checklist.
11. **G50 · German job-search execution kit** (Phase 9, L) — the long-game (land a qualified job →
    permit switch → PR) depends on applying for work; the app explains the 18-month window but gives
    no market-CV / Anschreiben / portals. Grounding: any market figure grounded or omitted; AI output
    validated.
12. **G51 · Family-reunion income & housing grounding fix** (Phase 9, M) — *(also a grounding defect)*
    `FamilyReunion.tsx` states income/housing/A1 expectations as bare prose with no figure and no
    `needsVerification`, violating CLAUDE.md §2/§3. Lowest student-blocking urgency of the must items,
    but the only one that is also an active grounding-discipline breach, so it must be fixed.

---

## 5. Full specs (traceable to scratch refs)

> Specs below are copied from the phase-band scratch audits, lightly edited for consistency. Each
> retains its original ref id in the heading. Grounding requirements are stated explicitly per
> CLAUDE.md §2/§3.

### G01 · Phase 0 · Programme-data freshness & coverage banner — *(ref GAP-0-01)*
- **Why:** Orientation tools promise routes, but Discovery runs on a curated **35-row** program set
  (`Matching.tsx:241` shows "bundled curated set"). A Bangladesh data-science applicant who searches an
  unusual field gets few/zero hits and cannot tell whether that means "no such programme in Germany" or
  "our sample is small." That ambiguity erodes trust at the moment a student decides to commit.
- **Data:** existing `programs` table / `useProgramData`; add a count + "sample vs. authoritative
  directory" callout and deep links to DAAD/Hochschulkompass scoped to `targetField`.
- **Acceptance:** (1) empty/low-result state explains the curated-sample limitation; (2) one-click
  DAAD/Hochschulkompass search pre-filled with field + level + language; (3) never implies the 35 rows
  are exhaustive; (4) "verify on official directory" provenance preserved.
- **Grounding:** DAAD & Hochschulkompass are the cited authoritative directories — link, don't assert counts.

### G02 · Phase 0 · Save/share the orientation verdict — *(ref GAP-0-02)*
- **Why:** All three Phase-0 tools are **stateless** — `Eligibility.tsx` keeps the result in component
  `useState`; refresh loses it, and there's no way to carry the verdict into the signed-in plan or share
  it with a parent/agent who funds the journey. Students re-run the same four answers repeatedly.
- **Data:** persist last eligibility/feasibility inputs+verdict to profile/account (`intake_submissions`
  or `account_memory`); render a shareable read-only summary.
- **Acceptance:** (1) verdict persists across refresh for a signed-in user; (2) "use these answers in my
  plan" pre-fills Settings; (3) export/print or copyable summary; (4) per-user isolation respected.
- **Grounding:** none (echoes already-grounded pathway notes).

### G03 · Phase 0 · "Realistic stress/time" commitment & risk briefing — *(ref GAP-0-03)*
- **Why:** Budget covers money and Feasibility covers years, but no tool sets honest expectations on
  **process risk**: visa-appointment waits (months), Studienkolleg competitiveness, APS lead time,
  refusal/gap-year scenarios. A Class-12 applicant routinely under-budgets *time risk* and applies for an
  intake that's already impossible.
- **Data:** existing pathway caveats + reverse-timeline overdue logic; surface a single "commitment
  reality" panel combining route risk + earliest viable intake.
- **Acceptance:** (1) shows earliest *viable* intake given today's date (reuse `reverseTimeline` overdue);
  (2) lists the top 3 process risks for the route; (3) framed as heuristics, not predictions.
- **Grounding:** appointment-wait/APS-lead-time figures must be `needs_verification` or omitted.

### G04 · Phase 0 · Personalised "first 5 concrete actions" from the interest self-check — *(ref GAP-0-04)*
- **Why:** The starting-point assessment should output **first 5 actions**. `Counseling.tsx:81-102`
  outputs ranked *fields*; `NextActions.tsx` outputs *milestones* but only after a profile exists. A
  brand-new visitor who just did the interest check gets fields, not "here are your 5 next clicks," and
  the two aren't wired (Counseling → fields, but doesn't seed the profile).
- **Data:** write `Counseling` results (suggested field, demand flag) into profile so
  `NextActions`/Matching pick them up; emit a 5-step starter list inline.
- **Acceptance:** (1) interest check offers "save these fields to my profile"; (2) shows 5 concrete next
  actions immediately; (3) Matching default subject group reflects the chosen field; (4) deterministic.
- **Grounding:** none.

### G05 · Phase 1 · Country-specific recognition deep-dive — *(ref GAP-1-01)*
- **Why:** Recognition is the make-or-break Phase-1 fact. `Recognition.tsx` + `pathway.ts` explain the
  HZB categories generically and link anabin, but a real Class-12 India / Bangladesh applicant needs the
  **country-specific** read ("Indian HSC generally not Abitur-equivalent → Studienkolleg unless carve-out";
  "Bangladesh HSC similar; ~2 yrs uni for direct"). The engine *has* this logic
  (`pathway.ts:123,133,406-414`) but it's only reachable through the routing flow, not as a browsable
  per-country guide, and the India raised-70%-from-WS2026/27 note isn't prominent outside the Studienkolleg branch.
- **Data:** `country.ts`, `pathway.ts` notes; a per-country recognition page keyed off `homeCountry`.
- **Acceptance:** (1) per-country card (India, Bangladesh min.) with HSC→HZB verdict; (2) anabin self-check
  steps; (3) WS2026/27 raised-minimum warning shown for India with `needs_verification`; (4) every
  threshold carries provenance or `needs_verification`.
- **Grounding:** anabin category, India ~70% WS2026/27, Bangladesh ~2-yr rule — all `needs_verification`/cited.

### G06 · Phase 1 · Actual Studienkolleg directory — *(ref GAP-1-02)* · **MUST**
- **Why:** `Studienkolleg.tsx` + `kurs.ts` explain the *concept* and pick the right Kurs, but a
  school-leaver cannot act without a **list of real state Studienkollegs**, their locations, Kurs offered,
  and that you apply *through a university/uni-assist* not the college. Without it the "route" is theory.
- **Data:** a seeded, provenance-stamped Studienkolleg list (public/uni-affiliated), filterable by Kurs +
  Bundesland; reuse the program-card/eligibility UI pattern.
- **Acceptance:** (1) browsable list with city/Bundesland/Kurs; (2) "apply via the university, not the
  college" stated; (3) each entry links to its official page; (4) public-vs-private flagged; (5) entries
  carry `{source_name, source_url, retrieved_at}` or `needs_verification`.
- **Grounding:** every college entry must cite an official source; do not fabricate Kurs availability.

### G07 · Phase 1 · Interactive German learning — *(ref GAP-1-03)*
- **Why:** `German.tsx` is a static can-do + example-phrase reference with TTS; `GermanPlan.tsx` is a plan
  with hours/milestones; `Flashcards.tsx` has a 12-card seed deck. There is **no graded practice**
  (fill-in, listening comprehension, grammar drills, progress-gated lessons). An A1→B1 learner needs real
  exercises; the app currently only *tracks* a plan.
- **Data:** new exercise content (seeded) + per-item progress in `srs_cards`/a lessons table; optional
  AI-generated drills via the existing `useGenerate` path with Zod validation.
- **Acceptance:** (1) ≥1 interactive exercise type per CEFR level; (2) immediate feedback; (3) progress
  persists per user; (4) AI-generated items validated + labelled; (5) no certification-equivalence claim.
- **Grounding:** none (practice content); keep "B2/C1 is the bar" facts grounded as today.

### G08 · Phase 1 · ECTS / credit-gap analyzer wired to the 180-ECTS bridge — *(ref GAP-1-04)*
- **Why:** `Ects.tsx` totals/normalises credits, and `pathway.ts:206-213` (`ECTS_BRIDGE_NOTE`) explains
  the three bridges when a 3-year Bachelor is <180 ECTS — but the two aren't connected. A Bangladesh/India
  3-year-degree Master's applicant (the #1 real blocker) isn't told *"your computed total is 168 → here
  are your three documented options."*
- **Data:** `ECTSCalculator` output + `ECTS_BRIDGE_NOTE`; compute shortfall vs 180 and surface bridges.
- **Acceptance:** (1) when ECTS < 180, show the gap and the three bridges; (2) per-programme acceptance
  framed as verify-only; (3) deterministic shortfall math; (4) `needs_verification` on the 180 expectation.
- **Grounding:** 180-ECTS expectation is per-programme → `needs_verification`/cited.

### G09 · Phase 2 · Auto-extract per-programme requirements into a checklist — *(ref GAP-2-01)*
- **Why:** `Requirements.tsx` is a manual paste box (`Requirements.tsx:64-66`). Wanted: a per-programme
  **auto-checklist** — from the shortlisted programme's known fields (language, tests, degree, deadline)
  generate the document/task checklist automatically, with manual paste only for the rest. A student with
  8 shortlisted programmes will not hand-transcribe 8 requirement blobs.
- **Data:** `programs` row fields + `eligibility()` criteria → seed a per-app checklist; merge with
  shortlist/tracker.
- **Acceptance:** (1) selecting a shortlisted programme pre-fills known requirements; (2) generates a
  checklist of documents/tests with status; (3) manual notes still allowed; (4) official page remains
  source of truth; (5) per-user persisted.
- **Grounding:** indicative requirements only — link the official programme page; no invented thresholds.

### G10 · Phase 2 · Per-programme / city employability signal — *(ref GAP-2-02)*
- **Why:** `Outcomes.tsx` gives **field-level** demand, but Discovery offers no programme- or city-level
  outcome signal even where a groundable one exists. Students choosing between two admits want more than
  tuition/city; Compare (`Matching.tsx:386-401`) shows only logistics. Honest scope: qualitative + cited only.
- **Data:** optional per-program note field + city job-market qualitative tags (reuse `career/fields`).
- **Acceptance:** (1) any outcome claim is qualitative + cited or omitted; (2) no fabricated
  salaries/placement rates; (3) absence shown honestly ("no grounded outcome data for this programme").
- **Grounding:** strict — only `make-it-in-germany`/official signals; otherwise show nothing.

### G11 · Phase 2 · Application-cost loop closes back to the budget — *(ref GAP-2-03)* · cross-link **G33**
- **Why:** `Shortlist.tsx:128` and `ApplicationCosts.tsx` exist, but the **shortlist size doesn't feed
  the Phase-0 total-journey budget**. A student who shortlists 10 programmes (uni-assist + APS fees scale
  per app) never sees the budget update; the orientation budget and the real shortlist diverge.
- **Data:** shortlist count + `ApplicationCosts` → `journeyBudget` one-time line.
- **Acceptance:** (1) budget reflects actual shortlist count for uni-assist/APS fees; (2) deterministic;
  (3) all fee constants grounded as today.
- **Grounding:** uni-assist/APS fees already grounded — reuse, don't re-assert. **Overlaps G33 (single
  cost source of truth) — implement under that umbrella.**

### G12 · Phase 3 · Unified test dashboard — *(ref GAP-3-01)* · **MUST**
- **Why:** The biggest Phase-3 gap. Three separate surfaces exist — `ExamsHub.tsx` (launches mocks),
  `ExamTracker.tsx` (post-hoc analytics, manual single target band), and `recommendedTests()`
  (`derive.ts:68-94`, returns *which* tests, no date/target). **No single page** says: *"For your pathway
  you need (a) IELTS — target 6.5, sit by <date>, you're 60% ready; (b) TestAS — by <date>, not started."*
  An applicant juggling IELTS + TestDaF + TestAS with different deadlines has no cockpit and will miss a sitting.
- **Data:** `recommendedTests(profile)` + per-test target (from program eligibility) + `reverseTimeline`
  test dates + `ExamTracker` predicted readiness → one dashboard. Persist targets/dates per user.
- **Acceptance:** (1) lists every required test with status (not-started/practising/ready); (2) each has an
  editable target + a planned sit-by date derived from the chosen intake; (3) a readiness signal per test
  from mock analytics; (4) a "ready to book" gate when readiness ≥ target; (5) deterministic; predictions
  carry the standing disclaimer; (6) per-user persisted.
- **Grounding:** target thresholds are per-programme → `needs_verification`; no fabricated "official" pass marks.

### G13 · Phase 3 · Test requirement resolver — *(ref GAP-3-02)*
- **Why:** `recommendedTests()` is heuristic from level + medium-of-instruction. It can't tell a Bangladesh
  English-medium Master's applicant whether their specific shortlist **waives IELTS** (many do) or demands
  it. Students over-prepare (waste money) or under-prepare. The eligibility engine knows per-programme test
  flags (`eligibility.ts:65-69`) but that isn't aggregated.
- **Data:** `eligibility()` per-program test criteria aggregated over the shortlist.
- **Acceptance:** (1) per-test "required by N of your M shortlisted programmes; waived by K"; (2)
  medium-of-instruction waiver flagged as verify-per-programme; (3) deterministic; (4) official page is source of truth.
- **Grounding:** waiver rules per-programme → `needs_verification`.

### G14 · Phase 3 · Live AI speaking examiner — *(ref GAP-3-03)*
- **Why:** Today `SpeakingTask.tsx` records a single answer + STT transcript that *later* feeds an AI
  rubric inside a mock — one-shot capture, not an **interactive examiner** that asks a follow-up, reacts,
  and conducts an IELTS Part-3 / TestDaF speaking conversation. Speaking is the hardest section to self-prepare.
- **Data:** existing TTS (`lib/speech/tts.ts`) + STT (`lib/speech/stt.ts`) + an AI turn-loop with
  Zod-validated rubric; reuse mock band descriptors.
- **Acceptance:** (1) multi-turn spoken exchange with follow-ups; (2) per-criterion feedback validated by
  Zod; (3) graceful no-STT / no-AI-provider fallbacks; (4) no claim it predicts the official score;
  (5) audio handled per existing autoplay/once rules.
- **Grounding:** none (practice); keep band-descriptor facts as today.

### G15 · Phase 3 · TestAS / TestDaF / Goethe actual practice items — *(ref GAP-3-04)*
- **Why:** `TestAs.tsx` is a guide with no practice questions; for non-EU Bachelor/Medicine applicants
  TestAS is often **mandatory** (`derive.ts:87-89`). The mock centre covers IELTS/TOEFL/TestDaF/Goethe/
  GRE/GMAT but **not TestAS** at all, and TestDaF/Goethe seed sets may be thin.
- **Data:** seeded TestAS core+subject practice items into the existing `EXAM_SPECS`/seed-forms pipeline;
  expand TestDaF/Goethe banks.
- **Acceptance:** (1) a TestAS practice runner exists in the mock centre; (2) core + ≥1 subject module
  modelled; (3) "study aid, not real test" disclaimer; (4) scoring mapped to the right scale.
- **Grounding:** practice items original; format/scale facts cited as in other exams.

### G16 · Phase 3 · Test-center locator + exam-sitting reminders — *(ref GAP-3-05)* · feeds **G34**
- **Why:** No surface helps a student **find where/when to sit** IELTS/TOEFL/TestDaF/TestAS or set a
  reminder for the sitting itself. `Reminders.tsx` tracks personal deadlines (visa, enrolment, renewals)
  but not exam sittings. A student must book a centre slot weeks ahead; missing the window slips an intake.
- **Data:** link out to official test-center finders (IELTS/TestDaF/TestAS) by city/country; add an
  exam-sitting reminder type to the existing reminders/deadlines store.
- **Acceptance:** (1) official test-center finder links per test, scoped by user country/city where
  possible; (2) user can add a "sit IELTS on <date>" reminder that flows into the calendar/.ics export;
  (3) lead-time guidance framed as `needs_verification`; (4) no fabricated center lists.
- **Grounding:** center locations/dates come from the official test owner — link, don't assert. **This is a
  distinct sub-surface of the unified deadline surface (G34) — its sitting reminders must feed that aggregator.**

### G17 · Phase 3 · Aufnahmeprüfung / FSP readiness gate — *(ref GAP-3-06)*
- **Why:** For the Class-12 school-leaver, the **Aufnahmeprüfung** (Studienkolleg entrance) and later the
  **FSP** are the real Phase-1/3 exams — `Aufnahmepruefung.tsx` and `Fsp.tsx` exist as guides/trackers, but
  there's no **readiness gate** ("you're at B1, the Aufnahmeprüfung expects B1–B2 + subject basics → not
  ready") tying German level + subject prep to a go/no-go, the way G12 does for international tests.
- **Data:** German placement level + FSP/Aufnahmeprüfung subject trackers → a readiness verdict.
- **Acceptance:** (1) readiness verdict from German level + subject-prep progress; (2) honest "not ready /
  on track"; (3) deterministic; (4) thresholds `needs_verification`.
- **Grounding:** entrance-exam level expectations per college → `needs_verification`.

### G18 · Phase 4 · Per-program document studio — *(ref GAP-401)* · **MUST**
- **Why:** A real applicant targets 3–6 programs and must tailor the SOP/motivation letter to each (named
  modules, professors, why-this-program). The career-switcher especially needs a distinct narrative per target.
- **Current state — MISSING.** `Sop.tsx:119-120` persists one global draft (`doc:sop:draft`) + one form;
  `Cv.tsx` → single `doc:cv:form`; `Lor.tsx` → single `doc:lor:program`/`doc:lor:university`. Tailoring for
  program #2 overwrites program #1. `Vault.tsx:88-93` shows one "Drafted" badge per type.
- **Data:** keys `doc:sop:*`, `doc:cv:*`, `doc:lor:*`; key off Offers/Tracker program ids (`offers:list`,
  `tracker:apps`).
- **Acceptance:** SOP/CV/LOR stored per program id (e.g. `doc:sop:draft:{appId}`); program picker
  pre-filled from Tracker/Offers; switching programs loads that program's draft without clobbering others;
  Vault lists each program's drafted docs separately; migration preserves an existing global draft as
  "General," never silently dropped.
- **Grounding:** none (user content); preserve the existing "edit before sending / verify every detail" guidance per draft.

### G19 · Phase 4 · Per-program requirement → auto-checklist — *(ref GAP-402)* · **MUST**
- **Why:** Each German program states different requirements (VPD vs direct, GRE/GMAT or not, language
  threshold, # LORs). Students must turn that into an actionable, trackable checklist instead of re-reading portals.
- **Current state — PARTIAL/MISSING.** `Requirements.tsx` stores `{ programme, deadline, requirements }`
  where `requirements` is a raw textarea; no parsing, no structured checklist, no link to Vault/Tracker/Calendar.
- **Data:** `programme:requirements`; emit checklist items consumed by `VaultMatrix.tsx` and Tracker.
- **Acceptance:** pasted requirements produce a structured, editable checklist (language cert, transcript,
  # LORs, GRE y/n, VPD y/n, translations) — AI-assisted extraction acceptable but user-confirmable, never
  authoritative; checklist attaches to the program and surfaces in the Vault matrix; deadlines flow into the
  unified surface (G34); nothing fabricated — extractor only restructures the user's pasted text.
- **Grounding:** none for pasted text; if AI infers a requirement not in the text, mark it as a suggestion to verify.

### G20 · Phase 4 · Document vault versioning + submission provenance — *(ref GAP-403)*
- **Why:** Students iterate documents (transcript v1 → updated, SOP v2 after feedback) and must know
  *which version went to which program on what date* — critical if a university queries a submission.
- **Current state — MISSING.** `Vault.tsx:62-68` `VaultItem` = `{ id, name, kind, note, url }` — no
  version, no timestamp, no submitted-to mapping. `VaultMatrix.tsx` records sent/not-sent booleans only.
- **Data:** `vault:items`, `vault:matrix`; Supabase `documents` table (has `content`, `item_key`, `kind`,
  `updated_at`, no version column).
- **Acceptance:** a vault item can hold multiple dated versions, active one marked; the doc-per-application
  matrix records *which version* was sent and *when*; history per-user scoped, survives refresh + auth
  switch; privacy preserved (metadata/links only, no binary upload, no PII logged).
- **Grounding:** none.

### G21 · Phase 4 · Academic-integrity / AI-content self-check — *(ref GAP-404)*
- **Why:** German universities are strict on plagiarism (`campus/Culture.tsx` stresses this). Students who
  "Generate with AI" then submit verbatim risk integrity flags; they need a guardrail + self-check.
- **Current state — MISSING.** `Sop.tsx` produces an AI draft with only an `AiGeneratedBadge`; no
  similarity/AI-content self-check, no "rewrite in your own voice" gate.
- **Data:** SOP/CV/LOR drafts.
- **Acceptance:** after AI generation, an explicit integrity notice + short self-check the student must
  acknowledge before export; a lightweight originality nudge (flag long passages identical to AI output) —
  heuristic only, clearly "not a plagiarism scanner"; links to `campus/culture`.
- **Grounding:** none; must NOT claim to be a certified plagiarism detector.

### G22 · Phase 4 · Reconcile Tracker vs Offers stores — *(ref GAP-405)*
- **Why:** A student adds programs to the Tracker Kanban while applying, then re-types the *same* programs
  into the Offers board when admits arrive. One program now lives in two stores with no link, doubling data
  entry and risking divergence.
- **Current state — MISSING (integration).** `Tracker.tsx:34` uses `tracker:apps`; `offers/offers.ts:23`
  uses `offers:list`. Both are read across Dashboard/NextActions/Matching, but nothing maps a Tracker app to its Offer.
- **Data:** `tracker:apps`, `offers:list`.
- **Acceptance:** a single canonical program identity links Tracker card → Offer → Requirements checklist →
  documents; promoting a Tracker card to "Decision/Admit" can seed an Offer without re-typing; no regression
  to per-page UX; backfill non-destructive.
- **Grounding:** none. **Enables G18/G19/G34.**

### G23 · Phase 4 · uni-assist / VPD / APS honest framing + processing windows — *(ref GAP-407)*
- **Why:** Students worry whether uni-assist actually forwarded their file. Trackers are fine as
  *self-reported* status, but the medicine/Hochschulstart and VPD flows need clearer stage semantics and the
  honest caveat that status is user-entered, not portal-synced.
- **Current state — PARTIAL.** `Vpd.tsx` cycles `requested → processing → received` manually;
  `UniAssist.tsx` is a static walkthrough; APS tracking is country-logic + checklist. None claim live sync
  (correct), but students get no expected-processing-time guidance or stuck advice.
- **Data:** `doc:vpd:entries`, APS/uni-assist checklists.
- **Acceptance:** each manual tracker states "status is what you record — we don't read the portal"; adds
  grounded typical-processing-window guidance (uni-assist VPD weeks; APS timelines) with provenance +
  `needs_verification`; a "stuck/overdue" nudge when a stage exceeds its typical window.
- **Grounding:** uni-assist VPD turnaround, APS processing times — grounded (uni-assist/APS official) or
  `needs_verification`; never invent week counts.

### G24 · Phase 4 · Tracker deadline UI → calendar — *(ref GAP-406)* · **MUST** · **(also logged as a defect)**
- **Why:** Application deadlines are the most time-critical Phase-4 data. The schema anticipates them but
  the student cannot enter them, and even the Offers `acceptBy` only reaches Reminders, not the Calendar.
- **Current state — PARTIAL (defect).** `Tracker.tsx:14-21` declares `deadline?` and `url?` but the add
  form (`72-95`) and card render (`117-162`) expose neither — the field is dead. `Calendar.tsx` only merges
  `SEED_EVENTS` + manual `calendar:deadlines`; it does not read `offers:list` or `tracker:apps`.
- **Data:** `tracker:apps.deadline`, `offers:list.acceptBy`, `calendar:deadlines`.
- **Acceptance:** Tracker cards expose deadline + URL inputs that persist; application deadlines and offer
  accept-by dates appear on the month Calendar and in Reminders/.ics export; urgency computed
  deterministically with `deadlines.ts` (no model math).
- **Grounding:** none. **Depends on G34.**

### G25 · Phase 5 · Enrollment as a per-program tracked workflow — *(ref GAP-502)*
- **Why:** After an admit, enrollment is a hard-deadline, multi-step sequence (accept → pay Semesterbeitrag
  → insurance confirmation → submit docs → Matrikelnummer). A student juggling multiple admits needs a
  *tracked* enrollment per accepted offer, not one shared checklist.
- **Current state — PARTIAL.** `Enrolment.tsx` shows a single shared `Checklist` + a 5-step prose list +
  the `SEMESTERBEITRAG` official fact (well grounded). Not tied to a specific accepted offer; can't track two.
- **Data:** `arrival-enrolment` checklist, `ENROLMENT_DOCS`, `SEMESTERBEITRAG`, `offers:list`.
- **Acceptance:** enrollment checklist + Semesterbeitrag-paid + insurance-confirmation status trackable per
  accepted offer; the enrollment deadline is the same date object on Calendar/Reminders (G34);
  Medicine/Studienkolleg variant notes the Studienkolleg → FSP → degree enrollment chain where flagged.
- **Grounding:** Semesterbeitrag already grounded; keep provenance. **Depends on G22.**

### G26 · Phase 5 · Admission-letter interpreter + NC/Hochschulstart (DoSV) semantics — *(ref GAP-503)*
- **Why:** For NC/Medicine places allocated via Hochschulstart's DoSV, "accepting a seat" works differently
  (coordination phase, clearing/Koordinierungsphase, ranked priorities). The generic Zulassungsbescheid
  interpreter and seat tracker don't reflect this, so the Medicine aspirant gets mismatched advice.
- **Current state — MISSING.** `AdmissionLetter.tsx` is a generic letter-contents checklist;
  `SeatDeadlines.tsx` treats all offers identically. A DoSV walkthrough exists at `/documents/dosv` but is
  not linked from the offers/enrollment flow, and offers carry no "central allocation" flag.
- **Data:** `offers:list`, DoSV content.
- **Acceptance:** an offer can be flagged "centrally allocated (Hochschulstart/DoSV)," surfacing
  DoSV-specific accept/clearing guidance + the `/documents/dosv` link; seat-deadline copy distinguishes a
  direct accept-by from a DoSV coordination-phase date; Medicine realism preserved (no implied guarantee).
- **Grounding:** DoSV phase rules/dates — grounded (hochschulstart) or `needs_verification`.

### G27 · Phase 5 · Offer comparison by total cost of ownership — *(ref GAP-501)* · cross-link **G33**
- **Why:** German public tuition is mostly €0, so "cheapest by tuition" is nearly meaningless. The real
  decision drivers are city cost-of-living, Semesterbeitrag, language, and funding fit. The board badges
  "cheapest" purely on `tuitionPerSem`, which can mislead.
- **Current state — PARTIAL.** `OfferComparison.tsx:24-28` computes `cheapest` from `tuitionPerSem` only;
  captures `city` but never pulls the city's CoL or the Semesterbeitrag; no link to funding-gap.
- **Data:** `offers:list`, `costOfLiving.ts` CITY_PROFILES, `SEMESTERBEITRAG`.
- **Acceptance:** each offer optionally shows the city's estimated monthly CoL (deterministic) and the
  typical Semesterbeitrag, labelled illustrative; "cheapest"/decision badges reflect total monthly cost or
  the misleading badge is removed; advisory disclaimer present.
- **Grounding:** Semesterbeitrag + CoL figures already carry source/illustrative labels; preserve them.
  **Overlaps G33 — implement under the single-cost-source umbrella.**

### G28 · Phase 6 · Scholarship finder that matches the profile — *(ref GAP-601)*
- **Why:** Eligibility is country/field/level/recency-specific (DAAD EPOS country list & 2-yr work +
  recency rules; Deutschlandstipendium; Erasmus+). The Bangladesh applicant and the career-switcher should
  see *their* eligible schemes, not the same nine for everyone.
- **Current state — PARTIAL.** `Scholarships.tsx` filters a static 9-item list by manual category and shows
  an experience-match note; it does **not** read `profile.homeCountry`, `targetLevel`, or field. Facts
  themselves are grounded (DAAD/EPOS carry source + "verify against official EPOS criteria").
- **Data:** `SCHOLARSHIPS` (`seed/finance.ts`), profile (`homeCountry`, level, field, experience).
- **Acceptance:** schemes ranked/flagged by country, level, field, experience/recency with an explicit "you
  may be eligible / likely not / verify" state per scheme; eligibility logic transparent and grounded;
  uncertain rules show `needs_verification`, never a hard yes/no; existing grounded facts + advisory disclaimer retained.
- **Grounding:** EPOS country list + 2-yr/6-yr rules, Deutschlandstipendium amount, Erasmus+ — grounded or `needs_verification`.

### G29 · Phase 6 · Health-insurance selector reads profile; ground the over-30 branch — *(ref GAP-603)*
- **Why:** The selector asks the student to re-toggle under-30/agreement that the profile may already know;
  and the over-30 → private/voluntary outcome (a real cost jump for the career-switcher) is asserted only in
  prose without a grounded figure or threshold citation.
- **Current state — PARTIAL.** `HealthInsurance.tsx:28-51` `recommend()` branches under-30/over-30/agreement
  correctly, but state is local `useState`, not read from profile/intake; the over-30 path (`45-50`) cites
  no figure and the `HEALTH_INSURANCE` fact (~€120–140) doesn't model the over-30 voluntary rate. CoL is
  deterministic & per-city but city figures lack per-line provenance and don't auto-feed funding.
- **Data:** profile/intake (age/country), `HEALTH_INSURANCE` fact, `costOfLiving.ts`.
- **Acceptance:** selector pre-fills under-30/agreement from the profile (overridable); the over-30 /
  >14-semester case shows a grounded range (or `needs_verification`); CoL city baselines carry an
  "illustrative, source/year" label.
- **Grounding:** statutory student rate, over-30 voluntary rate, age/semester threshold — grounded
  (TK/official) or `needs_verification`. **Depends on G30.**

### G30 · Phase 6 · Funding-gap planner auto-pulls totals — *(ref GAP-602)* · cross-link **G33** · **(also logged as a defect)**
- **Why:** The student already computed application costs, CoL, and Sperrkonto progress elsewhere. Re-typing
  `oneTime`/`monthly` into the funding plan is error-prone; the "Prefill totals" link only navigates, it
  doesn't prefill.
- **Current state — MISSING (integration / defect).** `FundingPlan.tsx` has manual `oneTime`/`monthly`
  inputs; `journeyBudget.ts` (`computeJourneyBudget`) and `SperrkontoProviders.tsx` tracked progress exist
  but aren't imported. The "Prefill from the journey budget" copy implies auto-fill that doesn't happen.
- **Data:** `journeyBudget.ts`, application-costs state, `costOfLiving.ts`, Sperrkonto-providers tracked total.
- **Acceptance:** funding plan can pull the computed one-time total (APS + uni-assist + translations + visa
  + flights + deposit) and monthly CoL from the journey budget, with override; tracked Sperrkonto progress
  counts toward the funded side automatically; all math deterministic (`fundingGap.ts`/`journeyBudget.ts`),
  unit-tested; no model-computed totals.
- **Grounding:** underlying official figures already grounded; preserve provenance. **Implement under G33.**

### G31 · Phase 6 · Work-day allowance (140/280) wired to the funding plan — *(ref GAP-604)*
- **Why:** Students over-estimate part-time earnings. The app computes the legal day budget deterministically
  but the funding plan's work-income field is a free number with no sanity bound, so a student can plan on
  income their permit doesn't allow.
- **Current state — MISSING (integration).** `WorkDays.tsx` + `workDays.ts` correctly compute the 140/280
  budget (grounded `WORK_LIMIT`); `FundingPlan.tsx` accepts arbitrary monthly work-income with no link.
- **Data:** `workDays.ts` budget, `FundingPlan` work-income input.
- **Acceptance:** funding plan shows an indicative maximum realistic work income derived from the 140/280
  budget, with override; clearly "indicative, depends on wage/role"; no invented hourly wage stated as fact.
- **Grounding:** 140/280 already grounded; any assumed wage must be user-entered or flagged. **Depends on G30.**

### G33 · Phase 6 · Single cost source of truth — *(ref GAP-605)* · **umbrella for G11, G27, G30**
- **Why:** A coherent "what will this cost and am I covered?" answer requires one number. Today the
  Sperrkonto requirement, the application-cost estimator, the CoL calc, and the funding plan each hold their
  own inputs, so the student can see inconsistent totals.
- **Current state — PARTIAL.** `SPERRKONTO_YEAR_EUR` (€11,904) is a single grounded constant, used by
  SperrkontoProviders; but `ApplicationCosts.tsx`, `CostOfLiving.tsx`, `journeyBudget.ts`, and
  `FundingPlan.tsx` don't converge on one persisted budget object.
- **Data:** `SPERRKONTO_YEAR_EUR`, application-costs state, CoL state, `journeyBudget.ts`, funding-plan state.
- **Acceptance:** one persisted journey-budget object is the source for the budget page, funding plan, offer
  comparison, and Sperrkonto target; changing an input in one place reflects everywhere (or is shown as an
  override); deterministic, tested; every official figure retains provenance.
- **Grounding:** Sperrkonto €11,904 + per-fact `retrieved_at` (currently module-level — add per-fact
  retrieval metadata). **This is the umbrella that absorbs G11, G27, and G30.**

### G34 · Cross 4–6 · Unified deadline surface — *(ref GAP-411)* · **MUST** · **umbrella; sub-surfaces G16, G36, G38**
- **Why:** A student's worst failure mode is missing a date. Today dates live in (1) `Calendar.tsx`
  (`calendar:deadlines` + seed), (2) `Reminders.tsx` (`reminder:*` keys + offers `acceptBy`), and (3) the
  Tracker's unused `deadline` field. Application deadlines and requirement deadlines reach *none* of these.
- **Current state — PARTIAL.** Calendar reads seed + `calendar:deadlines` only; Reminders reads 7 fixed
  `reminder:*` keys + offers; Tracker/Requirements deadlines are stranded. Good `.ics` export, but it only
  sees reminders + offers.
- **Data:** `calendar:deadlines`, `reminder:*`, `offers:list`, `tracker:apps.deadline`,
  `programme:requirements.deadline`, `SEED_EVENTS`.
- **Acceptance:** one deadline aggregator feeds the Calendar grid, the Reminders list, and the `.ics` export
  from a single source; application, offer accept-by, requirement, enrollment, visa, and renewal dates all
  appear in all three views; deterministic urgency/severity via `deadlines.ts`; timezone-safe; survives
  refresh + auth switch.
- **Grounding:** none (user dates); seed official dates keep their verification flags. **Depends on G22/G24;
  exam-sitting reminders (G16), visa-slot reminders (G36), and the cash-buffer dates (G38) feed this aggregator.**

### G35 · Phase 7 · Visa rejection / refusal & appeal pathway — *(ref GAP-7A)* · **MUST**
- **Why:** Every visa surface is happy-path only. `visa/Overview.tsx`, `visa/Checklist.tsx`,
  `visa/Appointment.tsx` walk submission → decision but stop dead at a refusal. A refused applicant — a very
  real outcome for first-time non-EU students — has zero in-app guidance at maximum stress. The single
  biggest contingency hole in Phase 7.
- **Data:** refusal-reason taxonomy; mission remonstration deadlines; links to the issuing mission; the
  existing `VISA_DOCS` checklist for resubmission. Deps: `seed/visa.ts`, `sources.ts`.
- **Acceptance:** lists common refusal grounds (insufficient funds, doubt about intent, document gaps) as
  *general guidance*; states the remonstration/appeal concept and that the **deadline + procedure are
  mission-specific**, rendered with `needs_verification` + a mission link — never a hard number; provides a
  resubmission checklist reusing `VISA_DOCS`; carries the visa/finance disclaimer.
- **Grounding:** remonstration deadline is official + mission-specific → must be `needs_verification`. No fabricated appeal windows.

### G36 · Phase 7 · Embassy/VFS slot-acquisition strategy + no-slot fallback — *(ref GAP-7B)* · feeds **G34**
- **Why:** `visa/Appointment.tsx` tracks a *booked* slot with `DeadlineReminder` but assumes you have one.
  The #1 real bottleneck for Indian/Bangladeshi students is **getting** the slot. The app says waits "run
  months" but offers no strategy when they do.
- **Data:** mission/VFS portal links; lead-time facts (`VISA_PROCESSING`). Deps: G37; `seed/visa.ts`.
- **Acceptance:** explains slot-release patterns *generically* (no fabricated release times); lists concrete
  fallbacks (alternate jurisdiction, VFS premium/Prime-Time where offered, waitlist); mission-specific timing
  is `needs_verification` + linked.
- **Grounding:** no invented slot-release schedules; processing/lead times stay grounded. **Its slot
  reminders are a distinct sub-surface that should feed G34.**

### G37 · Phase 7→8 · Travel-health insurance for the coverage gap — *(ref GAP-7C)* · **MUST**
- **Why:** `finance/HealthInsurance.tsx` covers *choosing* statutory vs private for the visa/enrolment, but
  no surface covers the **gap period** — typically a few weeks where the student is in Germany with no active
  German cover. The visa itself often requires incoming-travel insurance for entry. `campus/PreDeparture.tsx`
  lists "insurance" as a bare checklist item with no gap concept.
- **Data:** incoming-insurance providers (named generically, no fabricated prices); the existing insurance
  source; activation-date logic linking to enrolment. Deps: `HealthInsurance.tsx`, `sources.ts`.
- **Acceptance:** distinguishes **entry/travel insurance** from statutory student insurance; explains the
  activation gap and that public cover starts on enrolment (verify); no fabricated premiums; carries the disclaimer.
- **Grounding:** activation timing is `needs_verification`; no invented coverage amounts.

### G38 · Phase 7 · Forex / Sperrkonto monthly-withdrawal + first-weeks cash planner — *(ref GAP-7D)* · feeds **G34**
- **Why:** `PreDeparture.tsx` says "bring some euros" with no amount logic; `finance/Sperrkonto` explains the
  account but not the **withdrawal mechanics on arrival** (you can't draw the full balance; you get a fixed
  monthly amount). Students routinely arrive cash-short before their German account opens.
- **Data:** the grounded Sperrkonto monthly-release figure (€11,904/yr → monthly); CoL output. Deps:
  `costOfLiving.ts`, Sperrkonto facts.
- **Acceptance:** computes the monthly Sperrkonto release **deterministically** from the grounded annual
  amount; suggests a first-weeks cash buffer = release-delay × monthly CoL, clearly labelled an estimate;
  carries the disclaimer.
- **Grounding:** the annual blocked amount stays grounded; the buffer is an explicit heuristic.

### G39 · Phase 7→8 · SIM / eSIM first-connectivity guide — *(ref GAP-7E)*
- **Why:** `PreDeparture.tsx` and `arrival/ArrivalDay.tsx` list "Get SIM" as a bare checklist item. A SIM is
  needed for appointment SMS/2FA, banking, and apartment hunting *before* Anmeldung — so the ordering matters
  and isn't explained anywhere (some contracts need Anmeldung + SCHUFA, so start prepaid).
- **Data:** provider names (generic, no fabricated tariffs).
- **Acceptance:** explains prepaid-first ordering; no invented prices; links generic.
- **Grounding:** no fabricated tariffs.

### G40 · Phase 7 · Sponsor / proof-of-funds-beyond-Sperrkonto support — *(ref GAP-7F)*
- **Why:** `visa/Checklist.tsx` lists "proof of financial means" as one bare item and the app assumes
  Sperrkonto everywhere; students with a sponsor/scholarship have no path to assemble the alternative proof
  the mission accepts (Verpflichtungserklärung, scholarship award letter, parental sponsorship letter).
- **Data:** `studyFinance` source; existing finance disclaimers.
- **Acceptance:** lists accepted alternatives generically; flags that acceptance is mission-specific
  (`needs_verification`); disclaimer present.
- **Grounding:** no fabricated thresholds; alternatives' acceptance is mission-specific.

### G41 · Phase 8 · Health-insurance activation tracker — *(ref GAP-8A)* · **MUST**
- **Why:** the existing `finance/HealthInsurance.tsx` is a *pre-arrival selector*; `arrival/Enrolment.tsx`
  lists "proof of insurance" as a checklist item but nothing walks the **activation** sequence. Enrolment is
  *blocked* until the Krankenkasse confirmation exists — a core-flow gap, not polish.
- **Data:** `ChecklistItemDef` pattern (`seed/arrival.ts`); `krankenkassenZentrale`/`tk` sources. Deps:
  `HealthInsurance.tsx`, `Enrolment.tsx`.
- **Acceptance:** persisted checklist (choose fund → submit student membership → obtain confirmation for
  enrolment → receive card); states enrolment requires the confirmation; activation date `needs_verification`;
  links to the selector and Enrolment.
- **Grounding:** activation timing `needs_verification`; no invented premiums.

### G42 · Phase 8 · Liability insurance (Privathaftpflicht) guide — *(ref GAP-8B)*
- **Why:** `arrival/Rundfunkbeitrag.tsx` name-drops liability insurance in a checklist line but there is
  **no dedicated guidance**. It's one of the first things a settled student is told to get and the app barely
  mentions it. No `haftpflicht` source exists in `sources.ts` — so a source needs adding too.
- **Data:** new source entry; static explainer. Deps: `sources.ts`.
- **Acceptance:** explains coverage + norms; no fabricated premiums; carries disclaimer where cost is discussed.
- **Grounding:** add a cited source; no invented prices.

### G43 · Phase 8 · Anmeldung "no-appointment-available" fallback — *(ref GAP-8C)* · **MUST**
- **Why:** `visa/Anmeldung.tsx` and `arrival/AnmeldungRunbook.tsx` assume you can book an appointment. In
  Berlin/Munich/Hamburg slots vanish for months. Anmeldung gates the bank account, residence permit, and tax
  ID — so a student who can't get a slot is **blocked on everything downstream**. The highest-leverage
  contingency gap in Phase 8.
- **Data:** the existing `ANMELDUNG_WINDOW` fact; generic city strategies. Deps: `seed/visa.ts`, `AnmeldungRunbook.tsx`.
- **Acceptance:** section covering walk-in/Spontantermine hours, alternate districts, and documenting your
  attempts; keeps the 14-day window grounded; states enforcement is practice-dependent (`needs_verification`).
- **Grounding:** the registration window stays grounded; no fabricated city-specific wait times.

### G44 · Phase 8 · Fiktionsbescheinigung interim-certificate walkthrough — *(ref GAP-8D)*
- **Why:** `arrival/ResidencePermit.tsx` *warns* to "request a Fiktionsbescheinigung" but never explains
  how/when. Given months-long Ausländerbehörde waits, the entry visa frequently lapses first — this
  certificate is the only thing keeping the student in status, and it's under-explained.
- **Data:** `residencePermit`/`auslaenderbehoerde` sources. Deps: `ResidencePermit.tsx`, `Auslaenderbehoerde.tsx`.
- **Acceptance:** explains the trigger (visa expiring pre-permit), how to request it, what it permits
  (work/travel caveats `needs_verification`); disclaimer present.
- **Grounding:** legal effect of the certificate is `needs_verification`.

### G45 · Phase 8 · Finding a Hausarzt + how the health system works — *(ref GAP-8E)*
- **Why:** no page covers *using* the health system after you've *bought* insurance.
  `arrival/UniversityOnboarding.tsx` has no health entry. For a student needing ongoing meds, mental-health
  support, or a sick note (AU) for the university, this is a real blocker.
- **Data:** static guide; `krankenkassenZentrale` source; emergency numbers. Deps: G41.
- **Acceptance:** covers GP registration, the two phone numbers (116117 urgent vs 112 emergency), sick-note
  basics; emergency numbers correct/verifiable; disclaimer that it's not medical advice.
- **Grounding:** emergency numbers must be correct (116117 / 112); no fabricated wait times.

### G46 · Phase 8 · Emergency / support directory + buddy/community connect — *(ref GAP-8F)*
- **Why:** work-order §3 #50 explicitly calls for an "emergency/health/contacts directory + buddy/community
  connect" and **nothing in the cluster provides it**. Culture-shock and isolation are top reasons students struggle.
- **Data:** static directory; `studentenwerk` source; emergency numbers.
- **Acceptance:** lists 112/116117/110, generic international-office + counselling pointers, buddy-programme
  concept; no fabricated phone numbers; clearly "guidance, verify locally."
- **Grounding:** emergency numbers verifiable; institution-specific contacts are user-supplied.

### G47 · Phase 8 · Bank contingency + SCHUFA / no-credit-history explainer — *(ref GAP-8G)*
- **Why:** `arrival/BankAccount.tsx` is happy-path with no named-bank comparison and no SCHUFA concept.
  SCHUFA gates phone contracts and many rentals, so its absence surprises students (foreign students start
  with no German credit history).
- **Data:** `bankAccount` source; static explainer. Deps: `BankAccount.tsx`.
- **Acceptance:** explains SCHUFA + no-history reality; lists fallbacks (prepaid, deposit-based); no
  fabricated bank fees; disclaimer where relevant.
- **Grounding:** no invented fees; SCHUFA description generic.

### G48 · Phase 8 · Phone-contract (Handyvertrag) vs prepaid — *(ref GAP-8H)*
- **Why:** complements G39/G47; multiple arrival pages reference "mobile" but none explain the contract path
  or its prerequisites (Anmeldung + bank + often SCHUFA; cancellation/min-term traps).
- **Data:** provider names (generic). Deps: G39, G47.
- **Acceptance:** explains prerequisites + min-term/cancellation caveats; no fabricated tariffs.
- **Grounding:** none beyond avoiding fabricated prices.

### G49 · Phase 8 · Deutschland/Semesterticket coverage verifier + no-ticket fallback — *(ref GAP-8I)*
- **Why:** `campus/Deutschlandticket.tsx` grounds the €63/mo price but only says "check coverage" in prose —
  no per-university confirmation path, so students risk buying a ticket they already have, or assume coverage they don't.
- **Data:** grounded `DEUTSCHLANDTICKET_PRICE`; `semesterticket`/`studentenwerk` sources. Deps: `Deutschlandticket.tsx`.
- **Acceptance:** prompts the user to verify inclusion via their Studierendenwerk; states the price is
  `needs_verification`; handles the "no ticket offered" case.
- **Grounding:** ticket price stays grounded; inclusion is user-verified.

### G50 · Phase 9 · German job-search execution kit — *(ref GAP-9A)* · **MUST** · (includes events finder, ref GAP-9H)
- **Why:** `career/Outcomes.tsx` and `arrival/JobSeekerPermit.tsx` tell a student the 18-month window exists
  and which fields are in demand, but give **no tool to actually apply for work**. The Europass CV builder is
  admissions-oriented, not job-market-oriented (German employers expect a different CV + Anschreiben + often a
  photo). The biggest Phase-9 hole: the long-game depends on landing a qualified job and the app stops at
  "here's the permit."
- **Data:** existing profile/experience data; `jobMarket`/`jobSeekerPermit` sources; LLM for draft
  generation (validated schema, per existing SOP/LOR pattern). Deps: `experience.ts`, doc-gen pattern, LLM client.
- **Acceptance:** generates a German-market CV + Anschreiben draft from the profile via a **validated schema**
  (no free-form parse downstream); explains German application norms (no fabricated employer claims); links
  official portals (Bundesagentur für Arbeit, StepStone, XING/LinkedIn-DE); clearly labels AI drafts as
  starting points; no fabricated salary/hiring statistics. **Sub-item (ref GAP-9H):** a networking-events /
  career-fairs finder/tracker with reminders (no fabricated event listings) completes the execution band.
- **Grounding:** any market figures cited must be grounded or omitted; AI output validated.

### G51 · Phase 9 · Family-reunion income & housing — close the grounding hole — *(ref GAP-9B)* · **MUST**
- **Why:** **grounding defect + feature gap.** `arrival/FamilyReunion.tsx:14-17` states quantitative-ish
  expectations ("enough income/means", "A1 German for a spouse") as plain bullets with **no figure, no
  `needsVerification`, no cited number** — only the landing-page `SourceList`. Per CLAUDE.md §2/§3, any
  official requirement shown as guidance must carry a grounded figure or be flagged. A student planning family
  reunion gets no usable income/housing threshold.
- **Data:** `familyReunion`/`bamf` sources; household-size input; CoL output for a housing estimate. Deps:
  `costOfLiving.ts`, `seed/arrival.ts`.
- **Acceptance:** income/housing requirements are either grounded figures or `null + needs_verification`,
  never bare prose implying a number; optional deterministic helper estimates household income/housing need
  from family size (labelled an estimate, not the legal threshold); disclaimer present.
- **Grounding:** **grounding fix** — no implied official threshold without provenance.

### G52 · Phase 9 · Study→work / Blue-Card permit-switch deterministic timeline — *(ref GAP-9C)*
- **Why:** `BlueCardCheck.tsx` and `PrCitizenship.tsx` are excellent deterministic tools but they start
  *from* a qualified job. The **transition** — graduate → (job-seeker OR direct offer) → apply for work
  permit/Blue Card, with realistic ABH lead times — has no timeline tool, nor its effect on the PR start date.
- **Data:** grounded Blue-Card/PR constants in `facts.ts`; existing `lib/.../timeline` math. Deps:
  `PrCitizenship.tsx`, immigration timeline, `facts.ts`.
- **Acceptance:** computes the switch timeline **deterministically** from grounded constants (no model math);
  feeds the qualified-residence start into the existing PR/citizenship clock consistently; disclaimer present;
  thresholds `needs_verification`.
- **Grounding:** reuse grounded constants; ABH processing buffers labelled estimates.

### G53 · Phase 9 · Regulated-profession recognition (Approbation / Anerkennung) tracker — *(ref GAP-9D)*
- **Why:** `career/Outcomes.tsx` says some fields "require licensure" as prose only. The `approbation` source
  already exists in `sources.ts` but no page uses it. A medicine/nursing graduate has no in-app guide to the
  single most important gate on their career — practising legally. Blocks the medicine-aspirant persona end-to-end.
- **Data:** `approbation` source; `anabin`; static process + checklist. Deps: `sources.ts`, `Outcomes.tsx`.
- **Acceptance:** lists regulated professions, the recognition steps, Fachsprachprüfung concept; process
  timing `needs_verification`; disclaimer present.
- **Grounding:** recognition steps cite `approbation`/`anabin`; no fabricated timelines/fees.

### G54 · Phase 9 · Permit-loss / exmatrikulation risk explainer — *(ref GAP-9E)*
- **Why:** `arrival/Renewals.tsx` tracks the renewal/Rückmeldung *dates* but never explains the
  **consequences of missing them** (exmatrikuliert → permit at risk). No page covers the failure modes for a
  student whose studies go sideways — a real, high-stakes scenario.
- **Data:** `auslaenderbehoerde`/`residencePermit` sources; static explainer. Deps: `Renewals.tsx`.
- **Acceptance:** lists triggers (failing exams/exmatrikulation, dropping below progress thresholds, losing
  health insurance, missing Rückmeldung) + consequences + first recovery steps; states specifics are
  university/ABH-dependent (`needs_verification`); disclaimer present.
- **Grounding:** consequences are institution/ABH-specific → `needs_verification`.

### G55 · Phase 9 · Pension/social-security + payslip (Lohnabrechnung) explainer — *(ref GAP-9F)*
- **Why:** `arrival/TaxId.tsx` mentions tax class and Werkstudent rules as static cards but never shows how to
  *read a payslip* or what social contributions are. Phase-9 working students need this; it also underpins the
  pension-contribution requirement behind PR.
- **Data:** `daadSideJobs`; static explainer; existing `WORK_LIMIT_DAYS` fact. Deps: `TaxId.tsx`.
- **Acceptance:** annotated example payslip; Werkstudent exemption explained; no fabricated rates (or rates
  `needs_verification`); disclaimer present.
- **Grounding:** contribution rates `needs_verification` or omitted.

### G56 · Phase 9 · Tax-return (Steuererklärung) helper + deadline reminder — *(ref GAP-9G)*
- **Why:** `arrival/TaxId.tsx` mentions refunds exist but offers no deadline, no reminder, no how-to. This
  pairs naturally with the existing `DeadlineReminder` component.
- **Data:** `DeadlineReminder` pattern; static guide. Deps: `TaxId.tsx`, deadlines infra (G34).
- **Acceptance:** explains who should file + a `needs_verification` deadline + a reminder; no fabricated
  refund amounts; disclaimer present.
- **Grounding:** filing deadline `needs_verification`.

---

## 6. What is GOOD (do not re-flag)

- **APS country logic** is grounded and correct: Bangladesh = no APS office / not required; India/China/
  Vietnam/Mongolia/Pakistan handled (`country.ts`, `visa/Aps.tsx`).
- **Class-10 honest block** verified: `pathway.ts:363-380` returns `route:"blocked"`; `feasibility.ts:62-71`
  returns score 0 / band "blocked." No false hope.
- **Sperrkonto €11,904** is a single grounded constant with source + `needsVerification` (only weakness:
  per-fact `retrieved_at` is module-level — see G33).
- **Work-day 140/280 rule** grounded + computed deterministically (`workDays.ts`, tested).
- **Cost-of-living & funding-gap math** deterministic + unit-tested (`costOfLiving.ts`, `fundingGap.ts`, `journeyBudget.ts`).
- **Loan comparison** correctly refuses to invent interest rates (`Loans.tsx`).
- **Attestation & translation trackers** are functional per-document status tools.
- **Offers `.ics` export** works (the gap is only that more sources should feed it — G34).
- **Phase-7–9 immigration facts** correctly grounded with sources + `needsVerification` (Blue Card
  €50,700/€45,934.20, PR 21/27 mo, citizenship 5 yr, Rundfunk €18.36, Deutschlandticket €63, Semesterbeitrag,
  permit validity). The one exception is `FamilyReunion.tsx` — see G51.
