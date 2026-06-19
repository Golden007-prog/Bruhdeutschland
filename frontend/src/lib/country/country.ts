/**
 * Country-aware admissions logic (work order §7/§14, India-primary). APS is country-gated — it must
 * NOT be shown universally. Each entry carries a source so the requirement is grounded; the notes are
 * seed values to re-verify, never final (CLAUDE.md §2). Keyed off the user's profile `homeCountry`.
 */
import type { Source } from "@/lib/types";
import { source } from "@/lib/sources";

export type ApsStatus = "required" | "not_required" | "verify";

export interface CountryInfo {
  name: string;
  aps: ApsStatus;
  apsNote: string;
  apsSource?: Source;
}

/** Keyed by lowercased country name. India-primary; others added as grounded. */
export const COUNTRIES: Record<string, CountryInfo> = {
  india: {
    name: "India",
    aps: "required",
    apsNote:
      "APS certificate mandatory for the student visa since Nov 2022 (~€225; ~10–14 weeks). New anabin criteria apply from 15 Mar 2026 (e.g. ≥70% in Class XII) — re-verify with the APS office.",
    apsSource: source("apsIndia"),
  },
  china: {
    name: "China",
    aps: "required",
    apsNote: "APS certificate required before the university application and visa.",
    apsSource: source("aps"),
  },
  vietnam: {
    name: "Vietnam",
    aps: "required",
    apsNote: "APS certificate required before the university application and visa.",
    apsSource: source("aps"),
  },
  mongolia: {
    name: "Mongolia",
    aps: "required",
    apsNote: "APS certificate required.",
    apsSource: source("aps"),
  },
  pakistan: {
    name: "Pakistan",
    aps: "required",
    apsNote: "APS required; applications are processed via the APS office in India.",
    apsSource: source("aps"),
  },
  bangladesh: {
    name: "Bangladesh",
    aps: "not_required",
    apsNote:
      "No APS office and APS is not required; the German Embassy Dhaka verifies documents during the visa process (Master intake via VFS since 02.01.2025).",
    apsSource: source("aps"),
  },
};

export function countryInfo(name: string): CountryInfo | undefined {
  const key = name.trim().toLowerCase();
  return key ? COUNTRIES[key] : undefined;
}

/** APS status for a country name. Unknown/empty → "verify" (never assume not-required). */
export function apsStatusFor(name: string): { status: ApsStatus; note: string; source?: Source } {
  const info = countryInfo(name);
  if (!info) {
    return {
      status: "verify",
      note: "Whether you need an APS certificate depends on your country of study. Confirm with your local German mission and the APS office before you plan your timeline.",
      source: source("aps"),
    };
  }
  return { status: info.aps, note: info.apsNote, source: info.apsSource };
}

/** Country names with grounded entries, for a selector. */
export const KNOWN_COUNTRIES: string[] = Object.values(COUNTRIES).map((c) => c.name);
