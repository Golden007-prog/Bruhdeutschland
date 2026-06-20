# Gap analysis — Journey Phases 7–9 (Visa & pre-departure · Arrival & settling · Ongoing)

> Scope: DeutschPrep React+Vite SPA, journey phases 7–9. **Find & document only — no code/DB changes.**
> Method: walked three personas (Master's applicant heading to visa+arrival; career-switcher; student
> already in Germany settling in) across every page in the `visa/`, `arrival/`, and `career/` clusters,
> plus the `seed/visa.ts`, `seed/arrival.ts`, `seed/immigration.ts`, `career/fields.ts`, `facts.ts`,
> and `sources.ts` data modules. A page that already covers a need is **not** a gap; only genuine
> "what does this student need next that the app lacks" items are listed.
>
> **Headline:** the happy path is mature and (mostly) well-grounded — checklists persist, the visa
> simulator and Blue-Card/PR tools are deterministic and grounded. The gaps cluster in four bands:
> **(A) contingency / failure paths** (rejection, no-appointment, missed-deadline, exmatrikulation);
> **(B) practical settling logistics** (forex, SIM, doctor, insurance activation, Haftpflicht);
> **(C) the German job-search / career-execution layer** (Phase 9 is explained but not *actionable*);
> **(D) a handful of grounding holes** (quantitative claims rendered as bare prose without
> `needsVerification` / a cited figure).
>
> Priorities: **must** = a real student is blocked or misled without it; **should** = materially
> incomplete journey; **could** = nice-to-have / polish. Effort: S (≤1 page, existing patterns),
> M (new page + seed/calc), L (new deterministic module + grounded facts + multiple surfaces).

---

## Phase 7 — Visa & pre-departure

### GAP-7A · Visa rejection / refusal & appeal pathway · **must · M**
- **Phase:** 7 (Visa)
- **Feature:** A "what if my visa is refused" guide + structured next-steps (remonstration/appeal window,
  common refusal reasons, document-resubmission checklist, re-apply timing).
- **Why needed:** Every visa surface in the app is happy-path only. `visa/Overview.tsx`,
  `visa/Checklist.tsx`, `visa/Appointment.tsx` (verified) walk submission → decision but stop dead at a
  refusal. A refused applicant — a very real outcome, especially for first-time non-EU students — has
  zero in-app guidance and is at maximum stress. This is the single biggest contingency hole in Phase 7.
- **Data used:** refusal-reason taxonomy; mission remonstration deadlines (grounded, mission-specific);
  links to the issuing mission; the existing `VISA_DOCS` checklist for resubmission.
- **Dependencies:** `seed/visa.ts`, `sources.ts` (`autoVisa`, `autoVisaFaq`).
- **Acceptance criteria:**
  - Lists the most common refusal grounds (insufficient funds, doubt about intent, document gaps) as
    *general guidance*, not mission-specific promises.
  - States the remonstration/appeal concept and that the **deadline + procedure are mission-specific**,
    rendered with `needsVerification` and a link to the issuing mission — never a hard number.
  - Provides a resubmission checklist that reuses `VISA_DOCS`.
  - Carries the visa/finance **disclaimer**.
- **Grounding needs:** remonstration deadline is official + mission-specific → must be `needsVerification`,
  never asserted. No fabricated appeal windows.

### GAP-7B · Embassy/VFS appointment-slot strategy & no-slot fallback · **should · M**
- **Phase:** 7 (Visa)
- **Feature:** Practical slot-acquisition playbook: how slot release works per mission/VFS, refresh
  cadence, what to do when **no slots are available for months** (waitlist, alternate consulate, emergency
  appointment criteria), plus a mission-portal link.
- **Why needed:** `visa/Appointment.tsx` (verified) tracks a *booked* slot with `DeadlineReminder` but
  assumes you already have one. The #1 real bottleneck for Indian/Bangladeshi students is **getting** the
  slot. The app says appointment waits "run months" but offers no strategy when they do.
- **Data used:** mission/VFS portal links; lead-time facts (already grounded via `VISA_PROCESSING`).
- **Dependencies:** GAP-7C (visa-type → mission); `seed/visa.ts`.
- **Acceptance criteria:**
  - Explains slot-release patterns *generically* (no fabricated release times).
  - Lists concrete fallbacks: alternate jurisdiction, VFS premium/Prime-Time where offered, waitlist.
  - Mission-specific timing is `needsVerification` + linked, never asserted.
