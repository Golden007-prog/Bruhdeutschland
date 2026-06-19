# DeutschPrep — Frontend Route Map

> The frontend is a 54-page React Router app. Routes are generated from a single source of truth:
> the `PAGES` list in `frontend/scripts/gen-pages.mjs` → `frontend/src/lib/nav.tsx`. To add a page,
> edit `PAGES`, run `node scripts/gen-pages.mjs`, and fill the generated stub.

## Cross-cutting (Overview group)

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Profile, roadmap, alerts, status board, category modules |
| `/roadmap` | Roadmap | Step-by-step dependency-ordered plan |
| `/process` | Application status | Process-polling board (FSM: not_started → in_progress → submitted → complete) |
| `/deadlines` | Deadlines & alerts | Date-ordered alerts with computed severity |
| `/events` | Event watch | Recurring windows to watch (intake, scholarships, visa) |
| `/documents-checklist` | Document gathering | Application / Visa / Arrival checklists |
| `/timeline` | Timeline | Month-by-month 12–18 month prep arc |
| `/sources` | Sources | Full citation registry + grounding policy |

## Feature categories (30 features)

- **Profile & Assessment** — `/profile` + `/profile/{parse,evaluate,matching,skill-gap,ects}` (working GPA & ECTS calculators)
- **Document Prep** — `/documents` + `/documents/{sop,cv,lor,uni-assist,vpd,translation}`
- **Language & Test Prep** — `/language` + `/language/{german,flashcards,ielts-toefl,gre-gmat,goethe-testdaf,exams}`
  - **Mock exams** — `/language/exams/{ielts,toefl,testdaf,goethe,gre,gmat}` (timed, scored runner)
- **Finance & Logistics** — `/finance` + `/finance/{sperrkonto,cost-of-living,health-insurance,scholarships,work}` _(disclaimer)_
- **Visa & Relocation** — `/visa` + `/visa/{simulator,checklist,aps,accommodation,anmeldung}` _(disclaimer)_
- **Campus Life** — `/campus` + `/campus/{pre-departure,networking,deutschlandticket,culture}`

## System

`/about` (methodology & grounding) · `/settings` (intake form) · `*` (404)

## Conventions

- Every page is a default export that leads with `<PageHeader>` and returns one `space-y-6` wrapper; the
  `AppShell` provides sidebar + site-wide disclaimer footer.
- Official German figures render via `OfficialFactRow`/`OfficialFactList` from `lib/facts.ts`
  (HIGH-volatility values carry `needsVerification`) or carry a `SourceLink`. No fabricated figures.
- Deterministic math (GPA, ECTS, cost-of-living, deadlines) runs in tested `lib/calc/*`.
- Verification: `npm run typecheck && npm run lint && npm run test && npm run build`
  (tests include `src/test/routes.smoke.test.tsx`, which mounts every route).
