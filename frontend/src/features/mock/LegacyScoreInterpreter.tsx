import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { bandToCefr, legacy120ToBand1to6 } from "@/lib/exam/scale";

/**
 * Interpret a held legacy TOEFL 0–120 score against the new 1–6 CEFR-aligned scale (work-order §4).
 * Deterministic + indicative — labelled needs_verification, never presented as an official conversion.
 */
export function LegacyScoreInterpreter() {
  const [raw, setRaw] = useState("");
  const n = Number(raw);
  const valid = raw !== "" && Number.isFinite(n) && n >= 0 && n <= 120;
  const band = valid ? legacy120ToBand1to6(n) : null;

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Already have an old 0–120 score?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Convert a legacy TOEFL score to the new 1–6 band so your tracking stays meaningful.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor="legacy-score" className="sr-only">Legacy TOEFL score (0–120)</label>
        <input
          id="legacy-score"
          type="number"
          min={0}
          max={120}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="e.g. 95"
          className="h-9 w-28 rounded-md border bg-card px-2 text-sm"
        />
        {band !== null && (
          <span className="inline-flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="official-figure font-semibold">Band {band}</span>
            <span className="text-muted-foreground">· CEFR {bandToCefr(band)}</span>
          </span>
        )}
        {raw !== "" && !valid && <span className="text-xs text-red-600">Enter a number from 0 to 120.</span>}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Indicative concordance only (needs verification) — official conversions are published by ETS.
      </p>
    </section>
  );
}
