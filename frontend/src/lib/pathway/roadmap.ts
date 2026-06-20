/**
 * Pathway-specific roadmap sequences (addendum §4). The Master's flow keeps the canonical
 * ROADMAP_STEPS; school-leavers heading to a Bachelor get the Studienkolleg → FSP → C1 → apply
 * sequence, and Medicine adds the M-Kurs + TestAS/TMS + quota + Approbation steps. Official figures
 * stay `needsVerification` with a source. Deadlines remain computed in tested code elsewhere.
 */
import type { ProcessStep } from "@/lib/types";
import { source } from "@/lib/sources";
import { TUITION_BW_EUR } from "@/lib/facts";
import { apsStatusFor } from "@/lib/country/country";
import type { HighestQualification, TargetLevel } from "@/lib/profile/types";
import type { EducationSummary } from "@/lib/profile/education";
import { ROADMAP_STEPS } from "@/lib/seed/process";

export interface RoadmapInput {
  country: string;
  targetLevel: TargetLevel;
  highestQualification: HighestQualification;
  /**
   * Structured education summary — when present, drives the SAME non-linear routing as `evaluatePathway`
   * so the Roadmap and Pathway pages never give opposite advice (e.g. a diploma-only applicant must not
   * get Studienkolleg steps here while the Pathway page rules that route out).
   */
  education?: EducationSummary;
}

/** APS step, included only for countries that require it (India/China/Vietnam/…). */
function apsStep(country: string): ProcessStep | null {
  if (apsStatusFor(country).status !== "required") return null;
  return {
    id: "pw-aps",
    title: "Get your APS certificate",
    detail: `Required for ${country || "your country"} — it gates both application and visa. Start early.`,
    durationHint: "3–4 weeks",
    needsVerification: true,
    source: source("aps"),
    href: "/visa/aps",
  };
}

function bachelorSteps(country: string): ProcessStep[] {
  return [
    { id: "pw-b-german", title: "Build German A1 → B1/B2", detail: "Needed for the Studienkolleg entrance exam (Aufnahmeprüfung). Start now.", durationHint: "Months 1–9", href: "/language/german" },
    apsStep(country),
    { id: "pw-b-apply-kolleg", title: "Apply to a target university for the Studienkolleg", detail: "You apply via the university / uni-assist — not the Studienkolleg directly. Pick your Kurs (T/M/W/G/S).", durationHint: "By the intake deadline", needsVerification: true, source: source("studienkolleg"), href: "/profile/pathway" },
    { id: "pw-b-kolleg", title: "Sit the Aufnahmeprüfung & complete the Studienkolleg", detail: "One year (2 semesters); the college brings you to ~C1.", durationHint: "~1 year", needsVerification: true, source: source("anabin") },
    { id: "pw-b-fsp", title: "Pass the Feststellungsprüfung (FSP)", detail: "3 written subjects + ≥1 oral (incl. German). Passing confers your HZB for that stream.", durationHint: "End of Studienkolleg", needsVerification: true },
    { id: "pw-b-c1", title: "Reach C1 & take TestDaF/DSH", detail: "German-taught Bachelor needs C1 (DSH-2 / TestDaF TDN 4).", durationHint: "Alongside Studienkolleg", href: "/language/goethe-testdaf" },
    { id: "pw-b-apply", title: "Apply to Bachelor programmes", detail: "Apply via uni-assist / the university with your HZB, transcripts, and language proof.", durationHint: "By the deadline", needsVerification: true, source: source("uniAssist"), href: "/documents/uni-assist" },
    { id: "pw-b-finance", title: "Arrange finances", detail: "Blocked account, insurance, any scholarships. A public Studienkolleg charges only the Semesterbeitrag.", durationHint: "After admission", needsVerification: true, href: "/finance" },
    { id: "pw-b-visa", title: "Apply for your student visa", detail: "Book early; bring admission, financing, insurance, and (India) APS.", durationHint: "Several weeks", needsVerification: true, source: source("autoVisaFaq"), href: "/visa/checklist" },
    { id: "pw-b-relocate", title: "Relocate & settle in", detail: "Accommodation, Anmeldung, transit ticket.", durationHint: "On arrival", href: "/campus/pre-departure" },
  ].filter((s): s is ProcessStep => s !== null);
}

