# ADR-0003 — Hosted demo target: client-only SPA + BYOK LLM + Supabase

- **Status:** Accepted (2026-06-19)
- **Context owner:** Frontend / Platform
- **Supersedes:** none · **Relates to:** ADR-0001 (tech stack), ADR-0002 (agent orchestration), `CLAUDE.md` §3–§4

## Context

`CLAUDE.md` pins a server architecture: FastAPI + Postgres/pgvector + Redis + AWS, with the
Anthropic API behind an `LLMProvider`. That remains the **self-hosted / "pro"** target.

We additionally need a **zero-cost, zero-server "hosted/demo" target** that:
- deploys free to **GitHub Pages** (static files only — anything compiled in is world-readable),
- lets anyone use it without us paying an API bill,
- still honors every golden rule (no fabricated official facts, provenance, deterministic compute,
  structured outputs, disclaimers, PII care).

This ADR records that divergence so we do not silently contradict `CLAUDE.md` (ground rule #1/#2).

## Decision

Build a **100% client-side SPA** (the existing React + TS + Vite + Tailwind app) that runs entirely
in the browser and uses **Supabase** (free tier) as a backend-as-a-service. No FastAPI in this
target. The provider interfaces (`LLMProvider`, `TTSProvider`) carry over unchanged so the
self-hosted target can swap implementations.

### LLM access — two runtime-selected modes (no shared key, no API bill for us)

1. **Owner Mode (local only):** a tiny `localhost` bridge (`/tools/claude-bridge/`, **excluded from
   the Pages build**) fulfils generation via the **Claude Agent SDK / `claude -p`** authenticated by
   the operator's own Claude plan. The SDK/CLI manages its own login; we never read, store, embed, or
   forward a raw OAuth token, and the bridge is never deployed. The SPA probes the bridge and offers
   "Claude (your plan)" only when it answers.
2. **Guest / Public Mode (BYOK):** the visitor pastes **their own** key, stored only in their browser
   (`localStorage`, optionally encrypted in Supabase if they opt in). Default provider is the
   **Google Gemini free tier** (no card; structured output via `responseSchema`). Anthropic/OpenAI
   BYOK are optional extras. The hosted bundle holds **no** shared key.

Provider auto-select: probe `http://localhost:<port>/health` → if present, Owner Mode available;
else Guest/BYOK. The public site never depends on the bridge.

### Speech — free, browser-native

`TTSProvider` / speech wraps the **Web Speech API**: `SpeechSynthesis` (TTS, for Listening) and
`SpeechRecognition` (STT, for Speaking). A higher-quality engine can be added later as an **opt-in**
that uses the user's own key — never a required cost.

### Persistence — Supabase free tier

Auth (email magic-link + Google OAuth — account only, **not** AI billing) and Postgres with
**Row-Level Security** so each user sees only their rows. Tables: `profiles`, `exam_attempts`,
`exam_forms`, `answers`, `srs_cards`, `roadmap_items`, `documents`, `seen_topics`, `settings`.

### Determinism unchanged

Scoring, raw→band mapping, SM-2 SRS scheduling, GPA (Modified Bavarian), ECTS, cost-of-living, and
timer/deadline math run in **tested TypeScript** — never produced by the model.

### Official facts

Exam **content** is model-generated practice (clearly labelled "study aids — not the real test").
Exam **format facts** (counts, timing, scoring scales) come from `src/data/exam-specs.ts` with
`{ value, source_name, source_url, retrieved_at }` provenance — not invented. Ungrounded official
values return `null` + `needs_verification`. Visa/finance disclaimer shown where required.

## Consequences

**Positive:** $0 hosting + $0 usage for the public site; the operator gets full Claude power locally
on a plan they already pay for; offline-capable via a bundled seed bank; no backend to operate.

**Negative / risks:**
- **BYOK trust:** keys live in the visitor's browser. We never log/transmit them except to the
  provider's own endpoint. Document clearly.
- **Free-tier limits:** Gemini ~250–1,000 req/day; we add a fallback ladder (retry → lite model →
  bundled seed bank) so the app never shows a broken exam, and cache forms in Supabase.
- **Supabase free tier:** 500 MB DB, 1 GB storage, 5 GB egress/mo, projects pause after ~7 days
  idle. Mitigations: compact JSON only (audio synthesized client-side, never stored), a keep-alive
  cron, and a "resume project" runbook. `.env.example` ships only `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` (public by design, protected by RLS — never a service key).
- **Web Speech limits:** Chrome cuts `SpeechSynthesis` at ~15 s/~200 chars → we chunk by sentence;
  `SpeechRecognition` is absent in Firefox → fall back to MediaRecorder + typed answer.
- **Owner-Mode bridge is terms-sensitive** (Anthropic moved billing rules twice in 2026, incl. a
  paused June change). Kept behind the provider interface so we can swap to a plain API key or Gemini
  in one line; re-check the Help Center before relying on it long-term.
- **Routing:** GitHub Pages has no server, so the hosted target uses `HashRouter` (zero-config deep
  links); `BrowserRouter` stays for local/dev. Vite `base` is env-driven (`/Bruhdeutschland/`).

## Alternatives considered

- **Embed our own key** in the public bundle — rejected: world-readable, redistribution, abuse.
- **Cloudflare Workers / Vercel functions proxy** — rejected for the free demo (reintroduces a
  server + a key we pay for); revisit for the pro target.
- **Netlify/Vercel hosting** — viable, but GitHub Pages keeps it in one place with the repo and is
  fully free; the build is host-agnostic static output regardless.
