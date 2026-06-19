# ADR-0001 — Technology Stack

- **Status:** Accepted (Phase 1)
- **Date:** 2026-06-18
- **Deciders:** Lead architect (DeutschPrep)
- **Supersedes / superseded by:** —

## Context

DeutschPrep is an AI copilot that turns a student's resume/LinkedIn/intake into a personalized,
provenance-backed roadmap for German public-university Master's admission. The stack must support:

- **Anti-hallucination by construction** — structured outputs, deterministic compute, RAG grounding,
  provenance on every official fact (`CLAUDE.md` §2).
- **PII-sensitive workloads** — resumes/LinkedIn data; GDPR (encrypt at rest, export/delete).
- **Live data pipelines** — scraping/refresh of DAAD, Uni-Assist, university portals with caching.
- **Semantic search** over program/DAAD data.
- **Asynchronous, streamable** roadmap generation.

`CLAUDE.md` §3 pins a stack. This ADR records *why*, so future changes are deliberate.

## Decision

Adopt the pinned stack:

| Layer | Choice | Why |
|---|---|---|
| Language (backend) | **Python 3.12** | First-class Anthropic SDK; rich parsing/ML ecosystem; team fit |
| API | **FastAPI** | Async, typed, OpenAPI out of the box, SSE support |
| Validation | **Pydantic v2** | Enforces "structured outputs only"; same models for API + LLM tool-use schemas |
| Config | **pydantic-settings** | 12-factor; no secrets in code |
| ORM / migrations | **SQLAlchemy 2.0 + Alembic** | Typed ORM, deterministic migrations |
| DB | **PostgreSQL 16 + pgvector** | One store for relational + semantic vectors → simpler ops than a separate vector DB |
| Cache / queue | **Redis + Celery (beat)** | Mature broker + scheduled refresh jobs |
| LLM | **Anthropic Python SDK**, model via `CLAUDE_MODEL` | Opus-class planning/writing; model swappable by env |
| HTTP / parsing | **httpx**, **selectolax/bs4**, **Playwright** (JS portals only) | Fast static parsing; browser only when required |
| Logging | **structlog** | Structured logs; supports PII redaction |
| Frontend | **React 18 + TS + Vite + Tailwind + shadcn/ui + TanStack Query + Recharts** | Accessible, fast, typed; matches Claude Design principles |
| Infra | **Docker/compose** locally; **AWS** (ECS Fargate, RDS, ElastiCache, S3, CloudFront, Secrets Manager, CloudWatch); **Terraform** | Reproducible local dev; managed, observable cloud |
| Auth | **Auth0** (OAuth/JWT) | Standard, offloads credential handling; vendor-neutral (not AWS-locked), strong SDKs |

**Providers are interfaces, never hardcoded vendors:** `TTSProvider`, `LLMProvider`.

## Consequences

**Positive**
- Pydantic everywhere makes "structured outputs only" and schema-first guardrails natural.
- pgvector avoids running a second datastore; transactional consistency between rows and embeddings.
- Env-driven model id + `LLMProvider` interface keep model swaps and test mocking clean.

**Negative / trade-offs**
- pgvector is less specialized than a dedicated vector DB at very large scale → revisit if program
  corpus + embeddings grow beyond Postgres comfort (note for a future ADR).
- Celery adds operational surface vs RQ; **decided in favor of Celery (2026-06-18)** for native
  `beat` scheduling of incremental refresh jobs. Task invocation stays behind a thin interface so a
  later switch would be localized.
- Playwright is heavy; restricted to JS-only portals to limit cost/flakiness.

**Follow-ups**
- ADR-0002: agent orchestration approach.
- ADR-0003: RAG + grounding contract (incl. embedding-model choice — still open).
- Auth: **Auth0** decided (2026-06-18). API validates Auth0 JWTs; client uses Auth0 SPA SDK. Auth0 config (domain, audience, client id) via env/Secrets Manager.
