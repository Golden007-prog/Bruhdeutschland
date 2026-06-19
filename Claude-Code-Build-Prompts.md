# DeutschPrep — Claude Code Build Prompts

A ready-to-use prompt playbook for building the German Master's admission copilot in **Claude
Code**. Designed for a **docs-first** build: Claude Code produces architecture and design docs you
review *before* it writes application code.

---

## How to use this

1. **Drop `CLAUDE.md` into your repo root.** Claude Code reads it automatically as persistent
   project memory, so you don't have to restate the stack and rules every time.
2. **Run the phased prompts in order (recommended).** Paste Phase 1, review the docs it produces,
   then paste Phase 2, and so on. Each phase ends with a checkpoint and waits for your approval.
3. **Or paste the single Master Prompt** (bottom of this file) if you'd rather kick off the whole
   sequence at once — it still pauses after each phase for review.

> Tip: run `claude` in your repo, use **plan mode** (`shift+tab`) for big phases, and commit at
> each phase boundary so you can roll back cleanly.

---

## Before you start (one important reality check)

- A **Claude.ai Pro/Max subscription powers the Claude apps and Claude Code itself**, but a
  **deployed web backend needs an Anthropic API key** (billed via `console.anthropic.com`, or via
  **AWS Bedrock / Google Vertex** if you prefer cloud billing). They are separate things — your
  product's server can't authenticate to the API using a personal chat subscription. Plan for API
  keys + per-user rate limiting/cost controls, and confirm current options at
  `docs.claude.com`. (Check current model names and pricing there too.)
- Keep keys in a secret manager, **never in git**. Add billing alerts early.

---

## Phase 1 — System Architecture & Agentic Workflow  *(docs only)*

```text
You are the lead architect for DeutschPrep. First, read CLAUDE.md in full and treat it as binding.

PHASE 1 — System Architecture & Agentic Workflow. DOCS ONLY — do NOT scaffold backend or frontend
application code yet.

Goal: produce the complete architecture and multi-agent design as reviewable documents.

Create these files:
- docs/architecture.md — C4-style overview (system context, container, component) with Mermaid
  diagrams. Show how the React frontend, FastAPI backend, Orchestrator + agents, Claude API,
  Postgres/pgvector, Redis, scrapers, and the TTS provider communicate. Include the full request
  lifecycle for "ingest profile → generate roadmap," including where caching, queues, and
  guardrails sit.
- docs/agent-workflows.md — the multi-agent system: one Orchestrator/Planner + the 6 specialist
  agents from CLAUDE.md. For each agent specify: responsibility, typed Pydantic input/output
  (sketch), the scoped tools it may call, and its grounding requirement. Define the Roadmap
  Composer. Document the anti-hallucination strategy: RAG grounding, structured outputs,
  deterministic compute for all math, provenance on every official claim, the guardrail layer,
  and the needs_verification path.
- docs/feature-matrix.md — a table mapping all 30 features → owning agent → required
  tools/services → data sources → output type (generated | official-grounded | deterministic).
- docs/adr/0001-tech-stack.md, 0002-agent-orchestration.md, 0003-rag-and-grounding.md — short ADRs
  (context / decision / consequences). In 0002, weigh native Anthropic tool-use vs LangGraph and
  recommend one with reasons.
- docs/repo-layout.md — the planned monorepo tree with a one-line purpose per directory.

Constraints: follow the stack and golden rules in CLAUDE.md exactly. Use Mermaid for every
diagram. Keep each doc skimmable (headings + tables over walls of text).

When done: print a concise summary of key decisions and any open questions, then STOP and wait for
my review. Do not begin Phase 2.
```

---

## Phase 2 — Database & Data Pipeline

```text
Re-read CLAUDE.md and docs/architecture.md before starting.

PHASE 2 — Database schema + DAAD data pipeline, with one working vertical slice.

Create:
- docs/data-model.md — ER diagram (Mermaid) + narrative. Entities at minimum: User, Profile,
  ParsedProfileFacts, University, Program (DAAD), ProgramRequirement, SavedUniversity,
  Application, ApplicationStep, RoadmapItem, Document (SOP/CV/LOR), DeadlineEvent, ScrapeSource,
  ProvenanceRecord. Model application progress as an explicit state machine (define the states +
  transitions).
- backend/app/models/*.py — SQLAlchemy 2.0 models for the schema, plus an Alembic migration. Add a
  pgvector embedding column on Program for semantic matching.
- docs/data-pipeline.md — design for scraping and refreshing DAAD program data (and, where
  feasible, Uni-Assist and specific university portals): scheduling (Celery beat), incremental
  refresh + change detection, rate limiting, robots.txt compliance, caching, provenance capture,
  and validation. Prefer official/open data sources where they exist; document fallbacks and
  failure handling.
- backend/app/scrapers/daad.py — ONE reference scraper implemented as a tested vertical slice
  (httpx + parser) that writes normalized rows AND a ProvenanceRecord for each. Include a pytest
  that uses a recorded fixture — no live network calls in tests.

Constraints: every official value must link a ProvenanceRecord; never persist unsourced official
data. All transforms deterministic and unit-tested. Follow CLAUDE.md.

When done: summarize the schema + pipeline design, run the tests and show the output, then STOP for
my review.
```

---

## Phase 3 — UI/UX Blueprint (Claude Design)

