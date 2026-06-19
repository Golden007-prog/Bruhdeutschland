# DeutschPrep — System Architecture

> **Status:** Phase 1 design doc (reviewable). No application code yet.
> **Audience:** engineers, reviewers. Read alongside `agent-workflows.md` and the ADRs.
> Conforms to `CLAUDE.md` §3 (stack), §4 (agentic architecture), §5 (repo layout).

DeutschPrep ingests a student's resume / LinkedIn / intake form and produces a personalized,
provenance-backed roadmap for applying to Master's programs at German public universities. This
document gives a C4-style view (Context → Container → Component) plus the full request lifecycle for
the core path: **ingest profile → generate roadmap**.

The architecture is built around one principle from `CLAUDE.md` §2: **the LLM plans and writes;
deterministic code computes; every official fact carries provenance or is marked
`needs_verification`.**

---

## 1. C4 Level 1 — System Context

```mermaid
graph TB
    student["👤 Student<br/>(applicant)"]
    advisor["👤 Admin / Advisor<br/>(content + support)"]

    subgraph DP["DeutschPrep System"]
        app["DeutschPrep<br/>(web app + agentic backend)"]
    end

    claude["Anthropic Claude API<br/>(Opus-class LLM)"]
    tts["TTS Provider<br/>(pluggable)"]
    sources["Official German sources<br/>DAAD · Uni-Assist · Uni portals<br/>make-it-in-germany · missions"]
    auth["Identity Provider<br/>(Auth0)"]
    storage["Object Storage<br/>(S3 — documents)"]

    student -->|"uploads profile,<br/>reviews roadmap"| app
    advisor -->|"curates data,<br/>monitors quality"| app

    app -->|"prompts + tool-use<br/>(structured output)"| claude
    app -->|"synthesizes speech<br/>(language/visa sim)"| tts
    app -->|"retrieves + caches<br/>cited data"| sources
    app -->|"OAuth / JWT"| auth
    app -->|"stores resumes,<br/>generated docs"| storage

    classDef ext fill:#eee,stroke:#999,color:#333;
    class claude,tts,sources,auth,storage ext;
```

| Actor / External | Interaction | Notes |
|---|---|---|
| **Student** | Uploads profile, reviews & acts on roadmap | Primary user; PII owner (GDPR subject) |
| **Admin / Advisor** | Curates scraped data, monitors grounding quality | Internal role |
| **Anthropic Claude API** | Planning + writing via tool-use; returns structured output | Model id from `CLAUDE_MODEL`; never the source of official facts |
| **TTS Provider** | Speech for language module + visa simulator | Behind `TTSProvider` interface (no vendor hardcoding) |
| **Official sources** | DAAD, Uni-Assist, university portals, missions | Only valid origin of official facts; always cited |
| **Identity Provider** | Authentication | **Auth0** (OAuth/JWT) |
| **Object Storage** | Encrypted document storage | S3; PII encrypted at rest |

---

## 2. C4 Level 2 — Container Diagram

```mermaid
graph TB
    subgraph client["Client tier"]
        spa["React 18 + TS SPA<br/>Vite · Tailwind · shadcn/ui<br/>TanStack Query · Recharts"]
    end

    subgraph edge["Edge"]
        cf["CloudFront + WAF"]
    end

    subgraph api_tier["Application tier (ECS Fargate)"]
        api["FastAPI app<br/>REST /api/v1 + SSE"]
        orch["Orchestrator + 6 specialist agents<br/>+ Roadmap Composer"]
        guard["Guardrail layer<br/>schema · grounding · PII · safety"]
        svc["Deterministic services<br/>GPAConverter · ECTSCalculator<br/>CostOfLiving · DeadlineTracker"]
        rag["ProgramSearch (RAG)<br/>+ WebRetriever (cached, cited)"]
    end

    subgraph workers["Async workers"]
        celery["Celery workers + beat<br/>scrape / refresh / embeddings"]
        scrapers["Scrapers<br/>daad.py · uni_assist.py · ..."]
    end

    subgraph data["Data tier"]
        pg[("PostgreSQL 16<br/>+ pgvector")]
        redis[("Redis<br/>cache + broker + queue")]
        s3[("S3<br/>documents")]
    end

    ext_claude["Claude API"]
    ext_sources["Official sources"]
    ext_tts["TTS Provider"]

    spa --> cf --> api
    api --> orch --> guard
    orch --> svc
    orch --> rag
    guard --> ext_claude
    orch --> ext_claude
    rag --> pg
    api --> pg
    api --> redis
    api --> s3
    api -->|enqueue jobs| redis
    celery --> redis
    celery --> scrapers --> ext_sources
    celery --> pg
    rag -.embeddings.-> ext_claude
    orch --> ext_tts

    classDef store fill:#dde,stroke:#557;
    class pg,redis,s3 store;
```

