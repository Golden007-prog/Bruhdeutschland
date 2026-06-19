import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Cpu, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { GeminiProvider } from "@/lib/llm/gemini";
import { ClaudeBridgeProvider } from "@/lib/llm/bridge";
import {
  discoverClaudeModels,
  discoverGeminiModels,
  SEED_CLAUDE,
  SEED_GEMINI,
  type ModelMeta,
} from "@/lib/llm/discovery";
import {
  getModelConfig,
  MODEL_PRESETS,
  setModelConfig,
  type ModelConfig,
  type OrchestrationMode,
} from "@/lib/llm/modelConfig";
import { cn } from "@/lib/utils";

type Test = "idle" | "testing" | "ok" | "fail";

const MODES: { key: OrchestrationMode; label: string; desc: string }[] = [
  { key: "smart", label: "Smart routing + failover", desc: "Best fit per task (scoring → Claude, bulk → free Gemini), with automatic failover to the other." },
  { key: "failover", label: "Failover", desc: "Use your primary; fall back to the other on error / rate-limit." },
  { key: "gemini_only", label: "Gemini only", desc: "Only the free Gemini provider." },
  { key: "claude_only", label: "Claude only", desc: "Only Claude (Owner-Mode bridge / your key)." },
];

/**
 * Settings → AI Models (multi-model work order §5). Choose which Claude model and which Gemini model to
 * use, enable either or both, pick an orchestration mode, and discover models live. Config is saved
 * per-user. Keys never leave the browser; the free Gemini tier may train on data — pick accordingly.
 */
export function ModelSettings() {
  const [cfg, setCfg] = useState<ModelConfig>(() => getModelConfig());
  const [gemModels, setGemModels] = useState<ModelMeta[]>(SEED_GEMINI);
  const [claudeModels, setClaudeModels] = useState<ModelMeta[]>(SEED_CLAUDE);
  const [discovering, setDiscovering] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [gemTest, setGemTest] = useState<Test>("idle");
  const [claudeTest, setClaudeTest] = useState<Test>("idle");
  const [msg, setMsg] = useState("");

  const update = (patch: Partial<ModelConfig>) => setCfg(setModelConfig(patch));

  const refresh = async () => {
    setDiscovering(true);
    try {
      const [g, c] = await Promise.all([discoverGeminiModels(), discoverClaudeModels()]);
      setGemModels(g);
      setClaudeModels(c);
    } finally {
      setDiscovering(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const visibleGem = showAll ? gemModels : gemModels.filter((m) => m.recommended || m.id === cfg.geminiModel).slice(0, 6);
  const visibleClaude = showAll ? claudeModels : claudeModels.filter((m) => m.recommended || m.id === cfg.claudeModel).slice(0, 6);

  const testGemini = async () => {
    setGemTest("testing");
    setMsg("");
    try {
      await new GeminiProvider(cfg.geminiModel).generateJSON(z.object({ ok: z.boolean() }), 'Return exactly {"ok": true}.', '{ "ok": boolean }', { temperature: 0 });
      setGemTest("ok");
    } catch (e) {
      setGemTest("fail");
      setMsg(e instanceof Error ? e.message : "Test failed");
    }
  };
  const testClaude = async () => {
    setClaudeTest("testing");
    const ok = await new ClaudeBridgeProvider().isAvailable();
    setClaudeTest(ok ? "ok" : "fail");
  };

  return (
    <section className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
      <div>
        <p className="eyebrow">KI-Modelle · AI models</p>
        <h2 className="mt-0.5 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Cpu className="h-5 w-5 text-primary" aria-hidden /> Pick your models — Claude and/or Gemini
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use either one or both. Models are discovered live from each provider (defaults shown until then).
          Saved to your account.
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Presets:</span>
        {MODEL_PRESETS.map((p) => (
          <button key={p.key} type="button" onClick={() => update(p.apply)} className="rounded-full border bg-card px-2.5 py-1 text-xs hover:bg-muted">
            {p.label}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={discovering} className="ml-auto">
          {discovering ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} Refresh models
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gemini column */}
        <ProviderColumn
          title="Google Gemini (free)"
          enabled={cfg.geminiEnabled}
          onToggle={(v) => update({ geminiEnabled: v })}
          models={visibleGem}
          value={cfg.geminiModel}
          onPick={(id) => update({ geminiModel: id })}
          test={gemTest}
          onTest={() => void testGemini()}
          note="Free tier may use your data to improve models — avoid pasting sensitive PII."
        />
        {/* Claude column */}
        <ProviderColumn
          title="Claude (Owner-Mode / your key)"
          enabled={cfg.claudeEnabled}
          onToggle={(v) => update({ claudeEnabled: v })}
          models={visibleClaude}
          value={cfg.claudeModel}
          onPick={(id) => update({ claudeModel: id })}
          test={claudeTest}
          onTest={() => void testClaude()}
          note="Runs on your Claude subscription via the local Owner-Mode bridge (no key in the browser)."
        />
      </div>

      <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs text-primary hover:underline">
        {showAll ? "Show recommended only" : "Advanced: show all discovered models"}
      </button>
      {gemTest === "fail" && msg && <p className="text-xs text-red-600">{msg}</p>}

      {/* Orchestration mode */}
      <div className="rounded-md border p-4">
        <h3 className="flex items-center gap-1.5 font-medium"><Zap className="h-4 w-4 text-primary" aria-hidden /> When both are on…</h3>
        <div className="mt-2 space-y-2">
          {MODES.map((m) => (
            <label key={m.key} className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="radio" name="orch-mode" checked={cfg.mode === m.key} onChange={() => update({ mode: m.key })} className="mt-1 accent-[hsl(var(--primary))]" />
              <span>
                <span className="font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <Alert variant="info" className="text-xs">
        <AlertTitle>Same output, any model</AlertTitle>
        <AlertDescription>
          Every AI call is Zod-validated identically no matter which model answers, and deterministic
          maths + grounded official facts are unaffected by your choice. More orchestration modes
          (ensemble, verifier, A/B compare, quota meters) build on this and are on the roadmap.
        </AlertDescription>
      </Alert>
    </section>
  );
}

function ProviderColumn({
  title, enabled, onToggle, models, value, onPick, test, onTest, note,
}: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  models: ModelMeta[];
  value: string;
  onPick: (id: string) => void;
  test: Test;
  onTest: () => void;
  note: string;
}) {
  return (
    <div className={cn("rounded-md border p-4", !enabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        <label className="inline-flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="accent-[hsl(var(--primary))]" /> Enabled
        </label>
      </div>
      <div className="mt-3 space-y-1.5">
        <label className="eyebrow block">Model</label>
        <select value={value} onChange={(e) => onPick(e.target.value)} disabled={!enabled} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
          {models.some((m) => m.id === value) ? null : <option value={value}>{value}</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.label}{m.note ? ` — ${m.note}` : ""}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onTest} disabled={!enabled || test === "testing"}>
          {test === "testing" ? <Loader2 className="animate-spin" aria-hidden /> : null} Test model
        </Button>
        {test === "ok" && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Working</span>}
        {test === "fail" && <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3.5 w-3.5" aria-hidden /> Not reachable</span>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
