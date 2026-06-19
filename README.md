# DeutschPrep

An AI copilot that turns a student's resume/LinkedIn into a personalized roadmap for applying to
Master's programs at **German public universities** — profile evaluation, documents, language &
test prep (with full **mock exams**), finance, visa, and campus life.

**Live demo:** https://golden007-prog.github.io/Bruhdeutschland/

> Guidance only, not legal or financial advice. Verify visa, finance, and immigration details
> against official sources before acting.

## Two targets

| Target | Stack | Use |
|---|---|---|
| **Hosted / demo** (this README) | 100% client-side SPA (React + TS + Vite + Tailwind) on **GitHub Pages** + **Supabase** + **BYOK** LLM | free public demo; $0 hosting & usage |
| **Self-hosted / pro** | FastAPI + Postgres/pgvector + Redis + AWS (`/backend`) | full server deployment (see `/docs`) |

See `docs/adr/ADR-0003-hosted-spa-byok-supabase.md` for the hosted-target design.

## AI: two modes, no shared bill

- **Guest / Public (BYOK, default):** each visitor pastes their own key (Settings → API Keys). Default
  is the **free Google Gemini tier** — get a key at https://aistudio.google.com/apikey (no card). The
  hosted bundle holds **no** shared key. Without any key, exams use bundled **offline seed forms**.
- **Owner Mode (local only):** drive your **own Claude plan** — full power, no API bill — via a local
  bridge. Never deployed.

```bash
npm run owner   # builds the SPA and serves it + the Claude bridge on http://localhost:8787
```

Owner Mode needs the Claude CLI installed and logged in. To use your plan from the hosted site,
run `npm run bridge` + `cloudflared tunnel --url http://localhost:8787` and paste the HTTPS URL into
Settings → Bridge URL. Details: `tools/claude-bridge/README.md`.

## Quick start (local dev)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Optional: copy `frontend/.env.example` to `frontend/.env.local` and set your Supabase values to
enable accounts/sync (the app works fully without them — state stays on-device).

## Deploy your own (free)

1. **Fork** this repo.
2. Create a **Supabase** project (free tier). In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Repo **Settings → Secrets and variables → Actions** → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (the **anon/public** key — never the service key).
4. Set the base path: in `.github/workflows/deploy.yml` set `VITE_BASE_PATH` to `/<your-repo>/`
   (or `/` for a `username.github.io` repo / custom domain). Update `frontend/public/404.html` `BASE`
   to match.
5. **Push** to `main`. The workflow lints, typechecks, tests, builds, **scans the bundle for leaked
   secrets**, and deploys to Pages. Enable Pages (Settings → Pages → Source: GitHub Actions) if it
   isn't already.
6. In Supabase **Auth → URL Configuration**, add your site + `http://localhost:8787` +
   `http://localhost:5173` as redirect URLs, and enable the Google provider.

### This project's Supabase values (for reference)

- Project: **DeutschPrep** (org Bruhdeutschland, free, ap-south-1) · URL
  `https://dxfjstgnokncqabnumkr.supabase.co`
- `VITE_SUPABASE_URL` = `https://dxfjstgnokncqabnumkr.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = copy from Supabase → **Project Settings → API Keys** (the *anon*/publishable key)

## Verify

```bash
cd frontend
npm run typecheck && npm run lint && npm run test && npm run build
```

The test suite includes a smoke test that mounts every route and unit tests for all deterministic
math (GPA, ECTS, cost, deadlines, SM-2, exam scoring/band).