- **Grounding needs:** no invented slot-release schedules; processing/lead times stay grounded.

### GAP-7C · Travel-health insurance for the coverage gap (entry → public-insurance activation) · **must · M**
- **Phase:** 7→8 (Pre-departure/Arrival)
- **Feature:** Guidance + tracker for **incoming/travel health insurance** covering the window between
  landing and German statutory insurance activating after enrolment + Anmeldung.
- **Why needed:** `finance/HealthInsurance.tsx` covers *choosing* statutory vs private **for the visa/
  enrolment**, but no surface covers the **gap period** — typically a few weeks where the student is in
  Germany with no active German cover. The visa itself often requires incoming-travel insurance for entry.
  `campus/PreDeparture.tsx` (verified) lists "insurance" as a bare checklist item with no gap concept.
  This is a genuine money/health-risk hole.
- **Data used:** incoming-insurance providers (named generically, no fabricated prices); the existing
  insurance source; activation-date logic linking to enrolment.
- **Dependencies:** `finance/HealthInsurance.tsx`; `sources.ts` (`krankenkassenZentrale`).
- **Acceptance criteria:**
  - Distinguishes **entry/travel insurance** from statutory student insurance.
  - Explains the activation gap and that public cover starts on enrolment (verify).
  - No fabricated premiums; provider names without invented figures.
  - Carries the **disclaimer**.
- **Grounding needs:** activation timing is `needsVerification`; no invented coverage amounts.

### GAP-7D · Forex / blocked-account withdrawal & travel-cash planner · **should · S**
- **Phase:** 7 (Pre-departure)
- **Feature:** A small deterministic helper: monthly Sperrkonto withdrawal limit vs. cost-of-living,
  how much cash/forex card to carry for the first weeks, ATM/transfer cost awareness.
- **Why needed:** `PreDeparture.tsx` says "bring some euros" with no amount logic; `finance/Sperrkonto`
  explains the account but not the **withdrawal mechanics on arrival** (you can't draw the full balance;
  you get a fixed monthly amount). Students routinely arrive cash-short before their German account opens.
- **Data used:** the grounded Sperrkonto monthly-release figure (€11,904/yr → monthly); CoL output.
- **Dependencies:** `lib/calc/costOfLiving.ts`, existing Sperrkonto facts.
- **Acceptance criteria:**
  - Computes the monthly Sperrkonto release **deterministically** (no model math) from the grounded annual
    amount.
  - Suggests a first-weeks cash buffer = release-delay × monthly CoL, clearly labelled an estimate.
  - Carries the **disclaimer**.
- **Grounding needs:** the annual blocked amount stays grounded; the buffer is an explicit heuristic.

### GAP-7E · SIM / eSIM & first-connectivity guide · **should · S**
- **Phase:** 7→8 (Pre-departure/Arrival)
- **Feature:** Comparison of getting connectivity on arrival: prepaid SIM vs eSIM vs roaming, and the
  **chicken-and-egg** problem (some contracts need Anmeldung + SCHUFA, so start prepaid).
- **Why needed:** `PreDeparture.tsx` and `arrival/ArrivalDay.tsx` (verified) list "Get SIM" as a bare
  checklist item. A SIM is needed for appointment SMS/2FA, banking, and apartment hunting *before*
  Anmeldung — so the ordering matters and isn't explained anywhere.
- **Data used:** provider names (generic, no fabricated tariffs).
- **Dependencies:** none.
- **Acceptance criteria:** explains prepaid-first ordering; no invented prices; links generic.
- **Grounding needs:** no fabricated tariffs.

### GAP-7F · Financial-sponsor / proof-of-funds-beyond-Sperrkonto support · **could · S**
- **Phase:** 7 (Visa)
- **Feature:** Guidance + template pointers for alternative/supplementary proof of funds: sponsor
  (Verpflichtungserklärung) declaration, scholarship award letter, parental sponsorship letter — for
  students not using a full Sperrkonto.
- **Why needed:** `visa/Checklist.tsx` lists "proof of financial means" as one bare item and the app
  assumes Sperrkonto everywhere; students with a sponsor/scholarship have no path to assemble the
  alternative proof the mission accepts.
- **Data used:** `studyFinance` source; existing finance disclaimers.
- **Dependencies:** `finance/` cluster.
- **Acceptance criteria:** lists accepted alternatives generically; flags that acceptance is
  mission-specific (`needsVerification`); disclaimer present.
