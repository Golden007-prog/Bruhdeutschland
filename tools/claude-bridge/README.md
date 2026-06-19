# Owner-Mode Claude bridge (local only)

A tiny localhost server that lets DeutschPrep generate exams via **your own Claude plan** — full
Claude/Opus power, no API bill. It shells out to the **Claude CLI** (`claude -p --output-format
json`) and relies on the CLI's own login; it never reads, stores, or forwards a raw OAuth token, and
**it is never deployed** (excluded from the GitHub Pages build).

## Prerequisites
- Node ≥ 18 and the **Claude CLI** installed and logged in (`claude` on your PATH). Verify with
  `claude --version`.

## Run (mode 1 — recommended: local app + local bridge, zero browser friction)
From the repo root:
```bash
npm run owner
```
This builds the SPA and starts the bridge **serving the app on the same origin**
(`http://localhost:8787/`), so there's no CORS, mixed-content, or Private-Network-Access issue. Open
the printed URL, go to **Settings → Active provider**, and pick **Claude (your plan)** (it appears
once the bridge is detected).

## Run (just the bridge, for `npm run dev` on :5173)
```bash
npm run bridge          # bridge on :8787; Vite dev server on :5173
```
The SPA auto-probes `http://localhost:8787/health` and offers Claude when it answers.

## Use the hosted site with your plan (mode 2 — Cloudflare Tunnel)
```bash
npm run bridge
cloudflared tunnel --url http://localhost:8787
```
Paste the printed **HTTPS** URL into **Settings → Bridge URL** on `https://<you>.github.io/...`.
HTTPS→HTTPS means no mixed-content/PNA; the bridge already sends permissive CORS headers.

## Endpoints
- `GET /health` → `{ ok, model, serving }`
- `POST /generate` `{ prompt, schemaHint, temperature }` → `{ json }`

## Notes
- Heavy batch generation draws from your Claude plan's usage limits — generate deliberately.
- Configure the binary/port with `CLAUDE_BIN` and `--port` / `BRIDGE_PORT`.
- This tool is intentionally dependency-free (Node built-ins only).
