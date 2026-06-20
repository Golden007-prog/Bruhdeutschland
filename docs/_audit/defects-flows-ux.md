# DeutschPrep — Core-Flows / Feature-Correctness / UX-A11y Defect Audit

> Scope: React+Vite SPA (HashRouter on Pages), `frontend/src`. Backend = Supabase.
> Method: read-the-code, adversarial, evidence-based. Findings VERIFIED against source before listing.
> Author: core-flows + feature-correctness + UX/A11y subagent. **Find & document only — no code changed.**

## Executive summary

The app is in notably good shape for a build of this size (~54 routed pages + many sub-pages). The
spine of the product — **signup → onboarding → dashboard → matching → mock test → finance → visa →
roadmap** — is complete with **no dead-ends and no dead buttons** in the core path. The two riskiest
areas a public launch usually fails on are both handled well:

- **Empty/first-run states are honest.** Dashboard, Tracker, Calendar, Reminders, Shortlist, SkillGap
  etc. all show real empty states with no fabricated numbers (`Dashboard.tsx:101` gates on
  `isProfileStarted`; SkillGap labels seed data as "example, not your analysis").
- **Per-user persistence + resume-after-refresh works** where it matters most. The mock-exam runner,
  intake form, tracker, calendar, and all trackers persist via `useSyncedState` / `examProgress`, both
  **namespaced per user id** (`userScope.scopedKey`, `syncedStore` reset-on-auth-change) — the known
  data-isolation P0 is correctly closed in the storage layer.

`tsc --noEmit` passes clean.

**There are no confirmed P0s in this scope** (core flow / app-breaking / fabricated-fact-shown-as-truth).
Official figures consistently carry provenance / `needsVerification`, and disclaimer-flagged pages render
`<Disclaimer>`. The real defects are **P2/P3 polish and a handful of genuine P1 UX gaps**, listed below.

