# ADR-0004 — Hosted SPA: Supabase + BYOK + Owner-Mode bridge

- **Status:** Accepted (master work order, Phase 0)
- **Date:** 2026-06-19
- **Deciders:** Lead architect (DeutschPrep)
- **Related:** ADR-0001 (tech stack), ADR-0003 (RAG & grounding), `hosted-deploy-and-ai-modes` memory,
  `DeutschPrep_ClaudeCode_WorkOrder.md`, master work order §3/§6

## Context

`CLAUDE.md` §3 pins a server stack (FastAPI + Postgres/pgvector + Redis/Celery + Anthropic SDK) as the
"pro"/self-hosted target. We also need a **zero-server, publicly hostable demo** that a single student
can run for free with no backend operator. GitHub Pages serves static assets only; there is no place to
keep a secret Anthropic key; and the product must still personalize, persist, and generate AI content.

This ADR records the divergence from the pinned server stack for the **hosted build only** — it does
not retire the pinned stack (see ADR-0005 for the boundary).

## Decision

1. **Hosting:** the frontend is a 100% client-side SPA deployed to **GitHub Pages** at
   `https://golden007-prog.github.io/Bruhdeutschland/`. Vite `base = /Bruhdeutschland/`; **HashRouter**
   on Pages (env `VITE_HASH_ROUTER=true`) so deep links and OAuth callbacks resolve without a server;
   BrowserRouter for local dev / Owner Mode.

2. **Backend = Supabase** (project `dxfjstgnokncqabnumkr`). Postgres with **Row-Level Security**
   (owner-only) for all per-user data; Supabase Auth for **email magic-link + Google OAuth**. The
   browser holds **only the public anon key** (`VITE_SUPABASE_ANON_KEY`); RLS is the security boundary.
   **No service-role key ever reaches the client.** The app degrades to localStorage when Supabase is
   unconfigured, so the demo works signed-out.

3. **AI = pluggable `LLMProvider`, never a hardcoded vendor or a shipped key:**
   - **Gemini (BYOK)** — the free default. Each visitor pastes their own
     `aistudio.google.com/apikey` key, stored in their browser's localStorage only.
   - **Owner-Mode Claude bridge** — a local-only Node bridge (`tools/claude-bridge`, `npm run owner`)
     that uses the operator's own Claude CLI login. Never deployed, never exposed publicly.
   - `registry.ts` auto-selects: explicit choice → bridge (if reachable) → Gemini (if keyed) → throw
     `NoProviderError` so the UI offers the key wizard / seed-bank fallback.
   - Every AI call returns a **Zod-validated** structured output; official facts still obey ADR-0003
     (no fabrication; `needs_verification` path).

4. **Determinism unchanged:** GPA (Modified Bavarian), ECTS, cost-of-living, deadline math, and exam
   scoring run in tested TypeScript in `lib/calc` / `lib/exam` — mirroring the backend services, never
   model-computed (`CLAUDE.md` §4).

## Consequences

- **Positive:** free to host and run; no operator secret on the client; works offline / signed-out;
  user owns their AI spend; RLS gives real per-user isolation with no server to maintain.
- **Negative / risks:** no server-side secret store, so anything requiring a privileged key (server
  Anthropic calls, privileged scrapers) is out of scope for the hosted build; Supabase free-tier limits
  (500 MB DB / 1 GB storage / pause after ~7 days idle) require compact JSON, a keep-alive cron, and a
  documented "resume project" path; live fact re-verification must run client-side (CORS-limited) or via
  a public proxy.
- **Mitigations:** keep-alive GitHub Action; store no audio blobs (TTS is client-side); secret-scan gate
  in the deploy workflow (fails on `AIza`/`sk-`/`service_role`, allows the public anon JWT); GDPR export
  + delete implemented against Supabase.
