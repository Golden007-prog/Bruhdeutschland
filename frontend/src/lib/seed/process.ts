import type { ApplicationStage, ProcessStep } from "@/lib/types";
import { source } from "@/lib/sources";

/**
 * The canonical end-to-end preparation sequence (step-by-step), dependency-ordered. Each step links
 * to the tool that completes it. Official requirements referenced by a step carry `needsVerification`
 * because the underlying figures/dates are program- and year-specific.
 */
export const ROADMAP_STEPS: ProcessStep[] = [
  {
    id: "ps-evaluate",
    title: "Evaluate your profile & convert your grade",
    detail: "Parse your resume, convert your GPA to the German scale, and total your ECTS.",
    durationHint: "Week 1",
    href: "/profile/evaluate",
  },
  {
    id: "ps-shortlist",
    title: "Shortlist matching Master's programs",
    detail: "Match your background to programs at German public universities and note each one's requirements.",
    durationHint: "Weeks 1–3",
    href: "/profile/matching",
  },
  {
    id: "ps-language",
    title: "Plan and book your language/admission tests",
    detail: "Decide whether you need IELTS/TOEFL (English-taught) or TestDaF/DSH (German-taught), then book.",
    durationHint: "Months 1–4",
    href: "/language",
  },
  {
    id: "ps-aps",
    title: "Get your APS certificate (if required)",
    detail: "Mandatory for applicants from India, China, and Vietnam. Start early — it gates both application and visa.",
    durationHint: "3–4 weeks",
    needsVerification: true,
    source: source("aps"),
    href: "/visa/aps",
  },
  {
    id: "ps-documents",
    title: "Prepare your documents",
    detail: "Draft your SOP, build a Europass CV, request recommendation letters, and arrange certified translations.",
    durationHint: "Months 2–4",
    href: "/documents",
  },
  {
    id: "ps-vpd",
    title: "Request a VPD where needed",
    detail: "Some universities require a uni-assist VPD before a direct application. Allow 4–6 weeks.",
    durationHint: "4–6 weeks",
    needsVerification: true,
    source: source("uniAssistVpd"),
    href: "/documents/vpd",
  },
  {
    id: "ps-apply",
    title: "Submit applications",
    detail: "Apply via uni-assist or directly to each university before its deadline (often earlier for non-EU).",
    durationHint: "By ~15 Jul (WS)",
    needsVerification: true,
    source: source("uniAssistDeadlines"),
    href: "/documents/uni-assist",
  },
  {
    id: "ps-finance",
    title: "Arrange your finances",
    detail: "Open a blocked account, choose health insurance, and apply for any scholarships.",
    durationHint: "After admission",
    needsVerification: true,
    href: "/finance",
  },
  {
    id: "ps-visa",
    title: "Apply for your student visa",
    detail: "Book your appointment early and bring admission, financing, insurance, and APS documents.",
    durationHint: "Several weeks",
    needsVerification: true,
    source: source("autoVisaFaq"),
    href: "/visa/checklist",
  },
  {
    id: "ps-relocate",
    title: "Relocate & settle in",
    detail: "Find accommodation, fly out, register your address (Anmeldung), and get your transit ticket.",
    durationHint: "On arrival",
    href: "/campus/pre-departure",
  },
];

/** Process-polling snapshot: where each application thread stands in the FSM. */
export const APPLICATION_STAGES: ApplicationStage[] = [
  { id: "as-profile", title: "Profile evaluated", state: "complete", category: "profile", detail: "German grade 1,7 · ECTS totalled", updatedHint: "2 weeks ago" },
  { id: "as-shortlist", title: "Programs shortlisted", state: "complete", category: "profile", detail: "5 programs saved", updatedHint: "10 days ago" },
  { id: "as-sop", title: "SOP — TU München", state: "in_progress", category: "documents", detail: "Second draft in review", updatedHint: "yesterday" },
  { id: "as-language", title: "IELTS Academic", state: "in_progress", category: "language", detail: "Test booked for 4 Jul", updatedHint: "3 days ago" },
  { id: "as-aps", title: "APS certificate", state: "submitted", category: "visa", detail: "Awaiting verification", updatedHint: "1 week ago" },
  { id: "as-uniassist", title: "uni-assist application", state: "not_started", category: "documents", detail: "Opens after VPD" },
  { id: "as-sperrkonto", title: "Blocked account", state: "not_started", category: "finance", detail: "Open before visa appointment" },
  { id: "as-visa", title: "Student visa", state: "not_started", category: "visa", detail: "After admission letter" },
];
