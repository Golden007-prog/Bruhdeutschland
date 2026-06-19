# Page & Button Audit — DeutschPrep

> Phase 0 deliverable of the ULTRACODE master work order. Inventory of every route, every
> interactive element, its data source, and its status. Re-audited 2026-06-19 against the live
> 55-route registry (`frontend/src/lib/nav.tsx`). Supersedes the earlier pre-work-order baseline.
>
> **Status legend:** `working` (renders real content, all controls wired) · `partial` (real content
> but a control is a no-op / a promised feature is absent) · `placeholder` (scaffold stub) ·
> `broken` (crashes / obvious bug). **Goal: 0 broken, 0 placeholder, 0 dead buttons.**
>
> Method: 5 parallel auditor agents read every page file in full; the global shell, providers,
> persistence, and Supabase wiring were read directly. No files were modified during the audit.

---

## 1. Headline result

| | count |
|---|---|
| Routes audited | 55 |
| `broken` | **0** |
| `placeholder` (scaffold stub) | **0** |
| `partial` (real content, a wiring gap) | **2** (`/settings`, `/documents/translation`) |
| `working` | **53** |
| Genuinely dead buttons (no-op CTA) | **1** (`/settings` → "Save details") |

The existing domain app is **not broken**. The master work order's value is in the **systemic
wiring gaps** (§3) and the **missing product shell** (§4) — not in repairing dead routes.

---

## 2. Per-route status

All routes render real content unless noted. Issues are detailed in §3 / §5.

### Overview
| Route | File | Status | Notable |
|---|---|---|---|
| `/` | overview/Dashboard | working | Uses hardcoded `mockData` (profile `DPR-2026-0042`), not the user's intake. |
| `/roadmap` | overview/Roadmap | working | Two disconnected progress systems (persisted step status vs static `mockRoadmapItems`). |
| `/process` | overview/Process | working | Read-only by design; stage states are fixed seed. |
| `/deadlines` | overview/Deadlines | working | Deterministic `alertable`; verification flags present. |
| `/events` | overview/Events | working | Seed watch windows + source links. |
| `/documents-checklist` | overview/DocumentsHub | working | Persisted per-tab checklists (`storageKey`). |
| `/timeline` | overview/Timeline | working | Presentational prep arc. |
| `/sources` | overview/Sources | working | Source registry; no guard for a missing key (low risk). |

### Profile & Assessment
| Route | File | Status | Notable |
|---|---|---|---|
| `/profile` | profile/Overview | working | Sample snapshot from `mockData`. |
| `/profile/parse` | profile/Parse | working | AI + demo parse; **PDF/DOCX drop zone is a disabled stub** (paste-only); parsed profile **not persisted** so it doesn't feed downstream tools despite copy. PII handling is correct (null + `needsVerification`, no fabricated official values). |
| `/profile/evaluate` | profile/Evaluate | working | Deterministic Modified-Bavarian via `lib/calc/gpa`. Strong. |
| `/profile/matching` | profile/Matching | working | AI + seed shortlist; requirements flagged + cited. |
| `/profile/skill-gap` | profile/SkillGap | working | AI + seed; recommendations keyed to seed ids. |
| `/profile/ects` | profile/Ects | working | Deterministic `lib/calc/ects`. Strong. |

### Document Prep
| Route | File | Status | Notable |
|---|---|---|---|
| `/documents` | documents/Overview | working | Checklist may not persist (no `storageKey` passed). |
| `/documents/sop` | documents/Sop | working | AI + template fallback; **no copy/download**; draft not persisted. |
| `/documents/cv` | documents/Cv | working | AI polish; **no copy/download/Europass-editor link**; not persisted. |
| `/documents/lor` | documents/Lor | working | AI tailoring; output `readOnly` with **no copy/download**; not persisted. |
| `/documents/uni-assist` | documents/UniAssist | working | Facts flagged + cited. |
| `/documents/vpd` | documents/Vpd | working | Tracker state is `useState` only — **lost on reload** (persistence expected). |
| `/documents/translation` | documents/Translation | **partial** | Title promises "prepare drafts" but ships only checklists/guidance — **drafting tool absent**; `justiz-dolmetscher.de` is plain text, not a link. |

