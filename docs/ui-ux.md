# UI/UX Blueprint — DeutschPrep Dashboard (Phase 3)

> Mock data only; no backend dependency. Stack: React 18 + TypeScript + Tailwind + shadcn/ui-style
> primitives (no Radix). All values shown here are illustrative fixtures (`src/lib/mockData.ts`).

---

## 1. Design direction — "Official dossier"

DeutschPrep's core promise is the difference between **grounded** facts (sourced / deterministic)
and **ungrounded** ones (flagged for verification). The visual language encodes exactly that, so the
interface *looks like* its thesis rather than decorating it:

| Decision | Choice | Why (grounded in the subject) |
|----------|--------|-------------------------------|
| **Type signature** | Deterministic / official values (German grade, ECTS, deadlines, file refs, sources) render in **tabular monospace** (`.official-figure`); guidance prose stays humanist sans. | Mirrors *deterministic compute vs. generated prose* (CLAUDE.md §2/§4). Monospace reads as "stamped, machine-precise". |
| **Signature element** | The converted German grade is rendered as an **official seal** (`.stamp-seal`). Grounded → solid *Amtsblau*; ungrounded → dashed amber "unstamped". | The grade is the aspirational artifact of the whole journey; the seal makes provenance the memorable moment. |
| **Palette** | Existing administrative blue (`--primary 222 89% 55%`) on a faint cool paper (`--paper`); six category accents. | German administrative / Bauhaus heritage — precise, trustworthy, not the cream-serif or acid-green AI defaults. |
| **Structure** | Roadmap entries carry two-digit **file references** (`01`, `02`, …). | Justified: the roadmap is a real dependency-ordered sequence, and German bureaucracy assigns an *Aktenzeichen* to everything. |

Restraint: the seal is the one bold element; everything around it is quiet and disciplined.

---

## 2. Layout

```
┌───────────────────────────────────────────────────────────────────┐
│  [dossier grid band]                                              │
│  German Master's admission copilot              Aktenzeichen      │
│  DeutschPrep                                    DPR-2026-0042     │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐   ┌──────────────────────────────┐  │
│  │ Profile review           │   │ Aktenplan · Roadmap   1/8    │  │
│  │  ( 1,7 )  Deutsche Note   │   │  ▓▓▓░░░░░ 13%                 │  │
│  │  ╰seal╯   ECTS  — ⚠       │   │  01 ● Evaluate profile  Done │  │
│  │  Extracted facts (dl)     │   │  02 ● Shortlist…     Active   │  │
│  │  Skill gaps · AI-reasoned │   │  03 ○ Draft SOP      Locked   │  │
│  └──────────────────────────┘   └──────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Bereiche · Categories   (6 module cards, 1→2→3 cols)         │ │
│  └──────────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────┤
│  ⓘ Guidance only, not legal or financial advice. Verify…          │
└───────────────────────────────────────────────────────────────────┘
```

`ResumeAnalyzer` leads (it holds the signature seal); `RoadmapTracker` sits beside it; the
`FeatureModuleGrid` spans full width below. The advisory **disclaimer** is pinned in the footer
(CLAUDE.md §5 — required for visa/finance guidance).

---

## 3. Components & prop APIs

| Component | Props | Notes |
|-----------|-------|-------|
| `RoadmapTracker` | `items: RoadmapItem[]`, `className?` | Vertical numbered timeline; overall progress bar; per-item status, deadline, `needsVerification` badge; empty state. |
| `ResumeAnalyzer` | `profile: ParsedProfile`, `className?` | Grade seal (signature), German GPA + ECTS with verification state, extracted-facts `<dl>`, skill-gap chips labelled "AI-reasoned · not official". |
| `FeatureModuleGrid` | `modules: FeatureModule[]`, `onSelect?(key)`, `className?` | Six accent-coded category cards with completion %. Renders `<button>`s when `onSelect` is given, else static `<article>`s. |

Types live in `src/lib/types.ts`; category labels/accents in `src/lib/categories.ts`.

---

## 4. States

| State | Treatment |
|-------|-----------|
| **Empty** | `RoadmapTracker` with no items shows "No roadmap yet. Add a profile…". |
| **Loading** | (Phase 4) skeleton rows reusing the same grid; progress bar at 0%. |
| **Error** | (Phase 4) inline card in the interface's voice: what failed + how to retry. |
| **Needs verification** | Amber dashed "unstamped" seal / `Needs verification` badge on any ungrounded official value. |
| **Grounded** | Solid seal + `ShieldCheck` + source name. |

---

## 5. Responsive

| Breakpoint | Behavior |
|-----------|----------|
| `< sm` (mobile) | Single column; profile review first, then roadmap, then category cards (1 col). |
| `sm` | Two-column facts grid; module cards 2-up. |
| `lg` | Profile review + roadmap side-by-side; module cards 3-up. |
| Max width | `max-w-6xl`, centered, generous gutters. |

---

## 6. Accessibility (WCAG 2.1 AA)

- **Semantic landmarks:** `header` / `main` / `footer`; each panel is a labelled `<section>`.
- **Status never by color alone:** every roadmap status carries an icon **and** a text label
  ("Done" / "Active" / "Locked"); the active step also sets `aria-current="step"`.
- **Lists & dates:** roadmap is an `<ol>`; deadlines use `<time dateTime>`; facts use `<dl>`.
- **The seal** is `role="img"` with an `aria-label` (e.g. "German grade 1,7, computed via Modified
  Bavarian Formula" / "German grade not yet verified").
- **Progress bars** expose `role="progressbar"` + `aria-valuenow/min/max` and an `aria-label`.
- **Keyboard:** interactive module cards are real `<button>`s with visible `focus-visible` rings.
- **Motion:** `prefers-reduced-motion` collapses transitions/animations globally.

---

## 7. Verification

`npm run typecheck` (clean) · `npm run test` (18 passing, RTL) · `npm run build` (clean) ·
`npm run lint` (0 errors).
