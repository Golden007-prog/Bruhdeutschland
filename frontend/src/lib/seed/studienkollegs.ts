/**
 * Curated directory of REAL German state Studienkollegs (G06 / gap G1-2). Each entry is a real college
 * with its official page URL and is provenance-stamped + `needsVerification: true` — courses, regions,
 * and entrance rules are set per college and change, so the app orients and links out; it never certifies
 * (CLAUDE.md golden rule #2 — never fabricate official facts). A hand-verified sample, not an exhaustive
 * scrape: you apply to a Studienkolleg THROUGH a partner university (often via uni-assist).
 */
import { KURSE, type KursCode } from "@/lib/pathway/kurs";

export interface Studienkolleg {
  id: string;
  name: string;
  partnerUniversity: string;
  city: string;
  bundesland: string; // English Bundesland name (matches the programmes dataset)
  type: "university" | "fh"; // University-Studienkolleg (all unis) vs FH-Studienkolleg (FHs only)
  publicState: boolean; // state-run (free) vs private (charges tuition)
  kurse: KursCode[]; // streams offered; [] when not yet verified for this college
  officialUrl: string;
  source: string; // "curated"
  retrievedAt: string; // YYYY-MM-DD
  needsVerification: boolean;
  note?: string;
}

/**
 * Real German state Studienkollegs, each verified against its official page (2026-06-21). Streams are the
 * university scheme T/M/W/G/S; FH colleges that use the FH scheme (TI/WW/…) keep `kurse: []` with the
 * streams named in `note` (the filter is university-stream based). Every entry is needsVerification — the
 * UI links out to confirm. A hand-verified sample, not the full national list.
 */
const R = "2026-06-21";
const C = "curated";

