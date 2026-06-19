# Claude Code Work Order — DeutschPrep: Mock-Exam Engine, TTS, Live Pages & Free Hosting

> **How to use this file:** Paste everything below the line into Claude Code from the repo root
> (the folder that contains `CLAUDE.md`, `/frontend`, `/backend`). Run it in **plan mode** first.
> Work phase by phase and stop at every phase boundary for review, exactly as `CLAUDE.md` requires.

---

## ✅ READ THIS FIRST — two ways to power the AI (personal use of your own plan is fine)

This is **your private project on your own Claude subscription**, so you can absolutely use Claude's
full power for *yourself*. The only thing to avoid is baking **your** subscription credentials into a
**public** site so strangers run on your account — that's redistribution and exposes your token. So
the app supports **two AI modes**, selected automatically at runtime:

**1) Owner Mode (you, on your own machine) — full Claude power, no API bill.**
Drive your Claude Pro/Max plan through Anthropic's *own* sanctioned tooling — the **Claude Agent SDK
authenticated with your Claude plan**, or **`claude -p` headless mode** — exposed to the SPA via a
tiny **local bridge** (a `localhost` server you run). As of **June 2026**, `claude -p`, the Agent
SDK, and third‑party app usage **draw from your subscription's usage limits**: Anthropic *proposed*
moving these to separate credit billing on **15 Jun 2026** but **paused that change the day it was
due**, and there is an official Help Center article, *"Use the Claude Agent SDK with your Claude
plan."* You are **not** extracting or embedding a raw OAuth token — the SDK/CLI manages its own login
on your machine, which is the supported way to script your subscription.
  - ⚠️ This area moved twice in 2026 (a Feb tightening, then the paused Jun change), so terms can
    shift again. Keep it behind the provider interface (§3) so you can swap to a plain API key or to
    Gemini in one line. Re‑check the Help Center before relying on it long‑term.
  - Owner Mode lives **only** where the bridge runs (your computer). It is **never** part of the
    GitHub Pages bundle, and your credentials are never shipped to anyone.

**2) Guest / Public Mode (the GitHub Pages site — and you, when away from your machine) — BYOK.**
Any visitor pastes **their own** key; the hosted app never holds a shared key and never pays. Default
is the **Google Gemini API free tier** (no credit card; ~1,000 req/day on `gemini-2.5-flash-lite`,
~250/day on `gemini-2.5-flash`). Advanced users may paste their own paid Anthropic/OpenAI key.
  - **"Sign in with Google"** is for **Supabase accounts only**, *not* AI billing — a Google login is
    **not** a Gemini key (that still comes from `aistudio.google.com`). Say so in the UI.

**TTS** uses the browser's free **Web Speech API** by default in both modes. Net hosting + usage cost
for the public site: **$0**; your own use rides on the plan you already pay for.

---

## 0. Ground rules (inherit from `CLAUDE.md`, do not override)

1. **Read `CLAUDE.md` in full first.** All golden rules apply: docs‑before‑code, never fabricate
   official facts, provenance on official claims, deterministic code computes (LLM only
   plans/writes), structured (schema‑validated) outputs only, PII care, show the disclaimer.
