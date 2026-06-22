#!/usr/bin/env node
/**
 * DeutschPrep Owner-Mode bridge (work-order §3, §5I). A tiny localhost server that fulfils exam
 * generation via the operator's OWN Claude plan, by shelling out to `claude -p --output-format json`.
 * It NEVER reads, stores, or forwards a raw OAuth token — it relies on the Claude CLI's own login.
 *
 *   POST /generate { prompt, schemaHint, temperature } -> { json: <parsed value> }
 *   GET  /health                                       -> { ok: true, model }
 *
 * With `--serve <dir>` it also serves the built SPA on the SAME http://localhost origin (mode 1),
 * so there is no CORS / mixed-content / Private-Network-Access friction. This file is EXCLUDED from
 * the GitHub Pages build and must never be deployed publicly.
 *
 *   node server.mjs --serve ../../frontend/dist --port 8787 --open
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const PORT = Number(opt("--port", process.env.BRIDGE_PORT || 8787));
const SERVE_DIR = args.includes("--serve") ? resolve(opt("--serve", "")) : null;
const OPEN = args.includes("--open");
// When the bridge comes up, optionally open an extra URL in the browser (in addition to the local app).
// Owner Mode points this at the HOSTED Settings page so a user can connect their plan to the hosted
// site, which auto-probes http://localhost:8787/health. Set via `--open-url <url>` or OWNER_OPEN_URL.
const OPEN_URL = (opt("--open-url", process.env.OWNER_OPEN_URL || "") || "").trim();
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
// Bind loopback-only by default (qa SEC-2): never expose the bridge to the LAN. A `--host 0.0.0.0`
// override exists for advanced/trusted setups but is opt-in.
const BIND_HOST = opt("--host", process.env.BRIDGE_HOST || "127.0.0.1");
// Tunnel mode: instead of a `*.trycloudflare.com` wildcard (qa SEC-3 — any ephemeral tunnel page would be
// trusted), pin the EXACT tunnel hostname via env. Unset → no tunnel origin is trusted (safe default).
const TUNNEL_HOST = (process.env.BRIDGE_TUNNEL_HOST || "").trim();
// Optional shared secret (qa SEC-1, tunnel hardening): when set, /generate also requires a matching
// `X-Bridge-Token` header. Off by default so same-origin/localhost use keeps working unchanged.
const BRIDGE_TOKEN = (process.env.BRIDGE_TOKEN || "").trim();

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".map": "application/json",
};

/** Pull the first JSON value out of a possibly fenced/prose-wrapped string. */
function extractJson(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
  if (start > 0) {
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (end > start) t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

/** Run the prompt through the Claude CLI on the operator's plan and return parsed JSON. */
function runClaude(prompt) {
  return new Promise((resolveP, reject) => {
    // Force the SUBSCRIPTION credential: if ANTHROPIC_API_KEY is set in the shell, Claude Code would
    // bill the API instead of the user's Pro/Max plan. Strip it from the child env. (We never pass
    // --bare, which would skip the OAuth/keychain read and demand an API key.)
    const childEnv = { ...process.env };
    delete childEnv.ANTHROPIC_API_KEY;
    // The bridge only needs Claude for *generation*, so we run it with a minimal,
    // isolated config (work-order Fix 4): `--strict-mcp-config` loads NO MCP servers
    // (ignoring the operator's personal github/supabase servers AND this repo's own
    // .mcp.json), and `--setting-sources project,local` skips the user-global
    // settings.json so personal hooks don't load either. Both are quieter and faster,
    // and neither touches auth — we deliberately do NOT pass `--bare` (which would stop
    // Claude Code reading the OAuth/keychain credential and force an API key). Plain
    // `-p` keeps drawing from the operator's Pro/Max subscription.
    const child = spawn(
      CLAUDE_BIN,
      ["-p", "--output-format", "json", "--strict-mcp-config", "--setting-sources", "project,local"],
      { stdio: ["pipe", "pipe", "pipe"], env: childEnv },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => reject(new Error(`Failed to start ${CLAUDE_BIN}: ${e.message}`)));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(err.trim() || `claude exited ${code}`));
      try {
        // `--output-format json` wraps the model reply in an envelope; .result holds the text.
        const envelope = JSON.parse(out);
        const text = typeof envelope === "object" && envelope && "result" in envelope ? envelope.result : out;
        resolveP(extractJson(text));
      } catch {
        try {
          resolveP(extractJson(out));
        } catch (e2) {
          reject(new Error(`Could not parse Claude output: ${e2.message}`));
        }
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// Only these origins may call the bridge cross-origin. This blunts drive-by / DNS-rebinding: while the
// bridge holds no secret (it only drives the operator's own Claude and returns model output), an
// unrestricted ACAO would let ANY open tab spend the operator's Claude quota. Same-origin `npm run
// owner` (the app served on :8787) needs no ACAO; the hosted-site + tunnel modes are covered below.
const ALLOWED_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/golden007-prog\.github\.io$/,
];
if (TUNNEL_HOST) {
  // Pin the exact tunnel host (no wildcard). Escape regex metacharacters in the hostname.
  ALLOWED_ORIGINS.push(new RegExp(`^https://${TUNNEL_HOST.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

/** True when the request's Origin is allowlisted, or absent (same-origin / non-CORS request). */
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin requests and curl send no Origin
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && originAllowed(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Bridge-Token");
  // Allow Chrome Private Network Access preflight (public HTTPS page -> localhost). Note: newer Chrome
  // may still show a Local Network Access permission prompt the user must approve — no header suppresses it.
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

async function serveStatic(req, res, url) {
  if (!SERVE_DIR) return false;
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = normalize(join(SERVE_DIR, pathname));
  // Trailing-separator containment so a sibling dir like `<dir>-evil` can't satisfy a bare prefix.
  if (filePath !== SERVE_DIR && !filePath.startsWith(SERVE_DIR + sep)) {
    res.writeHead(403).end("Forbidden");
    return true;
  }
  try {
    const info = await stat(filePath);
    if (info.isFile()) {
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      res.end(body);
      return true;
    }
  } catch {
    /* fall through to SPA fallback */
  }
  // SPA fallback: serve index.html for client-side routes.
  try {
    const html = await readFile(join(SERVE_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  cors(req, res);
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, model: "claude (via CLI)", serving: !!SERVE_DIR }));
  }

  if (url.pathname === "/generate" && req.method === "POST") {
    // qa SEC-1: reject cross-origin callers whose Origin isn't allowlisted — the ACAO header alone only
    // stops the browser READING the reply; the work (spending the operator's Claude) would already be done.
    if (!originAllowed(req)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Origin not allowed" }));
    }
    // Optional shared-secret gate (mainly for tunnel mode): only enforced when BRIDGE_TOKEN is set.
    if (BRIDGE_TOKEN && req.headers["x-bridge-token"] !== BRIDGE_TOKEN) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid or missing X-Bridge-Token" }));
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { prompt, schemaHint } = JSON.parse(body || "{}");
        if (!prompt) throw new Error("Missing 'prompt'");
        // Steer Claude to emit ONLY JSON matching the requested shape; the client still Zod-validates,
        // so providers (Gemini/Claude) stay interchangeable.
        const fullPrompt = schemaHint
          ? `${prompt}\n\nReturn ONLY a single valid JSON value matching this shape — no prose, comments, or code fences:\n${schemaHint}`
          : prompt;
        const json = await runClaude(fullPrompt);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ json }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (await serveStatic(req, res, url)) return;
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, BIND_HOST, () => {
  const where = SERVE_DIR ? ` and serving the app from ${SERVE_DIR}` : "";
  console.log(`DeutschPrep Owner-Mode bridge on http://${BIND_HOST}:${PORT}${where}`);
  if (BIND_HOST !== "127.0.0.1" && BIND_HOST !== "localhost") {
    console.log(`⚠️  Bound to ${BIND_HOST} (non-loopback) — the bridge is reachable beyond this machine.`);
  }
  console.log(`Using Claude CLI: ${CLAUDE_BIN} (relies on your existing Claude login).`);
  if (OPEN) {
    const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    const urls = [];
    if (SERVE_DIR) urls.push(`http://localhost:${PORT}/`); // local app
    if (OPEN_URL) urls.push(OPEN_URL); // hosted Settings page (connect your plan)
    for (const u of urls) {
      // On win32 `start <url>` treats a quoted first arg as a window title, so pass an empty title first.
      const a = process.platform === "win32" ? ["", u] : [u];
      spawn(opener, a, { shell: true, stdio: "ignore", detached: true });
    }
  }
});
