/**
 * German study-pathway engine (addendum §1). Deterministic branching from {study level + highest
 * qualification + country + subject} to the correct route, so a school-leaver is NEVER given Master's
 * advice. Every official rule is a grounded seed value with a source and `needsVerification` — per-
 * university / anabin thresholds are linked, never presented as final (CLAUDE.md golden rule #2).
 *
 * The deterministic *grade* math (class-12 % → indicative HZB grade) lives in lib/calc/gpa; this module
 * only routes + explains. The binding recognition is anabin/ZAB + the university's VPD — stated as such.
 */
import type { Source } from "@/lib/types";
import { source } from "@/lib/sources";
import type { HighestQualification, TargetLevel } from "@/lib/profile/types";
import { kursForSubject, type KursInfo } from "./kurs";

export type PathwayRoute = "blocked" | "studienkolleg" | "direct_bachelor" | "master" | "medicine" | "phd" | "unknown";

export interface PathwayNote {
  label: string;
  detail: string;
  tone: "info" | "warn" | "block" | "ok";
  source?: Source;
  needsVerification?: boolean;
}

export interface PathwayInput {
  country: string;
  highestQualification: HighestQualification;
  targetLevel: TargetLevel;
  targetSubject: string;
}

export interface PathwayResult {
  route: PathwayRoute;
  title: string;
  summary: string;
  /** Ordered next steps for this person. */
  steps: string[];
  notes: PathwayNote[];
  /** Studienkolleg course when the route goes through one. */
  kurs?: KursInfo;
  sources: Source[];
  needsVerification: true;
}

const isIndia = (c: string) => /india/i.test(c);
const isBangladesh = (c: string) => /banglades/i.test(c);

const HZB_NOTE: PathwayNote = {
  label: "HZB — your entry qualification",
  detail:
    "Admission depends on your Hochschulzugangsberechtigung (HZB), decided from your certificates via anabin/ZAB into categories (general / subject-restricted / direct only with 1–2 years of university / not recognised). Check your certificate's status on anabin — we don't compute it.",
  tone: "info",
  source: source("anabin"),
  needsVerification: true,
};

const RAISED_70_NOTE: PathwayNote = {
  label: "⚠️ Raised Class-12 minimum (WS 2026/27)",
  detail:
    "Updated anabin criteria are reported to raise the minimum Class-12 average to ~70% (from ~50%) from intake WS 2026/27. Confirm the exact percentage and effective date with anabin / your APS office before relying on it.",
  tone: "warn",
  source: source("anabin"),
  needsVerification: true,
};

const studienkolleg = (subject: string, isMedicine: boolean): PathwayResult => {
  const kurs = kursForSubject(subject, isMedicine);
  return {
    route: "studienkolleg",
    title: "Route: Studienkolleg → Feststellungsprüfung (FSP) → Bachelor",
    summary:
      "On a school-leaving certificate that isn't Abitur-equivalent, the standard route is a one-year (2-semester) state Studienkolleg that confers your HZB by passing the FSP. You then study nationwide in that stream.",
    steps: [
      "Reach German B1–B2 (the Studienkolleg entrance exam, Aufnahmeprüfung, expects it; the college takes you to ~C1).",
      "Apply to the TARGET UNIVERSITY / via uni-assist (you apply through the university, NOT to the Studienkolleg directly).",
      "Sit the Aufnahmeprüfung; if admitted, complete the one-year Studienkolleg in the right course (Kurs).",
      "Pass the FSP (3 written subjects + ≥1 oral, including German) → you hold the HZB and can apply to Bachelor programmes in that stream.",
    ],
    notes: [
      HZB_NOTE,
      RAISED_70_NOTE,
      {
        label: `Course: ${kurs.name}`,
        detail: `${kurs.desc} University-Studienkolleg qualifies you for ALL institutions; an FH-Studienkolleg only for Fachhochschulen.`,
        tone: "info",
        needsVerification: true,
      },
      {
        label: "Public vs private",
        detail:
          "Public Studienkollegs are generally free (only the Semesterbeitrag) with a state-recognised FSP. Private ones charge fees and often use an external FSP. Prefer public where you can.",
        tone: "info",
        source: source("studienkolleg"),
        needsVerification: true,
      },
    ],
    kurs,
    sources: [source("anabin"), source("studienkolleg"), source("uniAssist")],
    needsVerification: true,
  };
};