```text
Re-read CLAUDE.md before starting.

PHASE 3 — UI/UX blueprint + 2–3 core components. Use mock data only; no backend dependency yet.

Create:
- docs/ui-ux.md — the main dashboard layout: navigation, the roadmap timeline, the profile/score
  panel, the 6 feature-category modules, the document workspace, and the language/visa simulators.
  Describe empty / loading / error states, responsive behavior (mobile→desktop), and accessibility
  (WCAG 2.1 AA: keyboard, contrast, semantics). Include a low-fidelity ASCII or Mermaid wireframe.
- frontend/src/components/RoadmapTracker.tsx — a stepped/vertical timeline of RoadmapItems with
  status (locked / active / done), category color coding, and overall progress.
- frontend/src/components/ResumeAnalyzer.tsx — upload + parsed-profile review: extracted facts,
  the German GPA conversion result, skill-gap chips, and "needs verification" badges on any
  ungrounded value.
- frontend/src/components/FeatureModuleGrid.tsx — the six category cards, each showing its feature
  count and progress.

Stack: React 18 + TypeScript + Tailwind + shadcn/ui. Typed props, sensible default mock data,
fully accessible, no localStorage/sessionStorage.

When done: summarize each component's prop API, then STOP for my review.
```

---

## Phase 4 — Core Implementation (LLM routing layer)

```text
Re-read CLAUDE.md and docs/agent-workflows.md before starting.

PHASE 4 — The FastAPI backend slice that ingests a profile and generates the personalized roadmap
via Claude. Implement the core loop end-to-end; stub the not-yet-built specialist agents behind
typed interfaces.

Create:
- backend/app/main.py + routers:
    POST /api/v1/profiles/ingest   (accept resume PDF/DOCX, a LinkedIn export, or intake JSON)
    POST /api/v1/roadmap/generate
    GET  /api/v1/roadmap/{id}      (support SSE streaming of progress)
- backend/app/ingestion/ — parse + normalize uploads into the typed Profile; chunk large
  documents; redact/handle PII.
- backend/app/llm/client.py — Anthropic wrapper: model from CLAUDE_MODEL env, retries with
  backoff, timeouts, token budgeting, structured output via Pydantic + tool-use/JSON schema, and a
  guardrail that rejects ungrounded official claims (sets needs_verification).
- backend/app/agents/ — the Orchestrator, the Profile & Assessment specialist, and the Roadmap
  Composer — enough to produce a real roadmap end-to-end. Other specialists: typed stubs.
- backend/app/services/gpa_converter.py (Modified Bavarian Formula) and ects_calculator.py —
  deterministic and fully unit-tested.
- Tests: pytest with the Anthropic client mocked (no live calls) + a golden-file test asserting
  the Roadmap schema.
- backend/Dockerfile + docker-compose.yml (api, postgres+pgvector, redis) so it runs locally.

Constraints: config via pydantic-settings/env; no secrets in code; structured logging; every
official value carries provenance or needs_verification; show the disclaimer on relevant output.
Follow CLAUDE.md.

When done: run the tests, generate a sample roadmap from a fixture profile (with the LLM mocked),
show the output, then summarize and STOP.
```

---

## Single Master Prompt (all-in-one alternative)

Paste this once if you prefer not to drive the phases manually. It still checkpoints after each
phase.

```text
You are the lead architect and full-stack engineer for DeutschPrep, an AI copilot that turns a
student's resume/LinkedIn/intake form into a personalized roadmap for applying to Master's programs
at German public universities (30+ features across profile, documents, language/tests, finance,
visa, and campus life).

First, read CLAUDE.md in full and treat every rule in it as binding — especially: docs before
code, never fabricate official facts (cite provenance or set needs_verification), deterministic
code for all math, and structured (Pydantic-validated) LLM outputs.

Execute these phases IN ORDER. After each phase, run any relevant checks/tests, print a concise
summary plus open questions, and STOP for my approval before continuing. Do NOT write application
code during Phase 1.

PHASE 1 (docs only): docs/architecture.md (C4 + Mermaid, full "ingest profile → roadmap"
lifecycle), docs/agent-workflows.md (Orchestrator + the 6 specialist agents with typed I/O, scoped
tools, grounding rules, the Roadmap Composer, and the anti-hallucination strategy),
docs/feature-matrix.md (all 30 features → agent → tools → data sources → output type), ADRs
(tech stack, agent orchestration, RAG/grounding), and docs/repo-layout.md.

PHASE 2: docs/data-model.md (ER diagram + application state machine); SQLAlchemy 2.0 models +
Alembic migration with a pgvector column on Program; docs/data-pipeline.md (DAAD/Uni-Assist refresh
design: scheduling, incremental updates, rate limits, robots.txt, provenance, validation); and one
tested reference scraper backend/app/scrapers/daad.py with recorded fixtures.

PHASE 3: docs/ui-ux.md (dashboard layout, states, responsive, WCAG AA) plus three React+TS+Tailwind
+shadcn/ui components with mock data: RoadmapTracker, ResumeAnalyzer, FeatureModuleGrid.

PHASE 4: FastAPI LLM routing layer — ingest endpoint (PDF/DOCX/LinkedIn/JSON), parsing + chunking +
PII handling, an Anthropic client wrapper (model from CLAUDE_MODEL, retries, structured output,
grounding guardrail), the Orchestrator + Profile&Assessment agent + Roadmap Composer producing a
real roadmap end-to-end (other agents stubbed), deterministic gpa_converter + ects_calculator with
unit tests, pytest with the LLM mocked, and Docker + docker-compose (api, postgres+pgvector, redis).

Begin with Phase 1 now.
```

---

## Running tips for Claude Code

- **Commit per phase** (`git commit` at each checkpoint) so each review is a clean diff.
- Use **plan mode** before Phases 2 and 4 (multi-file) and approve the plan first.
- If a phase is large, tell Claude Code to *"do Phase X in steps, pausing after each file group."*
- Keep CLAUDE.md updated as decisions land — it's the project's source of truth.
- For the scrapers, instruct it to **respect robots.txt and rate limits** and to prefer official
  DAAD open data over HTML scraping wherever available.
