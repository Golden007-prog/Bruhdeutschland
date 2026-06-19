/**
 * Claude bridge provider — Owner Mode (work-order §3, §5I). Talks to a local bridge that fulfils
 * generation via the operator's own Claude plan (Agent SDK / `claude -p`). NO key is held in the
 * browser; the bridge uses the operator's own Claude login. The SPA only offers this provider when
 * the bridge answers `/health`, so the public site never depends on it.
 */
import type { ZodType } from "zod";

import { getBridgeUrl } from "./keys";
import { repairPrompt, validate } from "./json";
import { LLMError, type GenerateOpts, type LLMProvider, type ProviderId } from "./types";

export class ClaudeBridgeProvider implements LLMProvider {
  readonly id: ProviderId = "claude-bridge";
  readonly label = "Claude (your plan)";
  readonly model = "claude (via local bridge)";

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${getBridgeUrl()}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateJSON<T>(
    schema: ZodType<T>,
    prompt: string,
    schemaHint: string,
    opts: GenerateOpts = {},
  ): Promise<T> {
    const call = async (text: string): Promise<unknown> => {
      let res: Response;
      try {
        res = await fetch(`${getBridgeUrl()}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, schemaHint, temperature: opts.temperature ?? 0.8 }),
          signal: opts.signal,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new LLMError(msg, /abort/i.test(msg) ? "aborted" : "network", this.id);
      }
      if (res.status === 429) throw new LLMError("Bridge rate limited", "rate_limit", this.id);
      if (!res.ok) throw new LLMError(`Bridge error ${res.status}`, "unknown", this.id);
      // The bridge returns { json: <parsed value> } already extracted from Claude's response.
      const body = (await res.json()) as { json?: unknown };
      return body.json ?? body;
    };

    try {
      return validate(schema, await call(prompt));
    } catch (err) {
      if (err instanceof LLMError) throw err;
      const lastError = err instanceof Error ? err.message : String(err);
      try {
        return validate(schema, await call(repairPrompt(prompt, lastError, schemaHint)));
      } catch (err2) {
        if (err2 instanceof LLMError) throw err2;
        throw new LLMError(
          `Bridge returned invalid output: ${err2 instanceof Error ? err2.message : err2}`,
          "invalid_output",
          this.id,
        );
      }
    }
  }
}
