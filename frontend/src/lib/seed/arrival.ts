/**
 * Seed content for the Arrival & Settling-In cluster (gap analysis G27, G38–G47). These are process
 * guides, not official-fact assertions: any figure here (Rundfunkbeitrag amount, deposit norms, permit
 * validity) is illustrative and flagged for verification per CLAUDE.md §2/§3. The stable official
 * landing pages are cited so the user confirms the live number.
 */
import type { ChecklistItemDef, OfficialFact } from "@/lib/types";
import { source } from "@/lib/sources";

/* ── G27 Enrolment (Immatrikulation) ─────────────────────────────────────────── */
export const ENROLMENT_DOCS: ChecklistItemDef[] = [
  { id: "admission", label: "Admission letter (Zulassungsbescheid)", hint: "The offer from the university." },
  { id: "passport", label: "Passport + visa / residence permit", hint: "Identity and right to stay." },
  { id: "photo", label: "Biometric passport photo" },
  { id: "hzb", label: "Original entrance qualification (HZB) / degree + transcripts", hint: "Certified copies and translations as required." },
  { id: "insurance", label: "Proof of German health insurance (statutory) or exemption", hint: "Mandatory for enrolment — see the health-insurance selector." },
  { id: "fee", label: "Semester contribution (Semesterbeitrag) payment receipt", hint: "Often ~€70–€430; set per university — verify." },
  { id: "language", label: "Language certificate (if required by the programme)", optional: true },
  { id: "aps", label: "APS certificate (if your country requires it)", optional: true },
];

/* ── G38 German bank account ──────────────────────────────────────────────────── */
export const BANK_DOCS: ChecklistItemDef[] = [
  { id: "passport", label: "Passport (and visa / residence permit)" },
  { id: "anmeldung", label: "Anmeldung confirmation (Meldebescheinigung)", hint: "Many banks need your registered address first." },
  { id: "enrolment", label: "Enrolment certificate (Immatrikulationsbescheinigung)", optional: true },
  { id: "tax-id", label: "Tax ID (Steuer-ID)", hint: "Arrives by post after Anmeldung; needed for interest reporting.", optional: true },
  { id: "address", label: "A German address for the bank card to be posted to" },
];

/* ── G41 University onboarding (first weeks) ──────────────────────────────────── */
export const ONBOARDING_TASKS: ChecklistItemDef[] = [
  { id: "matrikel", label: "Get your Matrikelnummer (student number)", hint: "Issued on enrolment; you'll use it everywhere." },
  { id: "card", label: "Collect your student ID / campus card", hint: "Often also your library + cafeteria + transit card." },
  { id: "email", label: "Activate your university email & IT accounts", hint: "Check it daily — official notices go here." },
  { id: "lms", label: "Log into the learning platform (Moodle/ILIAS) & course catalogue" },
  { id: "register-courses", label: "Register for courses / modules and exams", hint: "Exam registration often has its own separate deadline." },
  { id: "semesterticket", label: "Activate your Deutschland-Semesterticket", optional: true },
  { id: "library", label: "Set up library & printing accounts", optional: true },
  { id: "intro", label: "Attend the international-office orientation / Ersti week", optional: true },
];

/* ── G42 Anmeldung runbook ────────────────────────────────────────────────────── */
export const ANMELDUNG_DOCS: ChecklistItemDef[] = [
  { id: "passport", label: "Passport (all tenants register individually)" },
  { id: "wohnungsgeber", label: "Wohnungsgeberbestätigung (landlord confirmation)", hint: "Signed by your landlord — mandatory, you cannot register without it." },
  { id: "form", label: "Completed Anmeldung form (Anmeldeformular)", hint: "Download from your city's Bürgeramt site, or fill in on arrival." },
  { id: "appointment", label: "Booked Bürgeramt appointment confirmation", hint: "In big cities slots vanish — book the moment you have an address." },
  { id: "marriage", label: "Marriage / birth certificates (if registering family)", optional: true },
];

/* ── G39 Residence permit conversion / G40 Ausländerbehörde ───────────────────── */
export const PERMIT_DOCS: ChecklistItemDef[] = [
  { id: "passport", label: "Passport with the entry (D) visa" },
  { id: "anmeldung", label: "Anmeldung confirmation (Meldebescheinigung)" },
  { id: "enrolment", label: "Enrolment certificate (Immatrikulationsbescheinigung)" },
  { id: "finance", label: "Proof of financial means (Sperrkonto / scholarship / sponsor)", hint: "Usually the same blocked-account proof as the visa." },
  { id: "insurance", label: "Proof of health insurance" },
  { id: "photo", label: "Biometric passport photo" },
  { id: "rent", label: "Rental contract + landlord confirmation", optional: true },
  { id: "fee", label: "Fee for the residence permit (often ~€100 — verify)", hint: "Set nationally and updated periodically; confirm with your Ausländerbehörde." },
];

/* ── G44 Job-seeker permit checklist ──────────────────────────────────────────── */
export const JOBSEEKER_DOCS: ChecklistItemDef[] = [
  { id: "degree", label: "German degree certificate (or proof of completion)" },
  { id: "passport", label: "Passport + current residence permit" },
  { id: "finance", label: "Proof you can support yourself during the search" },
  { id: "insurance", label: "Continued health insurance cover" },
  { id: "anmeldung", label: "Current registered address (Meldebescheinigung)" },
];

/* ── G45 Family reunion checklist ─────────────────────────────────────────────── */
export const FAMILY_DOCS: ChecklistItemDef[] = [
  { id: "marriage", label: "Marriage certificate (apostilled + translated) / birth certificates" },
  { id: "passport", label: "Family members' passports" },
  { id: "housing", label: "Proof of adequate housing for the family size" },
  { id: "finance", label: "Proof of sufficient income / means for the whole family" },
  { id: "insurance", label: "Health insurance for joining family members" },
  { id: "language", label: "Basic German (A1) for a spouse, where required", optional: true, hint: "Exemptions exist — verify for your case." },
];

/* ── Illustrative facts (all flagged to verify) ───────────────────────────────── */
export const RUNDFUNK_FEE: OfficialFact = {
  label: "Rundfunkbeitrag (broadcasting fee)",
  value: "€18.36 / month per household",
  source: source("rundfunkbeitrag"),
  needsVerification: true,
  note: "Charged once per dwelling, not per person — flatmates split one fee. Register after your Anmeldung. Verify the current amount at rundfunkbeitrag.de.",
};

export const PERMIT_VALIDITY: OfficialFact = {
  label: "Student residence permit — typical validity",
  value: "1–2 years, renewable",
  source: source("residencePermit"),
  needsVerification: true,
  note: "Issued for up to two years and renewed for the rest of your studies. The exact term is set by your Ausländerbehörde.",
};

export const JOBSEEKER_WINDOW: OfficialFact = {
  label: "Post-study job-seeker permit",
  value: "Up to 18 months after graduation",
  source: source("jobSeekerPermit"),
  needsVerification: true,
  note: "To look for employment matching your qualification. During it you may work without restriction. Apply before your student permit expires.",
};