| Container | Tech | Responsibility |
|---|---|---|
| **SPA** | React 18 + TS + Vite + Tailwind + shadcn/ui | Dashboard, roadmap timeline, document workspace, simulators |
| **CloudFront + WAF** | AWS | TLS, caching of static assets, edge protection |
| **FastAPI app** | Python 3.12 + Pydantic v2 | REST + SSE; auth; request orchestration entrypoint |
| **Agent layer** | Native Anthropic tool-use (see ADR-0002) | Orchestrator + 6 specialists + Roadmap Composer |
| **Guardrail layer** | Pydantic + custom checks | Runs on every agent output (schema → grounding → PII → safety) |
| **Deterministic services** | Tested Python | All math (GPA, ECTS, cost, deadlines) |
| **RAG / retrieval** | pgvector + httpx | ProgramSearch over DAAD; WebRetriever for live, cited data |
| **Celery workers + beat** | Celery + Redis | Scraping, incremental refresh, embedding generation |
| **PostgreSQL + pgvector** | PG 16 | Relational data + semantic vectors |
| **Redis** | Redis | Cache, Celery broker, response/result cache |
| **S3** | AWS | Encrypted document storage (uploads + generated docs) |

---

## 3. C4 Level 3 — Component View (Application tier)

```mermaid
graph LR
    subgraph fastapi["FastAPI app"]
        r_prof["/profiles router"]
        r_road["/roadmap router"]
        r_doc["/documents router"]
        deps["auth + deps<br/>(JWT, rate limit)"]
    end

    subgraph ingestion["Ingestion"]
        parse["ResumeParser<br/>(PDF/DOCX/LinkedIn/JSON)"]
        norm["Normalizer<br/>+ chunker"]
        pii["PII handler<br/>(detect / encrypt / redact-in-logs)"]
    end

    subgraph agents["Agents"]
        planner["Orchestrator / Planner"]
        a1["1 Profile & Assessment"]
        a2["2 Document Prep"]
        a3["3 Language & Test"]
        a4["4 Finance & Logistics"]
        a5["5 Visa & Relocation"]
        a6["6 Campus Life"]
        composer["Roadmap Composer"]
    end

    subgraph llm["LLM layer"]
        client["Anthropic client wrapper<br/>(retries, budgeting, tool-use)"]
        schemas["Pydantic schemas"]
        guardrail["Guardrail layer"]
    end

    subgraph services["Services / tools"]
        gpa["GPAConverter*"]
        ects["ECTSCalculator*"]
        psearch["ProgramSearch (RAG)"]
        web["WebRetriever (cached, cited)"]
        col["CostOfLivingService*"]
        dl["DeadlineTracker*"]
        docgen["DocumentGenerator"]
        ttsp["TTSProvider"]
    end

    r_prof --> parse --> norm --> pii
    r_road --> planner
    planner --> a1 & a2 & a3 & a4 & a5 & a6
    a1 --> gpa & ects & psearch
    a2 --> docgen & web
    a3 --> ttsp & web
    a4 --> col & web
    a5 --> ttsp & web & dl
    a6 --> web
    planner --> composer
    a1 & a2 & a3 & a4 & a5 & a6 --> client
    client --> schemas --> guardrail
    composer --> dl
    composer --> guardrail

    note["* = deterministic, unit-tested.<br/>Never computed by the model."]
    classDef det fill:#dfd,stroke:#393;
    class gpa,ects,col,dl det;
```

See `agent-workflows.md` for each agent's typed I/O, scoped tools, and grounding rule.

---

## 4. Request lifecycle — "ingest profile → generate roadmap"

This is the canonical flow. Two phases: **(A) ingest** (synchronous, fast) and **(B) generate**
(async + streamed). Caching, queues, and guardrails are called out inline.

