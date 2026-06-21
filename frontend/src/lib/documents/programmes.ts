/**
 * Shared programme identity for the document phase (gaps G4-01/03/05/06, G2-2).
 *
 * The document trackers (SOP, requirements, VaultMatrix, translation/VPD/APS) and the application
 * tracker + offers each used to hold their own programme strings, so a student re-typed the same
 * target everywhere. This module gives one normalized "programme target" derived from the two real
 * stores — `tracker:apps` (the Kanban) and `offers:list` (admission offers) — keyed by a stable id,
 * so a draft/record can attach to a programme the student already entered once.
 *
 * It also derives, deterministically, which extra processes a programme needs (certified translation,
 * VPD, APS, a TestAS/language test) from the *pasted requirement text* plus the user's `homeCountry`.
 * APS is country-gated and comes from {@link apsStatusFor} — never hardcoded — so a Bangladesh
 * applicant (no APS) is never told to track one. Nothing here asserts an official fact: text scanning
 * is a hint over the student's own paste, and the country rule carries its own source + verify flag.
 */
import { apsStatusFor, type ApsStatus } from "@/lib/country/country";
import type { Source } from "@/lib/types";

/** Shape of one application row in `tracker:apps` (mirrors Tracker.tsx, read-only here). */
export interface TrackerApp {
  id: string;
  university: string;
  program: string;
}

/** Shape of one offer row in `offers:list` (subset of `Offer` we read here). */
export interface OfferLike {
  id: string;
  programme: string;
  university: string;
}

/** A normalized target a document/record can attach to, sourced from an app or an offer. */
export interface ProgrammeTarget {
  /** Stable id — the originating app/offer id, prefixed by source so the two never collide. */
  key: string;
  /** Originating store. */
  origin: "app" | "offer";
  /** Original row id (without the prefix). */
  originId: string;
  programme: string;
  university: string;
  /** "Programme — University", or whichever half is present; "Untitled programme" if neither. */
  label: string;
}

function labelFor(programme: string, university: string): string {
  const p = programme.trim();
  const u = university.trim();
  if (p && u) return `${p} — ${u}`;
  return p || u || "Untitled programme";
}

/**
 * Merge the application and offer stores into one de-duplicated target list. Offers and apps that name
 * the same programme+university (case-insensitively) collapse to a single target (the app wins, since
 * it's the entry point), so the student picks each programme once even if it exists in both stores.
 */
export function programmeTargets(apps: TrackerApp[], offers: OfferLike[]): ProgrammeTarget[] {
  const out: ProgrammeTarget[] = [];
  const seen = new Set<string>();
  const norm = (p: string, u: string) => `${p.trim().toLowerCase()}|${u.trim().toLowerCase()}`;

  for (const a of apps) {
    const dedupe = norm(a.program, a.university);
    if (dedupe !== "|") seen.add(dedupe);
    out.push({
      key: `app:${a.id}`,
      origin: "app",
      originId: a.id,
      programme: a.program,
      university: a.university,
      label: labelFor(a.program, a.university),
    });
  }
  for (const o of offers) {
    const dedupe = norm(o.programme, o.university);
    if (dedupe !== "|" && seen.has(dedupe)) continue; // already represented by an application
    out.push({
      key: `offer:${o.id}`,
      origin: "offer",
      originId: o.id,
      programme: o.programme,
      university: o.university,
      label: labelFor(o.programme, o.university),
    });
  }
  return out;
}

/** One derived process need for a programme. `verify` carries an official source the UI must show. */
export interface RequirementNeed {
  /** Stable need id. */
  id: "translation" | "vpd" | "aps" | "test" | "language";
  label: string;
  /** Whether this need was detected (true), explicitly not needed (false), or unknown (undefined). */
  needed: boolean | undefined;
  /** Plain reason — never an official assertion; the country rule's own note when APS-related. */
  reason: string;
  /** Set when the need rests on a country rule, so the page can render its source + verify treatment. */
  source?: Source;
  needsVerification?: boolean;
}

/** The keyword groups we scan the pasted requirement text for. Order = display order. */
const TEXT_SIGNALS: { id: RequirementNeed["id"]; label: string; re: RegExp; reason: string }[] = [
  {
    id: "translation",
    label: "Certified translation",
    re: /\b(certified|sworn|beglaubigt|vereidigt|beeidigt|translat)/i,
    reason: "The pasted requirements mention a certified/sworn translation.",
  },
  {
    id: "vpd",
    label: "VPD (uni-assist preliminary documentation)",
    re: /\b(vpd|vorpr[üu]fungsdokumentation|preliminary review documentation)\b/i,
    reason: "The pasted requirements mention a VPD / uni-assist preliminary review.",
  },
  {
    id: "test",
    label: "Admission test (TestAS / GRE / etc.)",
    re: /\b(testas|gre|gmat|tm-?wiso|aptitude test|entrance (?:exam|test))\b/i,
    reason: "The pasted requirements mention an admission/aptitude test.",
  },
  {
    id: "language",
    label: "Language certificate",
    re: /\b(ielts|toefl|testdaf|dsh|telc|goethe|c1|b2|language (?:certificate|proficiency)|deutschkenntnisse)\b/i,
    reason: "The pasted requirements mention a language certificate.",
  },
];

/**
 * Derive the extra processes a programme needs from `text` (the student's pasted requirements) and
 * `homeCountry`. Deterministic and side-effect-free. APS is decided by {@link apsStatusFor}, not by
 * scanning text, so it stays country-correct (Bangladesh → not needed; India/China → needed; unknown
 * → verify). Text signals are hints over the student's own paste — `needed:false`/`undefined` is never
 * asserted as an official "not required".
 */
export function deriveRequirementNeeds(text: string, homeCountry: string): RequirementNeed[] {
  const haystack = (text || "").toLowerCase();
  const needs: RequirementNeed[] = TEXT_SIGNALS.map((sig) => ({
    id: sig.id,
    label: sig.label,
    needed: sig.re.test(haystack) ? true : undefined, // absence ≠ "not required" → leave unknown
    reason: sig.re.test(haystack) ? sig.reason : "Not mentioned in the pasted text — check the programme page.",
  }));

  // APS is country-gated, independent of the text.
  const aps = apsStatusFor(homeCountry);
  const apsNeeded: Record<ApsStatus, boolean | undefined> = {
    required: true,
    not_required: false,
    verify: undefined,
  };
  needs.push({
    id: "aps",
    label: "APS certificate",
    needed: apsNeeded[aps.status],
    reason: aps.note,
    source: aps.source,
    needsVerification: aps.needsVerification,
  });

  return needs;
}

/** Convenience: just the needs that are positively detected, for a compact "you'll also need" list. */
export function activeNeeds(needs: RequirementNeed[]): RequirementNeed[] {
  return needs.filter((n) => n.needed === true);
}
