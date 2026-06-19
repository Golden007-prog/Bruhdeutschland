import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, ExternalLink, KeyRound, Loader2, Radio, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeminiProvider } from "@/lib/llm/gemini";
import { ClaudeBridgeProvider } from "@/lib/llm/bridge";
import {
  getActiveProviderId,
  getBridgeUrl,
  getKey,
  setActiveProviderId,
  setBridgeUrl,
  setKey,
} from "@/lib/llm/keys";
import { listProviders, type ProviderStatus } from "@/lib/llm/registry";
import type { ProviderId } from "@/lib/llm/types";

type TestState = "idle" | "testing" | "ok" | "fail";

const INSTALLER_URL = "https://github.com/Golden007-prog/Bruhdeutschland/releases/latest";

/**
 * AI provider settings (work-order §3). BYOK: the user's key lives only in this browser. Owner Mode
 * is detected when the local bridge answers. Google sign-in (Account panel) is for the account only —
 * it is NOT a Gemini key, which comes from aistudio.google.com.
 */
export function AiSettings() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [geminiKey, setGeminiKey] = useState(getKey("gemini") ?? "");
  const [bridgeUrl, setBridgeUrlState] = useState(getBridgeUrl());
  const [active, setActive] = useState<string>(getActiveProviderId() ?? "");
  const [geminiTest, setGeminiTest] = useState<TestState>("idle");
  const [bridgeTest, setBridgeTest] = useState<TestState>("idle");
  const [testMsg, setTestMsg] = useState("");
  const [bridgeMsg, setBridgeMsg] = useState("");

  const bridgeDetected = providers.find((p) => p.id === "claude-bridge")?.available ?? false;

  const refresh = () => listProviders().then(setProviders);
  useEffect(() => {
    void refresh();
  }, []);

  function saveGemini() {
    setKey("gemini", geminiKey);
    setGeminiTest("idle");
    void refresh();
  }

  async function testGemini() {
    setKey("gemini", geminiKey);
    setGeminiTest("testing");
    setTestMsg("");
    try {
      await new GeminiProvider().generateJSON(
        z.object({ ok: z.boolean() }),
        'Return exactly {"ok": true}.',
        '{ "ok": boolean }',
        { temperature: 0 },
      );
      setGeminiTest("ok");
      void refresh();
    } catch (err) {
      setGeminiTest("fail");
      setTestMsg(err instanceof Error ? err.message : "Test failed");
    }
  }

  function saveBridge() {
    setBridgeUrl(bridgeUrl);
    setBridgeUrlState(getBridgeUrl());
    setBridgeTest("idle");
  }

  async function testBridge() {
    setBridgeUrl(bridgeUrl);
    setBridgeTest("testing");
    setBridgeMsg("");
    const ok = await new ClaudeBridgeProvider().isAvailable();
    setBridgeTest(ok ? "ok" : "fail");
    if (!ok) {
      const url = getBridgeUrl();
      const onHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(url);
      if (onHttps && url.startsWith("http://")) {
        setBridgeMsg(
          "This site is HTTPS, so the browser blocks calls to http://localhost (mixed content). Run `npm run owner` and open http://localhost:8787 directly, or expose the bridge over an HTTPS tunnel (e.g. cloudflared) and paste that URL.",
        );
      } else if (isLocal) {
        setBridgeMsg("Couldn't reach the bridge — start it with `npm run owner`, or use the installer below.");
      } else {
        setBridgeMsg("Couldn't reach the bridge at that URL. Check it's running and reachable over HTTPS.");
      }
    }
    void refresh();
  }

  function chooseActive(id: ProviderId | "") {
    setActive(id);
    if (id) setActiveProviderId(id as ProviderId);
  }

  return (
    <section className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <p className="eyebrow">KI-Anbieter · AI provider</p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Bring your own AI key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your key stays in this browser and is sent only to the provider you choose — never to us,
          never into the build. The default free option is Google Gemini.
        </p>
      </div>

      {/* Gemini BYOK */}
      <div className="rounded-md border p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h3 className="font-medium">Google Gemini (free)</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Get a free key (no credit card) at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            aistudio.google.com/apikey <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          . A Google login alone is not a key — generate one here.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="gemini-key" className="sr-only">Gemini API key</label>
          <Input
            id="gemini-key"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza…"
            className="max-w-xs flex-1"
            autoComplete="off"
          />
          <Button size="sm" onClick={saveGemini}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => void testGemini()} disabled={!geminiKey || geminiTest === "testing"}>
            {geminiTest === "testing" ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Test key
          </Button>
          <TestBadge state={geminiTest} />
        </div>
        {geminiTest === "fail" && testMsg && <p className="mt-2 text-xs text-red-600">{testMsg}</p>}
      </div>

      {/* Owner-Mode bridge */}
      <div className="rounded-md border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="font-medium">Claude (your plan) — Owner Mode</h3>
          </div>
          {bridgeDetected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Detected — using Claude (your plan)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <XCircle className="h-3 w-3" aria-hidden /> Not detected
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Run the local bridge (<code>npm run owner</code>) to use your own Claude plan — no API key,
          no bill. Paste a Cloudflare-tunnel HTTPS URL here to drive it from the hosted site.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="bridge-url" className="sr-only">Bridge URL</label>
          <Input
            id="bridge-url"
            value={bridgeUrl}
            onChange={(e) => setBridgeUrlState(e.target.value)}
            placeholder="http://localhost:8787"
            className="max-w-xs flex-1"
          />
          <Button size="sm" onClick={saveBridge}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => void testBridge()} disabled={bridgeTest === "testing"}>
            {bridgeTest === "testing" ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Test bridge
          </Button>
          <TestBadge state={bridgeTest} />
        </div>
        {bridgeTest === "fail" && bridgeMsg && (
          <p className="mt-2 text-xs text-amber-700" role="status">{bridgeMsg}</p>
        )}
        {!bridgeDetected && (
          <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3 text-xs">
            <p className="font-medium">No bridge running? Use the one-click installer.</p>
            <p className="mt-0.5 text-muted-foreground">
              It installs Node + Claude Code and starts Owner Mode on your machine. Windows will warn
              about an unsigned app — that&apos;s expected; verify the published SHA-256.
            </p>
            <a
              href={INSTALLER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Download the one-click installer <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        )}
      </div>

      {/* Active provider */}
      <div className="rounded-md border p-4">
        <h3 className="font-medium">Active provider</h3>
        <p className="mt-1 text-xs text-muted-foreground">Auto picks the best available. Override it here.</p>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="active" checked={active === ""} onChange={() => chooseActive("")} className="accent-[hsl(var(--primary))]" />
            Auto (recommended)
          </label>
          {providers.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="active" checked={active === p.id} onChange={() => chooseActive(p.id)} className="accent-[hsl(var(--primary))]" />
              <span>{p.label}</span>
              <span className={`inline-flex items-center gap-1 text-xs ${p.available ? "text-emerald-700" : "text-muted-foreground"}`}>
                {p.available ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : <XCircle className="h-3 w-3" aria-hidden />}
                {p.available ? "available" : "not detected"}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Alert variant="info" className="text-xs">
        <AlertTitle>Privacy</AlertTitle>
        <AlertDescription>
          Keys are stored only in your browser&apos;s localStorage and are never logged or uploaded.
          Clear them any time by emptying the field and pressing Save.
        </AlertDescription>
      </Alert>
    </section>
  );
}

function TestBadge({ state }: { state: TestState }) {
  if (state === "ok")
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Working</span>;
  if (state === "fail")
    return <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3.5 w-3.5" aria-hidden /> Failed</span>;
  return null;
}
