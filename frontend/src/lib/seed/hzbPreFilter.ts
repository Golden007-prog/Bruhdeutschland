/**
 * Curated, NON-BINDING HZB pre-filter (gap analysis G1-5). Given a country + certificate type it returns
 * the *likely* anabin/HZB access category to cut cognitive load BEFORE the user goes to anabin. This is
 * orientation only — anabin (the KMK database) and the target university make the binding call, never us
 * (CLAUDE.md golden rule #2). Every entry carries `needsVerification: true` and a source; we map common
 * South-Asian patterns the pathway engine already encodes (India/Bangladesh Class-12 → Studienkolleg, a
 * completed Bachelor → direct access, a polytechnic diploma → vocational/partial), nothing more specific.
 */
import type { Source } from "@/lib/types";
import { source } from "@/lib/sources";

/** Coarse HZB access bands, aligned with the categories shown on the Recognition page. */
export type HzbCategory = "general" | "restricted" | "after_university" | "vocational" | "unknown";

/** The kind of certificate the user holds (drives the likely category). */
export type CertType = "class12" | "class10" | "diploma" | "some_university" | "bachelor" | "master";

export interface HzbHint {
  category: HzbCategory;
  /** Short headline for the category. */
  label: string;
  /** Plain-language, explicitly non-binding read on what this likely means. */
  detail: string;
  source: Source;
  needsVerification: true;
}

export const CERT_OPTIONS: { value: CertType; label: string }[] = [
  { value: "class10", label: "Class 10 / secondary (no Class 12 yet)" },
  { value: "class12", label: "Class 12 / higher-secondary (school-leaving)" },
  { value: "diploma", label: "Polytechnic / vocational diploma (no Bachelor)" },
  { value: "some_university", label: "1–2 years of university (not completed)" },
  { value: "bachelor", label: "Completed Bachelor's degree" },
  { value: "master", label: "Completed Master's degree" },
];

const CATEGORY_LABEL: Record<HzbCategory, string> = {
  general: "Likely: general/direct access (H+ class)",
  restricted: "Likely: restricted — Studienkolleg + FSP first",
  after_university: "Likely: direct only after university at home",
  vocational: "Likely: vocational / partial — not a university HZB by itself",
  unknown: "Can't pre-judge — check anabin",
};

const anabin = source("anabin");

/**
 * Best-effort likely category. `isSouthAsianSchoolLeaver` covers the India/Bangladesh Class-12 case the
 * engine treats as Studienkolleg-by-default; other countries fall back to "unknown" (we don't guess).
 */
export function hzbPreFilter(country: string, cert: CertType): HzbHint {
  const c = country.trim().toLowerCase();
  const isIndiaOrBangladesh = /india|banglades/.test(c);

  const make = (category: HzbCategory, detail: string): HzbHint => ({
    category,
    label: CATEGORY_LABEL[category],
    detail,
    source: anabin,
    needsVerification: true,
  });

  switch (cert) {
    case "class10":
      return make(
        "vocational",
        "A Class-10 certificate is below the German university-entry bar and below Studienkolleg entry too. Finishing Class 12 (or an equivalent) is the prerequisite — there's no shortcut around it.",
      );
    case "class12":
      if (isIndiaOrBangladesh) {
        return make(
          "restricted",
          "For India/Bangladesh, a Class-12 (HSC) certificate is generally NOT Abitur-equivalent, so the usual route is a Studienkolleg + Feststellungsprüfung — unless a direct-entry carve-out applies (e.g. ~1 yr recognised Bachelor / qualifying JEE / IB for India; ~2 yrs university for Bangladesh).",
        );
      }
      return make(
        "unknown",
        "Whether your school-leaving certificate gives direct access depends entirely on your country's listing in anabin — many do, many don't. Look it up; we won't guess for your specific system.",
      );
    case "diploma":
      return make(
        "vocational",
        "A polytechnic diploma is usually vocational/partial recognition — not a university entrance qualification on its own. Realistic routes are completing a recognised Bachelor, or a German Ausbildung (where the diploma can earn Anrechnung).",
      );
    case "some_university":
      return make(
        "after_university",
        "Partial university study often moves you toward direct access without a Studienkolleg — India commonly ~1 completed year of a related Bachelor, Bangladesh ~2 years — but only if anabin recognises it. Verify your specific case.",
      );
    case "bachelor":
      return make(
        "general",
        "A completed, recognised Bachelor's is normally your qualifying credential for a German Master's — what matters is the DEGREE's anabin status (H+), not the schooling route to it. Confirm via anabin and a uni-assist VPD.",
      );
    case "master":
      return make(
        "general",
        "A completed Master's is normally a strong qualifying credential (a Master's, or in some fields a PhD). The binding recognition still routes through anabin/ZAB and the university — confirm there.",
      );
    default:
      return make("unknown", "Look up your exact certificate and institution on anabin to find its access note.");
  }
}