```mermaid
sequenceDiagram
    autonumber
    actor U as Student
    participant FE as SPA
    participant API as FastAPI
    participant ING as Ingestion
    participant S3 as S3
    participant DB as Postgres
    participant Q as Redis (queue)
    participant W as Celery worker
    participant ORCH as Orchestrator
    participant AG as Specialist agents
    participant SVC as Deterministic svc
    participant RAG as ProgramSearch/Web
    participant LLM as Claude API
    participant GR as Guardrails

    Note over U,API: Phase A — Ingest (sync)
    U->>FE: Upload resume / LinkedIn / intake
    FE->>API: POST /api/v1/profiles/ingest
    API->>S3: store encrypted upload
    API->>ING: parse + normalize
    ING->>ING: PII detect → encrypt at rest, redact in logs
    ING->>DB: persist Profile + ParsedProfileFacts
    API-->>FE: 201 {profile_id}

    Note over U,LLM: Phase B — Generate roadmap (async + SSE)
    FE->>API: POST /api/v1/roadmap/generate {profile_id}
    API->>Q: enqueue roadmap job
    API-->>FE: 202 {roadmap_id, status=queued}
    FE->>API: GET /api/v1/roadmap/{id} (SSE subscribe)

    W->>ORCH: run plan(profile)
    ORCH->>LLM: build PlanContext + ExecutionPlan (tool-use, structured)
    LLM-->>ORCH: plan (fan-out set = all 6)
    ORCH->>RAG: ProgramSearch → coarse program shortlist
    RAG-->>ORCH: shortlist (into shared PlanContext)

    Note over ORCH,GR: FAN-OUT — all 6 specialists run concurrently (shared PlanContext, no blocking)
    loop each of the 6 specialists (concurrent)
        ORCH->>AG: typed input + shared PlanContext
        AG->>RAG: retrieve cited program/official data (cache-first)
        RAG-->>AG: grounded snippets + provenance
        AG->>SVC: deterministic math (GPA, ECTS, cost, deadlines)
        SVC-->>AG: computed values
        AG->>LLM: compose narrative (structured output only)
        LLM-->>AG: draft typed output
        AG->>GR: validate
        GR->>GR: schema → grounding → PII → safety
        alt ungrounded official claim
            GR-->>AG: set needs_verification=true, value=null
        end
        AG-->>ORCH: validated output (+ SSE progress event)
    end

    Note over ORCH,DB: FAN-IN — await all 6, then Roadmap Composer joins
    ORCH->>ORCH: Composer dedupe by composite hash + merge provenance
    ORCH->>SVC: DeadlineTracker orders by dependency + date
    ORCH->>GR: final guardrail pass on Roadmap
    ORCH->>DB: persist Roadmap (+ ProvenanceRecords)
    W-->>API: done
    API-->>FE: SSE: roadmap complete
    FE-->>U: render roadmap (disclaimers on visa/finance)
```

### Where the cross-cutting concerns sit

| Concern | Location in flow | Mechanism |
|---|---|---|
| **Caching** | RAG retrieval (step "cache-first"), HTTP responses, embeddings | Redis (keyed by source URL + content hash); pgvector for semantic reuse |
| **Queue** | Between `POST /roadmap/generate` and worker | Redis broker + Celery; API returns `202` immediately |
| **Streaming** | `GET /roadmap/{id}` | Server-Sent Events; one progress event per specialist |
| **Guardrails** | After *every* agent output + final Roadmap pass | schema → grounding → PII-in-logs → content safety |
| **Provenance** | RAG retrieval + persistence | `ProvenanceRecord {value, source_name, source_url, retrieved_at}` |
| **Determinism** | All math steps | Tested services; never the model |
| **PII** | Ingestion + logging everywhere | Encrypt at rest; redact in logs; GDPR export/delete |
| **Disclaimer** | Render + API response metadata | Attached to all visa/finance/immigration output |

---

## 5. Deployment view (AWS)

```mermaid
graph TB
    user["Browser"] --> cf["CloudFront + WAF"]
    cf --> s3static["S3 (static SPA)"]
    cf --> alb["ALB"]
    alb --> ecs["ECS Fargate: API service"]
    ecs --> ecsw["ECS Fargate: Celery workers + beat"]
    ecs --> rds[("RDS Postgres 16 + pgvector")]
    ecs --> ec[("ElastiCache Redis")]
    ecs --> s3docs[("S3: documents")]
    ecs --> sm["Secrets Manager<br/>(API keys, DB creds)"]
    ecs --> cw["CloudWatch (logs/metrics)"]
    ecsw --> rds
    ecsw --> ec
    ecs --> claude["Claude API"]
    ecsw --> sources["Official sources"]
```

- **IaC:** Terraform under `/infra` (`CLAUDE.md` §3).
- **Secrets:** Secrets Manager only — never in code or git. Add billing alerts on the Anthropic key early (per build playbook reality check).
- **Auth:** Auth0 (OAuth/JWT); API validates Auth0-issued JWTs. Decided — see ADR-0001.
- **Local dev:** `docker-compose` with `api`, `postgres+pgvector`, `redis` (Phase 4).

---

## 6. Key cross-references

| Topic | Document |
|---|---|
| Agent I/O, tools, grounding, anti-hallucination | `agent-workflows.md` |
| 30 features → agent → tools → sources → output type | `feature-matrix.md` |
| Stack rationale | `adr/0001-tech-stack.md` |
| Native tool-use vs LangGraph | `adr/0002-agent-orchestration.md` |
| RAG + grounding + provenance contract | `adr/0003-rag-and-grounding.md` |
| Directory tree | `repo-layout.md` |
| Schema + state machine | `data-model.md` (Phase 2) |

---

## 7. Open questions (for review)

1. **Auth provider:** ✅ **Resolved — Auth0** (OAuth/JWT).
2. **Task queue:** ✅ **Resolved — Celery** (+ `beat` for scheduled DAAD/Uni-Assist refresh).
3. **SSE vs WebSocket** for roadmap progress — SSE chosen for simplicity; confirm no bidirectional need.
4. **Embeddings provider** for pgvector: ✅ **Resolved — `BAAI/bge-m3`** (MIT, multilingual, 1024-dim) served locally behind an `EmbeddingProvider` interface. See ADR-0003.
