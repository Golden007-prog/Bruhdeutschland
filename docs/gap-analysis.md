# DeutschPrep — Gap Analysis (missing-feature register)

Deep audit pass, 2026-06-20. Five personas walked end-to-end (Class-12 school-leaver India · Master's
applicant Bangladesh/no-APS · Medicine aspirant · career-switcher with work experience · Class-10
student — correctly *blocked*). Inventory taken from `frontend/src/lib/nav.tsx` (60+ routes) + the
deterministic engines (`lib/pathway`, `lib/programs`, `lib/intake`, `lib/calc`, `lib/exam`).

**Strong existing features — NOT double-counted:** pathway engine (routes all 5 personas incl. Class-10
block + per-country Studienkolleg vs direct-Bachelor carve-outs); deterministic GPA→German grade, ECTS,
cost-of-living, deadline math, SRS, exam analytics; faceted hybrid program finder with honest per-criterion
eligibility (Bachelor/Master/Medicine pools); mock-exam centre (7 tests, TOEFL-2026, split layout, tiered
TTS); scholarships (EPOS-aware), Sperrkonto, health-insurance tier, Werkstudent rules; visa checklist /
APS guide / interview simulator / accommodation / Anmeldung; document vault, tracker Kanban, calendar,
SOP/CV/LOR + AI tailoring; intake "data engine" (derives documents-needed / test-recs / insurance / intake
label); multi-model AI router.

The single largest contiguous gap: **the roadmap ends at "relocate & settle"** — the entire
**Arrival → Ongoing tail** (Anmeldung booking, bank account, residence-permit conversion, university
onboarding, job-seeker permit, family reunion, renewals) is missing, and it's what every persona needs
after the offer.

*DV = downstream data consumed (fields already on `UserProfile`/`Program` unless marked "new data").*