### Important: false positives corrected during verification
Parallel exploration surfaced several claims that **do not hold up in the code** and are excluded from the
register (documented here so they aren't re-raised):

| Claimed | Verdict | Evidence |
|---|---|---|
| "MockExamRunner loses all answers/timer on refresh" (P1) | **False as a live bug.** `MockExamRunner.tsx` is **orphaned/unused** — every exam page renders `MockExamPage`→`ExamRunner`, which autosaves + resumes. | grep: `MockExamRunner` only self-referenced; `ExamRunner.tsx:106-118` autosave, `:62-69` resume, `MockExamPage.tsx:149-164` Resume UI |
| "ExamRunner submit enabled while adapting" (P1) | **False.** Submit and the adapt button are mutually exclusive branches; you can't reach Submit during adapt. | `ExamRunner.tsx:344-355` (`needsAdaptStage ? adapt : lastSection ? submit : next`) |
| "DeadlineReminder null crash on empty date" (P1) | **False.** Render is guarded `{date && sev && (…)}`. | `DeadlineReminder.tsx:48-52` |
| "ProcessPage StatusBoard is a dead component" (P3) | **False.** `StatusBoard` is a real imported component fed `APPLICATION_STAGES`. | `Process.tsx:4,52` |
| "Reminders r6 omission (7 defs, 6 wired)" (P3) | **False.** r6 is declared `:42` and included in the array `:46`. | `Reminders.tsx:42,46-47` |
| ".ics UID collisions for same-date events" (P0) | **False.** UID includes the loop index `i`. | `ics.ts:69` (`deutschprep-${i}-${d}-${dtstamp}`) |
| "deadlines.ts TZ off-by-one P0" | **False.** `parseISODate` builds a *local* date explicitly to avoid UTC drift; `daysUntil` normalizes both ends to local midnight. | `deadlines.ts:10-13,21-24` |
| "Tracker draft text lost on refresh" (P1) | **Downgraded.** Saved apps persist (`useSyncedState`); only 2 chars of unsubmitted add-form text are transient — standard, not P1. | `Tracker.tsx:34-45` |

---

## Findings register

### P1 — feature gap / wrong-ish result / missing critical state

**[P1] SOP & CV "generate from template" produce filler with empty input — no validation gate.**
`pages/documents/Sop.tsx` `composeDraft()` substitutes placeholders (`[target program]`, `[university]`)
even when the user filled nothing, so clicking Generate on an empty form yields confident-looking
boilerplate that reads as a real draft. Same shape on `Cv.tsx` (`canPolish` only checks the AI path).
*Impact:* a new user can ship an empty-skeleton SOP without realizing it isn't tailored. *Rec:* require
at least program + one profile field before enabling the template generate, or watermark obviously-empty
fields in the output.

**[P1] Exam autosave persists `timeLeft` only on answer/section change, not per tick.**
`ExamRunner.tsx:107-118` — the autosave effect reads `timeLeftRef.current` but its dependency array
(`[answers, openResponses, sectionIdx, exam, phase]`) excludes `timeLeft`, so the saved clock is only as
fresh as the last answer/navigation. After a refresh mid-section the candidate can recover several
"free" minutes (or lose them). Answers themselves are safe. *Rec:* persist a wall-clock deadline
(`startedAt + sectionDurationMs`) and recompute `timeLeft` on resume, rather than snapshotting the count.

**[P1] Listening "Replay (study mode)" lets candidates replay audio unlimited times during a timed
mock**, contrary to the once-only IELTS/TOEFL rule the runner otherwise emulates (paste is even
disabled). `features/mock/ListeningPlayer.tsx` (replay control resets `played`). *Impact:* inflated,
unrealistic listening scores — undermines the "practice like the real test" promise. *Rec:* gate replay
behind review/results phase only, or label the section "untimed study mode" explicitly.

### P2 — edge bug / confusing UX / weak validation

**[P2] Silent no-op on invalid "add" actions.** `finance/WorkDays.tsx` returns early when both full and
half days are 0 with no feedback; `Tracker.tsx:38-45` returns on blank fields (mitigated by a `disabled`
button, so lower). *Rec:* inline hint/toast instead of a dead-feeling click.

**[P2] Custom grade scale accepts degenerate input (best ≤ minPass) only caught post-submit.**
`profile/Evaluate.tsx` + `IntakeFields.tsx:172-199` — entering best=50, minPass=100 surfaces the
converter error but the inputs aren't validated client-side and the error isn't `aria-live`, so a
screen-reader user gets no announcement. *Rec:* validate `customBest > customMinPass` inline + live region.

**[P2] BlueCard salary check accepts 0 / nonsensical salaries.** `arrival/BlueCardCheck.tsx` `min={0}`
returns "below threshold, gap ≈ €50.7k", which isn't actionable. *Rec:* `min` a sane floor or hint.

**[P2] Mock section timer auto-advances at 0:00 with no "time's up" notice.** `ExamRunner.tsx:90-100`
jumps straight to the next section (or submit) the instant the clock hits zero. Disorienting; a brief
`aria-live` "Section time up — moving on" would help, especially for screen-reader users.

**[P2] Several trackers cycle status linearly with no direct pick / undo.**
`finance/ScholarshipTracker.tsx` (researching→applied→awarded→rejected→researching) — an accidental
click past the target requires three more clicks to return. *Rec:* segmented control / dropdown.

**[P2] Default assumptions that quietly bias output for some users.** `finance/HealthInsurance.tsx`
defaults `under30=true`; `FundingPlan`/`ApplicationCosts` default missing income/APS lines to 0 with no
"add yours" hint. Derive from `dateOfBirth`/`homeCountry` where the profile already has it.

**[P2] Feasibility/eligibility verdicts show weighted deltas (+20/−5) with no link to the rule.**
`start/Feasibility.tsx` — a user can't verify *why* a factor scored what it did. Per CLAUDE.md grounding
spirit, link each factor to its source/explanation.

**[P2] Deutschlandticket price rendered as "verify 2026" with the value hidden.** `campus/Deutschlandticket.tsx`
— only the verify flag shows; the actual figure (even as a grounded-but-stale number) is absent, so the
page under-informs. *Rec:* show last-known value + `needsVerification` rather than suppressing it.

### P3 — polish / minor a11y / dead code

**[P3] Orphaned component `components/common/MockExamRunner.tsx`** — superseded by `ExamRunner`, imported
nowhere. Carries its own (correct) logic but no persistence; delete to avoid future confusion and a
re-raised "no autosave" finding.

**[P3] Timer `aria-live` is `"off"` until ≤30s, then `"assertive"`.** `ExamRunner.tsx:251` /
`MockExamRunner.tsx:129-133` — screen-reader users get no time cues for most of the section, then a jarring
assertive burst. Prefer periodic `polite` announcements (e.g. at minute boundaries).

**[P3] Flashcards use a raw `SpeechSynthesisUtterance` instead of `TtsController`/`speakOnce`.**
`pages/language/Flashcards.tsx` duplicates TTS and skips the Chrome long-utterance chunking the shared
`lib/speech/tts.ts` provides; also no cleanup on unmount (orphaned utterance if you navigate mid-speech).
Low impact (single words), but use the shared helper.

**[P3] Timer display ticks 2→1→0 (extra frame).** `MockExamRunner.tsx:54-58` `if (s<=1) return 0`
shows "00:01" sub-second. Cosmetic; the live `ExamRunner` is fine.

**[P3] Document/text generators have no length cap on free-text inputs** (SOP goal, LOR fields, Loans
notes). Very long pasted text isn't truncated/validated; no crash, but UI can blow out. Add maxlength.

**[P3] `OfferComparison` "cheapest" badge treats €0/sem as cheapest without a "tuition-free" tooltip** —
correct logic, mild ambiguity vs a data-entry error. `overview/OfferComparison.tsx`.

---

## Cross-cutting state-coverage verdict
- **Loading:** present where async (RequireAuth, AppGate `GateLoader`, Matching spinner, GenerationLoader,
  ExamRunner "Scoring…").
- **Empty:** present and honest across dashboard/tracker/calendar/reminders/shortlist.
- **Error:** present for AI generation (`useGenerate.messageFor`, MockExamPage error alert) and degrades to
  bundled/offline content. No unhandled async-throw paths found in the core flow.

## Accessibility verdict (WCAG 2.1 AA spot-check)
Generally strong: semantic landmarks, `aria-label`s on icon buttons, focus rings, `role="status"`/`timer`,
`useReducedMotion` in the exam runner. Worst offenders are the timer `aria-live` toggle (P3) and the
non-announced custom-scale validation error (P2). No keyboard traps found; radio/label patterns in the exam
runner are correct.