- **Grounding needs:** no fabricated thresholds; alternatives' acceptance is mission-specific.

---

## Phase 8 — Arrival & settling

### GAP-8A · Health-insurance **activation** tracker (post-arrival) · **must · S**
- **Phase:** 8 (Arrival)
- **Feature:** A short tracker for *activating* German statutory cover after arrival: enrol with a
  Krankenkasse, get the membership/insurance confirmation the university needs for Immatrikulation,
  receive the insurance card, and the date cover starts.
- **Why needed:** the existing `finance/HealthInsurance.tsx` is a *pre-arrival selector*;
  `arrival/Enrolment.tsx` (verified) lists "proof of insurance" as a checklist item but nothing walks the
  **activation** sequence. Enrolment is *blocked* until the Krankenkasse confirmation exists, so this is a
  core-flow gap, not polish.
- **Data used:** `ChecklistItemDef` pattern (as in `seed/arrival.ts`); `krankenkassenZentrale`/`tk` sources.
- **Dependencies:** `finance/HealthInsurance.tsx`, `arrival/Enrolment.tsx`.
- **Acceptance criteria:**
  - Persisted checklist: choose fund → submit student membership → obtain confirmation for enrolment →
    receive card.
  - States that enrolment requires the confirmation; activation date `needsVerification`.
  - Links to the existing selector and to Enrolment.
- **Grounding needs:** activation timing `needsVerification`; no invented premiums.

### GAP-8B · Liability insurance (Privathaftpflicht) guide · **should · S**
- **Phase:** 8 (Arrival)
- **Feature:** A short explainer: what Haftpflicht covers, why landlords/WGs effectively expect it, and
  that it's cheap and near-universal in Germany.
- **Why needed:** `arrival/Rundfunkbeitrag.tsx` (verified, the "utilities" page) name-drops liability
  insurance in a checklist line but there is **no dedicated guidance**. It's one of the first things a
  settled student is told to get and the app barely mentions it. No `haftpflicht` source exists in
  `sources.ts` (verified) — so a source needs adding too.
- **Data used:** new source entry; static explainer.
- **Dependencies:** `sources.ts` (add a Haftpflicht source).
- **Acceptance criteria:** explains coverage + norms; no fabricated premiums; carries disclaimer where
  cost is discussed.
- **Grounding needs:** add a cited source; no invented prices.

### GAP-8C · Anmeldung "no-appointment-available" fallback · **must · S**
- **Phase:** 8 (Arrival)
- **Feature:** Add a fallback section to the Anmeldung flow: what to do when Bürgeramt slots are booked
  out for weeks/months — walk-in/Spontantermine hours, neighbouring districts, the 14-day-window reality
  vs. practice, and proof that you *tried* to register on time.
- **Why needed:** `visa/Anmeldung.tsx` and `arrival/AnmeldungRunbook.tsx` (verified) assume you can book
  an appointment. In Berlin/Munich/Hamburg slots vanish for months. Anmeldung gates the bank account,
  residence permit, and tax ID — so a student who can't get a slot is **blocked on everything
  downstream**. This is the highest-leverage contingency gap in Phase 8.
- **Data used:** the existing `ANMELDUNG_WINDOW` fact; generic city strategies.
- **Dependencies:** `seed/visa.ts`, `arrival/AnmeldungRunbook.tsx`.
- **Acceptance criteria:**
  - Section covering walk-in hours, alternate districts, and documenting your attempts.
  - Keeps the 14-day window grounded; states enforcement is practice-dependent (`needsVerification`).
- **Grounding needs:** the registration window stays grounded; no fabricated city-specific wait times.

### GAP-8D · Fiktionsbescheinigung (interim residence certificate) walkthrough · **should · S**
- **Phase:** 8 (Arrival)
- **Feature:** A focused explainer/step list: when the entry visa expires before the Ausländerbehörde
  issues the residence permit, how to request a Fiktionsbescheinigung so you stay legal in the interim.
- **Why needed:** `arrival/ResidencePermit.tsx` (verified) *warns* to "request a Fiktionsbescheinigung"
  but never explains how/when. Given months-long ABH waits, the entry visa frequently lapses first — this
  certificate is the only thing keeping the student in status, and it's under-explained.
