# DeutschPrep — Repository Layout

> Phase 1 design doc. The tree below is the **planned** monorepo; directories are created as their
> phase lands (Phase 2 = models/scrapers, Phase 3 = frontend, Phase 4 = api/agents/llm). Mirrors
> `CLAUDE.md` §5.

```text
deutschprep/
├── CLAUDE.md                      # Persistent project memory / golden rules (source of truth)
├── Claude-Code-Build-Prompts.md   # Phased build playbook
├── README.md                      # Quickstart, dev setup (added when code lands)
├── .env.example                   # Documented env vars; no secrets (Phase 4)
│
├── docs/                          # Docs-first artifacts — written & reviewed before code
│   ├── architecture.md            # C4 views + request lifecycle (Phase 1)
│   ├── agent-workflows.md         # Orchestrator + 6 agents, typed I/O, grounding (Phase 1)
│   ├── feature-matrix.md          # 30 features → agent → tools → sources → output type (Phase 1)
│   ├── repo-layout.md             # This file (Phase 1)
│   ├── data-model.md              # ER diagram + application state machine (Phase 2)
│   ├── data-pipeline.md           # Scraping/refresh design, provenance, rate limits (Phase 2)
│   ├── ui-ux.md                   # Dashboard layout, states, responsive, WCAG AA (Phase 3)
│   └── adr/                       # Architecture Decision Records (context/decision/consequences)
│       ├── 0001-tech-stack.md
│       ├── 0002-agent-orchestration.md
│       └── 0003-rag-and-grounding.md
│
├── backend/                       # FastAPI app, agents, services, scrapers, tests
│   ├── pyproject.toml             # Deps + ruff/black/mypy config (Phase 4)
│   ├── Dockerfile                 # API container (Phase 4)
│   ├── alembic.ini                # Migration config (Phase 2)
│   ├── alembic/                   # Migration scripts + env (Phase 2)
│   │   └── versions/
│   └── app/
│       ├── main.py                # FastAPI entrypoint, app factory, middleware (Phase 4)
│       ├── api/                   # Versioned routers (/api/v1/...)
│       │   └── v1/                #   profiles.py, roadmap.py, documents.py
│       ├── agents/                # Orchestrator + 6 specialists + roadmap_composer
│       │   ├── orchestrator.py    #   planner: routes, never emits official facts
│       │   ├── profile_assessment.py
│       │   ├── document_prep.py
│       │   ├── language_test.py
│       │   ├── finance_logistics.py
│       │   ├── visa_relocation.py
│       │   ├── campus_life.py
│       │   ├── roadmap_composer.py
│       │   └── base.py            #   shared agent contract (typed I/O, scoped tools)
│       ├── llm/                   # Anthropic integration boundary
│       │   ├── client.py          #   wrapper: model from CLAUDE_MODEL, retries, budgeting
│       │   ├── prompts/           #   versioned prompt templates
│       │   ├── schemas.py         #   Pydantic tool-use / output schemas
│       │   └── guardrails.py      #   schema → grounding → PII → safety
│       ├── ingestion/             # Resume/LinkedIn parsing, chunking, PII handling
│       │   ├── resume_parser.py
│       │   ├── normalizer.py
│       │   └── pii.py
│       ├── services/              # Tools & deterministic compute
│       │   ├── gpa_converter.py   #   Modified Bavarian Formula (deterministic, tested)
│       │   ├── ects_calculator.py #   ECTS sums (deterministic, tested)
│       │   ├── program_search.py  #   RAG over DAAD + pgvector
│       │   ├── web_retriever.py   #   cached, cited live retrieval
│       │   ├── cost_of_living.py  #   deterministic cost math
│       │   ├── deadline_tracker.py#   deterministic deadline arithmetic
│       │   ├── document_generator.py
│       │   └── tts.py             #   TTSProvider interface + impls
│       ├── scrapers/              # Source scrapers, each emits ProvenanceRecord
│       │   ├── base.py
│       │   ├── daad.py            #   reference scraper (Phase 2)
│       │   └── uni_assist.py      #   (later)
│       ├── models/                # SQLAlchemy 2.0 models (Phase 2)
│       ├── core/                  # config (pydantic-settings), logging (structlog), security
│       │   ├── config.py
│       │   ├── logging.py
│       │   └── security.py
│       └── db/                    # session, engine, pgvector setup
│   └── tests/                     # pytest; Anthropic + network always mocked
│       ├── conftest.py
│       ├── fixtures/              #   recorded scraper fixtures, sample profiles
│       ├── services/             #   unit tests for deterministic services
│       ├── agents/
│       └── scrapers/
│
├── frontend/                      # React 18 + TS + Vite + Tailwind + shadcn/ui (Phase 3)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── components/            #   RoadmapTracker, ResumeAnalyzer, FeatureModuleGrid, ...
│       ├── pages/                 #   dashboard, document workspace, simulators
│       ├── lib/                   #   api client, TanStack Query hooks, types
│       └── styles/
│
└── infra/                         # Terraform (AWS) + local compose
    ├── docker-compose.yml         #   api + postgres+pgvector + redis (Phase 4)
    └── terraform/                 #   ECS, RDS, ElastiCache, S3, CloudFront, Secrets Manager
```

## Directory purpose (one-liner each)

| Path | Purpose |
|---|---|
| `docs/` | All design artifacts; written and reviewed **before** the matching code (golden rule #1) |
| `docs/adr/` | Immutable decision log — context, decision, consequences |
| `backend/app/api/` | Versioned HTTP surface; thin — delegates to agents/services |
| `backend/app/agents/` | Orchestrator + 6 specialists + composer; the only place LLM planning happens |
| `backend/app/llm/` | Single Anthropic boundary: client, prompts, schemas, guardrails |
| `backend/app/ingestion/` | Untrusted input → typed `Profile`; PII handled here first |
| `backend/app/services/` | Tools; deterministic math lives here and is unit-tested |
| `backend/app/scrapers/` | Source adapters; each row links a `ProvenanceRecord` |
| `backend/app/models/` | SQLAlchemy 2.0 ORM models |
| `backend/app/core/` | Config, structured logging, security primitives |
| `backend/tests/` | pytest; **Anthropic API and live network always mocked** |
| `frontend/src/components/` | Accessible, typed UI components (mock data until Phase 4 wiring) |
| `infra/` | Terraform IaC + local `docker-compose` |

## Conventions (from `CLAUDE.md` §6)

- Backend: `ruff` + `black` + `mypy --strict`. Frontend: ESLint + Prettier + strict TS.
- Tests: `pytest` (backend), Vitest/RTL (frontend). No live network / Anthropic calls in tests.
- Config via `pydantic-settings`; secrets only via env / Secrets Manager.
- Conventional commits; one logical change per commit; commit at each phase boundary.
