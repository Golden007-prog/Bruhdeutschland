# ADR-0002 — Agent Orchestration: Native Anthropic Tool-Use vs LangGraph

- **Status:** Accepted (Phase 1)
- **Date:** 2026-06-18
- **Deciders:** Lead architect (DeutschPrep)
- **Related:** `agent-workflows.md`, ADR-0003

## Context

DeutschPrep needs a multi-agent system: one Orchestrator/Planner routing to 6 specialist agents,
then a Roadmap Composer (`agent-workflows.md`). Hard requirements from `CLAUDE.md` §2 and §4:

- **Determinism & traceability** — reproducible routing, inspectable state, auditable provenance.
- **Typed I/O at every boundary** (Pydantic) and **scoped tools** per agent.
- **Guardrails on every output** (schema → grounding → PII → safety).
- **No heavy framework without an ADR** (`CLAUDE.md` §3, agent-orchestration note).

The choice: build a **thin custom orchestrator on native Anthropic tool-use + Pydantic**, or adopt
**LangGraph** (graph-based agent framework).

## Options considered

### Option A — Thin custom orchestrator on native Anthropic tool-use + Pydantic *(recommended)*

How it works: the orchestrator is plain Python. Each agent = a function with a Pydantic input/output
and a declared tool list. The Anthropic client wrapper drives tool-use loops; outputs are validated
by the same Pydantic schemas the API uses; guardrails are explicit middleware around each call.

| Pros | Cons |
|---|---|
| Full control over control flow, retries, parallelism | We build/maintain the loop, retry, and DAG logic ourselves |
| Determinism + traceability are first-class (we own every step) | No built-in graph visualization/checkpointing |
| One mental model: Pydantic for API, tool-use, and guardrails | More initial boilerplate |
| Minimal deps → smaller attack/PII surface; easy mocking in tests | |
| Scoped-tool enforcement is trivial (we pass each agent its own tool set) | |

### Option B — LangGraph

| Pros | Cons |
|---|---|
| Prebuilt graph runtime: nodes, edges, checkpoints, retries | Heavier dependency; couples us to its abstractions & release cadence |
| Built-in state persistence & visualization | Determinism/traceability filtered through framework internals |
| Community patterns for multi-agent | Another schema/state model alongside Pydantic → duplication |
| | Harder to enforce *scoped tools* + *grounding guardrails* exactly our way |
| | Larger surface to audit for a PII/GDPR product |

## Decision

**Adopt Option A — a thin custom orchestrator on native Anthropic tool-use + Pydantic.**

Rationale: our differentiators are *determinism, traceability, and grounding* — precisely the
concerns a thin, owned orchestrator serves best. The agent graph is small and well-specified (1
planner → 6 specialists → composer), so a framework's graph runtime buys little while adding
coupling and audit surface. Pydantic already spans API + tool-use + guardrails; a single mental
model reduces bugs.

## Consequences

**Positive**
- Every routing/grounding/guardrail step is explicit, testable, and mockable (no live calls in tests).
- Scoped-tool enforcement and the `needs_verification` path are implemented directly, not bolted on.
- Smaller dependency/PII surface.

**Negative / trade-offs**
- We own retry/backoff, parallel dispatch, and the dependency DAG (mitigated: scope is small; logic
  lives in `agents/orchestrator.py` + `llm/client.py`, both unit-tested).
- No free visualization/checkpointing — add lightweight run-tracing/logging instead.

**Revisit if** the agent graph grows substantially (many dynamic branches, long-running human-in-the-
loop checkpoints, durable resumable state). At that point, re-evaluate LangGraph or a workflow engine
in a new ADR rather than retrofitting.

**Guardrail:** introducing any orchestration framework later requires a superseding ADR.
