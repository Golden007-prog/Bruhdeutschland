# DeutschPrep — Feature Matrix

> Phase 1 design doc. Maps all 30 features → owning agent → required tools/services → data sources →
> output type. Conforms to `CLAUDE.md` §1 (six categories, 30+ features) and §4 (agent ownership).

## Output-type legend

| Type | Meaning | Grounding rule |
|---|---|---|
| **generated** | LLM-authored content (prose, plans, drafts) | No provenance needed; clearly labeled as generated |
| **official-grounded** | A fact from an official source | MUST carry `{value, source_name, source_url, retrieved_at}`; else `needs_verification=true` |
| **deterministic** | Computed by tested Python | Never produced by the model; method recorded |

Many features are **composite** (e.g. an SOP draft = generated, but its cited deadlines =
official-grounded). The "Output type" column lists the dominant type(s).

---

## Category A — Profile & Assessment (Agent 1)

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 1 | Resume / LinkedIn parsing | Profile & Assessment | ResumeParser, Normalizer, PII handler | User upload (PII) | deterministic (extraction) |
| 2 | Profile eval (GPA → German) | Profile & Assessment | **GPAConverter** (Modified Bavarian) | User grades + DAAD scale | **deterministic** |
| 3 | Course / University matching | Profile & Assessment | ProgramSearch (RAG), WebRetriever | DAAD, Uni portals | official-grounded |
| 4 | Skill-gap analysis | Profile & Assessment | (LLM reasoning) | Parsed profile + program reqs | generated |
| 5 | ECTS calculator | Profile & Assessment | **ECTSCalculator** | User transcript | **deterministic** |

## Category B — Document Prep (Agent 2)

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 6 | SOP generator | Document Prep | DocumentGenerator | Profile + program facts | generated |
| 7 | Europass CV | Document Prep | DocumentGenerator | Parsed profile | generated |
| 8 | LOR templates | Document Prep | DocumentGenerator | Profile + program | generated |
| 9 | Uni-Assist walkthrough | Document Prep | WebRetriever, DeadlineTracker | Uni-Assist portal | official-grounded |
| 10 | VPD tracker | Document Prep | WebRetriever, DeadlineTracker | Uni-Assist (VPD) | official-grounded |
| 11 | Translation assistant | Document Prep | DocumentGenerator | User docs | generated (+ disclaimer to use certified translators) |

## Category C — Language & Test Prep (Agent 3)

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 12 | German A1–B2 + TTS | Language & Test | TTSProvider | Curriculum (generated) | generated (+ audio) |
| 13 | SRS flashcards | Language & Test | (LLM + SRS scheduler) | Generated vocab | generated |
| 14 | IELTS / TOEFL mock | Language & Test | WebRetriever | Test format (official), items (generated) | generated + official-grounded (score reqs) |
| 15 | GRE / GMAT checker | Language & Test | WebRetriever | Program admission pages | official-grounded |
| 16 | Goethe / TestDaF guides | Language & Test | WebRetriever | Goethe/TestDaF official | official-grounded |

## Category D — Finance & Logistics (Agent 4) — **disclaimer required**

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 17 | Sperrkonto guide | Finance & Logistics | WebRetriever | Make-it-in-Germany, providers, missions | official-grounded |
| 18 | Cost-of-living calc | Finance & Logistics | **CostOfLivingService** | City datasets + user inputs | **deterministic** |
| 19 | Health-insurance selector | Finance & Logistics | WebRetriever | Insurer official pages | official-grounded |
| 20 | Scholarship finder | Finance & Logistics | WebRetriever, ProgramSearch | DAAD scholarship DB | official-grounded |
| 21 | HiWi / Werkstudent readiness | Finance & Logistics | (LLM reasoning), WebRetriever | Job norms (official hrs limits) | generated + official-grounded (work-hour limits) |

## Category E — Visa & Relocation (Agent 5) — **disclaimer required**

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 22 | Visa interview simulator (voice) | Visa & Relocation | TTSProvider | Generated dialog | generated (+ audio) |
| 23 | Visa checklist + deadlines | Visa & Relocation | WebRetriever, DeadlineTracker | German missions, make-it-in-germany | official-grounded |
| 24 | APS guide | Visa & Relocation | WebRetriever | APS official | official-grounded |
| 25 | Accommodation finder | Visa & Relocation | WebRetriever | Listings + Studierendenwerk | official-grounded (where official) |
| 26 | Anmeldung simulation | Visa & Relocation | (LLM), WebRetriever | City Bürgeramt info | generated + official-grounded (required docs) |

## Category F — Campus Life (Agent 6)

| # | Feature | Owning agent | Tools / services | Data sources | Output type |
|---|---|---|---|---|---|
| 27 | Pre-departure checklist | Campus Life | (LLM), WebRetriever | Generated + official items | generated + official-grounded |
| 28 | Academic networking | Campus Life | (LLM reasoning) | Profile | generated |
| 29 | Deutschlandticket guide | Campus Life | WebRetriever | Official ticket info | official-grounded |
| 30 | Academic culture & plagiarism | Campus Life | (LLM), WebRetriever | Uni academic-integrity pages | generated + official-grounded |

---

## Roll-up

| Category | Agent | Features | # |
|---|---|---|---|
| A Profile & Assessment | 1 | 1–5 | 5 |
| B Document Prep | 2 | 6–11 | 6 |
| C Language & Test Prep | 3 | 12–16 | 5 |
| D Finance & Logistics | 4 | 17–21 | 5 |
| E Visa & Relocation | 5 | 22–26 | 5 |
| F Campus Life | 6 | 27–30 | 4 |
| **Total** | | | **30** |

### Output-type distribution (dominant type)

| Output type | Count | Features |
|---|---|---|
| deterministic | 4 | 1, 2, 5, 18 |
| official-grounded | 11 | 3, 9, 10, 15, 16, 17, 19, 20, 23, 24, 29 |
| generated | 8 | 4, 6, 7, 8, 11, 12, 13, 22, 28 |
| composite (generated + official) | 7 | 14, 21, 25, 26, 27, 30 |

> **Disclaimer-required features (10):** all of Category D (17–21) and Category E (22–26) —
> finance/immigration guidance (`CLAUDE.md` §2 rule 5).

### Deterministic-service features (must be tested Python, never the model)

| Feature | Service | Method |
|---|---|---|
| 2 GPA → German | `GPAConverter` | Modified Bavarian Formula |
| 5 ECTS calculator | `ECTSCalculator` | ECTS summation/normalization |
| 18 Cost-of-living | `CostOfLivingService` | City dataset + user-input arithmetic |
| (cross-cutting) deadlines | `DeadlineTracker` | Date arithmetic / ordering |
