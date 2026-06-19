# Page & Button Audit — DeutschPrep (pre work-order)

Baseline before the mock-exam/TTS/hosting work order. Status of every left-nav route as built.
Legend: ✅ working · 🟡 works but enhance (wire to live AI / Supabase / animations) · 🔴 broken/placeholder.

> Result of the prior build: all 54 routes render (verified by `routes.smoke.test.tsx`), no dead links.
> So there are **no 🔴**; the work is upgrading 🟡 items (live generation, persistence, speech, motion).

## Overview
| Route | Status | Notes / work-order action |
|---|---|---|
| `/` Dashboard | 🟡 | Composes real widgets; add motion + Supabase-backed progress. |
| `/roadmap` | 🟡 | Renders ROADMAP_STEPS; persist status to Supabase `roadmap_items`. |
| `/process` | 🟡 | Status board from seed; back with Supabase. |
| `/deadlines` | ✅ | Deterministic severity; sources now cited. Add motion. |
| `/events` | ✅ | Event-watch cards w/ sources. |
| `/documents-checklist` | 🟡 | Checklists; persist checked state to Supabase. |
| `/timeline` | ✅ | Static prep arc. |
| `/sources` | ✅ | Full registry. |

## Profile & Assessment
| Route | Status | Action |
|---|---|---|
| `/profile` | ✅ | Landing. |
| `/profile/parse` | 🟡 | Demo parse → wire BYOK LLM extraction (structured) + PII note. |
| `/profile/evaluate` | ✅ | Real GPA converter (Modified Bavarian, tested). |
| `/profile/matching` | 🟡 | Static matches → AI matching via provider (grounded thresholds). |
| `/profile/skill-gap` | 🟡 | Static → AI skill-gap from profile. |
| `/profile/ects` | ✅ | Real ECTS calculator (tested). |

## Document Prep
| Route | Status | Action |
|---|---|---|
| `/documents` | ✅ | Landing + checklist. |
| `/documents/sop` | 🟡 | Template string → AI SOP via provider (structured) + disclaimer. |
| `/documents/cv` | 🟡 | Form→preview; AI polish optional via provider. |
| `/documents/lor` | 🟡 | Templates; AI tailoring optional. |
| `/documents/uni-assist` | ✅ | StepList + cited fees. |
| `/documents/vpd` | 🟡 | Tracker; persist to Supabase. |
| `/documents/translation` | ✅ | Checklists + sworn-translator warning. |

## Language & Test Prep
| Route | Status | Action |
|---|---|---|
| `/language` | ✅ | Landing + thresholds. |
| `/language/german` | 🟡 | CEFR + TTS; move TTS to shared SpeechProvider w/ chunking. |
| `/language/flashcards` | 🟡 | In-memory SRS → SM-2 + Supabase `srs_cards`. |
| `/language/ielts-toefl` | ✅ | Formats + bars. |
| `/language/gre-gmat` | ✅ | Checker. |
| `/language/goethe-testdaf` | ✅ | Comparison. |
| `/language/exams` | 🟡 | Hub → links to upgraded runners. |
| `/language/exams/{ielts,toefl,testdaf,goethe,gre,gmat}` | 🟡 | **Headline:** static seed → live full-length generation, TTS Listening, STT Speaking, autoscore+band, review, fallback ladder. |

## Finance & Logistics
| Route | Status | Action |
|---|---|---|
| `/finance` + sperrkonto/health/scholarships/work | ✅ | Grounded facts + disclaimer. |
| `/finance/cost-of-living` | ✅ | Real calculator (tested). |

## Visa & Relocation
| Route | Status | Action |
|---|---|---|
| `/visa` + checklist/aps/accommodation/anmeldung | ✅ | Grounded + disclaimer. |
| `/visa/simulator` | 🟡 | TTS Q&A → add STT answers + AI feedback via provider. |

## Campus Life + System
| Route | Status | Action |
|---|---|---|
| `/campus/*` | ✅ | Content + Deutschlandticket fact. |
| `/about` `/settings` | 🟡 | Settings → Supabase profile + **API Keys** screen (BYOK) + provider picker. |
| `*` 404 | ✅ | Friendly. |

## Summary of work
- **Headline:** upgrade the 6 exam runners to live full-length generation + speech + autoscore (Phases 2–3).
- **Wire AI-backed pages** (parse, matching, skill-gap, SOP/CV/LOR, visa simulator) to the BYOK `LLMProvider` with structured outputs + disclaimers.
- **Persist** flashcards (SM-2), roadmap, checklists, attempts, settings to **Supabase** (graceful localStorage fallback).
- **Speech:** consolidate TTS into a chunking `SpeechProvider`; add STT.
- **Motion/states:** framer-motion + skeletons + empty/error/success across data-backed pages.
- **Deploy:** GitHub Pages (HashRouter, base path, Actions, security scan).
