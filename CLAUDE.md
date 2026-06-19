# CLAUDE.md — DeutschPrep (German Master's Admission Copilot)

> **Persistent project memory for Claude Code.** Read this file in full before any task.
> If a user prompt conflicts with this file, follow this file and flag the conflict.

---

## 1. What we are building

DeutschPrep is an AI copilot that ingests a student's **LinkedIn profile, resume, or intake
form** and generates a personalized, end-to-end roadmap for applying to **Master's programs at
German public universities**. Scope spans six categories and 30+ features: profile evaluation,
application/document prep, language & test prep, finance & logistics, visa & relocation, and
campus life. The LLM engine is **Claude (Opus-class)** via the Anthropic API.

---

## 2. Golden rules (read first — these override convenience)

1. **Docs before code.** For any new subsystem, write or update the doc in `/docs` and get it
   reviewed *before* writing implementation. Do not scaffold application code until the relevant
   ADR / design doc exists.
2. **Never fabricate official facts.** Visa rules, application deadlines, tuition &
   *Semesterbeitrag*, blocked-account (*Sperrkonto*) amounts, APS requirements, and language
   thresholds **must** come from a retrieved, cited source (DAAD, Uni-Assist, the specific
   university portal, German missions/`make-it-in-germany`). If a value is not grounded, return
   `null` with `needs_verification: true` — never a guess.
3. **Every official claim carries provenance:** `{ value, source_name, source_url, retrieved_at }`.
4. **The LLM plans and writes; deterministic code computes.** GPA conversion (Modified Bavarian
   Formula), ECTS sums, cost-of-living math, and deadline arithmetic run in **tested Python** —
   never "computed by the model."
5. **Always attach the disclaimer** to visa/finance/immigration output: *"Guidance only, not
   legal or financial advice. Verify against official sources before acting."*
6. **Structured outputs only.** Every LLM call that feeds the app returns a Pydantic-validated
   schema (tool-use / JSON schema). No free-form text is parsed downstream.
7. **PII is sensitive.** Resumes and LinkedIn data are personal data. Encrypt at rest, never log
   raw PII, and design for GDPR (data export + deletion).

---

## 3. Tech stack (pinned — do not substitute without an ADR)

**Backend**
- Python 3.12, **FastAPI**, **Pydantic v2**, `pydantic-settings` for 12-factor config
- **SQLAlchemy 2.0** + **Alembic** migrations
- **PostgreSQL 16** with **pgvector** for semantic search over program/DAAD data
- **Redis** for caching + task queue; **Celery** (or RQ) for scraping/refresh jobs
- **Anthropic Python SDK** (`anthropic`) — model id from `CLAUDE_MODEL` env var (Opus-class)
- HTTP: `httpx`; parsing: `selectolax`/`beautifulsoup4`; **Playwright** only for JS-heavy portals
- `structlog` for structured logging

**Agent orchestration**
- Default to a **thin custom orchestrator built on native Anthropic tool-use + Pydantic** for
  determinism and traceability. Evaluate LangGraph as an alternative in ADR-0002; do not adopt a
  heavy framework without recording that decision.

**Frontend**
- **React 18 + TypeScript + Vite**, **Tailwind CSS**, **shadcn/ui**, **TanStack Query**,
  React Router. Charts via Recharts. (Claude Design principles: clean, accessible, responsive.)

**Pluggable providers (interface, never hardcode a vendor)**
- `TTSProvider` for text-to-speech (language module, visa simulator voice)
- `LLMProvider` wrapping Anthropic (keeps model swaps and testing clean)

**Infra**
- **Docker** + `docker-compose` (api, postgres+pgvector, redis) for local dev
- **AWS**: ECS Fargate (or EKS), RDS Postgres, ElastiCache Redis, S3 (documents), CloudFront,
  Secrets Manager, CloudWatch. IaC via **Terraform** under `/infra`.
- Auth: OAuth/JWT (Cognito or Auth0).

---

## 4. Agentic architecture (anti-hallucination by design)

```
User input ─▶ Ingestion (parse + normalize + PII handling)
           ─▶ Orchestrator / Planner agent  ──routes──▶ 6 specialist agents
                                                         (typed I/O + scoped tools)
           ◀─ Roadmap Composer (assembles validated outputs) ◀─┘
           ─▶ Guardrail layer (schema + grounding + safety) ─▶ API response
```