- **Data used:** `residencePermit`/`auslaenderbehoerde` sources.
- **Dependencies:** `arrival/ResidencePermit.tsx`, `arrival/Auslaenderbehoerde.tsx`.
- **Acceptance criteria:** explains the trigger (visa expiring pre-permit), how to request it, what it
  permits (work/travel caveats `needsVerification`); disclaimer present.
- **Grounding needs:** legal effect of the certificate is `needsVerification`.

### GAP-8E · Finding a doctor (Hausarzt) & how the medical system works · **should · M**
- **Phase:** 8 (Arrival)
- **Feature:** Practical health-system orientation: register with a Hausarzt, how Termine/referrals work,
  what your insurance card does, urgent vs emergency (116117 vs 112), pharmacy basics.
- **Why needed:** no page in the cluster covers using the health system after you've *bought* insurance.
  `arrival/UniversityOnboarding.tsx` (verified) has no health entry. For a student needing ongoing meds,
  mental-health support, or a sick note (AU) for the university, this is a real blocker.
- **Data used:** static guide; `krankenkassenZentrale` source; emergency numbers (verifiable).
- **Dependencies:** GAP-8A (insurance activation).
- **Acceptance criteria:** covers GP registration, the two phone numbers, sick-note basics; emergency
  numbers are correct/verifiable; disclaimer that it's not medical advice.
- **Grounding needs:** emergency numbers must be correct (116117 / 112); no fabricated wait times.

### GAP-8F · Emergency / support directory + buddy/community connect · **should · S**
- **Phase:** 8 (Arrival)
- **Feature:** A single directory: emergency numbers, university international office + counselling,
  Studierendenwerk psychosocial services, buddy-programme / community sign-up pointers.
- **Why needed:** the work-order §3 #50 explicitly calls for an "emergency/health/contacts directory +
  buddy/community connect" and **nothing in the cluster provides it** (verified across all arrival pages).
  Culture-shock and isolation are top reasons students struggle; the app currently offers no safety net.
- **Data used:** static directory; `studentenwerk` source; emergency numbers.
- **Dependencies:** none.
- **Acceptance criteria:** lists 112/116117/110, generic international-office + counselling pointers,
  buddy-programme concept; no fabricated phone numbers; clearly "guidance, verify locally."
- **Grounding needs:** emergency numbers verifiable; institution-specific contacts are user-supplied.

### GAP-8G · Bank-account contingency (Sperrkonto-transfer rejection / SCHUFA) · **should · S**
- **Phase:** 8 (Arrival)
- **Feature:** Add a contingency + SCHUFA explainer to the bank-account flow: what to do if a bank won't
  accept the Sperrkonto transfer or rejects the account, why SCHUFA exists, and that foreign students
  start with no German credit history (and what that affects: phone contracts, rentals).
- **Why needed:** `arrival/BankAccount.tsx` (verified) is happy-path with no named-bank comparison and no
  SCHUFA concept. SCHUFA gates phone contracts and many rentals, so its absence surprises students.
- **Data used:** `bankAccount` source; static explainer.
- **Dependencies:** `arrival/BankAccount.tsx`.
- **Acceptance criteria:** explains SCHUFA + no-history reality; lists fallbacks (prepaid, deposit-based);
  no fabricated bank fees; disclaimer where relevant.
- **Grounding needs:** no invented fees; SCHUFA description generic.

### GAP-8H · Phone-contract (Handyvertrag) vs prepaid guide · **could · S**
- **Phase:** 8 (Arrival)
- **Feature:** Short guide on moving from prepaid to a contract: needs Anmeldung + bank + (often) SCHUFA;
  the cancellation/min-term traps.
- **Why needed:** complements GAP-7E/8G; multiple arrival pages reference "mobile" but none explain the
  contract path or its prerequisites.
- **Dependencies:** GAP-7E, GAP-8G.
- **Acceptance criteria:** explains prerequisites + min-term/cancellation caveats; no fabricated tariffs.
- **Grounding needs:** none beyond avoiding fabricated prices.

