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
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

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
    const child = spawn(CLAUDE_BIN, ["-p", "--output-format", "json"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: childEnv,
    });
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
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
];

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

server.listen(PORT, () => {
  const where = SERVE_DIR ? ` and serving the app from ${SERVE_DIR}` : "";
  console.log(`DeutschPrep Owner-Mode bridge on http://localhost:${PORT}${where}`);
  console.log(`Using Claude CLI: ${CLAUDE_BIN} (relies on your existing Claude login).`);
  if (OPEN && SERVE_DIR) {
    const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    spawn(opener, [`http://localhost:${PORT}/`], { shell: true, stdio: "ignore", detached: true });
  }
});