2. This work order targets a **new "hosted/demo" build target** that runs as a **100% client‑side
   SPA on GitHub Pages** with **Supabase** as the backend‑as‑a‑service. It does **not** delete or
   contradict the FastAPI/Postgres/AWS architecture — treat that as the "self‑hosted/pro" target.
   If anything here conflicts with `CLAUDE.md`, **flag it in your plan** and propose an ADR rather
   than silently diverging (golden rule #1).
3. **Smallest correct change; no unrelated refactors.** Pass lint/format/type/tests before
   declaring any phase done.
4. **Secrets never enter the build.** GitHub Pages serves static files to the public — anything
   compiled in is world‑readable. All keys are user‑provided at runtime and stored only in the
   visitor's browser.

---

## 1. Mission

Upgrade DeutschPrep so that:

- The **Mock Exam Centre** (IELTS, TOEFL, TestDaF, Goethe, GRE, GMAT) produces **fresh, full‑length,
  realistically‑structured exams every time**, generated on demand, with **70–90 scored questions
  for a full IELTS test**, polished **loading animations**, **text‑to‑speech for Listening** and
  **speech‑to‑text for Speaking**, auto‑scoring, and review.
- **Every page and every button in the left nav actually works** (no dead links, no placeholder
  buttons), with smooth animations and graceful empty/loading/error states.
- The app **deploys free to GitHub Pages**, uses the **Supabase free tier** for accounts and
  progress, and powers generation two ways: **Owner Mode** (your own Claude plan via a local Agent
  SDK / `claude -p` bridge — full Claude power, no API bill) and **Guest Mode** (BYOK, default free
  Gemini) so the public site costs nobody an API bill.

---

## 2. Architecture for the hosted build (client‑only SPA + Supabase + BYOK)

```
GitHub Pages (static SPA: React 18 + TS + Vite + Tailwind + shadcn/ui)
   │
   ├── LLMProvider (browser, pluggable)
   │     ├─ Guest/Public:  user's own key ─► Gemini (free) / Anthropic / OpenAI   (BYOK, localStorage only)
   │     └─ Owner Mode:    localhost bridge ─► Claude Agent SDK / `claude -p`  (your Claude plan; local only)
   │        (structured-output/JSON mode; keys & tokens never logged, never in the public bundle)
   │
   ├── SpeechProvider (browser) ──► Web Speech API  (SpeechSynthesis = TTS, SpeechRecognition = STT)
   │
   ├── Deterministic engines (tested TS): scoring, band mapping, timers, ECTS, GPA, cost math
   │
   └── Supabase JS client ──► Supabase (Auth + Postgres + RLS)
            (accounts, attempts, scores, SRS cards, roadmap, generated-content cache, seen-topics)
```

Key consequences to honor everywhere:

- **No server in this target.** Replace any FastAPI call in the hosted build with either a
  deterministic client function or a Supabase call. Keep the provider interfaces from `CLAUDE.md`
  (`LLMProvider`, `TTSProvider`) so the self‑hosted target can swap implementations.
- **Deterministic stays deterministic.** Scoring, band conversion, ECTS, GPA (Modified Bavarian
  Formula), timers, and deadline math run in **tested TypeScript** — never "computed by the model."
- **Graceful degradation is mandatory** (rate limits are real on the free tier — see §5A).
- **Owner Mode is local‑only.** The Claude‑plan bridge is a tiny `localhost` dev server (Node or
  Python) that runs on your machine and is **excluded from the GitHub Pages build**. The SPA probes
  `http://localhost:<port>` and, if present, offers Claude as a provider; if absent, it falls back to
  Guest/BYOK automatically. Never bundle or deploy the bridge publicly.

Write an **ADR** (`/docs/adr/ADR-0003-hosted-spa-byok-supabase.md`) before coding, covering: client‑only
trade‑offs, BYOK security model, the Owner‑Mode Claude‑plan bridge (local‑only) vs Guest BYOK,
Gemini‑free default, Web Speech limits, Supabase free‑tier caveats.

---

## 3. The cost / auth rule (implement exactly)

**Provider layer (`/frontend/src/lib/llm/`):**

- Interface `LLMProvider { generateJSON<T>(schema, prompt, opts): Promise<T>; name; model }`.
- Implementations: `GeminiProvider` (Guest default, free tier), `ClaudeBridgeProvider` (Owner Mode —
  talks to the local bridge, **no key in the browser**), `AnthropicProvider` and `OpenAIProvider`
  (optional, user's own paid key). BYOK keys come from a **Settings → API Keys** screen and live in
  `localStorage` (optionally encrypted in Supabase if the user opts in). **Never** bake a key into
  the bundle; **never** log a key or token; **never** send a key anywhere except that provider's own
  endpoint (or, for the bridge, `localhost`).
- **Provider auto‑select:** on load, probe `http://localhost:<port>/health`. If the bridge answers,
  surface "Claude (your plan)" as a provider and let you set it as the Owner‑Mode default; otherwise
  hide it and use Guest/BYOK (Gemini). The public site therefore never depends on the bridge.
- **Owner‑Mode bridge (`/tools/claude-bridge/`, excluded from the Pages build):** a minimal local
  server that accepts `{schema, prompt, opts}` and fulfils it via the **Claude Agent SDK on your
  Claude plan** (preferred) or by shelling out to **`claude -p --output-format json`**, returning
  Zod‑validated JSON to the SPA. It can **also serve the built SPA on the same `http://localhost` origin** so Owner
  Mode has no CORS / mixed-content / PNA issues (run topologies in §5I). It relies on the
  SDK/CLI's own login — it does **not** read, store, or forward raw OAuth tokens. Document start‑up
  in the README and gate heavy batch generation behind a confirmation so it doesn't burn your plan's
  usage cap.
- **Default UX:** first run shows a friendly "Add your free Gemini key" wizard with a direct link to
  `https://aistudio.google.com/apikey`, a 30‑second how‑to, and a "Test key" button. App is fully
  usable the moment a free key is present.
- **Structured output:** use Gemini's `responseSchema` / JSON mode (and the equivalent for
  Anthropic tool‑use / OpenAI JSON schema). Validate every response with **Zod** before use; on
  validation failure, retry once with a "return valid JSON only" repair prompt, then fall back
  (see §5A). Keep schemas shallow (Gemini rejects very deep/large schemas).
- **What to actually avoid:** don't scrape the Claude Code OAuth *token* out of its config and call
  `api.anthropic.com` with it from the web app, and don't embed any Claude credential in the public
  bundle — those are the brittle, terms‑risky patterns. Driving the Agent SDK / `claude -p` locally
  on your own plan (the bridge above) is the supported path and needs none of that.

---

## 4. Phased plan (stop at each boundary; commit at each phase — conventional commits)

- **Phase 0 — Audit & docs.** Inventory every left‑nav route and button; mark working / broken /
  placeholder in `/docs/page-audit.md`. Write ADR‑0003. Produce the plan. **Stop for review.**
- **Phase 1 — Provider & data foundation.** `LLMProvider` (Gemini BYOK + `ClaudeBridgeProvider` seam
  + local bridge), `SpeechProvider`,
  Supabase client + schema + RLS + Google sign‑in, Zod schemas, deterministic scoring/band engines
  with unit tests. **Stop.**
- **Phase 2 — IELTS mock engine** (full‑length generation, TTS Listening, STT Speaking, timers,
  auto‑score, review). **Stop.**
- **Phase 3 — Other exams to parity** (TOEFL, TestDaF, Goethe, GRE, GMAT). **Stop.**
- **Phase 4 — "Make every page work"** sweep + animations + empty/error states. **Stop.**
- **Phase 5 — GitHub Pages deploy** (Vite base path, routing, GitHub Actions, smoke test). **Stop.**

Each phase: typed I/O validated, tests green, `ruff/black/mypy` (backend touched) and ESLint +
Prettier + strict TS (frontend) clean, docs updated, disclaimer shown where required.

---

## 5. Detailed specifications

### 5A. LLM generation: fresh every time, robust, free

- **Freshness ("new questions and passages every time"):** inject a per‑attempt nonce (UUID +
  timestamp), set higher temperature (~0.9 for content, ~0.3 for answer keys), rotate over a
  **topic pool** per skill, and pass an **exclusion list of recently‑seen topics/titles** (stored
  per user in Supabase / `localStorage`) so consecutive attempts don't repeat. Persist each
  generated set so "Review" is stable even though the next attempt is new.
- **Generate per section, not all at once.** For a full IELTS test, make separate calls:
  4 Listening parts, 3 Reading passages, 2 Writing prompts, 3 Speaking parts. This keeps each
  response inside schema/size limits and drives the **progressive loading animation** (§5E).
- **Robust fallback ladder** (the app must never show a broken exam):
  1. Live generation with the user's key →
  2. on rate‑limit/error, retry with backoff on `gemini-2.5-flash-lite` →
  3. then a **bundled offline seed bank** (ship ~3 full IELTS forms + a few per other exam as
     static JSON in `/frontend/src/data/seed/`) so the product works with **no key and no network**.
  Label clearly when a seed form is used.
- **Caching:** cache generated forms in Supabase keyed by user; offer "Reuse last" vs "Generate
  new" so users on the 250–1000/day free quota don't burn it accidentally.
- **Anti‑hallucination for *official* facts:** exam **content** is model‑generated practice, but
  exam **format facts** (counts, timing, scoring scales) must come from a **config file with
  provenance** (`/frontend/src/data/exam-specs.ts` with `{value, source_name, source_url,
  retrieved_at}`), not invented by the model. Keep the existing banner: *"Practice items are study
  aids — not the real test."*

### 5B. IELTS mock engine (the headline feature)

Build `/frontend/src/features/mock/ielts/`. Match the **real IELTS Academic** structure (cite these
in `exam-specs.ts`; verify against ielts.org):

| Section | Items | Time | Notes |
|---|---|---|---|
| Listening | **40 questions** (4 parts × 10) | ~30 min | TTS plays each part once; transcript hidden until review |
| Reading | **40 questions** (3 passages, 13–14 each) | 60 min | Academic passages ~700–900 words |
| Writing | **2 tasks** (Task 1 ≥150 words, Task 2 ≥250 words) | 60 min | Task 1 describes a chart/graph/table/map/process; Task 2 essay |
| Speaking | **3 parts** | 11–14 min | Part 1 familiar topics, Part 2 cue‑card long turn, Part 3 abstract discussion |

➡️ **A full test = 80 scored questions** (Listening 40 + Reading 40), which is the requested
**"70–90"** range, **plus** the 2 Writing tasks and 3 Speaking parts. Also offer **single‑section**
and **mini (≈half‑length)** modes.

Use **authentic IELTS question types** (these mirror the IELTS prep book the user supplied — wire
them all in, chosen at random per part):

- **Listening:** form/note/table/flow‑chart/summary completion, multiple choice (one or many),
  matching, plan/map/diagram labelling, sentence completion. Include distractors and paraphrase
  (the way the recording restates the question).
- **Reading:** matching headings, T/F/Not Given, Yes/No/Not Given, matching information/features,
  matching sentence endings, multiple choice, note/table/flow‑chart/diagram/summary completion,
  short‑answer. Scanning‑for‑detail and skimming targets.
- **Writing:** Task 1 must include a renderable data figure (generate the underlying data and draw
  it with **Recharts**, or generate an SVG map/process diagram) so the prompt is real, not "imagine
  a chart." Task 2 = argument/discussion/problem‑solution essay.
- **Speaking:** generate Part 1 questions, a Part 2 cue card (+1 min prep timer + up to 2 min
  record), Part 3 follow‑ups.

**Delivery & scoring:**

- Exam runner with **per‑section countdown timers**, question palette/navigator, flag‑for‑review,
  next/prev, and a real **submit**.
- **Deterministic auto‑scoring (tested TS):** mark Listening + Reading objectively; map raw /40 to
  an **IELTS band (0–9)** using a configurable raw→band table in `exam-specs.ts` (clearly labelled
  "indicative — official conversion varies by form"). Writing & Speaking get **AI rubric feedback**
  against the four IELTS criteria (Task Achievement/Response, Coherence & Cohesion, Lexical
  Resource, Grammatical Range & Accuracy) with an **estimated** band and the disclaimer that only a
  certified examiner gives a real score.
- **Review screen:** every question shows user answer, correct answer, explanation, the source
  paragraph/transcript line, and the question‑type label.

### 5C. Other exams — bring to parity

Reuse the same runner/generator with per‑exam config:

- **TOEFL iBT** — Reading, Listening, Speaking, Writing (incl. the "Writing for an Academic
  Discussion" task); note the Jan‑2026 format and score scale in `exam-specs.ts`.
- **TestDaF** — Reading, Listening, Writing, Speaking on the TDN 3–5 scale (German prompts, German
  TTS voice).
- **Goethe‑Zertifikat** — CEFR‑aligned Lesen/Hören/Schreiben/Sprechen modules; let user pick level
  (A1–C2); German TTS.
- **GRE General** — Verbal, Quantitative, (optional) Analytical Writing; render math with KaTeX.
- **GMAT Focus** — Quantitative, Verbal, Data Insights; KaTeX for math, mini data tables/charts.

Every exam: fresh‑every‑time generation, loading animation, seed‑bank fallback, auto‑score where
objective, AI‑rubric where subjective, review screen, and the official‑source link already in the UI.

### 5D. Speech: free TTS (Listening) + STT (Speaking)

`/frontend/src/lib/speech/` wrapping the **Web Speech API** (free, browser‑native, works
Chrome/Edge/Safari; offline once voices load):

- **TTS (`SpeechSynthesis`) for Listening:** play each part as audio. **Work around the Chrome
  ~15s / ~200–250 char cut‑off by chunking** the transcript into sentence‑sized
  `SpeechSynthesisUtterance`s queued back‑to‑back; expose play/pause/seek‑by‑sentence, speed, and a
  voice picker filtered by the exam's language (German voice for TestDaF/Goethe). Handle the
  "voices load asynchronously" race (`voiceschanged`). Detect tab‑blur throttling and pause cleanly.
  Because real IELTS plays audio **once**, default to single play with an optional "study mode" replay.
- **STT (`SpeechRecognition`) for Speaking:** record + live‑transcribe the user's answer; if the API
  is missing (e.g., Firefox), fall back to MediaRecorder audio capture + a "type your answer"
  textarea. Feed transcript to the AI rubric for Speaking feedback.
- Keep a `TTSProvider` seam so a higher‑quality engine (e.g., Gemini 2.5 TTS) can be added later as
  an **opt‑in** that uses the user's own key — never as a required cost.
- Show a one‑time **browser‑support notice** and graceful fallback messaging.

### 5E. Loading animations & micro‑interactions

- **Generation loader:** a multi‑step progress animation tied to the per‑section calls — e.g.
  "Writing passage 1/3 → drafting questions → building answer key → preparing audio" with a
  shimmer/skeleton of the exam layout, an indeterminate progress bar, and rotating study tips.
  Never a dead spinner; always show *what* is generating.
- Use **Framer Motion** (or CSS) for: page transitions, card hover/press, staggered list reveals,
  answer‑select feedback, timer pulse in the last 60s, score count‑up on results, toast
  notifications. Respect `prefers-reduced-motion`.
- Add **skeleton loaders** to every data‑backed page and **optimistic UI** on buttons (disabled +
  spinner while pending). Keep it accessible (WCAG 2.1 AA: focus states, contrast, ARIA live region
  announcing generation progress).

### 5F. "Make every page work" sweep

Drive from `/docs/page-audit.md`. The left nav has ~30 features across Overview, Profile &
Assessment, Document Prep, Language & Test Prep, Finance & Logistics, Visa & Relocation, Campus Life.
For **each** route:

- No 404, no blank screen, no dead button. Every CTA either does the real action or shows an honest
  "Coming soon" state (only where truly unscoped — minimize these).
- Wire the obvious deterministic ones now: **ECTS calculator**, **GPA/Profile evaluation** (Modified
  Bavarian Formula, tested), **Cost‑of‑living calc**, **Deadlines & alerts**, **SRS flashcards**
  (SM‑2 algorithm, tested), **Roadmap/Timeline** (render from Supabase), **Document gathering /
  VPD tracker** (checklist state in Supabase).
- AI‑backed ones (SOP generator, Europass CV, LOR templates, Uni‑Assist walkthrough, Visa interview
  simulator with voice, Skill‑gap, University matching) use the BYOK provider + structured outputs +
  the disclaimer where official/visa/finance content appears: *"Guidance only, not legal or
  financial advice. Verify against official sources before acting."*
- Standardize empty, loading, error, and success states across the app.

### 5G. Supabase (free tier) — accounts & persistence

- Use the **Supabase MCP** to provision and migrate. Tables (with **Row‑Level Security** so each
  user sees only their rows): `profiles`, `exam_attempts`, `exam_forms` (cached generated content),
  `answers`, `srs_cards`, `roadmap_items`, `documents`, `seen_topics`, `settings`.
- **Auth:** email magic‑link **and** Google OAuth (Supabase Auth). Make explicit in UI that Google
  login is for the account only, not for AI billing.
- **Free‑tier caveats to design around** (put in ADR + a runbook): 500 MB DB, 1 GB file storage,
  5 GB egress/month, 2 projects, and **projects pause after ~7 days of inactivity**. Mitigations:
  keep payloads small (store compact JSON, not audio blobs — audio is synthesized client‑side),
  add a tiny scheduled keep‑alive ping (GitHub Actions cron hitting a lightweight endpoint), and a
  clear "resume project" note for the maintainer. No PII in logs; provide data export + delete
  (GDPR, per `CLAUDE.md`).
- Provide `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only (the anon key is
  public by design and protected by RLS — document this so nobody pastes a service key).

### 5H. GitHub Pages deployment (free hosting)

- **Vite base path:** set `base: '/<repo-name>/'` in `vite.config.ts` (or `'/'` for a
  `user.github.io` repo / custom domain). Make it env‑driven so forks just change one value.
- **Routing:** prefer **`HashRouter`** (works on Pages with zero server config). If `BrowserRouter`
  is required, add the **`404.html` = copy of `index.html`** fallback (and the redirect shim) so
  deep links don't 404. Document the choice.
- **CI/CD:** add `.github/workflows/deploy.yml` — install, lint, typecheck, **test**, `vite build`,
  then deploy `dist/` via `actions/deploy-pages`. Build must **fail** if any secret‑looking env var
  is present (guard against baked keys).
- **Smoke test** after deploy: load the Pages URL, run the Gemini key wizard, generate a short IELTS
  Listening section, play TTS, submit, see a score. Capture a screenshot in the PR.
- Update `README.md` with a 5‑step "Fork → add Supabase project → enable Google auth → set base path
  → push" guide so others can host their own copy free.

### 5I. Owner‑Mode run topologies (how the local Claude bridge connects to the UI)

GitHub Pages serves the UI over **HTTPS**, but your Claude bridge runs on **`http://localhost`**.
Browsers police that boundary hard, so choose the right topology instead of fighting it:

- **Why a hosted `https://…github.io` page calling `http://localhost:<port>` is fragile:** the Mixed
  Content rules do **not** reliably exempt `http://localhost` in Chromium (Firefox is more lenient),
  and Chrome's **Private Network Access / Local Network Access** adds a CORS preflight that the local
  server must answer with `Access-Control-Allow-Private-Network: true` — plus, increasingly, a
  **user permission prompt** for public→localhost calls. It can work today on Chrome with the right
  headers, but it varies by browser/version and is tightening. Do **not** make it the default.

Implement these three modes (the SPA auto‑detects; Supabase provides accounts in all of them):

1. **Local app + local bridge — RECOMMENDED default for Owner Mode (zero browser friction).**
   The bridge **also serves the built SPA** on `http://localhost:<port>` (e.g. 8787) and exposes
   `POST /generate` + `GET /health`. Because the page and the bridge share the **same
   `http://localhost` origin**, there is **no mixed content, no PNA, and no CORS** to fight. One
   command (`npm run owner`) builds the SPA, starts the bridge, and opens the browser — full
   Claude/Opus power. (For dev you may instead run Vite on `:5173` and the bridge on `:8787`; then the
   bridge just needs a CORS allow for `http://localhost:5173` — still no mixed content/PNA.)

2. **Hosted UI + Cloudflare Tunnel — RECOMMENDED way to drive your plan from the public site.**
   Run `cloudflared` to give the local bridge a public **HTTPS** URL, then paste that URL into the
   site's **Settings → Bridge URL** field. HTTPS→HTTPS means **no mixed content and no PNA**; the
   bridge only needs standard CORS allowing `https://<you>.github.io`. Cloudflare's free tier covers
   it (quick tunnel = one‑command random URL; named tunnel = stable URL if you own a domain). ngrok
   also works but its free URL rotates each run.

3. **Hosted UI + raw `http://localhost` Bridge URL — ADVANCED / fragile; document, don't default.**
   Same **Bridge URL** field, defaulting to `http://localhost:8787`. To have any chance of working,
   the bridge must answer the PNA preflight with `Access-Control-Allow-Private-Network: true` and
   allow the github.io origin; the user may still hit a Local Network Access permission prompt and it
   may fail on some browsers. Show a "works best in Chrome/Edge; if blocked, use a tunnel (mode 2) or
   run locally (mode 1)" help note.

**Accounts/data are identical across all modes** because Supabase is cloud: log in with the same
Google account on the local build, the hosted build, or hosted+tunnel and you see the same attempts,
flashcards, and roadmap. The bridge **only** supplies generation. In Supabase **Auth → URL
Configuration**, add every origin you'll use — `https://<you>.github.io`, `http://localhost:8787`,
`http://localhost:5173` — to Site URL / Redirect URLs so Google OAuth redirects resolve everywhere.

**Decision:** default Owner Mode to **mode 1** (run locally, bridge serves the UI); offer **mode 2**
(Cloudflare Tunnel) to use the hosted site with your plan; keep **mode 3** behind an "advanced" toggle.

---

## 6. Guardrails & Definition of Done

- ✅ Owner Mode uses the local Claude‑plan bridge (Agent SDK / `claude -p`), **excluded from the
  public build**; Guest Mode is BYOK. **No key or token in the bundle, none in logs**; no raw OAuth
  token is read or forwarded.
- ✅ Official **format facts** carry provenance; ungrounded official values return `null` +
  `needs_verification` (never guessed). Practice‑item and "guidance only" disclaimers shown.
- ✅ All LLM calls return **Zod‑validated** structured output; deterministic math is **unit‑tested**.
- ✅ Every nav route renders and every button does something real or an honest "coming soon."
- ✅ TTS/STT degrade gracefully; `prefers-reduced-motion` respected; WCAG 2.1 AA.
- ✅ Lint + Prettier + strict TS clean; Vitest/RTL tests green; Anthropic/Gemini/network **mocked**
  in tests (recorded fixtures). Docs updated. Conventional commits, one logical change each.
- ✅ Deploys to GitHub Pages from a clean checkout; free‑tier‑safe.

## 7. Verification (do this before calling it done)

1. **Unit tests:** scoring, raw→band mapping, SM‑2 SRS, ECTS, GPA, timer logic.
2. **Generation tests (mocked):** schema‑valid IELTS form; fallback ladder triggers seed bank on
   simulated 429; "generate new" differs from "reuse last" (anti‑repetition).
3. **E2E happy path (Playwright):** key wizard → generate IELTS Listening → TTS plays (assert audio
   events / chunk queue) → answer → submit → score → review.
4. **Owner Mode test:** `npm run owner` serves SPA + bridge same-origin on localhost; generate an
   IELTS section via `ClaudeBridgeProvider`; kill the bridge and confirm auto-fallback to Gemini.
5. **Deploy smoke test** on the live Pages URL (screenshot in PR).
6. **Self‑review pass** for the golden rules (provenance, disclaimers, no secrets, a11y).

## 8. Confirm with me before Phase 1 (put answers in your plan)

1. Repo name / will it be `username.github.io` or `username.github.io/<repo>` (sets the Vite base)?
2. Is there an existing Supabase project, or should you create one via the Supabase MCP?
3. OK to add deps: `@supabase/supabase-js`, `framer-motion`, `zod`, `recharts` (already in stack),
   `katex`, `@google/generative-ai` (or REST), Playwright? Flag anything `CLAUDE.md` would gate.
4. Guest default provider = **Gemini free** confirmed? Keep Anthropic/OpenAI BYOK as optional extras?
5. Build **Owner Mode** now (local Claude‑plan bridge via Agent SDK / `claude -p`) or stub the
   provider seam and add it after the core app works? Which plan are you on (Pro/Max), and is Claude
   Code already installed and logged in on this machine?

— End of work order —