### Language & Test Prep
| Route | File | Status | Notable |
|---|---|---|---|
| `/language` | language/Overview | working | Nav hub; facts from `facts.ts`. |
| `/language/german` | language/German | working | CEFR tabs + per-phrase TTS (no Stop control). |
| `/language/flashcards` | language/Flashcards | working | Deterministic SM-2, persisted. Strong. |
| `/language/ielts-toefl` | language/IeltsToefl | working | Format tables + facts + runner links. |
| `/language/gre-gmat` | language/GreGmat | working | Interactive self-check; `aria-live` guidance. |
| `/language/goethe-testdaf` | language/GoetheTestdaf | working | Certificate comparison; telc/DSH have no runner (by design). |
| `/language/exams` | language/ExamsHub | working | 6-card hub. |
| `/language/exams/{ielts,toefl,testdaf,goethe,gre,gmat}` | language/exams/* | working | Live engine: generate → TTS/STT → score → review; AI provider → seed fallback; deterministic scoring. Engine caveats in §3.9. |

### Finance & Logistics (disclaimer required — all present)
| Route | File | Status | Notable |
|---|---|---|---|
| `/finance` | finance/Overview | working | Facts via `OfficialFactList`. |
| `/finance/sperrkonto` | finance/Sperrkonto | working | `SPERRKONTO_AMOUNT` grounded; `needsVerification`. |
| `/finance/cost-of-living` | finance/CostOfLiving | working | Deterministic `lib/calc/costOfLiving`. Strong. |
| `/finance/health-insurance` | finance/HealthInsurance | working | Radio selector + rule-of-thumb. |
| `/finance/scholarships` | finance/Scholarships | working | Filters; no empty-state if a filter yields 0 (seed never triggers). |
| `/finance/work` | finance/Work | working | **"140/280 days" hardcoded in prose** (duplicates `WORK_LIMIT`). |

### Visa & Relocation (disclaimer required — all present)
| Route | File | Status | Notable |
|---|---|---|---|
| `/visa` | visa/Overview | working | Facts + journey StepList. |
| `/visa/simulator` | visa/Simulator | working | AI feedback; strong a11y; refuses to coach lying. |
| `/visa/checklist` | visa/Checklist | working | Fee + processing grounded. |
| `/visa/aps` | visa/Aps | working | India listed first + APS-required; **`APS_COUNTRIES` hardcoded** in page. |
| `/visa/accommodation` | visa/Accommodation | working | Scam flags; avoids quoting rents. |
| `/visa/anmeldung` | visa/Anmeldung | working | **"14 days" hardcoded in prose** (duplicates `ANMELDUNG_WINDOW`). |

### Campus Life
| Route | File | Status | Notable |
|---|---|---|---|
| `/campus` | campus/Overview | working | Only the "Open" link is clickable, not the whole card (minor). |
| `/campus/pre-departure` | campus/PreDeparture | working | Persisted checklists. |
| `/campus/networking` | campus/Networking | working | Copy works; **edited templates not persisted**; clipboard failure is silent. |
| `/campus/deutschlandticket` | campus/Deutschlandticket | working | Price grounded in `facts.ts`. |
| `/campus/culture` | campus/Culture | working | Dashed "More" box visually mimics the placeholder convention (restyle). |

### System
| Route | File | Status | Notable |
|---|---|---|---|
| `/about` | system/About | working | Methodology; disclaimer present. |
| `/settings` | system/Settings | **partial** | **Intake "Save details" is a no-op** (`useState` only, lost on reload) while copy claims "stays on this device". AiSettings + AccountPanel are fully wired. |
| `*` (404) | system/NotFound | working | Two recovery links. |

---

## 3. Cross-cutting findings (the real backlog)

1. **Profile pipeline is unwired (P0).** `/settings` collects name/country/degree/grade/intake/field/
   German level but discards it; `/profile/parse` extracts a profile but never persists it. Meanwhile
   `/` (Dashboard), `/profile`, `/profile/skill-gap` render canned `lib/mockData`. Fix: a persisted
   **profile store** (`useSyncedState`, Supabase `profiles` when signed in) that the intake form and
   Parse both write, and that Dashboard / Evaluate / ECTS / Matching / SkillGap / Roadmap read. Run the
   grade through `lib/calc/gpa` instead of the mock seal.
2. **Persistence gaps (P1).** VPD tracker, SOP/CV/LOR drafts, networking templates, `/documents`
   checklist — convert local `useState` to `useSyncedState`/`storageKey`.
3. **No copy/download/export on document outputs (P1).** SOP, CV, LOR are select-all-from-textarea
   only. Add Copy + Download (and a Europass-editor link on CV).
4. **Grounding-drift: prose literals (P1).** Derive "140/280 days" (`finance/Work`), "14 days"
   (`visa/Anmeldung`), and `APS_COUNTRIES` (`visa/Aps`) from `facts.ts` so they can't diverge from the
   cited source.
5. **No "re-verify / refresh source" affordance (P1, explicit user ask).** Add a per-fact "last
   verified · re-check now" control (esp. University/matching + finance + visa research pages) that
   re-fetches via a WebRetriever path and updates `retrieved_at`.
6. **`/documents/translation` feature gap (P1).** Build the promised drafting affordance or correct
   the description; make the translator-directory a real link.
7. **Roadmap dual progress (P2).** Unify the persisted step status with `RoadmapTracker`.
8. **`/profile/parse` PDF/DOCX upload is a disabled stub (P1).** Implement real PDF/DOCX parsing
   (work order §11) with the editable review-before-compute form.
9. **Exam-engine a11y/robustness (P2).** Timer cannot be paused; `speechSynthesis.pause()` is flaky;
   STT silent no-op on permission denial; `role="timer"` announces every tick. Polish in Phase 5.
10. **Seed-source inconsistency (P2).** Profile pages pull from `lib/mockData`; convention elsewhere is
    `lib/seed/`. Consolidate.

---

## 4. Missing product shell (work order §8 catalog A–F)

✅ present · ⚠️ partial · ❌ missing

**A. Marketing/public:** Landing ❌ · How-it-works ❌ · Features overview ❌ · Pricing ❌ · Sample
roadmap demo ❌ · Testimonials ❌ · Blog/Guides ❌ · Universities explorer ❌ · About ✅ · Contact ❌

**B. Auth & account:** Sign up ❌ · Log in ❌ · Magic-link screen ⚠️ (logic in AccountPanel, no screen)
· OAuth callback ❌ · Password reset ❌ · Email verify ❌ · Account settings ⚠️ · Notification prefs ❌
· GDPR export ❌ · Delete account ❌ · Session/device mgmt ❌ · Auth error page ❌

**C. Onboarding:** Wizard ❌ · Resume upload ⚠️ (paste-only) · LinkedIn PDF upload ❌ · Manual intake
⚠️ (no persist) · Parse review/confirm ⚠️ · Goals setup ❌ · Welcome/first-value ❌

**D. Dashboard:** Dashboard ✅ (mock data) · Roadmap ✅ · Application tracker (Kanban) ❌ · Deadline
calendar ⚠️ (list only) · Document vault ❌ · AI assistant/chat ❌ · Global search (cmd-K) ❌ ·
Notifications center ❌ · Program comparison ❌ · Readiness score ❌ · Activity timeline ⚠️

**E. Settings:** BYOK keys ✅ · Owner-Mode URL ✅ · Dark-mode toggle ❌ · i18n switch ❌ · Data &
privacy ❌ · Supabase session ⚠️

**F. Support/system:** Help/FAQ ❌ · Product tour ❌ · Changelog ❌ · Feedback widget ❌ · Privacy
Policy ❌ · Terms ❌ · Accessibility statement ❌ · Cookie consent ❌ · 404 ✅ · 500/error-boundary ❌
· Maintenance ❌ · Empty states ⚠️ · Offline/seed fallback ✅ · Persistent disclaimer ✅

---

## 5. Backend status

- **Supabase client** (`lib/supabase/client.ts`): degrades gracefully when unconfigured (localStorage
  only). Anon-key only, RLS-protected — correct.
- **Auth helpers** (`lib/supabase/auth.ts`): magic-link + Google OAuth + `onAuthChange` exist. **No
  AuthProvider/context, no route guards, no dedicated auth pages.**
- **Migration** `supabase/migrations/0001_init.sql`: 9 tables + RLS + signup trigger — solid. **Missing
  work-order tables:** `applications`, `deadlines`, `notifications`, `audit_log`.
- **Not yet applied** to the live project (`dxfjstgnokncqabnumkr`); repo secrets + Auth URL config + MCP
  OAuth still pending (manual).

---

## 6. Prioritized fix backlog

- **P0:** profile store + wire intake/Parse → Dashboard/GPA/Roadmap; Supabase provision (migration +
  RLS) and AuthProvider + guards + auth pages.
- **P1:** persistence on stateful tools; copy/download on documents; grounding-drift literals →
  `facts.ts`; re-verify/refresh affordance; real PDF/DOCX resume upload; translation drafting.
- **P2:** roadmap unification; exam-engine a11y; seed-source consolidation; Scholarships empty state;
  Sources missing-key guard; campus card hit-area + dashed-box restyle.

Each fix's verification (unit test / route smoke / Playwright e2e) is tracked in the task list and
linked from the relevant PR.
