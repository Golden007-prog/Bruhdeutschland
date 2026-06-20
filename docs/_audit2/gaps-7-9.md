# Gap analysis — Phases 7–9 (Visa & pre-departure · Arrival & settling · Ongoing)

> Fresh, independent audit pass. **Find & document only.** Scope: the visa→arrival→settled tail of the
> journey for three personas — a Master's applicant heading into visa+arrival, a career-switcher, and a
> student already settling in Germany. Frontend is a React+Vite SPA (`frontend/src`); routes live in
> `frontend/src/lib/nav.tsx`. Supabase + localStorage persistence.
>
> Judgment standard: a **genuine gap** is a *missing surface* OR a *real partial/failure-path boundary*
> on a shipped page (visa refusal/appeal, no-appointment fallback, entry-insurance gap, Approbation,
> German job-search, permit-loss). Existence ≠ depth.

## What is already shipped and genuinely good (so we don't re-spec it)

The phase 7–9 surface is **broad and, for the happy path, deep**. Credit where due, to keep this register
honest:

- **Grounding is disciplined.** Every official figure routes through `frontend/src/lib/facts.ts` /
  `frontend/src/lib/seed/arrival.ts` as an `OfficialFact` with `source`, `needsVerification`, a `note`, and
  a `FACTS_RETRIEVED_AT` stamp. 2026 values are current and honestly caveated: Blue Card €50,700 / €45,934.20
  (`facts.ts:40-41,170-176`), citizenship **5 years** with the 3-yr fast-track repeal dated 30 Oct 2025
  (`facts.ts:44,186-192`), Rundfunkbeitrag €18.36/household (`seed/arrival.ts:84-90`), Sperrkonto €11,904
  (`facts.ts:28`). **I found no fabricated official fact in phases 7–9.**
- **Deterministic math stays in code.** Blue Card check (`lib/immigration/blueCard`), PR/citizenship
  timeline (`lib/immigration/timeline`) — pages call them, don't restate numbers.
- **Failure boundaries ARE handled in a few standout places:** Fiktionsbescheinigung if the permit
  appointment lands after D-visa expiry (`pages/arrival/ResidencePermit.tsx:36-42`); irreversible
  statutory-insurance opt-out warning (`pages/finance/HealthInsurance.tsx:132-140`); exmatrikulation /
  out-of-status warnings on `pages/arrival/Renewals.tsx` and `UniversityOnboarding.tsx`; rental-scam red
  alert (`pages/visa/Accommodation.tsx:25-38`); no-slot walk-in fallback (`AnmeldungRunbook.tsx:17`).
- **Interactive trackers exist** with persistence: visa appointment + docs-ready (`visa/Appointment.tsx`),
  Ausländerbehörde appointment (`arrival/Auslaenderbehoerde.tsx:41-45`), permit-renewal + Rückmeldung
  (`arrival/Renewals.tsx`), PR/citizenship tracker (`arrival/PrCitizenship.tsx`, syncedState).

The gaps below are therefore mostly **failure-path boundaries** and a few **missing surfaces** at the
edges — not "the feature doesn't exist."

---

## Register — full specs

Priority: **must** (a real persona is blocked / misled without it) · **should** · **could**.
Effort: **S** (≤0.5d, mostly seed + copy) · **M** (1–2d, new page or stateful tracker) · **L** (3d+).

---

### G7-01 · Visa refusal & remonstration (appeal) path — MUST
- **Phase:** 7 (Visa)
- **Feature:** What to do if the student visa is **refused** — read the refusal reasons, the one-month
  **Remonstration** (formal objection / *Remonstrationsverfahren*) window at the mission, when to re-apply
  vs. appeal, and how a refusal interacts with the intake deadline (deferral).
- **Why a student needs it:** Refusals are common (insufficient funds, doubts about intent/return, document
  gaps). The entire visa cluster assumes approval. A refused student today hits a dead end with no next step
  — the single most damaging boundary in phase 7.
- **Refines route:** NEW page under `/visa/` (e.g. `/visa/refusal`); link from `visa/Checklist.tsx`,
  `visa/Appointment.tsx`, `visa/Simulator.tsx`.
- **Data:** seed of refusal reason-codes → remedy; the remonstration deadline (flag `needsVerification`,
  mission-specific); deferral cross-link to intake/timeline planner.
- **Grounding:** Remonstration window and procedure are mission-specific — must be `needsVerification` with
  a source link to the relevant German mission / Auswärtiges Amt. **Do not state a fixed appeal deadline as
  fact.**