**Orchestrator / Planner agent** — interprets the profile + goals, builds an execution plan,
routes to specialists, never produces official facts itself.

**Six specialist agents** (each: single responsibility, typed Pydantic input/output, a *scoped*
toolset, and an explicit grounding requirement):

| # | Agent | Owns features |
|---|-------|---------------|
| 1 | **Profile & Assessment** | 1 Resume/LinkedIn parsing · 2 Profile eval (GPA→German) · 3 Course/University matching · 4 Skill-gap analysis · 5 ECTS calculator |
| 2 | **Document Prep** | 6 SOP generator · 7 Europass CV · 8 LOR templates · 9 Uni-Assist walkthrough · 10 VPD tracker · 11 Translation assistant |
| 3 | **Language & Test Prep** | 12 German A1–B2 + TTS · 13 SRS flashcards · 14 IELTS/TOEFL mock · 15 GRE/GMAT checker · 16 Goethe/TestDaF guides |
| 4 | **Finance & Logistics** | 17 Sperrkonto guide · 18 Cost-of-living calc · 19 Health-insurance selector · 20 Scholarship finder · 21 HiWi/Werkstudent readiness |
| 5 | **Visa & Relocation** | 22 Visa interview simulator (voice) · 23 Visa checklist + deadlines · 24 APS guide · 25 Accommodation finder · 26 Anmeldung simulation |
| 6 | **Campus Life** | 27 Pre-departure checklist · 28 Academic networking · 29 Deutschlandticket guide · 30 Academic culture & plagiarism |

**Roadmap Composer** — merges specialist outputs into the canonical `Roadmap` object
(ordered, dependency-aware `RoadmapItem`s with status, category, deadlines, provenance).

**Shared services / tools**
`ResumeParser` · `GPAConverter` (deterministic) · `ECTSCalculator` (deterministic) ·
`ProgramSearch` (RAG over DAAD + pgvector) · `WebRetriever` (cached, cited live data) ·
`TTSProvider` · `CostOfLivingService` · `DeadlineTracker` (deterministic) · `DocumentGenerator`.

**Guardrail layer** (runs on every agent output): output-schema validation → grounding check
(reject ungrounded official claims, set `needs_verification`) → PII redaction in logs →
content safety.

---

## 5. Repo layout (monorepo)

```
/backend      FastAPI app, agents, services, scrapers, tests, Dockerfile
  /app
    /api          routers (versioned: /api/v1/...)
    /agents       orchestrator + 6 specialists + roadmap_composer
    /llm          Anthropic client wrapper, prompts, schemas, guardrails
    /ingestion    resume/LinkedIn parsing, chunking, PII handling
    /services     gpa_converter, ects_calculator, program_search, tts, ...
    /scrapers     daad.py, uni_assist.py, ... + provenance
    /models       SQLAlchemy models
    /core         config, logging, security
  /alembic
  /tests
/frontend     React + TS + Vite + Tailwind + shadcn/ui
  /src/components, /src/pages, /src/lib
/infra        Terraform (AWS), docker-compose.yml
/docs         architecture.md, agent-workflows.md, data-model.md, ui-ux.md,
              data-pipeline.md, feature-matrix.md, repo-layout.md, /adr/*.md
```

---

## 6. Conventions & Definition of Done

- **Lint/format/type:** `ruff` + `black` + `mypy --strict` (backend); ESLint + Prettier + strict
  TS (frontend). Code must pass before a task is "done."
- **Tests:** `pytest` backend, Vitest/RTL frontend. **Anthropic API and live network are always
  mocked in tests** (use recorded fixtures for scrapers). Deterministic services have unit tests.
- **Config:** all settings via env (`pydantic-settings`); **no secrets in code or git**. Provide
  `.env.example`.
- **Commits:** conventional commits; one logical change per commit; commit at each phase boundary.
- **Accessibility:** WCAG 2.1 AA — keyboard nav, contrast, semantic HTML, ARIA where needed.
- **A feature is done when:** typed I/O validated, grounding/provenance enforced for official
  data, tests pass, lint/type clean, doc updated, and the disclaimer is shown where required.

---

## 7. Working agreement for Claude Code

- Prefer **plan mode** for anything spanning multiple files; show the plan before editing.
- **Stop at each phase boundary**, summarize what changed + open questions, and wait for review.
- Make the **smallest correct change**; don't refactor unrelated code.
- When unsure about an official German requirement, **do not invent it** — wire the
  `needs_verification` path and note the source to confirm.
