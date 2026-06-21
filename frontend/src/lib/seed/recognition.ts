import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

/**
 * Professional recognition / Approbation for REGULATED professions — gap G8-01.
 *
 * Grounding rules (CLAUDE.md §2/§3): which authority recognises a given profession is
 * state- AND profession-specific (>1,500 competent bodies), and the language bar, exam names,
 * fees and timelines vary by Land and profession. So this seed asserts NO specific office,
 * fee, or timeline as fact. It names the recognising-authority *class* (e.g. "the Land medical
 * chamber / Landesärztekammer or Landesprüfungsamt"), flags every profession-specific claim
 * `needsVerification`, and points the user at the official Recognition Finder to get their own
 * competent body. The structural distinction (regulated vs. not, academic vs. professional
 * recognition, the Defizitbescheid → compensation-measure path) is grounded against the federal
 * Recognition Act portal.
 *
 * Verified 2026-06-21 against anerkennung-in-deutschland.de (Recognition Finder + procedure)
 * and make-it-in-germany (medical professions / Approbation).
 */

/* ── Official sources (the canonical registry already has `approbation`; we add the federal
 *    recognition portal + finder, which are the load-bearing official entry points here) ──────── */

/** The federal recognition portal — explains the Recognition Act and the procedure. */
export const SOURCE_ANERKENNUNG: Source = {
  name: "Anerkennung in Deutschland — Federal recognition portal",
  url: "https://www.anerkennung-in-deutschland.de/html/en/index.php",
};

/** The Recognition Finder — enter your profession + intended city to get YOUR competent authority. */
export const SOURCE_RECOGNITION_FINDER: Source = {
  name: "Anerkennung in Deutschland — Recognition Finder (find your authority)",
  url: "https://www.anerkennung-in-deutschland.de/en/interest/finder/profession",
};

/** What happens after the assessment notice — the Defizitbescheid → compensation-measure path. */
export const SOURCE_AFTER_NOTICE: Source = {
  name: "Anerkennung in Deutschland — After the assessment notice (Defizitbescheid)",
  url: "https://www.anerkennung-in-deutschland.de/html/en/after-the-notice.php",
};

/* ── Regulated-profession map ──────────────────────────────────────────────────── */

export interface RegulatedProfession {
  id: string;
  /** The profession, in the terms a graduate would search. */
  name: string;
  /** The official German licence / authorisation that gates practice. */
  licence: string;
  /** The CLASS of recognising authority — never a specific named office (it varies by Land). */
  authorityClass: string;
  /** The typical language bar (profession-specific, always flag-and-cite). */
  languageBar: string;
  /** A plain note on why a job offer ≠ permission to practise here. */
  note: string;
}

/**
 * Professions that are REGULATED in Germany: you cannot legally practise on your degree alone —
 * a state licence (Approbation / Berufserlaubnis / Bestallung / chamber admission) is required,
 * and the recognising authority differs by profession and federal state. The `authorityClass`
 * deliberately names a class of body, not a specific office: the user gets their exact authority
 * from the Recognition Finder. Every entry is profession-specific → renders as needs-verification.
 */