- **Acceptance:** A refused-visa persona reaches a page that names remonstration, gives the (flagged) window,
  and offers a concrete decision (object / re-apply / defer) with official source links.
- **Deps:** none. **Effort:** M.
- **Evidence of gap:** repo-wide grep for `refus|appeal|Remonstration|Widerspruch|Ablehnung` across
  `pages/` returns **zero** visa-refusal coverage; the only hits are unrelated (`Videx.tsx:13` "mismatches
  cause rejections", scholarship/translation status).

### G7-02 · No-appointment-available fallback at the mission — MUST
- **Phase:** 7 (Visa)
- **Feature:** A real fallback when the mission has **no visa-appointment slots for months** (or none
  released): waitlist/auto-refresh tactics, VFS vs. direct-mission routes, third-country application,
  appointment-via-email escalation, and proof-of-attempt to protect the intake.
- **Why:** `visa/Appointment.tsx` correctly frames the appointment wait as *the* bottleneck and says
  "book early / check often" — but offers **no path when there is nothing to book.** This blocks the
  applicant persona hard and is a known reality at high-volume missions.
- **Refines route:** `/visa/appointment` (`pages/visa/Appointment.tsx`).
- **Data:** seed of fallback tactics + escalation channels; cross-link to deferral/reverse-timeline planner.
- **Grounding:** tactics are practical, not official — keep as guidance with mission source links; do not
  invent SLAs.
- **Acceptance:** From the appointment tracker, a stuck applicant finds at least three concrete fallback
  actions and a "what if I can't get a slot before my intake" deferral branch.
- **Deps:** ideally G7-01 (deferral). **Effort:** S.
- **Evidence:** `pages/visa/Appointment.tsx:12-18,52-58` — steps assume a slot exists; the only failure copy
  is "waits can run months."

### G7-03 · Travel / incoming health insurance for the entry gap — MUST
- **Phase:** 7 (Visa & pre-departure) / 8 boundary
- **Feature:** **Incoming/travel health insurance covering the gap between landing on the D-visa and
  statutory student insurance activating at enrolment** (typically several weeks). Many missions require
  travel insurance for the initial entry period; statutory student cover only begins at Immatrikulation.
- **Why:** This is a genuine, well-known boundary. `finance/HealthInsurance.tsx` handles under-30 /
  over-30 / agreement / irreversible opt-out **but never the entry gap**; the pre-departure list only says
  "Health-insurance documents" (`seed/checklists.ts:46`) and the arrival list only "Activate statutory
  health insurance" (`seed/checklists.ts:35`). A student can land **uninsured** for the gap and not know.
- **Refines route:** `/finance/health-insurance` (add an entry-gap section) and/or `/campus/pre-departure`.
- **Data:** seed explaining the gap + what incoming/travel cover must include (and that it is NOT the
  statutory plan). No provider rates invented.
- **Grounding:** keep qualitative; cite make-it-in-germany / mission. Flag any duration as `needsVerification`.
- **Acceptance:** The health-insurance flow explicitly surfaces the entry gap and tells a new arrival they
  need interim cover before statutory insurance starts.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/finance/HealthInsurance.tsx:28-51` (no entry-gap branch); `seed/checklists.ts:35,46`.

### G7-04 · Travel / forex / flights planning surface — SHOULD
- **Phase:** 7 (Pre-departure)
- **Feature:** A small dedicated travel block: flight-booking timing vs. visa approval (don't book
  non-refundable before approval), forex / money-transfer comparison framework (no invented rates), baggage
  & customs essentials, SIM/eSIM-on-arrival. Spec gap #44 ("Travel/forex/insurance planning").
- **Why:** Currently scattered as single checklist items ("Some euros in cash", "Get a German SIM",
  `seed/checklists.ts:37,48`) with no guidance on sequencing flights against visa risk or moving money —
  a real cost-risk for every persona.
- **Refines route:** `/campus/pre-departure` (expand) or NEW `/campus/travel`.
- **Data:** seed checklist + forex comparison fields (provider, fee, FX-margin, speed) the user fills — no
  rates shipped.
- **Grounding:** none official; pure framework.
- **Acceptance:** A pre-departure persona sees explicit "don't book non-refundable flights before visa
  approval" guidance and a money-transfer comparison scaffold.
- **Deps:** none. **Effort:** S.
- **Evidence:** no dedicated travel/forex page in `nav.tsx`; items only at `seed/checklists.ts:37,48`.

### G7-05 · Accommodation: scam-victim recovery + dorm-waitlist fallback — SHOULD
- **Phase:** 7 (Visa/relocation)
- **Feature:** Two missing boundaries on the accommodation page: (1) **what to do if you've already been
  scammed** (stop payment, report to police/Schufa, evidence, embassy note) and (2) **no-housing-yet
  fallback** when dorms are waitlisted and you must still register — temporary-address strategy, address
  for Anmeldung, hostel/sublet bridging.
- **Why:** `visa/Accommodation.tsx` warns about scams (`:25-38`) but stops at prevention; it never handles
  the victim, nor the very common "I have an admission but nowhere to live yet, and I can't register without
  an address" deadlock.
- **Refines route:** `/visa/accommodation` (`pages/visa/Accommodation.tsx`).
- **Data:** seed recovery steps + temporary-address tactics; cross-link to `arrival/AnmeldungRunbook`.
- **Grounding:** practical; link Studierendenwerk / police-reporting resources.
- **Acceptance:** The accommodation page covers both "I got scammed" and "I have no address yet but must
  register."
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/visa/Accommodation.tsx:25-38` prevention only; `Wohnungsgeberbestätigung` hard
  requirement at `seed/arrival.ts:46` with no no-address branch.

### G7-06 · Visa interview simulator: German-language mode — COULD
- **Phase:** 7 (Visa)
- **Feature:** Allow the simulator's speech recognition + question set to run in **German**, not only
  English. Speech-to-text is hardcoded `lang: "en-US"`.
- **Why:** Some missions interview partly in German; the persona prepping for a German-medium programme gets
  no German rehearsal. Minor but real for a subset.
- **Refines route:** `/visa/simulator` (`pages/visa/Simulator.tsx`).
- **Data:** none new (question set + locale toggle).
- **Grounding:** n/a.
- **Acceptance:** A language toggle switches dictation locale and question language.
- **Deps:** none. **Effort:** S.
- **Evidence:** dictation `lang: "en-US"` hardcoded (`pages/visa/Simulator.tsx`, ~line 66).

---

### G8-01 · Professional recognition / Approbation for regulated professions — MUST
- **Phase:** 8/9 (Arrival & ongoing)
- **Feature:** A recognition surface for **regulated professions** — medicine (Approbation /
  Berufserlaubnis), nursing, pharmacy, law, teaching, and chamber-regulated engineering/architecture:
  Anerkennung procedure, the **Defizitbescheid → Kenntnisprüfung/Anpassungslehrgang** path, the typical
  **C1 (often C1-Medizin/Fachsprachprüfung)** language bar, and that a job offer ≠ permission to practise.
- **Why:** This is the **largest missing surface in the tail.** The Medicine persona and any career-switcher
  into a regulated field can finish a degree, clear the Blue Card salary check, and still be **legally
  unable to work** without recognition — which adds 6–24 months and gates income/Blue Card planning. The
  immigration ladder (`arrival/ImmigrationPathway.tsx`) and career outcomes (`career/Outcomes.tsx`) never
  mention it.
- **Refines route:** NEW page (e.g. `/arrival/recognition` or `/career/recognition`); cross-link from
  `career/Outcomes.tsx`, `arrival/JobSeekerPermit.tsx`, `arrival/BlueCard.tsx`, and the medicine pathway.
- **Data:** seed mapping profession → regulated? → recognising authority + steps; the anabin/ZAB
  distinction (academic recognition vs. professional licence).
- **Grounding:** authorities and language bars are real but state/profession-specific — `needsVerification`,
  cite anerkennung-in-deutschland.de / ZAB / relevant Landesärztekammer. **Do not invent timelines or fees.**
- **Acceptance:** A medicine/nursing/law persona reaches a page that explains recognition is mandatory,
  names the recognising authority class, the language bar, and the deficit-exam path, with official links.
- **Deps:** none. **Effort:** M.
- **Evidence:** repo-wide — **zero** matches for `Approbation`, "regulated profession", chamber, or
  professional recognition across phase 7–9 pages; confirmed absent in `ImmigrationPathway.tsx`,
  `Outcomes.tsx`, `JobSeekerPermit.tsx`.

### G8-02 · Bank-account rejection / no-Schufa / no-Anmeldung-yet fallback — SHOULD
- **Phase:** 8 (Arrival)
- **Feature:** Handle the common deadlocks: bank refuses without Anmeldung, but you need a bank to pay rent;
  no Schufa history; rejected neobank KYC. Surface the **address-free neobank / blocked-account-provider
  current account** bridge and the correct ordering when steps are circular.
- **Why:** `arrival/BankAccount.tsx` is happy-path only (4-step success sequence + "confirm with the bank");
  the Anmeldung↔bank↔address circular dependency is a real, frequently-hit wall for new arrivals.
- **Refines route:** `/arrival/bank-account` (`pages/arrival/BankAccount.tsx`).
- **Data:** seed of rejection causes → workaround; ordering guidance.
- **Grounding:** practical; no invented bank policies.
- **Acceptance:** The page covers "bank says no without Anmeldung" and offers at least one address-free bridge.
- **Deps:** relates to G7-05 (no address). **Effort:** S.
- **Evidence:** `pages/arrival/BankAccount.tsx` — success sequence + disclaimer only; no rejection branch.

### G8-03 · Rundfunkbeitrag exemption (Befreiung) & dispute how-to — SHOULD
- **Phase:** 8 (Arrival)
- **Feature:** The **Befreiung/Ermäßigung** mechanics: who qualifies (BAföG/benefit recipients), how to
  actually apply, what to do about **duplicate billing in a shared flat / WG** (only one fee per dwelling),
  and how to respond to a **back-dated demand or enforcement (Festsetzungsbescheid)**.
- **Why:** `arrival/Rundfunkbeitrag.tsx` correctly states the fee is per-household and mentions exemption
  exists "but most international students don't qualify" — then stops. The dispute/duplicate-billing and
  how-to-apply paths are missing, and back-dated demands genuinely blindside arrivals.
- **Refines route:** `/arrival/rundfunkbeitrag` (`pages/arrival/Rundfunkbeitrag.tsx`).
- **Data:** seed of exemption criteria + WG duplicate-fee resolution + how to respond to a demand.
- **Grounding:** cite rundfunkbeitrag.de; keep €18.36 as the existing `needsVerification` fact
  (`seed/arrival.ts:84-90`).
- **Acceptance:** Page explains how to apply for exemption and how to resolve a duplicate-billing/WG demand.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/arrival/Rundfunkbeitrag.tsx:47-49` — exemption acknowledged, no how-to/dispute.

### G8-04 · Enrolment: deadline reminder + conditional-admission failure path — SHOULD
- **Phase:** 8 (Arrival)
- **Feature:** Add a **DeadlineReminder** for the enrolment/Immatrikulation deadline, and handle the
  **conditional-admission** failure (missing certified docs, language cert pending, fee not paid in time →
  place withdrawn) with a recovery branch.
- **Why:** `arrival/Enrolment.tsx` says "Miss it and the place can be withdrawn — diarise the enrolment
  deadline immediately" but ships **no reminder component** (unlike Auslaenderbehoerde/Renewals which do),
  so the very thing it warns about isn't trackable. No path for a conditional offer's unmet conditions.
- **Refines route:** `/arrival/enrolment` (`pages/arrival/Enrolment.tsx`).
- **Data:** reuse `DeadlineReminder` (storageKey `enrolment-deadline`); seed conditional-admission remedies.
- **Grounding:** Semesterbeitrag already grounded (`facts.ts:76-82`).
- **Acceptance:** Enrolment page has a working deadline reminder and addresses unmet conditional-admission
  conditions.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/arrival/Enrolment.tsx` (no `DeadlineReminder`); contrast `arrival/Renewals.tsx`,
  `arrival/Auslaenderbehoerde.tsx:41-45` which have one.

### G8-05 · Emergency / health / community directory + buddy connect — SHOULD
- **Phase:** 8 (Arrival) — spec gap #50, currently unbuilt
- **Feature:** An emergency & support surface: 112/110, doctor/Hausarzt & after-hours (Bereitschaftsdienst)
  basics, university psychological counselling, international-office buddy programmes, mental-health and
  crisis lines, community/diaspora connect.
- **Why:** The arrival cluster is all admin (Anmeldung, bank, permit) — there is **no "if something goes
  wrong / who do I call / how do I see a doctor" surface.** A settling student persona has nowhere to turn
  for non-bureaucratic help.
- **Refines route:** NEW `/arrival/support` (or `/campus/support`).
- **Data:** seed of emergency numbers (stable, low-volatility) + how-to-find-a-doctor + buddy-programme
  pointers.
- **Grounding:** emergency numbers are stable facts; counselling/buddy links per-university → generic +
  "find yours."
- **Acceptance:** A new arrival finds emergency numbers, how to see a doctor, and where to get peer/mental
  support.
- **Deps:** none. **Effort:** S.
- **Evidence:** no support/emergency page in `nav.tsx`; arrival group is admin-only.

### G8-06 · Anmeldung: structurally-no-appointment deadlock (beyond walk-in) — COULD
- **Phase:** 8 (Arrival)
- **Feature:** Strengthen the no-slot path: what to do when **no slots exist for weeks past the 14-day
  window** — proof you tried (screenshots), neighbouring-Bürgeramt strategy across cities, and that the
  14-day deadline is rarely penalised if you're demonstrably trying.
- **Why:** `AnmeldungRunbook.tsx:17` offers a one-line walk-in fallback, but the structural "the city has
  released no slots and my 14 days are running out" reality (Berlin/Munich) isn't addressed, and the
  ANMELDUNG_DAYS=14 fact reads as a hard penalty.
- **Refines route:** `/arrival/anmeldung-runbook` (`pages/arrival/AnmeldungRunbook.tsx`).
- **Data:** seed escalation tactics; reassurance copy grounded to Bundesmeldegesetz reality.
- **Grounding:** keep the 14-day fact (`facts.ts:21-22,160-166`); add nuance, don't restate a penalty.
- **Acceptance:** The runbook addresses a genuine no-slots-before-deadline situation.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/arrival/AnmeldungRunbook.tsx:17` (single-line fallback).

---

### G9-01 · Job-seeker permit: "no job within 18 months" failure path — MUST
- **Phase:** 9 (Ongoing)
- **Feature:** What happens when the 18-month post-study window **runs out without a qualifying job** —
  options (further study, lower-qualified work bridge, leave & re-enter, switch permit type), the no-
  extension reality, and how to avoid falling out of status.
- **Why:** `arrival/JobSeekerPermit.tsx` is happy-path only (apply → search → work → settle). The career-
  switcher persona who doesn't land a role is exactly who needs this, and there's no guidance at the cliff
  edge. This is the highest-stakes phase-9 boundary.
- **Refines route:** `/arrival/job-seeker-permit` (`pages/arrival/JobSeekerPermit.tsx`).
- **Data:** seed of end-of-window options; cross-link to recognition (G8-01) and Blue Card check.
- **Grounding:** `needsVerification`; cite make-it-in-germany / Ausländerbehörde. No invented extensions.
- **Acceptance:** The job-seeker page covers the window expiring with no job and gives at least three
  honest options.
- **Deps:** G8-01 (recognition can be the blocker). **Effort:** S.
- **Evidence:** `pages/arrival/JobSeekerPermit.tsx` — 5-step success ladder, no failure branch.

### G9-02 · Active German job-search toolkit (CV/Anschreiben/portals/networking) — SHOULD
- **Phase:** 9 (Ongoing)
- **Feature:** A real job-search surface for the German market: German-style CV vs. the academic Europass,
  the **Anschreiben** (cover letter) norms, Arbeitszeugnis literacy, where to look (Bundesagentur für
  Arbeit, StepStone, LinkedIn, university career service, Werkstudent→permanent conversion), and visa-
  sponsorship signalling.
- **Why:** The app helps you *qualify* for a job (Blue Card check, outcomes) and *network academically*
  (`campus/Networking.tsx`), but there's **no surface for actually finding and applying for a German job** —
  the core need of both the career-switcher and the graduating student.
- **Refines route:** NEW `/career/job-search` (sits beside `career/Outcomes`, `career/Counseling`).
- **Data:** seed of portals + CV/Anschreiben templates (editable, like the networking templates pattern).
- **Grounding:** none official; practical framework.
- **Acceptance:** A graduating persona finds where to search, a German-CV/Anschreiben scaffold, and
  conversion tactics.
- **Deps:** none. **Effort:** M.
- **Evidence:** `career/Outcomes.tsx` (demand only), `campus/Networking.tsx` (academic outreach only) — no
  job-application surface in `nav.tsx`.

### G9-03 · Permit-loss / out-of-status & exmatrikulation recovery — SHOULD
- **Phase:** 9 (Ongoing)
- **Feature:** A recovery surface for the worst cases the app currently only *warns* about: residence permit
  lapsed (out of status), exmatrikuliert for a missed Rückmeldung, or permit-renewal **refused** — what to
  do next (Fiktionsbescheinigung if mid-process, re-enrolment, leave/re-enter, legal-aid pointers).
- **Why:** `arrival/Renewals.tsx` and `UniversityOnboarding.tsx` say "miss this and you're de-registered /
  out of status" but offer **no recovery** once it happens. The settling-in persona who slips needs more
  than a warning.
- **Refines route:** `/arrival/renewals` (add a recovery section) or a small `/arrival/out-of-status` page.
- **Data:** seed of recovery steps per failure; reuse Fiktionsbescheinigung concept from
  `ResidencePermit.tsx:36-42`.
- **Grounding:** `needsVerification`; cite Ausländerbehörde / BAMF. No invented grace periods.
- **Acceptance:** A user who already missed a renewal/Rückmeldung finds concrete recovery steps, not just a
  warning.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/arrival/Renewals.tsx:26-27` (warning, no recovery); `UniversityOnboarding.tsx:26-29`.

### G9-04 · Family reunion: income-sufficiency check + A1-exemption clarity — COULD
- **Phase:** 9 (Ongoing)
- **Feature:** Turn the family-reunion guide into something testable: a (deterministic, grounded)
  income/housing-sufficiency self-check for the household size, and clearer A1-German exemption logic (who
  is exempt) rather than "exemptions exist — verify."
- **Why:** `arrival/FamilyReunion.tsx` lists qualifying conditions and docs but has **no calculator** for
  the income bar (the thing that actually decides eligibility) and leaves the A1 exemption vague.
- **Refines route:** `/arrival/family-reunion` (`pages/arrival/FamilyReunion.tsx`).
- **Data:** household-size income rule (flag `needsVerification`); A1-exemption category list.
- **Grounding:** income thresholds are real but volatile → `needsVerification`, cite make-it-in-germany.
- **Acceptance:** The page offers a sufficiency self-check and names the common A1-exemption categories.
- **Deps:** cross-link `finance/funding-plan`. **Effort:** M.
- **Evidence:** `pages/arrival/FamilyReunion.tsx:15-16` (qualitative, no calculator); `seed/arrival.ts:74-81`.

### G9-05 · BlueCardCheck & Outcomes thresholds: persistence + single-source — COULD
- **Phase:** 9 (Ongoing) — defect-adjacent polish
- **Feature:** (1) `BlueCardCheck` inputs don't persist (plain `useState`) so the salary check is lost on
  navigation — move to syncedState like `PrCitizenship`. (2) `career/Outcomes.tsx:63` hardcodes the
  literals "€45,934.20 / €50,700" in JSX instead of importing `BLUE_CARD_SHORTAGE_EUR`/`_STANDARD_EUR`,
  risking drift from the single source in `facts.ts:40-41`.
- **Why:** Minor, but the persistence gap loses user input and the hardcoded literal violates the "prose
  derives from constants" rule the codebase otherwise follows well.
- **Refines route:** `/arrival/blue-card-check`, `/career/outcomes`.
- **Data:** none.
- **Grounding:** strengthens it (kills a drift risk).
- **Acceptance:** BlueCardCheck persists; Outcomes imports the euro constants.
- **Deps:** none. **Effort:** S.
- **Evidence:** `pages/arrival/BlueCardCheck.tsx:20-23` (`useState`, no persistence);
  `pages/career/Outcomes.tsx:63` (hardcoded euro literals).

---

## Notes on scope honesty

- I judged **depth, not existence**: phases 7–9 are well-populated (visa, arrival, ongoing are real,
  grounded pages), so most genuine gaps here are **failure/partial-path boundaries**, plus three real
  missing surfaces (G8-01 Approbation, G9-02 job-search, G8-05 emergency/support) and one missing interim-
  insurance branch (G7-03).
- **No fabricated official fact found** in this slice — grounding discipline is strong. The only grounding-
  adjacent nit is the hardcoded euro literal in `Outcomes.tsx:63` (G9-05).
- Items that *look* missing but are covered (excluded deliberately): Anmeldung walk-in fallback
  (`AnmeldungRunbook.tsx:17`), permit-expiry-before-appointment (`ResidencePermit.tsx:36-42`), insurance
  opt-out irreversibility (`HealthInsurance.tsx:132-140`), Rückmeldung/permit reminders (`Renewals.tsx`),
  rental-scam prevention (`Accommodation.tsx:25-38`).
