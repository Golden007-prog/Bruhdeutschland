# DeutschPrep — QA / Loophole & Gap Audit (post-build)

Adversarial find-and-document audit, 2026-06-20, **after** the full gap-build (all 51 gaps shipped, 117
routes) and the non-linear-education-paths feature. Run with 4 parallel read-only subagents
(security/red-team · data-honesty/grounding · correctness/edge-cases · a11y/UX/perf) over the **new
surface**, re-verifying the previously-fixed P0s still hold. Findings-only; the 4 items marked **✅ FIXED
THIS PASS** were regressions in the just-shipped non-linear feature and were corrected here.

> Supersedes the pre-build register (whose P0/P1 defects are all fixed — see git history). Severity:
> **P0** data-leak/security/fabricated-fact-as-truth/money-risk/app-break · **P1** broken feature / wrong
> result · **P2** edge bug / confusing UX · **P3** polish. Sorted severity × likelihood.

## ✅ Resolution — ALL findings fixed (2026-06-20)
Every item below has since been fixed (3 commits; 314 tests, lint, build green):
- **Bridge** SEC-1/2/3: `/generate` now 403s non-allowlisted Origins, binds `127.0.0.1` (opt-in `--host`),
  pins the exact tunnel host instead of a wildcard, + optional `BRIDGE_TOKEN`.
- **Correctness** COR-1 (free programme can be "cheapest"), COR-3 (medicine +Studienkolleg year),
  COR-2/COR-5 (education wiring + semester leak — prior commit), COR-4 (direct_bachelor factor),
  COR-6/SEC-4 (`.ics` extracted to tested `lib/calendar/ics.ts` with DTSTAMP + RFC-5545 escaping),
  COR-7 (non-linear + Bachelor target uses the degree), COR-8 (no 0/0 work-day rows), COR-9 (Sperrkonto
  draft re-syncs).
- **a11y** A11Y-1 (Checklist focus ring), A11Y-2 (Cities sort focus), A11Y-3 (`p-1` on 12 remove buttons),
  A11Y-4 (empty states on 7 trackers), A11Y-6 (micro-badges → `text-xs`). A11Y-5 left as-is (accessible
  name already present via `aria-label`).
- **Honesty/SSOT** HON-1..4 (euro figures now imported from canonical `lib/facts` numeric constants),
  HON-5 (`<Disclaimer/>` on BankAccount/Renewals), HON-6 (uni-assist deadlines source), HON-7 (CEFR hours
  no longer styled as precise).
- **New regression tests:** `lib/calendar/ics.test.ts`, feasibility new-route + medicine-year cases,
  pathway COR-7/medicine cases, education semester-leak case.

## Executive summary

**No P0s.** The known **cross-account data-isolation bug is VERIFIED FIXED** (per-user namespaced blob +
hard reset on every auth transition + regression test; all 14 new stores go through the scoped layer).
**No fabricated official fact is shown as truth** anywhere in the ~60 new pages — every euro/date/threshold
flows through `OfficialFactRow` (verify badge + source), a tested deterministic calc, or a `PathwayNote`
carrying `{source, needsVerification}`; finance/visa/immigration pages all carry the disclaimer. **Secrets
& RLS are clean** (BYOK keys localStorage-only, never logged/bundled; owner-only RLS on every table; no
service key client-side; the one `dangerouslySetInnerHTML` is KaTeX-only and safe).

The real exposure is the **Owner-Mode Claude bridge** (operator-local, never in the Pages build, but a
genuine quota/money vector on a shared network), one **wrong-result** correctness bug (a free programme is
never flagged "cheapest"), a **medicine feasibility year undercount** that contradicts the app's own copy,
and a tail of **P2/P3** correctness, a11y-pattern, and single-source-of-truth hygiene items. Nothing blocks
private use; the Top-10 should be cleared before sharing publicly.

