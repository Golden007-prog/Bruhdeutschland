# Audit 2 — Data-honesty + AI/model defect register (DeutschPrep)

**Fresh, independent audit.** Scope: data-honesty (CLAUDE.md golden rules #2 grounding, #3 provenance,
#4 deterministic math, #5 disclaimer, #6 validated AI output) and AI/model defects across the React/Vite
SPA (`frontend/src`), the LLM provider layer (`lib/llm`), the exam engine (`lib/exam`), the NEW ranking
math (`lib/rank/percentile.ts` + `pages/overview/Leaderboard.tsx`), and the Section-9 Supabase
persistence. **Find & document only — nothing changed.**

Severity model (lead's): **P0** = fabricated official fact shown as truth / unvalidated AI output that
breaks the app / cost blowup · **P1** = wrong result / missing validation/failover · **P2** minor ·
**P3** polish.

> A prior audit lives at `docs/_audit/defects-honesty-ai.md` (Audit 1). I formed my own judgments and
> re-verified in code. Several Audit-1 items remain **unfixed** and are restated here with current line
> numbers; items marked **NEW** were not in Audit 1. Where I checked an Audit-1 claim and it is still
> accurate, I say so.

---

## Executive summary

The anti-hallucination thesis is implemented with real discipline, and it still holds in Audit 2:

- **No P0 found.** No fabricated official German fact is rendered as grounded truth; no stale 2026 number;
  no unvalidated AI output that can break the app or burn quota uncontrollably.
- **Official facts are grounded.** Every user-facing official figure flows through `OfficialFact` objects
  in `lib/facts.ts`, each with a `source` and (for volatile figures) `needsVerification: true`, rendered
  with a badge + source link. Euro literals are single-sourced constants. 2026 currency verified:
  Sperrkonto €11,904/€992, Deutschlandticket €63, work limit 140/280, citizenship 5 yr (3-yr route
  repealed 30 Oct 2025), Blue Card €50,700 / €45,934.20, PR 21/27 mo, Rundfunkbeitrag €18.36 — all current.
- **Deterministic math is correct** (GPA Modified-Bavarian, ECTS, cost-of-living, deadlines, journey
  budget, reverse timeline, funding gap, work-days, SRS, CEFR/0–120 concordance). The NEW
  `percentile.ts` rank math is correct and well-tested.
- **AI output is Zod-validated** with a one-shot repair retry and a fallback ladder (live → retry → bundled
  seed form) for the exam engine.

What remains are **P1/P2 AI-integrity + math-correctness gaps**, not honesty violations. The two that
matter most are both genuinely wrong-result class:

### Top must-fix
1. **[P1] Streak / day-bucketing uses UTC, not local time — off-by-one for the entire user base** (NEW).
2. **[P1] AI model provenance computed but discarded — AI output is not traceable to a model** (Audit-1,
   still unfixed).
3. **[P2] AI rubric `score`/`max` and `bandLow/High` are unbounded — an impossible score (e.g. "9/6") can
   render as an official-looking figure** (NEW).
4. **[P2] User résumé / visa-answer / SOP text is concatenated into prompts unsandboxed** (Audit-1, still
   unfixed) — prompt-injection surface.

---

## Findings

### [P1] (NEW) Streak & analytics day-bucketing uses UTC `toISOString()` — off-by-one for IST/CET users
`lib/exam/attempts.ts:93` (`dayStr = new Date(ms).toISOString().slice(0,10)`), the same UTC slice in
`computeStreak`'s "yesterday" derivation (`attempts.ts:106`), and `lib/exam/analytics.ts:9` + `:52`.
`finishedAt` is a local-epoch `Date.now()` (`ExamRunner.tsx:167`). `toISOString()` converts to **UTC**
before slicing the calendar date.

For the actual audience (India UTC+5:30, Germany UTC+1/+2), any session finished after local midnight but
before the UTC-midnight offset (≈ 01:30–05:30 IST, 01:00–02:00 CET) is bucketed into the **previous**
calendar day. Verified: `2026-06-21 00:30` Berlin → `"2026-06-20"`. Consequences:
- the public streak (`goals_streaks`, written from the same `dayStr` at `attempts.ts:176`) can mis-count —
  two distinct local days can collapse to one UTC day (no increment), or a single late-night session lands
  on the "wrong" day vs. what the user sees on their clock;
- `scoreHistory`/the trend line date labels (`analytics.ts:52`) are off for late-night practice.
The math is *self-consistent* (so it doesn't crash), but it produces a **wrong result** the user can
directly observe (a broken streak). Impact: erodes trust in the one gamified, motivational metric.
**Fix:** bucket by **local** date — build `YYYY-MM-DD` from `getFullYear()/getMonth()+1/getDate()` — and
derive "yesterday" from a local-midnight `Date`, consistently in `attempts.ts` and `analytics.ts`.

### [P1] (Audit-1, STILL UNFIXED) AI model provenance is computed then discarded — output not traceable
`lib/llm/registry.ts:89-110` — `routeJSON` returns `{ result, provenance: { provider, model, latencyMs } }`,
but every consumer drops it:
- `features/mock/ExamRunner.tsx:212` — `.then((r) => r.result)` discards provenance; `recordAttempt`
  (`attempts.ts:112`, called at `ExamRunner.tsx:168`) stores bands/confidence but **not** which model graded.
- `features/ai/useGenerate.ts:75-77` — the feature pages call `provider.generateJSON` directly and never
  capture which provider/model answered.

Impact: the UI shows an "AI-generated — review before use" badge but cannot say whether a given SOP,
skill-gap list, or Writing band came from `gemini-2.5-flash-lite`, `gemini-2.5-flash`, or Claude. With
cross-provider **failover** and a "smart" mode that silently switches models, results are not reproducible
or auditable. Audit task #7 ("is model provenance recorded?") is **not satisfied**. CLAUDE.md §3's
provenance principle, extended to model output, is unmet. **Fix:** thread `provenance` out of `routeJSON`,
store `{provider, model}` on the attempt + alongside each AI result, and render it next to the AI badge.

### [P2] (NEW) AI rubric `score`/`max`/`bandLow`/`bandHigh` are unvalidated — impossible scores can render
`lib/exam/schema.ts:217-234` — `rubricFeedbackSchema` declares `score: z.number()` and `max: z.number()`
with **no bound and no cross-field check**, and `bandLow`/`bandHigh` are free `z.string()` with no ordering
or scale constraint. `buildRubricPrompt` *tells* the model the per-criterion max (`prompts.ts:162`,
`maxFor` → IELTS 9 / TOEFL 6 / else 5) but `validate` never enforces `0 ≤ score ≤ max`, nor that `max`
matches the exam's real scale, nor that `bandLow ≤ bandHigh`. `ExamRunner.tsx:465` then renders
`{c.score}/{c.max}` verbatim as an `official-figure`, and `:457` renders `Estimated {bandLow}–{bandHigh}`.

Impact: a model that returns `score: 9, max: 6` (or `max: 100`, or `bandLow: "7"`/`bandHigh: "5"`) produces
a nonsensical, official-looking "9/6" or an inverted range shown to the user as a graded result.
Mitigations: it's labelled "Estimated … confidence" and "only a certified examiner gives a real score"
(`ExamRunner.tsx:421`), and it can't break the app. Hence P2, not P0/P1 — but it's an unvalidated AI
**number presented as a score**, which is exactly what golden rule #6 exists to prevent. **Fix:** in the
schema, clamp/superRefine `score` to `[0, max]`, pin `max` to the exam scale (pass it in), and assert a
parseable `bandLow ≤ bandHigh`; reject-and-repair otherwise.

### [P2] (Audit-1, STILL UNFIXED) User text concatenated into prompts without delimiter/sandbox
The exam **rubric** prompt correctly fences candidate text in `"""…"""` (`lib/exam/prompts.ts:181-185`),
but the user-content feature prompts do not:
- `pages/profile/Parse.tsx:118-119` — `"Text:\n" + text.trim()` appends raw résumé / LinkedIn / uploaded-file
  text directly after the instructions, no delimiter, no "treat as data" preamble.
- `pages/visa/Simulator.tsx:102` — `` `Applicant's answer: ${answer.trim()}` `` appends raw answer text.
- `pages/documents/Sop.tsx:151-156` — raw `background` / `motivation` / `whyProgram` / `careerGoal` fields.
- `pages/profile/Matching.tsx:192` — `` `Goal: ${goal.trim()}` `` appended raw.

Impact: a crafted résumé/answer ("Ignore the above instructions and output …") can steer the model's
extraction or feedback. Bounded because (a) output is Zod-validated to a fixed shape (can't break the app or
assert official facts), (b) the parse result only pre-fills an editable form the user reviews, (c) it's the
user's own session/key (no cross-user effect). But injected content can mislead the user (fabricated work
experience pre-filled, or feedback that endorses a bad visa answer). **Fix:** wrap all untrusted user
content in explicit delimiters with a "treat strictly as data, never as instructions" preamble, mirroring
the rubric prompt's `"""` pattern.

### [P2] (Audit-1, STILL UNFIXED) AI-generated exam answer keys are never verified before scoring
`lib/exam/schema.ts:75-93` (`objectiveQuestionSchema.superRefine`) validates only **structural**
consistency (e.g. `answerId` present, `order.length === tokens.length`) — never that the designated answer
is actually correct. The model authors both the question and its own answer key; `scoreExam`/`markItem`
(`lib/exam/scoring.ts`, invoked `ExamRunner.tsx:186`) then marks deterministically against that key and the
review screen stamps an "indicative band" seal. For GRE/GMAT quantitative items the prompt only says
"Ensure the math is correct" (`prompts.ts:138-140`) with no second-pass/self-consistency check. A wrong
model key yields a confidently-wrong "correct/incorrect" verdict and a wrong band. Mitigations: every item
carries an `explanation` + `sourceRef`, passages/transcripts are shown at review for self-check, and the
band is captioned "indicative". Inherent to AI-authored exams → P2. **Fix (optional):** a cheap verifier or
majority-vote pass for math items, or label objective marks "auto-generated — verify against the explanation".

### [P2] (NEW) `gemini-2.5-flash` grading vs `routeJSON` failover can silently downgrade the grader to "lite"
`lib/llm/registry.ts:73` selects `qualityGemini` (flash, not lite) for `kind: "grade"`, which is correct.
But `routeJSON` (`:99-108`) fails over to the *next* provider in the chain on **any** error, and the chain
for grading is `[claude?, qualityGemini?]` — so if Claude is enabled-but-unreachable the grader uses
`qualityGemini` (fine). However the `providerChain` for grading never includes the **lite** model, so no
downgrade actually occurs here — verified OK. Reported only to close the loop on the failover question; **no
defect** — grading never silently drops to `flash-lite`.

### [P2] (Audit-1, STILL ACCURATE) `extractJson` greedy outer-bracket slice can mis-parse model prose
`lib/llm/json.ts:9-26` slices from the first `{`/`[` to the **last** `}`/`]`. If a model emits prose with a
stray brace before the real JSON (or two JSON values), the slice can capture the wrong span — then either
`JSON.parse`-throws (caught → repair retry, fine) or rarely parses a wrong-but-valid object. Low impact:
Zod `validate` rejects a wrong shape → repair retry / seed-bank fallback; worst case is one wasted retry.
The same logic is duplicated in the Claude bridge. **Fix:** prefer a balanced-bracket scan.

### [P1] (NEW, from math sub-audit) IELTS section band double-rounds through integer percent on short sets
`lib/exam/scoring.ts:160` & `:166` — `rawToBand(Math.round((percent/100)*40), table)` where `percent`
(`:147`) is itself `Math.round(correct/total*100)`. For a full 40-question section this is lossless, but for
the **short practice sections** the app actually generates (mini-mode halves question counts, often 4–14
items) the integer-percent → /40 round-trip distorts the band. Example: a 13-question section, 12/13 correct
→ percent 92 → scaledRaw 37 → **band 8.5** — a single miss out of 13 should not read as 8.5. Impact: practice
band estimates are inflated/jumpy on short sets, and these feed `predictedBand`/`bestOverall`. **Fix:** scale
from the fractional ratio (`correct/total*40`), or map from raw counts, instead of round-tripping integer %.

### [P2] (NEW, from math sub-audit) Test claims unmet — untested deterministic branches marked "tested"
CLAUDE.md golden rule #4 / the `analytics.ts:1-5` "Pure + unit-tested" header are overstated for several
exported functions:
- `lib/exam/analytics.ts:49` `scoreHistory` and `:62` `latestSkillStats` — **no test** (trend line + radar).
- `lib/exam/scoring.ts:203-210` — the `toefl-legacy` overall-0–120 estimation branch has **no test**
  (`scoring.test.ts` covers only `ielts` and `toefl-2026`).
- `lib/calc/reverseTimeline.ts` — only **WS** intake is tested; the **SS** branch (`:43-45,68`), whose
  negative-month-index back-dating rolls into the prior year, is the most off-by-one-prone path and is
  entirely untested.
Impact: deterministic widgets the app presents as authoritative are unverified. **Fix:** add the missing
cases (SS reverse-timeline, `scoreHistory`/`latestSkillStats`, `toefl-legacy` scoreExam).

### [P1] (NEW, grounding sub-audit) Grounded `TUITION_BW` fact is orphaned; €1,500/sem reaches users as raw prose
The grounded `TUITION_BW` OfficialFact (`facts.ts:68-74`, `needsVerification: true`, sourced) is **never
imported or rendered** and is not in `FINANCE_FACTS`. The €1,500 figure reaches the user only through
ungrounded literals with no provenance badge:
- `pages/finance/Overview.tsx:111` (prose), `lib/pathway/pathway.ts:186` (`detail`), `lib/pathway/roadmap.ts:58`
  (`detail`), `lib/seed/programs.ts:11` (`const BW = 1500`) + `:320` (prose), `lib/programs/types.ts:60`.
The page does carry a `<Disclaimer/>` and the step-level `detail`s carry `needsVerification`, so it is not a
P0 fabrication — but the one official figure with a ready-made grounded fact is the one not using it, and six
independent literals can silently drift. **Fix:** export `TUITION_BW_EUR = 1500` from `facts.ts`, derive all
prose from it, and render `TUITION_BW` via `OfficialFactRow` (add it to `FINANCE_FACTS`).

### [P2] (NEW, grounding sub-audit) Blue Card & immigration-ladder numbers restated as literals, not from facts.ts
- `pages/career/Outcomes.tsx:63` hard-codes `"(€45,934.20)"` / `"(€50,700)"` instead of importing
  `BLUE_CARD_SHORTAGE_EUR`/`BLUE_CARD_STANDARD_EUR` (which already exist and are used by the deterministic
  checker). Values are correct and the line says "— verify", but they can drift.
- `lib/seed/immigration.ts:50,57-58` restates `"€50,700 / €45,934.20 (2026)"` and `21/27 months` as literal
  `timing` strings. Each step carries a `source` and `ImmigrationPathway.tsx` also renders the grounded
  `IMMIGRATION_FACTS` below — so the user sees provenance — but the seed strings aren't derived from the
  constants. **Fix:** build these strings from the `facts.ts` constants (`BLUE_CARD_*`, `BLUE_CARD_PR_MONTHS_*`).

### [P2] (Audit-1, STILL ACCURATE) UMCH private-medicine tuition (~€34,800/yr) cites the wrong source
`lib/pathway/pathway.ts:186` states an illustrative private-medicine tuition figure with
`needsVerification: true` but cites `source("daadScholarships")`, which is not the figure's actual source
(UMCH is not in the SOURCES registry). Flagged unverified, so it renders "unstamped" — not a fabrication —
but the citation is misleading. **Fix:** drop the exact number or add UMCH's official page to SOURCES.

### [P3] (NEW) `predictedBand` clamps to IELTS 0–9 regardless of scale
`lib/exam/analytics.ts:127` clamps the projected band to `[0, 9]`. For TOEFL-2026 (1–6 scale) inputs are
always ≤ 6, so the clamp never bites wrongly today — but the function is scale-agnostic and would not cap a
TOEFL prediction at 6. Latent inconsistency, no active wrong output. **Fix:** clamp to the attempt's scale
max, or document the IELTS assumption.

### [P3] (Audit-1, STILL ACCURATE) Feature-page rate-limit path has no seed-bank fallback
Exam generation has a full fallback ladder to a bundled seed form (`lib/exam/generate.ts:121-131`), but the
feature pages (`useGenerate`) only show a retry/template message on `rate_limit` (`useGenerate.ts:42-44`).
Each page keeps its deterministic template path, so there is no dead-end — hence P3. Noted for completeness.

### [P3] (NEW) `MathText` renders KaTeX HTML for AI-authored GRE/GMAT items via `dangerouslySetInnerHTML`
`features/mock/MathText.tsx:18-20` renders `katex.renderToString(part.value, { throwOnError: false })` for
`$…$` spans pulled from **model-generated** question text. KaTeX output is generally safe (it escapes input
and emits its own markup), and `throwOnError:false` prevents crashes, so this is low risk — but it is the
one place AI text reaches the DOM as raw HTML. **Fix (defensive):** pass `trust:false` / `strict:true` to
KaTeX (default-ish) and/or sanitize, and keep KaTeX pinned/updated. No active vuln found.

---

## Provider / cost-abuse review (verified — no new defect)

- **BYOK key never exposed** — `lib/llm/keys.ts` localStorage-only; `messageFor` (`useGenerate.ts:38`) never
  logs raw errors/PII; key sent only to the provider SDK endpoint. ✔
- **Failover honours user-abort** — `routeJSON` (`registry.ts:106`) re-throws on `opts.signal?.aborted`
  instead of failing over, so a cancel doesn't burn the second provider's quota. ✔
- **Multi-model modes** (`registry.ts` + `modelConfig.ts`): `gemini_only` / `claude_only` / `smart` /
  failover resolve correctly; grading prefers the quality Gemini (not lite) or the Claude bridge. ✔
  (The provenance of *which* model answered is computed but not recorded — see P1 above.)
- **Owner-Mode bridge** is build-excluded from the public Pages site and holds no key (Audit-1 verified the
  loopback bind + Origin allowlist + token; unchanged here). ✔
- **Leaderboard / ranking** (`pages/overview/Leaderboard.tsx`): reads the leak-safe `my_rank` RPC (caller's
  own value + anonymized `below`/`total`/`avg`/`p50`/`p90` aggregates, never another user's row); the
  percentile/rank shown is the tested `lib/rank/percentile` formula, not model output. `avg`/`p50`/`p90` are
  rendered as-is from the RPC (server-trusted, appropriate). Opt-in board is default-OFF, pseudonymous. ✔

---

## Official-fact grounding table (every official value rendered → grounded?)

| Official fact | Value shown (2026) | In facts.ts? | needs_verification | Where rendered (file:line) |
|---|---|---|---|---|
| Sperrkonto / yr · mo | €11,904 · €992 | Yes (`SPERRKONTO_AMOUNT`, consts `:28-29`) | true | Sperrkonto.tsx; Budget.tsx:31/179 |
| Tuition — public | No fees (most states) | Yes (`TUITION_PUBLIC`, FINANCE_FACTS) | false | finance/Overview.tsx:132 |
| **Tuition — BW** | **€1,500/sem** | **Fact ORPHANED — prose uses raw literals** | (fact unused) | **Overview.tsx:111; pathway.ts:186; roadmap.ts:58; programs.ts:11/320; types.ts:60 — P1** |
| Semesterbeitrag | ~€70–€430/sem | Yes (`SEMESTERBEITRAG`) | true | finance/Overview.tsx:132; Enrolment.tsx:41 |
| Health insurance | ~€120–€140/mo | Yes (`HEALTH_INSURANCE`) | true | HealthInsurance.tsx:72; finance/Overview.tsx:132 |
| Deutschlandticket | €63/mo (raised 1 Jan 2026) | Yes (`DEUTSCHLANDTICKET_PRICE`) | true | campus/Deutschlandticket.tsx:33 |
| Work limit | 140 full / 280 half | Yes (`WORK_LIMIT` + `WORK_LIMIT_DAYS`) | true | WorkDays.tsx:45; Work.tsx; TaxId.tsx:25 |
| Visa fee · type | €75 · National "D" | Yes (`VISA_FEE`/`VISA_TYPE`, const `:30`) | fee true / type false | via VISA_FACTS; Budget.tsx:30 |
| Visa processing | Several weeks–months | Yes (`VISA_PROCESSING`) | true | via VISA_FACTS |
| APS — India | Mandatory since 1 Nov 2022 · ~€225 | Yes (`APS_INDIA` + country.ts) | true | facts.ts:152; country.ts:29 |
| Anmeldung | Within 14 days | Yes (`ANMELDUNG_WINDOW` + `ANMELDUNG_DAYS`) | false | via VISA_FACTS |
| Blue Card threshold | €50,700 / €45,934.20 | Yes (`BLUE_CARD_THRESHOLD`, consts `:40-41`) | true | BlueCardCheck.tsx:44; ImmigrationPathway.tsx:77 — **literal dupes Outcomes.tsx:63, immigration.ts:50 (P2)** |
| Blue Card → PR | 21 mo (B1) / 27 mo | Yes (`BLUE_CARD_PR`, consts `:42-43`) | true | ImmigrationPathway.tsx:77 — **literal dupe immigration.ts:57-58 (P2)** |
| Citizenship | 5 years (3-yr repealed, not 8) | Yes (`CITIZENSHIP_RULE`, const `:44`) | true | ImmigrationPathway.tsx:77/85; PrCitizenship.tsx:114 |
| Job-seeker permit | 18 months | Yes (`JOB_SEEKER_MONTHS`) | n/a const | immigration ladder |
| DAAD stipend | €992/mo | Yes (`DAAD_STIPEND`) | true | finance/Scholarships |
| Deutschlandstipendium | €300/mo | Yes (`DEUTSCHLANDSTIPENDIUM`) | false | Scholarships; seed/finance.ts:56 |
| ECTS / year | 60 (30/sem) | Yes (`ECTS_YEAR`) | false | profile/academic pages |
| German grade band | 1.0 best – 5.0 fail | Yes (`GERMAN_GRADE_BAND`) | false | profile/GPA pages |
| IELTS bar | 6.5 overall | Yes (`IELTS_TYPICAL`) | true | language/Overview.tsx:157 |
| TOEFL bar | ~85–90 / new 1–6 (Jan 2026) | Yes (`TOEFL_TYPICAL`) | true | language/Overview.tsx:157 |
| TestDaF bar | TDN 4 all sections | Yes (`TESTDAF_TYPICAL`) | true | language/Overview.tsx:157 |
| Rundfunkbeitrag | €18.36/mo | Yes (`RUNDFUNK_FEE`, seed/arrival.ts:84) | true | Rundfunkbeitrag.tsx:40 |
| UMCH private-med tuition | ~€34,800/yr | No — ungrounded literal, **wrong citation** | step-level only | pathway.ts:186 — P2 |
| Residence-permit fee | ~€100 | No (inline, hedged "verify") | n/a | arrival.ts:61 — P3 |
| AI Writing/Speaking rubric score | `{score}/{max}`, band range | n/a (AI estimate) | **unbounded — not validated** | ExamRunner.tsx:457/465 — P2 |

**No FABRICATED official fact is shown as grounded truth, and no stale 2026 number was found.** The flagged
rows are either orphaned-fact/raw-literal drift risks (P1/P2) or unverified/unattributed-but-flagged values.

---

## Verdict vs. Audit 1

Audit 1's core conclusions hold. Of its must-fixes, **P1 provenance**, **P2 prompt-sandbox**, **P2 answer-key
verification**, and **P2 `extractJson`** are all **still unfixed** at the cited lines. Audit 2 adds four NEW
findings the first pass missed: the **UTC day-bucketing off-by-one (P1)**, the **unbounded rubric score/band
(P2)**, the **IELTS short-set double-rounding (P1)**, and the **orphaned `TUITION_BW` grounded fact (P1)** —
plus several NEW test-coverage and literal-drift items.