function medicineSteps(country: string, q: HighestQualification): ProcessStep[] {
  const needsKolleg = q === "class12" || q === "class10";
  return [
    { id: "pw-m-german", title: "German A1 → B1, then plan for C1", detail: "Public medicine is taught in German → C1 (DSH-2 / TestDaF TDN 4). Begin immediately.", durationHint: "Months 1–18", href: "/language/german" },
    apsStep(country),
    needsKolleg ? { id: "pw-m-kolleg-apply", title: "Apply for a Studienkolleg M-Kurs", detail: "Most school-leaving certificates need a Studienkolleg M-Kurs first (or a direct-entry carve-out). Apply via the target university.", durationHint: "By the deadline", needsVerification: true, source: source("studienkolleg"), href: "/profile/pathway" } : null,
    needsKolleg ? { id: "pw-m-kolleg", title: "Complete the M-Kurs & pass the FSP", detail: "One year + Feststellungsprüfung → your HZB.", durationHint: "~1 year", needsVerification: true } : null,
    { id: "pw-m-c1", title: "Reach C1 (DSH-2 / TestDaF TDN 4)", detail: "Required for German-taught medicine.", durationHint: "Before applying", href: "/language/goethe-testdaf" },
    { id: "pw-m-test", title: "Sit the required admission test", detail: "Non-EU internationals usually take TestAS (per-university quota); EU/HZB applicants use TMS via hochschulstart (TMS slated to change from 2027).", durationHint: "Test windows", needsVerification: true, source: source("testas") },
    { id: "pw-m-apply", title: "Apply into the medicine quota", detail: "Non-EU: per-university / uni-assist international quota (GPA-gated, small). EU/HZB: hochschulstart.de.", durationHint: "By the deadline", needsVerification: true, source: source("hochschulstart"), href: "/profile/pathway" },
    { id: "pw-m-finance", title: "Arrange finances", detail: `Tuition-free except Baden-Württemberg (€${TUITION_BW_EUR.toLocaleString("en-US")}/sem non-EU) + Semesterbeitrag. No DAAD scholarship for the medicine Staatsexamen.`, durationHint: "After admission", needsVerification: true, href: "/finance" },
    { id: "pw-m-visa", title: "Apply for your student visa", detail: "Book early; bring admission, financing, insurance, and (India) APS.", durationHint: "Several weeks", needsVerification: true, source: source("autoVisaFaq"), href: "/visa/checklist" },
    { id: "pw-m-after", title: "Later: Staatsexamen → Approbation", detail: "After the ~6.25-yr degree: Staatsexamen → Approbation; practising also needs the medical-German Fachsprachprüfung.", durationHint: "Long-term", needsVerification: true, source: source("approbation") },
  ].filter((s): s is ProcessStep => s !== null);
}

/** diploma_only (no Bachelor) → no university HZB yet: complete a Bachelor or take the Ausbildung route. */
function diplomaOnlySteps(): ProcessStep[] {
  return [
    { id: "pw-d-anabin", title: "Check your diploma's status on anabin", detail: "A polytechnic diploma is usually partial/vocational recognition, NOT a university entrance qualification (HZB) on its own.", needsVerification: true, source: source("anabin"), href: "/profile/pathway" },
    { id: "pw-d-route-a", title: "Route A — complete a recognised Bachelor first", detail: "Finish a recognised Bachelor (in your country or via lateral entry), then follow the Master's path. Studienkolleg is generally hard without a class-12-track base.", needsVerification: true, href: "/profile/pathway" },
    { id: "pw-d-route-b", title: "Route B — pursue a German Ausbildung", detail: "German vocational training (Ausbildung) is paid and leads to recognised qualifications; your diploma may earn Anrechnung (credit) that shortens it by ~6–12 months. Verify with the provider/chamber.", needsVerification: true, source: source("ausbildung") },
    { id: "pw-d-german", title: "Build German A1 → B1 in parallel", detail: "Either route needs German — start now so you're ready when you commit to a path.", href: "/language/german" },
  ];
}