const directBachelor = (country: string): PathwayResult => ({
  route: "direct_bachelor",
  title: "Route: possible DIRECT Bachelor entry (carve-out)",
  summary:
    "With completed university study in your home country you may qualify for direct Bachelor admission without a Studienkolleg — but only if anabin recognises it. Verify your specific case.",
  steps: [
    "Confirm your HZB status on anabin (does your completed study give direct access?).",
    "Reach the required German level (usually C1 for German-taught Bachelor; some English-taught Bachelor exists).",
    isIndia(country) ? "India: ~1 completed year of a recognised Bachelor in a related field, a qualifying JEE result, or IB can give direct access." : "Bangladesh: ~2 years of recognised university study is commonly needed for direct access.",
    "Apply via uni-assist / the university with your transcripts, language proof, and (India) APS.",
  ],
  notes: [
    HZB_NOTE,
    {
      label: "Direct-entry carve-outs",
      detail: isIndia(country)
        ? "India: ~1 year of a recognised Bachelor in a related subject, a qualifying JEE rank (threshold needs_verification), or IB. Otherwise the default is Studienkolleg."
        : isBangladesh(country)
          ? "Bangladesh: typically ~2 years of recognised university study for direct entry; otherwise Studienkolleg."
          : "Direct entry depends entirely on your anabin category — verify before assuming it.",
      tone: "info",
      source: source("anabin"),
      needsVerification: true,
    },
  ],
  sources: [source("anabin"), source("uniAssist")],
  needsVerification: true,
});

const medicine = (country: string, qualification: HighestQualification): PathwayResult => {
  const needsKolleg = qualification === "class12" || qualification === "class10";
  return {
    route: "medicine",
    title: "Route: Humanmedizin (there is no “MBBS” in Germany)",
    summary:
      "Germany awards no MBBS. Medicine is Humanmedizin — one integrated ~6.25-year programme → Staatsexamen → Approbation (state licence). “MBBS in Germany” is an agent marketing label.",
    steps: [
      needsKolleg
        ? "Most school-leaving certificates aren't enough — plan a Studienkolleg M-Kurs + FSP first (or a direct-entry carve-out, §1)."
        : "Confirm your HZB/anabin category gives direct access for Medicine.",
      "Reach German C1 (DSH-2 / TestDaF TDN 4) — public-university medicine is taught IN GERMAN; there is no English-taught medicine at German public universities.",
      isIndia(country) || isBangladesh(country)
        ? "Non-EU internationals usually apply per-university / via uni-assist into a small, GPA-gated international quota (some need TestAS) — NOT via hochschulstart/TMS."
        : "EU/HZB-holders apply centrally via hochschulstart.de (Abiturbestenquote / AdH / ZEQ; TMS can boost chances).",
      "After the degree: Staatsexamen → Approbation; medical practice also needs the Fachsprachprüfung (medical German) via the Ärztekammer.",
    ],
    notes: [
      {
        label: "Language — German only (public)",
        detail: "Public medicine is German-taught → C1 (DSH-2 / TestDaF TDN 4), often effectively C1/C2. No English-taught medicine at German public universities.",
        tone: "warn",
        source: source("testdaf"),
        needsVerification: true,
      },
      {
        label: "Admission — Numerus Clausus (very limited)",
        detail:
          "Medicine is highly NC-restricted. EU/HZB applicants use hochschulstart.de (TMS helps; TMS is slated to be replaced from 2027). Non-EU internationals usually apply per-university into a small separate quota, GPA-gated, sometimes via TestAS.",
        tone: "warn",
        source: source("hochschulstart"),
        needsVerification: true,
      },
      {
        label: "Licensing — Approbation + Fachsprachprüfung",
        detail: "The licence (Approbation) is granted by the state after the Staatsexamen; practising also requires the medical-German Fachsprachprüfung via the Ärztekammer.",
        tone: "info",
        source: source("approbation"),
        needsVerification: true,
      },
      {
        label: "Costs",
        detail: "Tuition-free except Baden-Württemberg (€1,500/sem for non-EU) + the Semesterbeitrag. DAAD has no scholarship for the medicine Staatsexamen. Paid English private options exist (e.g. UMCH ~€34,800/yr non-EU) as a costly separate track.",
        tone: "info",
        source: source("daadScholarships"),
        needsVerification: true,
      },
      {
        label: "Reality check (non-EU South Asians)",
        detail:
          "This is very competitive and multi-year: ~1–1.5 yr German → ~1 yr Studienkolleg/FSP → ~6.25 yr degree → FSP/Approbation ≈ 8–9+ years. Honest alternatives: a Studienkolleg-first roadmap; paid English private (Germany/Romania/other EU); or related German-taught fields (biomedical/health sciences, nursing, public health).",
        tone: "warn",
        needsVerification: true,
      },
    ],
    kurs: needsKolleg ? kursForSubject("medicine", true) : undefined,
    sources: [source("hochschulstart"), source("tms"), source("testas"), source("approbation"), source("anabin")],
    needsVerification: true,
  };
};