## Top 10 — must-fix before sharing publicly
1. **SEC-1 (P1)** Owner-Mode bridge `/generate` runs for any Origin (CORS is advisory-only) → operator quota/money abuse.
2. **SEC-2 (P1)** Bridge binds `0.0.0.0` (no host arg) → reachable from the whole LAN.
3. **COR-1 (P1)** Offer comparison: a **free (€0) programme is never flagged "cheapest"** (the common German-public case).
4. **COR-3 (P1)** Feasibility under-counts **Medicine** years by ~1 (no Studienkolleg year for a class-12 medicine applicant) — contradicts the pathway's own "≈8–9 yrs" copy.
5. **SEC-3 (P2)** Bridge trusts the entire `*.trycloudflare.com` wildcard origin.
6. **COR-7 (P2)** A non-linear (missing-class-12) applicant **targeting a Bachelor** falls through to Studienkolleg, ignoring the degree they already hold/are completing.
7. **A11Y-1 (P2)** Shared `Checklist` checkbox is `sr-only` with **no visible keyboard focus ring** (affects many guide pages).
8. **COR-6 (P2)** Reminders `.ics` export omits `DTSTAMP` → strict calendar importers reject the events.
9. **HON-1 (P2)** `Budget.tsx` hardcodes the bare literal `992` for the monthly Sperrkonto payout (drift risk; derive from `SPERRKONTO_AMOUNT`).
10. **A11Y-3 (P2/P3)** ~9 icon-only Trash remove buttons are `h-4 w-4` (16px) — below the 24px target-size minimum.

## ✅ Verified fixed / resolved (do not re-report)
- **Cross-account data isolation** — `syncedStore` blob namespaced `deutschprep:state:<uid|anon>`,
  `setIdentity` hard-resets on auth change, mid-flight cloud pulls dropped on identity change, legacy key
  migrated+removed; regression test reproduces two-accounts-same-browser and asserts isolation. All new
  stores (`offers:list`, `tracker:apps`, `lor:requests`, `scholarship:apps`, `work:days`, `vault:matrix`,
  `programme:requirements`, `translation:tracker`, `attestation:tracker`, `loans:offers`,
  `supervisors:outreach`, `sperrkonto:funded`, `reminder:*`, `checklist:*`) go through the scoped layer.
- **Secrets/RLS** — BYOK keys in localStorage only, never logged (no `console.*` in `lib/llm`), never
  bundled; bridge strips `ANTHROPIC_API_KEY`; only the public anon key client-side; owner-only RLS
  (`auth.uid()=user_id`) on every table incl. private `exam-audio` storage; every write attaches `user_id`.
- **Honesty** — no fabricated official fact as truth; €18.36 Rundfunk, €11,904 Sperrkonto, €75 visa, €225
  APS, 140/280 work-days, 18-month job-seeker, 1–2yr permit, anabin/lateral-entry notes all grounded +
  verify-flagged. Blue Card/loans deliberately state NO invented figures.

---

## P1 — Major

**SEC-1 · Owner-Mode bridge `/generate` executes for any origin** — `tools/claude-bridge/server.mjs:100-111,
155-176`. `cors()` only *omits* the ACAO header for non-allowlisted Origins; it never rejects. A POST to
`/generate` runs `runClaude()` server-side regardless of Origin (the browser only blocks *reading* the
response) — so a malicious tab or any `curl`/non-browser client can spend the operator's Claude
plan. *Fix:* return 403 when `req.headers.origin` is present and not allowlisted; optionally require a
shared-secret header. *(Operator-local, excluded from the Pages build.)*

**SEC-2 · Bridge binds all interfaces** — `server.mjs:183` `server.listen(PORT)` (no host) → `0.0.0.0`.
With SEC-1, any LAN host can drive the operator's Claude. *Fix:* `listen(PORT, "127.0.0.1")`; keep the
cloudflared tunnel as the explicit opt-in for remote.

**COR-1 · Free (€0) programme never flagged "cheapest"** — `pages/overview/OfferComparison.tsx:22-23`.
`withTuition = offers.filter(o => o.tuitionPerSem > 0)` runs before the cheapest-reduce, so a tuition-free
offer (the genuinely cheapest, and the norm at German public unis) is excluded and a paid offer gets the
badge. *Repro:* A €1500, B €0 → "cheapest" shows on A. *Fix:* reduce over all offers; only suppress the
badge when every offer is 0.