/** missingClass12 + degree ongoing → finish the degree first; this is a timeline, not a rejection. */
function completeDegreeSteps(country: string): ProcessStep[] {
  return [
    { id: "pw-cd-finish", title: "Finish your Bachelor's degree first", detail: "A German Master's needs a COMPLETED Bachelor — an ongoing degree can't be assessed yet. The missing class 12 is usually NOT the blocker once the degree is done.", needsVerification: true, source: source("anabin"), href: "/profile/pathway" },
    { id: "pw-cd-tests", title: "Build German and/or sit IELTS/TOEFL meanwhile", detail: "Be test-ready the moment you graduate so you can apply in your final year for the next cycle.", href: "/language/german" },
    apsStep(country),
    { id: "pw-cd-anabin", title: "On graduation: check anabin (H+) & order a uni-assist VPD", detail: "Confirm your degree's recognition and full 10 → diploma → degree chain via a uni-assist VPD.", needsVerification: true, source: source("uniAssistVpd"), href: "/documents/uni-assist" },
    { id: "pw-cd-apply", title: "Then follow the Master's path", detail: "Match programmes, meet the language requirement, and apply via uni-assist / the university.", href: "/profile/matching" },
  ].filter((s): s is ProcessStep => s !== null);
}

/** Choose the roadmap sequence for a profile's pathway. Master's/default keeps the canonical steps. */
export function roadmapStepsFor(input: RoadmapInput): { steps: ProcessStep[]; label: string } {
  const { country, targetLevel: level, highestQualification: q, education: e } = input;

  // ── Non-linear paths (diploma / lateral entry / no class 12) take priority — mirror evaluatePathway ──
  if (e && e.isNonLinear) {
    // diploma only, no Bachelor → Ausbildung / complete-a-Bachelor (regardless of target level).
    if (e.qualifyingCredential === "diploma" && !e.degreeCompleted && !e.degreeOngoing) {
      return { label: "Complete a Bachelor or take an Ausbildung", steps: diplomaOnlySteps() };
    }
    // Missing class 12 but a degree is in play (every target EXCEPT medicine, which has its own route).
    if (e.missingClass12 && level !== "medicine") {
      if (e.degreeOngoing && !e.degreeCompleted) {
        return { label: "Finish your Bachelor first", steps: completeDegreeSteps(country) };
      }
      if (e.degreeCompleted) {
        // The held degree is the qualifying credential → the Master's path, not a Studienkolleg.
        return { label: "Master's (on your lateral-entry Bachelor)", steps: ROADMAP_STEPS };
      }
    }
  }

  if (q === "class10") {
    return {
      label: "Finish Class 12 first",
      steps: [
        { id: "pw-block", title: "Finish Class 12 first", detail: "A Class-10 certificate isn't enough for a German university or a Studienkolleg. Complete Class 12; meanwhile start German A1→B1.", needsVerification: true, source: source("anabin"), href: "/profile/pathway" },
      ],
    };
  }
  if (level === "medicine") return { label: "Medicine (Humanmedizin)", steps: medicineSteps(country, q) };
  if (level === "bachelor" || level === "studienkolleg") {
    if (q === "bachelor" || q === "master") return { label: "Master's", steps: ROADMAP_STEPS };
    return { label: "Bachelor via Studienkolleg", steps: bachelorSteps(country) };
  }
  return { label: "Master's", steps: ROADMAP_STEPS };
}
