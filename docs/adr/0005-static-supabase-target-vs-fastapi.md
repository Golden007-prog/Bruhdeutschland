# ADR-0005 — Static/Supabase target replaces FastAPI/Postgres for the hosted build

- **Status:** Accepted (master work order, Phase 0)
- **Date:** 2026-06-19
- **Deciders:** Lead architect (DeutschPrep)
- **Related:** ADR-0001 (pinned tech stack), ADR-0004 (hosted SPA), `CLAUDE.md` §3

## Context

`CLAUDE.md` §3 pins FastAPI + Pydantic v2 + SQLAlchemy/Alembic + PostgreSQL 16/pgvector + Redis/Celery
as the backend, "do not substitute without an ADR." ADR-0004 introduces a Supabase-backed static SPA.
This ADR makes the boundary explicit so the pin is **not silently broken** (`CLAUDE.md` §7).

## Decision

There are **two supported targets**, and they do not contradict — they serve different audiences:

| Concern | Hosted/demo target (this work order) | Pro/self-hosted target (pinned) |
|---|---|---|
| Frontend | React SPA on GitHub Pages | Same React app |
| Data/auth | **Supabase** (Postgres + RLS + Auth) | FastAPI + Postgres/pgvector + Cognito/Auth0 |
| AI | BYOK Gemini / Owner-Mode Claude bridge | Server-side Anthropic SDK |
| Compute | Deterministic TS in `lib/calc` (mirrors backend) | Tested Python services |
| Scrapers/RAG | Client-side / cached static facts | Celery + pgvector |
| Operator | None (each user self-serves) | An organization running the stack |

The **`/backend` FastAPI app, its services, and ADR-0001 remain authoritative** for the pro target and
are not deleted. The hosted target is additive. Deterministic logic is intentionally duplicated in
tested TS and tested Python; the two must agree (same formulas, same fixtures where practical).

## Consequences

- **Positive:** ships a usable product today with no infra; preserves the pro path; the grounding,
  determinism, structured-output, and PII rules from `CLAUDE.md` apply to **both** targets unchanged.
- **Negative:** duplicated deterministic logic (GPA/ECTS/cost/deadlines) across TS and Python must be
  kept in sync — enforced by parallel unit tests with shared fixtures; two persistence layers to reason
  about (Supabase schema in `/supabase/migrations`, SQLAlchemy in `/backend`).
- **Non-goal:** this ADR does **not** migrate the pro target to Supabase or retire FastAPI. Any such
  move needs its own ADR.