| id | phase | feature | why a real student needs it | DV | prio | effort |
|----|-------|---------|------------------------------|----|------|--------|
| G01 | 0 Orientation | Instant eligibility quick-check (1 screen, no signup) | pathway engine is gated behind full intake; a visitor can't get a 30-sec "are you eligible & by which route" answer | country, highestQualification, targetLevel, targetField | must | S |
| G02 | 0 Orientation | Reality-score / years-to-finish feasibility gate | career-switcher & medicine aspirant need a blunt feasibility + timeline estimate | pathway route, germanLevel, graduationDate | should | M |
| G03 | 0 Orientation | Reverse timeline planner (target intake → back-dated milestones) | "to start WS2026, do X by when"; deadlines.ts only does forward days-until | targetIntake, targetIntakeYear, steps | must | M |
| G04 | 0 Orientation | Total-journey budget calculator (one-time + recurring, end-to-end) | nobody sums APS + uni-assist + translation + visa + Sperrkonto + flights + deposit; CoL is monthly only | new fee data, dependents, country, fundingSource | must | M |
| G05 | 1 Foundations | anabin / HZB recognition checker | HZB is referenced everywhere as "check anabin yourself"; no in-app H+/H+- lookup | new anabin dataset, country, institution, qualification | must | L |
| G06 | 1 Foundations | Studienkolleg finder (colleges, Kurs, city, public/private, deadlines) | school-leaver route ends at "apply to a Studienkolleg" with no directory | new Studienkolleg dataset, kurs, targetField | must | M |
| G07 | 1 Foundations | Aufnahmeprüfung (entrance-exam) prep | Studienkolleg entry needs a B1/B2 German + maths test; no prep | kurs, germanLevel | should | M |
| G08 | 1 Foundations | FSP (Feststellungsprüfung) prep & per-subject tracker | the exam that confers HZB for school-leavers; no practice | kurs, pathway route | should | M |
| G09 | 1 Foundations | Structured German A1→C1 plan with progress | German.tsx is static CEFR phrase cards; no lessons, stops at B2 though C1 is required for Bachelor/Medicine | germanLevel, targetLevel | must | L |
| G10 | 1 Foundations | German placement test (estimate current CEFR) | app asks user to self-declare germanLevel; no test | germanLevel | should | M |
| G11 | 3 Tests | TestAS prep module | Bachelor/medicine international quota needs TestAS; derive.ts recommends it but no prep/mock | targetLevel, recommendedTests | must | M |
| G12 | 3 Tests | TMS prep (medicine, EU/HZB route) | medicine roadmap names TMS but offers no prep | medicine route | could | M |
| G13 | 3 Tests | DSH exam prep | Goethe/TestDaF covered; DSH (other C1 route, uni-run) has no prep | germanTestType | should | M |
| G14 | 2 Discovery | Reach / match / safety shortlist builder | per-program rollup exists, but no portfolio view balancing ambitious/realistic/safe | eligibility rollup, tracker apps | must | M |
| G15 | 2 Discovery | Per-program requirement extractor (paste URL/text → structured reqs) | eligibility says "verify on official page"; students read each portal manually | new AI extraction, Program fields | should | L |
| G16 | 2 Discovery | Professor / research-group finder | PhD route says "find a supervisor" with zero tooling | new prof/lab dataset, targetField, careerGoal | should | L |
| G17 | 2 Discovery | City explorer (rent, safety, intl community, climate) | Program carries only city + lat/lng; no liveability data | new city dataset, dependents, budget | should | M |
| G18 | 2 Discovery | Application-cost estimator per shortlist (uni-assist tiers) | uni-assist charges €75 first + €30 each; no sum across the shortlist | tracker apps, country | should | S |
| G19 | 4 Documents | Document vault versioning + per-program status | vault stores files but no versions, no "which doc went to which application" | vault, tracker apps | should | M |
| G20 | 4 Documents | LOR request tracker (asked/sent/received + reminders) | Lor.tsx only drafts; recommender counts exist but nothing tracks the ask→receive workflow | recommendersAcademic/Professional, deadlines | must | S |
| G21 | 4 Documents | Certified-translation tracker (per-doc status, translator, cost, ETA) | Translation.tsx is one free-text note | documentsOnHand, DOC_CATALOG | should | S |
| G22 | 4 Documents | Attestation / legalization tracker (notarized copies, apostille) | German unis need certified copies; no tracker | documentsOnHand | should | S |
| G23 | 4 Documents | VPD-vs-direct-application decision helper | VPD tracker exists, but nothing tells *this* student which path applies | tracker apps, Program (new field) | should | M |
| G24 | 4 Documents | DoSV / hochschulstart walkthrough (NC Bachelor/medicine) | only mentioned in prose; no walkthrough like uni-assist | pathway route, admissionMode | should | M |
| G25 | 5 Offers | Admission-letter (Zulassungsbescheid) interpreter | offers carry enrolment deadlines + conditional clauses students miss | new AI parse, tracker apps | must | M |
| G26 | 5 Offers | Offer comparison board (cost/city/ranking/deadline) | a student with multiple admits has no side-by-side | tracker apps, Program | must | M |
| G27 | 5 Offers | Enrolment / Immatrikulation guide | roadmap ends at "relocate"; the offer→enrolment step is absent | offer, Program.semesterContribution | must | M |
| G28 | 5 Offers | Seat-acceptance / Studienplatz deadline tracker | accepting a seat has hard deadlines distinct from the application deadline | tracker apps, deadlines | should | S |
| G29 | 6 Finance | Education-loan comparison (Indian/BD banks + KfW) | fundingSource "loan" exists; the #1 path for Indian students has no comparison | fundingSource, country, total budget (G04) | must | M |
| G30 | 6 Finance | Sperrkonto provider comparison + funding tracker | guide exists but no provider comparison or deposit-progress tracker | sperrkontoStatus, fundingSource | should | M |
| G31 | 6 Finance | Scholarship application tracker + reminders | finder exists; no applied/awarded tracker | scholarship picks, deadlines | should | S |
| G32 | 6 Finance | Funding-gap / affordability planner | combine Sperrkonto + loan + scholarship + Werkstudent income vs total budget | fundingSource, budget (G04), work rules | should | M |
| G33 | 6 Finance | Part-time income & 140/280-day work-limit tracker | Work page states rules; no log of days vs the legal cap | new work-log data, Werkstudent rules | could | S |
| G34 | 7 Visa | Visa appointment / slot tracker (wait-time + booking countdown) | checklist lists docs but doesn't track *your* appointment | passportExpiry, deadlines, country | must | S |
| G35 | 7 Visa | VIDEX visa-form walkthrough | students must fill VIDEX; no guided walkthrough | profile basics, country | should | M |
| G36 | 7 Visa | Visa-type selector (study vs applicant §17 vs language-course) | different personas need different visas (BD applicant w/o offer may need §17) | pathway route, offer status | should | M |
| G37 | 7 Pre-departure | Arrival-day planner (flight, SIM/eSIM, temp stay) | PreDeparture is a static checklist; no actionable arrival-day sequence | arrival date, city | could | S |
| G38 | 8 Arrival | German bank-account opening guide (what unblocks Sperrkonto) | Anmeldung page mentions a bank account unlocks things; no guide | sperrkontoStatus, Anmeldung status | must | S |
| G39 | 8 Arrival | Residence-permit (Aufenthaltstitel) conversion tracker | the entry visa must convert at the Ausländerbehörde within weeks; entirely missing | new permit data, visa type, Anmeldung | must | M |
| G40 | 8 Arrival | Ausländerbehörde appointment + document tracker | permit conversion needs its own appointment/doc set | documentsOnHand, sperrkontoStatus | must | M |
| G41 | 8 Arrival | University onboarding checklist (Matrikelnummer, card, email, library, Rückmeldung) | first-weeks campus admin absent | enrolment status | should | S |
| G42 | 8 Arrival | Anmeldung appointment booker / city-specific runbook | Anmeldung.tsx is one generic guide; no per-city process/forms/appointment | city, ANMELDUNG data | should | M |
| G43 | 8 Arrival | Rundfunkbeitrag + utilities setup guide | €18.36/mo is legally mandatory per household and blindsides arrivals | dependents, accommodation | could | S |
| G44 | 9 Ongoing | 18-month post-study job-seeker permit planner | the whole post-graduation stay path (the reason many enrol) has no feature | graduationDate, permit, careerGoal | must | M |
| G45 | 9 Ongoing | Family-reunion (Familiennachzug) guide | `dependents` is collected but never used for a reunion workflow | dependents, permit, income | must | M |
| G46 | 9 Ongoing | Residence-permit / visa renewal reminders | permits are time-limited; no renewal reminder despite a deadline engine | permit expiry, passportExpiry, deadlines | must | S |
| G47 | 9 Ongoing | Semester re-registration (Rückmeldung) + fee reminders | miss Rückmeldung/Semesterbeitrag and you're exmatrikuliert | enrolment, deadlines | should | S |
| G48 | 9 Ongoing | Blue Card / PR (Niederlassungserlaubnis) planner | career-switchers want the work→settlement endgame | careerGoal, permit, graduationDate | could | M |
| G49 | 9 Ongoing | Tax-ID / first-job & Werkstudent contract onboarding | converting to a work permit + tax setup unmodeled | permit, work rules | could | M |
| G50 | cross-cutting | Persona-aware "you are HERE → next 3 actions" engine | dashboard aggregates but doesn't drive a single next-action engine off pathway+phase | pathway route, all status fields | should | M |
| G51 | cross-cutting | Notification / reminder delivery (email/push for any deadline) | deadlines/calendar/events compute urgency but nothing reminds off-app | deadlines, events, trackers | should | M |

**51 genuine gaps** (≥45 required). Highest-leverage "must" clusters: **(1)** Orientation top-of-funnel
(G01–G04); **(2)** Foundations for school-leavers (G05–G10, barely exists); **(3)** the entire
**Arrival→Ongoing tail** (G38–G47) — the single largest contiguous gap, since the roadmap stops at
"relocate". Class-10 is correctly *blocked* (no features owed). See `roadmap-unified.md` for sequencing.