const master = (): PathwayResult => ({
  route: "master",
  title: "Route: Master's (existing flow)",
  summary: "With a recognised Bachelor's you follow the Master's path — degree-field match, the Modified-Bavarian German grade, ECTS, and the language requirement of the specific programme.",
  steps: [
    "Use Profile evaluation for your German grade and ECTS; match programmes in University matching.",
    "Meet the programme's language requirement (English-taught: IELTS/TOEFL; German-taught: C1).",
    "Apply via uni-assist / the university (India: APS first).",
  ],
  notes: [HZB_NOTE],
  sources: [source("daad"), source("uniAssist")],
  needsVerification: true,
});

/** Route the applicant to the correct German pathway. Pure + deterministic + grounded. */
export function evaluatePathway(input: PathwayInput): PathwayResult {
  const { country, highestQualification: q, targetLevel: level, targetSubject } = input;

  if (q === "class10") {
    return {
      route: "blocked",
      title: "Finish Class 12 first",
      summary:
        "A Class-10 certificate is not enough to enter a German university — or even a Studienkolleg. Complete Class 12 (or an equivalent) before any German-admissions plan.",
      steps: [
        "Complete Class 12 (or an equivalent secondary-leaving certificate).",
        "Meanwhile, start German from A1 and aim for B1 — it's required on every Bachelor/Studienkolleg route.",
        "Come back once you have your Class-12 result to get your real pathway.",
      ],
      notes: [
        { label: "Why blocked", detail: "German higher-education entry (HZB) requires a completed upper-secondary qualification. There is no Studienkolleg entry on Class 10 alone.", tone: "block", source: source("anabin"), needsVerification: true },
      ],
      sources: [source("anabin")],
      needsVerification: true,
    };
  }

  if (level === "medicine") return medicine(country, q);
  if (level === "phd") {
    return {
      route: "phd",
      title: "Route: Doctorate (PhD)",
      summary: "A doctorate needs a completed Master's (or an equivalent strong Bachelor in some fields). Secure a supervisor/position first; admission is via the faculty, not a central portal.",
      steps: ["Complete a relevant Master's.", "Find a supervisor / advertised doctoral position.", "Apply to the faculty/graduate school with your research proposal."],
      notes: [HZB_NOTE],
      sources: [source("daad")],
      needsVerification: true,
    };
  }
  if (level === "master") return master();

  // Bachelor or Studienkolleg level
  if (level === "bachelor" || level === "studienkolleg") {
    if (q === "bachelor" || q === "master") {
      return { ...master(), title: "You already hold a degree — consider a Master's", summary: "You already have a Bachelor's (or higher), so a German Bachelor is rarely the right move — the Master's path usually fits. Switch your target level to Master's." };
    }
    if (q === "some_bachelor") {
      if (isIndia(country) || isBangladesh(country)) return directBachelor(country);
      return studienkolleg(targetSubject, false);
    }
    // class12 (default)
    if (isIndia(country) || isBangladesh(country)) {
      const result = studienkolleg(targetSubject, false);
      return {
        ...result,
        summary:
          (isIndia(country)
            ? "For India, Class 12 (HSC) is generally NOT Abitur-equivalent, so the default route is a Studienkolleg + FSP — unless a direct-entry carve-out applies (≈1 yr recognised Bachelor / qualifying JEE / IB). "
            : "For Bangladesh, Class 12 (HSC) is generally NOT Abitur-equivalent, so the default route is a Studienkolleg + FSP — unless ~2 years of recognised university study give direct entry. ") + result.summary,
      };
    }
    return studienkolleg(targetSubject, false);
  }

  return {
    route: "unknown",
    title: "Tell us a bit more",
    summary: "Choose your study level and highest qualification so we can route you to the right German pathway.",
    steps: ["Set your target level (Bachelor / Master / Medicine / …) and highest qualification in your profile."],
    notes: [HZB_NOTE],
    sources: [source("anabin")],
    needsVerification: true,
  };
}