### GAP-8I · Deutschlandticket / Semesterticket coverage verifier & no-ticket fallback · **could · S**
- **Phase:** 8 (Arrival/Campus)
- **Feature:** Let the student confirm whether their university's Semesterbeitrag already includes a
  semester/Deutschland ticket (so they don't double-pay), with a fallback if their uni offers none.
- **Why needed:** `campus/Deutschlandticket.tsx` (verified) grounds the €63/mo price but only says "check
  coverage" in prose — no per-university confirmation path, so students risk buying a ticket they already
  have, or assume coverage they don't.
- **Data used:** grounded `DEUTSCHLANDTICKET_PRICE`; `semesterticket`/`studentenwerk` sources.
- **Dependencies:** `campus/Deutschlandticket.tsx`.
- **Acceptance criteria:** prompts the user to verify inclusion via their Studierendenwerk; states the
  price is `needsVerification`; handles the "no ticket offered" case.
- **Grounding needs:** ticket price stays grounded; inclusion is user-verified.

---

## Phase 9 — Ongoing

### GAP-9A · German job-search execution kit (Anschreiben + market-CV + portals) · **must · L**
- **Phase:** 9 (Ongoing)
- **Feature:** The actionable job-search layer: a German-market CV/Anschreiben (cover letter) helper, an
  explainer of German application norms, and pointers to the right portals (Bundesagentur für Arbeit,
  StepStone, XING/LinkedIn-DE) — turning the *explanatory* career pages into *doing*.
- **Why needed:** `career/Outcomes.tsx` and `arrival/JobSeekerPermit.tsx` (verified) tell a student the
  18-month window exists and which fields are in demand, but give **no tool to actually apply for work**.
  The Europass CV builder is admissions-oriented, not job-market-oriented (German employers expect a
  different CV + Anschreiben + often a photo). This is the biggest Phase-9 hole: the long-game depends on
  landing a qualified job and the app stops at "here's the permit."
- **Data used:** existing profile/experience data; `jobMarket`/`jobSeekerPermit` sources; LLM for draft
  generation (validated schema, per existing SOP/LOR pattern).
- **Dependencies:** `lib/profile/experience.ts`, document-generation pattern, LLM client.
- **Acceptance criteria:**
  - Generates a German-market CV + Anschreiben draft from the profile via a **validated schema**
    (reuse the existing structured-output pattern; no free-form parse downstream).
  - Explains German application norms (no fabricated employer claims).
  - Links the official portals; clearly labels AI drafts as starting points.
  - No fabricated salary or hiring statistics.
- **Grounding needs:** any market figures cited must be grounded or omitted; AI output validated.

### GAP-9B · Family-reunion income & housing requirement — close the grounding hole · **must · M**
- **Phase:** 9 (Ongoing)
- **Feature:** Replace `FamilyReunion.tsx`'s bare-prose "enough income / adequate housing / A1 German"
  claims with grounded, `needsVerification`-flagged figures (or explicit `null` + verify), and add a small
  deterministic household-income/housing-size helper.
- **Why needed:** **grounding defect + feature gap.** `arrival/FamilyReunion.tsx:14-17` (verified) states
  quantitative-ish expectations ("enough income/means", "A1 German for a spouse") as plain bullets with
  **no figure, no `needsVerification`, no cited number** — only the landing-page `SourceList` at the
  bottom. Per CLAUDE.md §2/§3, any official requirement shown as guidance must either carry a grounded
  figure or be flagged. A student planning family reunion gets no usable income/housing threshold.
- **Data used:** `familyReunion`/`bamf` sources; household-size input; CoL output for a housing estimate.
- **Dependencies:** `lib/calc/costOfLiving.ts`; `seed/arrival.ts`.
- **Acceptance criteria:**
  - Income/housing requirements are either grounded figures or `null + needsVerification`, never bare
    prose implying a number.
  - Optional deterministic helper estimates household income/housing need from family size (labelled an
    estimate, not the legal threshold).
  - Disclaimer present.
- **Grounding needs:** **P-equivalent grounding fix** — no implied official threshold without provenance.

### GAP-9C · Study→work permit-switch deterministic timeline (beyond the 18-month job-seeker) · **should · M**
- **Phase:** 9 (Ongoing)
- **Feature:** A deterministic timeline tool for converting student status → work permit / Blue Card:
  when you can switch, ABH processing buffers, and how it chains into the existing PR/citizenship clock.
- **Why needed:** `BlueCardCheck.tsx` and `PrCitizenship.tsx` (verified) are excellent deterministic tools
  but they start *from* a qualified job. The **transition** — graduate → (job-seeker OR direct offer) →
  apply for work permit/Blue Card, with realistic ABH lead times — has no timeline tool. The job-seeker
  page covers the 18-month window but not the switch mechanics or its effect on the PR start date.
- **Data used:** grounded Blue-Card/PR constants in `facts.ts`; existing `lib/.../timeline` math.
- **Dependencies:** `arrival/PrCitizenship.tsx`, `lib/calc` immigration timeline, `facts.ts`.
- **Acceptance criteria:**
  - Computes the switch timeline **deterministically** from grounded constants (no model math).
  - Feeds the qualified-residence start into the existing PR/citizenship clock consistently.
  - Disclaimer present; thresholds `needsVerification`.
- **Grounding needs:** reuse grounded constants; ABH processing buffers labelled estimates.

### GAP-9D · Regulated-profession recognition (Approbation / Anerkennung) tracker · **should · M**
- **Phase:** 9 (and 0 for medicine aspirants)
- **Feature:** A path + tracker for regulated professions (medicine, nursing, pharmacy, teaching, law):
  the recognition/Approbation process, Fachsprachprüfung, and that you **cannot practise** without it.
- **Why needed:** `career/Outcomes.tsx` (verified) says some fields "require licensure" as prose only.
  The `approbation` source already exists in `sources.ts` (verified) but no page uses it. A medicine/
  nursing graduate has no in-app guide to the single most important gate on their career — practising
  legally. This blocks the medicine-aspirant persona end-to-end.
- **Data used:** `approbation` source; `anabin`; static process + checklist.
- **Dependencies:** `sources.ts` (`approbation`), `career/Outcomes.tsx`.
- **Acceptance criteria:** lists regulated professions, the recognition steps, Fachsprachprüfung concept;
  process timing `needsVerification`; disclaimer present.
- **Grounding needs:** recognition steps cite `approbation`/`anabin`; no fabricated timelines/fees.

### GAP-9E · Permit-loss / exmatrikulation risk explainer · **should · S**
- **Phase:** 9 (Ongoing)
- **Feature:** A plain-language risk page: what triggers loss of student status (failing
  exams/exmatrikulation, dropping below progress thresholds, losing health insurance, missing Rückmeldung)
  and the residence-permit consequences + recovery options.
- **Why needed:** `arrival/Renewals.tsx` (verified) tracks the renewal/Rückmeldung *dates* but never
  explains the **consequences of missing them** (exmatrikuliert → permit at risk). No page covers the
  failure modes for a student whose studies go sideways — a real, high-stakes scenario.
- **Data used:** `auslaenderbehoerde`/`residencePermit` sources; static explainer.
- **Dependencies:** `arrival/Renewals.tsx`.
- **Acceptance criteria:** lists triggers + consequences + first recovery steps; states specifics are
  university/ABH-dependent (`needsVerification`); disclaimer present.
- **Grounding needs:** consequences are institution/ABH-specific → `needsVerification`.

### GAP-9F · Pension / social-security (Rentenversicherung) & payslip explainer · **could · S**
- **Phase:** 9 (Ongoing)
- **Feature:** Explain the deductions on a German payslip (Lohnabrechnung): tax, Rentenversicherung,
  health, unemployment, and the Werkstudent exemptions — so the first payslip isn't a shock.
- **Why needed:** `arrival/TaxId.tsx` (verified) mentions tax class and Werkstudent rules as static cards
  but never shows how to *read a payslip* or what social contributions are. Phase-9 working students need
  this; it also underpins the pension-contribution requirement behind PR.
- **Data used:** `daadSideJobs`; static explainer; existing `WORK_LIMIT_DAYS` fact.
- **Dependencies:** `arrival/TaxId.tsx`.
- **Acceptance criteria:** annotated example payslip; Werkstudent exemption explained; no fabricated rates
  (or rates `needsVerification`); disclaimer present.
- **Grounding needs:** contribution rates `needsVerification` or omitted.

### GAP-9G · Tax return (Steuererklärung) helper & deadline · **could · S**
- **Phase:** 9 (Ongoing)
- **Feature:** A short guide + deadline reminder for the annual income-tax return: who should file,
  why students often get a refund, the filing deadline, and ELSTER/help pointers.
- **Why needed:** `arrival/TaxId.tsx` (verified) mentions refunds exist but offers no deadline, no
  reminder, no how-to. This pairs naturally with the existing `DeadlineReminder` component.
- **Data used:** `DeadlineReminder` pattern; static guide.
- **Dependencies:** `arrival/TaxId.tsx`, deadlines infra.
- **Acceptance criteria:** explains who should file + a `needsVerification` deadline + a reminder; no
  fabricated refund amounts; disclaimer present.
- **Grounding needs:** filing deadline `needsVerification`.

### GAP-9H · Networking-events / career-fairs finder · **could · M**
- **Phase:** 9 (Ongoing)
- **Feature:** A finder/tracker for career fairs, alumni meetups, and networking events (university +
  industry), feeding the job-search kit.
- **Why needed:** `campus/Networking.tsx` exists but `JobSeekerPermit.tsx` links to it without any
  events surface; there's no way to discover or track actual events. Lower priority than the execution kit
  (GAP-9A) but completes the career-execution band.
- **Data used:** user-entered events; existing networking content.
- **Dependencies:** GAP-9A.
- **Acceptance criteria:** lets a user add/track events with reminders; no fabricated event listings.
- **Grounding needs:** no fabricated event data.

---

## Register (count: 22 — Phase 7: 6 · Phase 8: 9 · Phase 9: 8; one item GAP-7C spans 7→8)

| id | priority | effort | one-line |
|----|----------|--------|----------|
| GAP-7A | must | M | Visa refusal/appeal pathway — every visa page is happy-path only. |
| GAP-7B | should | M | Embassy/VFS slot-acquisition strategy + no-slot fallback. |
| GAP-7C | must | M | Travel-health insurance for the entry→public-insurance coverage gap. |
| GAP-7D | should | S | Forex / Sperrkonto monthly-withdrawal + first-weeks cash planner. |
| GAP-7E | should | S | SIM/eSIM first-connectivity guide (prepaid-first ordering). |
| GAP-7F | could | S | Sponsor / proof-of-funds-beyond-Sperrkonto support. |
| GAP-8A | must | S | Health-insurance **activation** tracker (gates enrolment). |
| GAP-8B | should | S | Liability insurance (Haftpflicht) guide (+ add source). |
| GAP-8C | must | S | Anmeldung "no-appointment-available" fallback (blocks all downstream). |
| GAP-8D | should | S | Fiktionsbescheinigung interim-certificate walkthrough. |
| GAP-8E | should | M | Finding a Hausarzt + how the health system works (116117/112). |
| GAP-8F | should | S | Emergency/support directory + buddy/community connect (§3 #50, absent). |
| GAP-8G | should | S | Bank contingency + SCHUFA / no-credit-history explainer. |
| GAP-8H | could | S | Phone-contract (Handyvertrag) vs prepaid + prerequisites. |
| GAP-8I | could | S | Deutschland/Semesterticket coverage verifier + no-ticket fallback. |
| GAP-9A | must | L | German job-search kit: market-CV + Anschreiben + portals (validated AI). |
| GAP-9B | must | M | Family-reunion income/housing — close grounding hole + helper. |
| GAP-9C | should | M | Study→work/Blue-Card permit-switch deterministic timeline. |
| GAP-9D | should | M | Regulated-profession recognition (Approbation) tracker (source unused). |
| GAP-9E | should | S | Permit-loss / exmatrikulation risk explainer. |
| GAP-9F | could | S | Pension/social-security + payslip (Lohnabrechnung) explainer. |
| GAP-9G | could | S | Tax-return (Steuererklärung) helper + deadline reminder. |
| GAP-9H | could | M | Networking-events / career-fairs finder. |

**Must: 6 · Should: 10 · Could: 6.**

### Cross-cutting observations
- **Failure paths are the systemic blind spot.** The cluster is meticulous on the happy path but has no
  story for refusal/no-slot/missed-deadline/exmatrikulation (GAP-7A, 7B, 8C, 9E). For a non-EU student
  these are common, high-stress outcomes.
- **One genuine grounding defect found:** `FamilyReunion.tsx:14-17` asserts income/housing/A1
  expectations as bare prose without a figure or `needsVerification` (GAP-9B). All other Phase-7–9 facts
  audited (Blue Card €50,700/€45,934.20, PR 21/27 mo, citizenship 5 yr, Rundfunk €18.36, Deutschlandticket
  €63, Semesterbeitrag, permit validity) are correctly grounded with sources + `needsVerification`.
- **Two existing sources are unused** and signal intended-but-unbuilt features: `approbation` (GAP-9D)
  and `jobMarket` (supports GAP-9A). `sources.ts` has no `haftpflicht`/`schufa` entry (GAP-8B, 8G).
- **Phase 9 is explained, not actionable.** The immigration ladder, Blue-Card check, and PR/citizenship
  tools are strong, but the career-execution layer that the whole long-game depends on (apply for and land
  a qualified job — GAP-9A) is missing.
