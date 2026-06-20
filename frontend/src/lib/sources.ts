import type { Source } from "./types";

/**
 * Canonical citation registry (CLAUDE.md §3). Official guidance pages change their *content*
 * yearly, but these landing URLs are stable entry points. Any specific figure pulled from them
 * (fees, amounts, deadlines, thresholds) is still rendered with `needsVerification` until grounded
 * by the backend retriever — these links tell the user exactly where to confirm it.
 */
export const SOURCES = {
  daad: { name: "DAAD — German Academic Exchange Service", url: "https://www.daad.de/en/" },
  daadProcess: { name: "DAAD — Application process", url: "https://www.daad.de/en/studying-in-germany/requirements/application-process/" },
  daadRequirements: { name: "DAAD — Admission requirements", url: "https://www.daad.de/en/studying-in-germany/requirements/overview/" },
  daadCosts: { name: "DAAD — Finances & cost of study", url: "https://www.daad.de/en/studying-in-germany/living-in-germany/finances/" },
  daadSideJobs: { name: "DAAD — Side jobs while studying", url: "https://www.daad.de/en/studying-in-germany/work-career/side-jobs/" },
  daadScholarships: { name: "DAAD Scholarship Database", url: "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/" },
  uniAssist: { name: "uni-assist e.V.", url: "https://www.uni-assist.de/en/" },
  uniAssistVpd: { name: "uni-assist — VPD (preliminary documentation)", url: "https://www.uni-assist.de/en/how-to-apply/plan-your-application/vpd/" },
  uniAssistDeadlines: { name: "uni-assist — Deadlines & processing time", url: "https://www.uni-assist.de/en/how-to-apply/plan-your-application/deadlines-processing-time/" },
  makeItInGermany: { name: "Make it in Germany (Federal Government)", url: "https://www.make-it-in-germany.com/en/" },
  studyInGermany: { name: "Study in Germany (DAAD)", url: "https://www.study-in-germany.de/en/" },
  bamf: { name: "BAMF — Federal Office for Migration and Refugees", url: "https://www.bamf.de/EN/" },
  autoVisa: { name: "Auswärtiges Amt — Visa for Study", url: "https://www.auswaertiges-amt.de/en/visa-service/-/231148" },
  autoVisaFaq: { name: "Auswärtiges Amt — Student visa FAQ", url: "https://www.auswaertiges-amt.de/en/visa-service/buergerservice/faq/08-studentenvisum-606690" },
  autoSperrkonto: { name: "Auswärtiges Amt — Blocked account (Sperrkonto)", url: "https://www.auswaertiges-amt.de/en/sperrkonto-388600" },
  studyFinance: { name: "Study in Germany — Proof of financial resources", url: "https://www.study-in-germany.de/en/plan-your-studies/requirements/proof-of-financial-resources_27533.php" },
  aps: { name: "APS — Akademische Prüfstelle", url: "https://www.aps-germany.org/" },
  apsIndia: { name: "German Mission India — APS visa newsletter (Oct 2022)", url: "https://india.diplo.de/in-en/ueber-uns/mumbai/visa-newsletter-04oct2022/2566330" },
  studentenwerk: { name: "Deutsches Studierendenwerk", url: "https://www.studierendenwerke.de/en/" },
  deutschlandticket: { name: "Deutschlandticket (official)", url: "https://www.deutschlandticket.de/" },
  deutschlandticketPrice: { name: "Deutschlandticket — 2026 price", url: "https://wissen.deutschlandticket.de/wie-viel-kostet-das-deutschland-ticket-ab-dem-1.-januar-2026-0" },
  semesterticket: { name: "Deutschland-Semesterticket", url: "https://semesterticket.deutschlandticket.de/" },
  bundesmeldegesetz: { name: "Make it in Germany — Housing & registration (Anmeldung)", url: "https://www.make-it-in-germany.com/en/living-in-germany/housing-mobility/housing-registration" },
  ects: { name: "European Commission — ECTS", url: "https://education.ec.europa.eu/education-levels/higher-education/inclusive-and-connected-higher-education/european-credit-transfer-and-accumulation-system" },
  goethe: { name: "Goethe-Institut Exams", url: "https://www.goethe.de/en/spr/kup/prf.html" },
  testdaf: { name: "TestDaF Institut", url: "https://www.testdaf.de/en/" },
  telc: { name: "telc Language Tests", url: "https://www.telc.net/en/" },
  ielts: { name: "IELTS (official)", url: "https://www.ielts.org/" },
  toefl: { name: "TOEFL iBT — ETS", url: "https://www.ets.org/toefl/test-takers/ibt/about.html" },
  gre: { name: "GRE — ETS", url: "https://www.ets.org/gre.html" },
  gmat: { name: "GMAT — GMAC", url: "https://www.mba.com/exams/gmat-exam" },
  europass: { name: "Europass (European Union)", url: "https://europa.eu/europass/en" },
  tk: { name: "Techniker Krankenkasse (TK)", url: "https://www.tk.de/en" },
  krankenkassenZentrale: { name: "German statutory health insurance overview", url: "https://www.make-it-in-germany.com/en/living-in-germany/insurance/health-insurance" },
  deutschlandstipendium: { name: "Deutschlandstipendium", url: "https://www.deutschlandstipendium.de/" },
  erasmus: { name: "Erasmus+", url: "https://erasmus-plus.ec.europa.eu/" },
  daadEpos: { name: "DAAD — EPOS (Development-Related Postgraduate Courses)", url: "https://www.daad.de/en/study-and-research-in-germany/scholarships/epos/" },
  daadHelmutSchmidt: { name: "DAAD — Helmut-Schmidt-Programme (Public Policy & Good Governance)", url: "https://www.daad.de/en/study-and-research-in-germany/scholarships/helmut-schmidt-programme/" },
  anabin: { name: "anabin — KMK database on recognition of foreign qualifications", url: "https://anabin.kmk.org/anabin.html" },
  studienkolleg: { name: "Studienkollegs in Germany (overview)", url: "https://www.studienkollegs.de/en/" },
  hochschulstart: { name: "hochschulstart.de — central admissions (incl. Medicine)", url: "https://www.hochschulstart.de/" },
  tms: { name: "TMS — Test für Medizinische Studiengänge", url: "https://www.tms-info.org/" },
  testas: { name: "TestAS — Test for Academic Studies (international applicants)", url: "https://www.testas.de/en/" },
  approbation: { name: "Make it in Germany — Recognition for doctors (Approbation)", url: "https://www.make-it-in-germany.com/en/working-in-germany/recognition-of-qualifications/medical-professions" },
  residencePermit: { name: "Make it in Germany — Residence permit for studying", url: "https://www.make-it-in-germany.com/en/visa-residence/types/visa-residence-permit-study" },
  auslaenderbehoerde: { name: "BAMF — Foreigners authority (Ausländerbehörde) & residence", url: "https://www.bamf.de/EN/Themen/MigrationAufenthalt/ZuwandererDrittstaaten/zuwandererdrittstaaten-node.html" },
  bankAccount: { name: "Make it in Germany — Opening a bank account", url: "https://www.make-it-in-germany.com/en/living-in-germany/money-banking/bank-account" },
  rundfunkbeitrag: { name: "Rundfunkbeitrag (broadcasting fee) — official", url: "https://www.rundfunkbeitrag.de/" },
  jobSeekerPermit: { name: "Make it in Germany — Staying to find work after graduation", url: "https://www.make-it-in-germany.com/en/study-training/studying/job-search-after-studies" },
  familyReunion: { name: "Make it in Germany — Bringing your family (family reunification)", url: "https://www.make-it-in-germany.com/en/visa-residence/family-reunion" },
  enrolment: { name: "Study in Germany — Enrolment & semester organisation", url: "https://www.study-in-germany.de/en/plan-your-studies/enrol/" },
  blueCard: { name: "Make it in Germany — EU Blue Card", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card" },
} as const satisfies Record<string, Source>;

export type SourceKey = keyof typeof SOURCES;

/** Resolve a registry key to a `Source`. */
export function source(key: SourceKey): Source {
  return SOURCES[key];
}