**COR-3 · Feasibility under-counts Medicine years by ~1** — `lib/calc/feasibility.ts` (`degreeYears` +
year block). `degreeYears("medicine")=[6,7]`; the Studienkolleg/FSP year is only added when
`route==="studienkolleg"`, but a class-12 medicine applicant routes `medicine` (which itself states an
M-Kurs+FSP year is needed). Estimate shows 8–10 vs the route's own ≈9–11. *Fix:* add 1 year when
`route==="medicine"` and qualification is class10/class12 (mirror `medicine()`'s `needsKolleg`).

**COR-2 · Feasibility & NextActions ignored the education timeline** — `pages/start/Feasibility.tsx`,
`pages/overview/NextActions.tsx` called `evaluatePathway` **without** `education`, so a diploma-only user
was told their Master's was "feasible/workable." **✅ FIXED THIS PASS** — both now pass
`summarizeEducation(profile)`, and `computeFeasibility` now handles the `ausbildung` / `complete_degree`
routes with an honest low-band "not yet / finish first" read (+ 2 tests).

## P2 — Minor (correctness / a11y / honesty)

- **SEC-3 · Wildcard tunnel origin** — `server.mjs:97` trusts every `*.trycloudflare.com` (random,
  ephemeral) host. *Fix:* pin the exact tunnel hostname or gate behind a shared secret.
- **COR-7 · Non-linear + Bachelor target → Studienkolleg** — `lib/pathway/pathway.ts` non-linear block only
  handles `master/phd/""`; a missing-class-12 applicant who already holds/began a degree but sets
  `targetLevel:"bachelor"` falls through to the generic Studienkolleg branch. *Fix:* add a branch (or
  steer them to Master) when a degree exists.
- **COR-4 · `direct_bachelor` unscored in feasibility** — `feasibility.ts` references the route only in
  one OR-clause; there's no route factor, so an India/Bangladesh `some_bachelor→direct_bachelor` applicant
  gets only the base score. *Fix:* add a `direct_bachelor` factor (or document it as a plain Bachelor).
- **COR-5 · `currentSemester` leaked from an ongoing degree when a completed degree wins** —
  `lib/profile/education.ts`. **✅ FIXED THIS PASS** (`currentSemester` is now gated on `degreeOngoing`).
- **COR-6 · Reminders `.ics` missing `DTSTAMP`** — `pages/overview/Reminders.tsx:37-51`. RFC-5545 requires
  `DTSTAMP` per `VEVENT`; lenient apps accept it, stricter Outlook paths reject. *Fix:* add `DTSTAMP`
  (+ ideally `DTEND` next-day). (Comma/newline are stripped; ✓.)
- **COR-8 · WorkDays can append a 0/0 entry** — `pages/finance/WorkDays.tsx:25-31` guard allows month-only
  rows. *Fix:* require `full>0 || half>0`.
- **A11Y-1 · Checklist checkbox has no visible focus ring** — `components/common/Checklist.tsx:81-86`
  (`sr-only` input, sibling visible `<span>`, no `peer-focus-visible`). Broad reach (Videx, AdmissionLetter,
  visa/arrival/doc guides). *Fix:* `peer sr-only` + `peer-focus-visible:ring-2` on the span.
- **A11Y-2 · Cities sort button has no focus ring** — `pages/profile/Cities.tsx:44`. *Fix:* add
  `rounded focus-visible:ring-2 focus-visible:ring-ring`.
- **HON-1 · `Budget.tsx:192` bare `992` literal** for the monthly Sperrkonto payout — drift risk; not
  badge-verified itself. *Fix:* derive from `SPERRKONTO_AMOUNT` (`/12`).

## P3 — Polish
- **SEC-4** ICS `SUMMARY` not RFC-escaped (`\\`, line-folding) — self-inflicted-only (downloaded file), low.
- **HON-2..4** Single-source-of-truth literals: `SperrkontoProviders` `REQUIRED=11904`; `TaxId` "140/280"
  prose; `Budget`/`ApplicationCosts` `DEFAULTS` (visaFee/blockedAccount/apsFee). All user-editable + badge-
  verified + disclaimed, but should import the canonical constants so they can't drift from `facts.ts`.
- **HON-5** `BankAccount`/`Renewals` use an inline plain-text disclaimer instead of `<Disclaimer />`
  (wording is correct — consistency nit).
- **HON-6** `TimelinePlanner` "~15 Jul / ~15 Jan" anchor dates — already framed "not official deadlines";
  optionally add `source("uniAssistDeadlines")`.
- **HON-7** `GermanPlan` CEFR hours use the `official-figure` monospace class (reads as precise) — already
  labelled "estimates"; drop the class or add "varies by learner".
- **A11Y-3** ~9 Trash remove buttons `h-4 w-4` (<24px) — add `p-1` (WorkDays, ScholarshipTracker, Loans,
  LorTracker, TranslationTracker, Attestation, Requirements, Supervisors, OfferComparison). Status pills
  `py-0.5` borderline → `py-1`.
- **A11Y-4** ~7 add-then-list trackers show nothing when empty (WorkDays, ScholarshipTracker, Loans,
  LorTracker, TranslationTracker, Attestation, Supervisors) — copy `Requirements.tsx:50`'s empty state.
- **A11Y-5** A few add inputs rely on `aria-label` only (Loans, Requirements, TranslationTracker,
  Attestation, Supervisors) — add a visible `<label htmlFor>` for consistency (accessible name exists).
- **A11Y-6** `text-[0.6rem]` micro-badges (OfferComparison/ApplicationCosts/Budget) → bump to `text-xs`.
- **COR-9** `SperrkontoProviders` `draft` seeded once from `funded`; won't re-sync on a cross-tab/cloud
  update until reload (onBlur→commit itself works).

## Verified GOOD (do not over-report)
- All **157 static `Link` targets resolve** (0 broken links); dynamic targets all valid routes.
- `reverseTimeline`, `journeyBudget`, `workDays`, `fundingGap` math verified correct incl. negative-input
  guards + div-by-zero safety; `summarizeEducation` + the documented non-linear pathway cases sound.
- `Placement` contiguous CEFR estimate correct; empty states present on Reminders/OfferComparison/
  SeatDeadlines/VaultMatrix/Shortlist(+spinner)/Requirements; all ~60 pages `lazy()`-loaded, no new bundle
  offenders; forms largely use `<label htmlFor>`; icon-only buttons carry `aria-label` + focus rings;
  toggles use `aria-pressed`.

## Regression-test backlog (so each bug can't return)
- **Bridge:** assert `/generate` returns 403 for a disallowed Origin and that the server binds `127.0.0.1`.
- **OfferComparison (RTL):** a €0 offer beside a €1500 offer gets the "cheapest" badge.
- **feasibility:** `medicine` + class-12 estimate includes the Studienkolleg year (≈9–11, not 8–10).
- **education:** `currentSemester` is `undefined` when a completed degree exists (✅ covered now).
- **pathway:** missing-class-12 + `targetLevel:"bachelor"` routes sensibly (not blind Studienkolleg).
- **Reminders:** `buildIcs` output contains `DTSTAMP` and escapes `\,;`.
- **a11y:** axe/snapshot that `Checklist` exposes a visible focus ring on keyboard focus.

## Proposed fix order
1. **Wave A (pre-share, ~½ day):** SEC-1, SEC-2, SEC-3 (bridge hardening); COR-1 (free-cheapest); COR-3
   (medicine year); A11Y-1 (Checklist focus); HON-1 (992 literal). All small, high-value.
2. **Wave B (correctness/UX, ~1 day):** COR-6 (ICS DTSTAMP), COR-7 (non-linear bachelor branch), COR-4/8/9;
   A11Y-3/4 (tap targets + empty states across the trackers — mechanical, broad).
3. **Wave C (polish):** HON-2..7 single-source-of-truth + disclaimer-component consistency; A11Y-5/6.
