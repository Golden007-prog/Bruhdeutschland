import type { DeadlineEvent } from "@/lib/types";
import { source } from "@/lib/sources";

/**
 * Illustrative deadline/event fixtures dated around the 2026-06-19 reference so the alert severities
 * (overdue / urgent / soon / upcoming) are all represented. Real dates vary by university and year;
 * official ones carry `needsVerification`. Used by the dashboard, deadlines, events, and timeline.
 */
export const SEED_EVENTS: DeadlineEvent[] = [
  {
    id: "ev-aps",
    title: "Submit APS application (India/China/Vietnam)",
    date: "2026-06-12",
    category: "visa",
    note: "Required before the visa and most applications. Allow 3–4 weeks of processing.",
    needsVerification: true,
    source: source("aps"),
    href: "/visa/aps",
  },
  {
    id: "ev-vpd",
    title: "Request uni-assist VPD for TU Berlin",
    date: "2026-06-20",
    category: "documents",
    note: "VPD processing is ~4–6 weeks and the certificate is valid one year.",
    needsVerification: true,
    source: source("uniAssistVpd"),
    href: "/documents/vpd",
  },
  {
    id: "ev-ws-deadline",
    title: "Winter-semester application deadline (typical)",
    date: "2026-07-15",
    category: "documents",
    note: "Many Master's programs and non-EU deadlines fall earlier — verify each program.",
    needsVerification: true,
    source: source("daadProcess"),
    href: "/documents/uni-assist",
  },
  {
    id: "ev-ielts",
    title: "IELTS Academic test date booked",
    date: "2026-07-04",
    category: "language",
    note: "Computer-delivered results arrive a few days after the test; paper-based take longer. Confirm timing with the official source.",
    needsVerification: true,
    source: source("ielts"),
    href: "/language/exams/ielts",
  },
  {
    id: "ev-sperrkonto",
    title: "Open blocked account before visa appointment",
    date: "2026-07-28",
    category: "finance",
    note: "Proof of financing is a visa requirement; arrange it first.",
    needsVerification: true,
    source: source("studyFinance"),
    href: "/finance/sperrkonto",
  },
  {
    id: "ev-daad",
    title: "DAAD scholarship round — typical deadline",
    date: "2026-08-31",
    category: "finance",
    note: "Cycles are annual and set per program in the funding database.",
    needsVerification: true,
    source: source("daadScholarships"),
    href: "/finance/scholarships",
  },
  {
    id: "ev-visa-appt",
    title: "Student visa appointment (book early)",
    date: "2026-09-10",
    category: "visa",
    note: "Appointment lead times vary widely by mission and can be months.",
    needsVerification: true,
    source: source("autoVisaFaq"),
    href: "/visa/checklist",
  },
  {
    id: "ev-anmeldung",
    title: "Anmeldung — register address within 14 days of arrival",
    date: "2026-10-08",
    category: "campus",
    note: "Bring your passport and the landlord's Wohnungsgeberbestätigung.",
    source: source("bundesmeldegesetz"),
    href: "/visa/anmeldung",
  },
  {
    id: "ev-semester-start",
    title: "Winter semester begins",
    date: "2026-10-15",
    category: "campus",
    note: "Set per university; orientation week is usually the week before lectures.",
    needsVerification: true,
    source: source("studyInGermany"),
    href: "/campus/pre-departure",
  },
];
