# ADR-0007 — Mock exam engine: TOEFL-2026, tiered TTS, and the improvement tracker

Status: Accepted · Date: 2026-06-20 · Supersedes parts of the original mock-engine work order

## Context

The Mock Exam Centre had a working per-section generator (Zod-validated, seed fallback),
single-MCQ scoring, IELTS raw→band, Web-Speech listening, and an AI rubric. Three findings forced
an upgrade:

1. **TOEFL iBT was restructured on 21 Jan 2026** — it is now multistage-adaptive with all-new task
   types on a **1–6 CEFR-aligned** scale (0–120 concordance shown through ~2028). The old format and
   the 0–120 scale are legacy.
2. **Claude has no audio output.** It writes the listening transcript + scores; the *voice* must come
   from Web Speech / Gemini TTS / Google Cloud TTS.
3. The product needed a **complete score / ranking / improvement-tracking** system, persisted.

## Decisions

### Grounding & scales (deterministic)
- `data/exam-specs.ts` carries TOEFL **2026** (`toefl`) and the retired **legacy** form
  (`toefl-legacy`), each with `needs_verification` provenance, Listening `accents`, and a `scale`
  selector. All TOEFL-2026 figures are `needs_verification` with a re-verify link to ETS.
- `lib/exam/scale.ts` holds every band/scale conversion in **tested** code: IELTS half-band
  rounding, TOEFL-2026 accuracy→1–6, CEFR mapping, 0–120 concordance, and a **legacy 0–120→band**
  interpreter (so a held old score still gets tracking). Thresholds are indicative + flagged.

### Item model (exact question types)
- The objective item schema gained a `responseType` of `single | multi | text | matching | ordering`
  (+ `answerIds`/`acceptable`/`pairs`/`tokens`/`order`), covering IELTS (TFNG/YNNG, matching
  headings/features/info, gap-fill) and TOEFL-2026 (Complete the Words, Build a Sentence, …).
- `scoring.ts` marks **every** type deterministically (partial credit for matching) and emits
  per-item results that feed the tracker. The model only *writes*; code *marks*.

### Adaptivity
- TOEFL-2026 Reading/Listening are two-stage: the runner derives a difficulty from Stage-1 accuracy
  and regenerates Stage-2 at that difficulty (`generateAdaptiveStage`). Full per-item CAT was
  rejected as over-engineering; offline/seed gracefully runs Stage 1 only. IELTS is calibration-only.

### Tiered TTS (human-like voice)
- `lib/speech/provider.ts` exposes three tiers: **Web Speech** (free, live, robotic),
  **Gemini TTS** (BYOK, native ≤2-speaker dialogue + prompt-driven accents — the recommended
  pure-browser path), and **Chirp 3: HD** (optional premium; honest CORS caveat). Gemini is called
  over REST to avoid an SDK dependency; PCM is wrapped to WAV client-side.
- Synthesized audio is cached in-memory + Supabase Storage (`exam-audio`, per-user folder), keyed by
  form+segment, so replays/play-once never re-synthesize. Keys never enter the bundle.

### Rubric with evidence
- The AI rubric must **quote the official band-descriptor phrase** justifying each sub-score
  (anchors in `data/band-descriptors.ts`, with provenance) and returns a band/score **range +
  confidence** — never a bare number — always with the "estimate only" disclaimer.

### Persistence & tracker
- Reused the existing `exam_attempts` + `answers` tables (init migration) — **extended** with
  analytics columns rather than duplicated — and added `study_plan_items`, `goals_streaks`, and the
  `exam-audio` bucket (migration 0007, owner-only RLS).
- Attempts are **local-first** (works signed-out/offline), write-through to Supabase when signed in,
  and hydrate back for returning users. `lib/exam/analytics.ts` computes every widget deterministically;
  the dashboard shows **real data or an honest empty state**. Cohort ranking is **personal-only**
  (self vs target) for v1 — real percentiles need a population, and showing them at n≈1 would fabricate
  data.

## Consequences
- Practice content is a study aid, not the real test; practice lengths are shorter than the official
  counts (stated in each spec, flagged). Semantic difficulty calibration is heuristic.
- TOEFL-2026 facts will drift as ETS finalises the rollout — the re-verify affordances and
  `needs_verification` flags are load-bearing, not decoration.
- Audio cache counts against the Supabase 1 GB free tier; eviction is future work.