export const SEED_STUDIENKOLLEGS: Studienkolleg[] = [
  { id: "studienkolleg-muenchen", name: "Studienkolleg München", partnerUniversity: "LMU / TU München (Bavarian universities)", city: "Munich", bundesland: "Bavaria", type: "university", publicState: true, kurse: ["T", "M", "W", "G"], officialUrl: "https://www.tum.de/en/studies/application/other-forms-of-study/preparatory-study-at-the-studienkolleg", source: C, retrievedAt: R, needsVerification: true, note: "Serves Bavarian universities; B2 German + entrance test. Apply through the partner university." },
  { id: "studienkolleg-tu-berlin", name: "Studienkolleg an der TU Berlin", partnerUniversity: "Technische Universität Berlin", city: "Berlin", bundesland: "Berlin", type: "university", publicState: true, kurse: ["T", "W"], officialUrl: "https://www.tu.berlin/en/international/students-1/preparatory-school", source: C, retrievedAt: R, needsVerification: true, note: "Apply via uni-assist; not every course runs each semester — check the official page." },
  { id: "studienkolleg-fu-berlin", name: "Studienkolleg der Freien Universität Berlin", partnerUniversity: "Freie Universität Berlin", city: "Berlin", bundesland: "Berlin", type: "university", publicState: true, kurse: [], officialUrl: "https://www.fu-berlin.de/sites/studienkolleg", source: C, retrievedAt: R, needsVerification: true, note: "State college with focus courses; stream codes not listed on the page — verify on site." },
  { id: "studienkolleg-mainz", name: "Studienkolleg der JGU Mainz (ISSK)", partnerUniversity: "Johannes Gutenberg-Universität Mainz", city: "Mainz", bundesland: "Rhineland-Palatinate", type: "university", publicState: true, kurse: ["M", "T", "W", "G", "S"], officialUrl: "https://www.issk.uni-mainz.de/en/studienkolleg/", source: C, retrievedAt: R, needsVerification: true, note: "Applications handled centrally by JGU admissions (not uni-assist); confirm deadlines on site." },
  { id: "studienkolleg-hannover", name: "Niedersächsisches Studienkolleg (Leibniz Uni Hannover)", partnerUniversity: "Leibniz Universität Hannover", city: "Hanover", bundesland: "Lower Saxony", type: "university", publicState: true, kurse: ["M", "T", "G", "W", "S"], officialUrl: "https://www.stk.uni-hannover.de/", source: C, retrievedAt: R, needsVerification: true, note: "State institution of Lower Saxony; prepares for the Feststellungsprüfung (FSP)." },
  { id: "studienkolleg-kit", name: "Studienkolleg am KIT", partnerUniversity: "Karlsruhe Institute of Technology (KIT)", city: "Karlsruhe", bundesland: "Baden-Württemberg", type: "university", publicState: true, kurse: ["T"], officialUrl: "https://www.stk.kit.edu/", source: C, retrievedAt: R, needsVerification: true, note: "Technical (T) focus; apply through KIT." },
  { id: "studienkolleg-darmstadt", name: "Studienkolleg der TU Darmstadt", partnerUniversity: "Technische Universität Darmstadt", city: "Darmstadt", bundesland: "Hesse", type: "university", publicState: true, kurse: ["T", "G"], officialUrl: "https://www.stk.tu-darmstadt.de/", source: C, retrievedAt: R, needsVerification: true, note: "Public technical university; T (tech/science) and G (humanities/social) streams." },
  { id: "studienkolleg-hamburg", name: "Studienkolleg Hamburg", partnerUniversity: "Universität Hamburg", city: "Hamburg", bundesland: "Hamburg", type: "university", publicState: true, kurse: ["G", "M", "T", "W"], officialUrl: "https://studienkolleg-hamburg.de/en/", source: C, retrievedAt: R, needsVerification: true, note: "Large state-run college; one-year courses + Propädeutikum." },
  { id: "studienkolleg-halle", name: "Landesstudienkolleg Sachsen-Anhalt (MLU Halle)", partnerUniversity: "Martin-Luther-Universität Halle-Wittenberg", city: "Halle (Saale)", bundesland: "Saxony-Anhalt", type: "university", publicState: true, kurse: [], officialUrl: "https://www.studienkolleg.uni-halle.de/", source: C, retrievedAt: R, needsVerification: true, note: "Central college of the State of Saxony-Anhalt (with Hochschule Anhalt); streams — verify on site." },
  { id: "studienkolleg-leipzig", name: "Studienkolleg Sachsen (Uni Leipzig)", partnerUniversity: "Universität Leipzig", city: "Leipzig", bundesland: "Saxony", type: "university", publicState: true, kurse: ["T", "M", "W", "G", "S"], officialUrl: "https://www.stksachs.uni-leipzig.de/", source: C, retrievedAt: R, needsVerification: true, note: "Public (Uni Leipzig); needs conditional pre-admission; confirm exact stream codes on site." },
  { id: "studienkolleg-heidelberg", name: "Studienkolleg am ISZ der Universität Heidelberg", partnerUniversity: "Universität Heidelberg", city: "Heidelberg", bundesland: "Baden-Württemberg", type: "university", publicState: true, kurse: ["M", "W", "G", "T"], officialUrl: "https://www.isz.uni-heidelberg.de/en/courses", source: C, retrievedAt: R, needsVerification: true, note: "Central facility of Heidelberg University; each stream has its own course page." },
  { id: "studienkolleg-konstanz", name: "Studienkolleg an der HTWG Konstanz", partnerUniversity: "HTWG Konstanz (applied sciences)", city: "Konstanz", bundesland: "Baden-Württemberg", type: "fh", publicState: true, kurse: ["T", "W"], officialUrl: "https://www.htwg-konstanz.de/studium/studienkolleg-der-htwg-konstanz/studienkolleg/unsere-kurse", source: C, retrievedAt: R, needsVerification: true, note: "State FH college; certificate valid at all universities of applied sciences nationwide + BW universities." },
  { id: "studienkolleg-coburg", name: "Studienkolleg Coburg (Bavarian FH preparatory college)", partnerUniversity: "Hochschule Coburg (Bavarian UAS)", city: "Coburg", bundesland: "Bavaria", type: "fh", publicState: true, kurse: [], officialUrl: "https://studienkolleg-coburg.de/en/focus-courses/", source: C, retrievedAt: R, needsVerification: true, note: "State FH college; FH streams TI (technical) + WW (economics); ~€152 semester fee; apply via PRIMUSS." },
  { id: "studienkolleg-nordhausen", name: "Staatliches Studienkolleg an der Hochschule Nordhausen", partnerUniversity: "Hochschule Nordhausen (applied sciences)", city: "Nordhausen", bundesland: "Thuringia", type: "fh", publicState: true, kurse: ["T", "M", "W", "G", "S"], officialUrl: "https://www.hs-nordhausen.de/international/staatliches-studienkolleg", source: C, retrievedAt: R, needsVerification: true, note: "State college; uses university-style T/M/W/G/S streams; ends with the Feststellungsprüfung." },
];

/** Distinct Bundesländer present in the directory (for the filter), sorted. */
export function studienkollegBundeslaender(): string[] {
  return [...new Set(SEED_STUDIENKOLLEGS.map((s) => s.bundesland))].sort();
}

export interface StudienkollegFilter {
  kurs?: KursCode | "";
  bundesland?: string;
  type?: "university" | "fh" | "";
}

/** Filter the directory: a college matches a Kurs if it offers it OR its streams are unverified ([]). */
export function filterStudienkollegs(list: Studienkolleg[], f: StudienkollegFilter): Studienkolleg[] {
  return list.filter((s) => {
    if (f.kurs && s.kurse.length > 0 && !s.kurse.includes(f.kurs)) return false;
    if (f.bundesland && s.bundesland !== f.bundesland) return false;
    if (f.type && s.type !== f.type) return false;
    return true;
  });
}

/** Human label for a Kurs code (reuses the grounded KURSE map). */
export function kursLabel(code: KursCode): string {
  return KURSE[code].name;
}