export const REGULATED_PROFESSIONS: RegulatedProfession[] = [
  {
    id: "rp-medicine",
    name: "Doctor / physician (medicine)",
    licence: "Approbation (full licence) or a temporary Berufserlaubnis",
    authorityClass:
      "the Land authority for health professions — often the Landesprüfungsamt / Regierungspräsidium / LAGeSo, depending on the federal state",
    languageBar:
      "general German ~B2 plus a profession-specific medical-language exam (Fachsprachprüfung), commonly framed as C1-Medizin — set per Land",
    note: "A signed job contract at a hospital does not authorise you to treat patients. Without the Approbation (or an interim Berufserlaubnis) you may not practise — this is the single most-missed gate for international medical graduates.",
  },
  {
    id: "rp-nursing",
    name: "Nurse (general nursing care)",
    licence: "Berufserlaubnis as Pflegefachfrau/-mann (recognition of the nursing qualification)",
    authorityClass:
      "the competent Land authority for nursing recognition (varies by federal state — e.g. a Regierungspräsidium or a designated Landesamt)",
    languageBar: "typically B1–B2 German, set per Land and employer",
    note: "Recognition usually compares your training to the German Pflegefachfrau/-mann; gaps lead to a knowledge test or an adaptation period before you can work as a recognised nurse.",
  },
  {
    id: "rp-pharmacy",
    name: "Pharmacist",
    licence: "Approbation as a pharmacist (Apotheker/in)",
    authorityClass: "the Land authority for health-profession licensing (varies by federal state)",
    languageBar: "general B2 plus a profession-specific language check — verify per Land",
    note: "Like medicine, pharmacy practice is gated by Approbation; a degree alone is not enough to dispense or run a pharmacy.",
  },
  {
    id: "rp-law",
    name: "Lawyer (admission to the German bar)",
    licence: "Admission as a Rechtsanwalt/Rechtsanwältin (Zulassung zur Rechtsanwaltschaft)",
    authorityClass: "the regional bar association (Rechtsanwaltskammer) for your district",
    languageBar: "high-level German (German law is practised in German) — no single fixed certificate",
    note: "German legal practice generally requires the two German state law exams (Staatsexamina); a foreign law degree rarely converts directly. Foreign-law consultancy is a separate, narrower route.",
  },
  {
    id: "rp-teaching",
    name: "School teacher (state schools)",
    licence: "Recognition as a Lehrer/in (Lehramt) for the relevant school type",
    authorityClass:
      "the education ministry / school authority of the federal state where you intend to teach (Kultusministerium / Landesschulbehörde)",
    languageBar: "usually C1–C2 German plus the language(s) of the subjects you teach",
    note: "Teaching at state schools normally expects two subjects and a German-style teacher-training structure (incl. the Referendariat); recognition is decided per federal state.",
  },
  {
    id: "rp-engineer",
    name: "Engineer (protected title) / architect",
    licence:
      "Use of the protected title 'Ingenieur/in' (per the Land's Ingenieurgesetz) or chamber entry for architects",
    authorityClass:
      "the Land engineering chamber (Ingenieurkammer) or architects' chamber (Architektenkammer) for the title; many engineering jobs need no licence at all",
    languageBar: "no fixed exam — employer- and role-dependent",
    note: "Many engineering ROLES are not regulated and you can be hired on your degree. But the TITLE 'Ingenieur' is protected, and some functions (e.g. structural sign-off, chamber membership) require recognition — check whether your specific role needs it.",
  },
];

/* ── The recognition procedure, as honest steps ───────────────────────────────── */

export interface RecognitionStep {
  id: string;
  title: string;
  detail: string;
  /** Official/procedural detail that varies by case → flag + cite. */
  needsVerification?: boolean;
  source?: Source;
  href?: string;
}

/**
 * The recognition procedure for a regulated profession, structurally grounded against the federal
 * Recognition Act portal. No fee, no timeline, no specific office is asserted — those come from the
 * user's own Recognition Finder result and assessment notice.
 */
export const RECOGNITION_STEPS: RecognitionStep[] = [
  {
    id: "rs-find",
    title: "Find your competent authority",
    detail:
      "Recognition is decided by a competent body that depends on BOTH your profession and your intended federal state — there are over 1,500 of them. Use the official Recognition Finder to get yours; don't assume the office a friend in another Land used.",
    needsVerification: true,
    source: SOURCE_RECOGNITION_FINDER,
  },
  {
    id: "rs-academic-vs-pro",
    title: "Separate academic recognition from the professional licence",
    detail:
      "Two different things: (1) ACADEMIC recognition — whether your degree is recognised as equivalent (anabin / ZAB / the Statement of Comparability) — and (2) the PROFESSIONAL licence to practise a regulated profession (Approbation / Berufserlaubnis / chamber admission). Clearing the academic side does NOT grant the licence.",
    href: "/profile/recognition",
  },
  {
    id: "rs-apply",
    title: "Apply for the equivalence assessment",
    detail:
      "Submit your qualification to the competent authority for an equivalence assessment against the German reference profession. It compares your training content and duration. Fees and processing times are set per authority and case — confirm them from your authority, never assume.",
    needsVerification: true,
    source: SOURCE_ANERKENNUNG,
  },
  {
    id: "rs-deficit",
    title: "If you get a Defizitbescheid, take a compensation measure",
    detail:
      "A partial-recognition / deficit notice (Defizitbescheid) lists the substantial differences found. For regulated professions you close them with a compensation measure: a knowledge test (Kenntnisprüfung) or an adaptation period (Anpassungslehrgang). Passing it leads to full recognition. The duration depends on your individual notice.",
    needsVerification: true,
    source: SOURCE_AFTER_NOTICE,
  },
  {
    id: "rs-language",
    title: "Clear the language bar",
    detail:
      "Regulated health professions add a profession-specific language requirement on top of general German — for doctors this is typically a medical-language exam (Fachsprachprüfung), often framed as C1-Medizin. The exact level and exam are set per federal state.",
    needsVerification: true,
    source: source("approbation"),
  },
];

/** Convenience: the sources this dataset cites, for a Sources footer. */
export const RECOGNITION_SOURCES: Source[] = [
  SOURCE_ANERKENNUNG,
  SOURCE_RECOGNITION_FINDER,
  SOURCE_AFTER_NOTICE,
  source("approbation"),
  source("anabin"),
];
