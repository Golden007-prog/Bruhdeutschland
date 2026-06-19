import type { ChecklistItemDef, ProcessStep } from "@/lib/types";
import { source } from "@/lib/sources";

/* ------------------------------------------------------------------ *
 *  uni-assist walkthrough — application steps (Feature 09)
 *  Order is real & dependency-ordered. Fees / processing time are
 *  volatile → flagged needsVerification + cited at the step. (facts §1)
 * ------------------------------------------------------------------ */

export const UNI_ASSIST_STEPS: ProcessStep[] = [
  {
    id: "ua-account",
    title: "Create your My-assist account",
    detail:
      "Register once on the uni-assist portal. You reuse the same account for every university and every semester you apply to.",
    durationHint: "~15 min",
    source: source("uniAssist"),
  },
  {
    id: "ua-select",
    title: "Select your programs & universities",
    detail:
      "Search for the Master's programs you shortlisted. uni-assist only handles universities that are members or that require it — others you apply to directly.",
    source: source("uniAssist"),
  },
  {
    id: "ua-upload",
    title: "Upload your documents",
    detail:
      "Upload certified copies of your degree and transcripts, language certificate, ID, and any program-specific extras (SOP, CV, LORs). Keep names and dates consistent across documents.",
  },
  {
    id: "ua-pay",
    title: "Pay the handling fee",
    detail:
      "uni-assist charges a fee per application/semester. The exact amount changes and depends on how many programs you apply to — confirm the current fee before paying.",
    durationHint: "fee — verify",
    needsVerification: true,
    source: source("uniAssist"),
  },
  {
    id: "ua-submit",
    title: "Submit & mail any originals required",
    detail:
      "Submit online before the deadline. Some universities still require certified paper copies by post — check whether yours does and allow for mail time.",
    needsVerification: true,
    source: source("uniAssistDeadlines"),
  },
  {
    id: "ua-track",
    title: "Track processing & forwarding",
    detail:
      "uni-assist checks your documents (typically 4–6 weeks), then forwards a Vorprüfungsdokumentation (VPD) or your full application to the university, which makes the admission decision.",
    durationHint: "4–6 weeks",
    needsVerification: true,
    source: source("uniAssistDeadlines"),
  },
];

/* ------------------------------------------------------------------ *
 *  VPD prerequisites checklist (Feature 10)
 * ------------------------------------------------------------------ */

export const VPD_PREREQUISITES: ChecklistItemDef[] = [
  {
    id: "vpd-account",
    label: "My-assist account created",
    hint: "The VPD is requested through the same uni-assist portal.",
    category: "documents",
  },
  {
    id: "vpd-degree",
    label: "Certified copy of your Bachelor's degree certificate",
    hint: "Plus a certified translation if it is not in German or English.",
    category: "documents",
  },
  {
    id: "vpd-transcript",
    label: "Certified academic transcript / mark sheets",
    hint: "All semesters, showing grades and the grading scale used.",
    category: "documents",
  },
  {
    id: "vpd-scale",
    label: "Proof of your university's grading scale",
    hint: "Needed so your grade can be converted to the German 1.0–4.0 scale.",
    optional: true,
    category: "documents",
  },
  {
    id: "vpd-target",
    label: "Confirmation the target university requires a VPD",
    hint: "Not every university uses VPDs — check the program page first.",
    category: "documents",
  },
  {
    id: "vpd-deadline",
    label: "University application deadline noted",
    hint: "The finished VPD must reach the university before its deadline.",
    category: "documents",
  },
];

/* ------------------------------------------------------------------ *
 *  Translation assistant — what needs a certified translation (Feature 11)
 * ------------------------------------------------------------------ */

export const TRANSLATION_NEEDED: ChecklistItemDef[] = [
  {
    id: "tr-degree",
    label: "Bachelor's degree certificate",
    hint: "Required as a certified/sworn translation if not issued in German or English.",
    category: "documents",
  },
  {
    id: "tr-transcript",
    label: "Academic transcript / mark sheets",
    hint: "Often the longest document — budget time and cost accordingly.",
    category: "documents",
  },
  {
    id: "tr-leaving",
    label: "Secondary-school leaving certificate",
    hint: "Some universities ask for it as part of the entrance-qualification check.",
    optional: true,
    category: "documents",
  },
  {
    id: "tr-marriage",
    label: "Civil documents (marriage / name-change), if relevant",
    hint: "Only when a name on your certificates differs from your passport.",
    optional: true,
    category: "documents",
  },
];

export const TRANSLATION_NOT_NEEDED: ChecklistItemDef[] = [
  {
    id: "trn-english",
    label: "Documents already issued in German or English",
    hint: "Most German universities accept English-language originals as-is.",
    category: "documents",
  },
  {
    id: "trn-sop",
    label: "Statement of Purpose & motivation letter",
    hint: "You write these directly in the application language — no translator needed.",
    category: "documents",
  },
  {
    id: "trn-cv",
    label: "Curriculum vitae (Europass)",
    hint: "Authored in German or English; not a document that gets sworn-translated.",
    category: "documents",
  },
  {
    id: "trn-lor",
    label: "Letters of recommendation",
    hint: "Recommenders normally write directly in German or English.",
    category: "documents",
  },
  {
    id: "trn-passport",
    label: "Passport",
    hint: "An international travel document — never translated.",
    category: "documents",
  },
];

/* ------------------------------------------------------------------ *
 *  Letter-of-Recommendation templates (Feature 08)
 *  Placeholders in {{double-braces}} are filled by the recommender.
 * ------------------------------------------------------------------ */

export type LorRelationship = "professor" | "manager";

export interface LorTemplate {
  id: string;
  /** Who this variant is written for. */
  relationship: LorRelationship;
  label: string;
  /** One-line description of when to use it. */
  blurb: string;
  /** Template body with {{placeholders}} the recommender fills in. */
  body: string;
}

export const LOR_TEMPLATES: LorTemplate[] = [
  {
    id: "lor-prof-academic",
    relationship: "professor",
    label: "Academic referee — coursework & thesis",
    blurb: "Best when the professor taught you or supervised a project/thesis.",
    body: `To the Admissions Committee,

I am writing to recommend {{Applicant name}} for admission to the {{Program name}} at {{University name}}.

I am {{Referee name}}, {{Referee title}} in the Department of {{Department}} at {{Referee institution}}. I have known {{Applicant name}} for {{duration}}, during which they {{how you know the applicant — e.g. took my course on …, completed their thesis under my supervision}}.

{{Applicant name}} stood out for {{specific academic strength}}. A concrete example: {{describe a project, paper, or result and the grade/outcome}}. Among the {{cohort size}} students I taught that year, I would place them in the top {{percentile}}.

Beyond academic ability, {{Applicant name}} demonstrated {{personal quality — e.g. intellectual curiosity, rigour, independence}}, which I believe will serve them well in a research-oriented Master's such as {{Program name}}.

I recommend {{Applicant name}} without reservation. Please contact me at {{Referee email}} if I can provide further detail.

Sincerely,
{{Referee name}}
{{Referee title}}, {{Referee institution}}`,
  },
  {
    id: "lor-prof-research",
    relationship: "professor",
    label: "Research referee — lab / publication focus",
    blurb: "Use when the applicant did research, a publication, or a long project.",
    body: `To the Admissions Committee,

It is my pleasure to recommend {{Applicant name}} for the {{Program name}} at {{University name}}.

As {{Referee title}} at {{Referee institution}}, I supervised {{Applicant name}} on {{research project / topic}} for {{duration}}. Their contribution — {{specific contribution: methods, analysis, results}} — was {{quality assessment}} and led to {{outcome: a publication, presentation, prototype, grade}}.

What distinguishes {{Applicant name}} is {{research quality — e.g. they formulate clear questions, design sound experiments, and interpret results carefully}}. They work {{work style}} and respond constructively to feedback.

Given the research component of {{Program name}}, I am confident {{Applicant name}} will excel. I give them my strongest recommendation.

Sincerely,
{{Referee name}}
{{Referee title}}, {{Referee institution}}
{{Referee email}}`,
  },
  {
    id: "lor-manager-professional",
    relationship: "manager",
    label: "Professional referee — manager / supervisor",
    blurb: "Best when your strongest reference is from work, not academia.",
    body: `To the Admissions Committee,

I am pleased to recommend {{Applicant name}} for admission to the {{Program name}} at {{University name}}.

I am {{Referee name}}, {{Referee title}} at {{Company}}, where I was {{Applicant name}}'s {{relationship — e.g. direct manager}} for {{duration}}. In that time they were responsible for {{role / responsibilities}}.

{{Applicant name}} consistently delivered {{achievement with a measurable result, e.g. "reduced processing time by 30%"}}. They combine {{technical skill}} with {{soft skill — e.g. ownership, clear communication}}, and were trusted with {{example of responsibility}}.

A Master's in {{field}} is a logical and well-judged next step for {{Applicant name}}, and I am confident they have the discipline and ability to succeed in {{Program name}}.

Please feel free to contact me at {{Referee email}} for any further information.

Sincerely,
{{Referee name}}
{{Referee title}}, {{Company}}`,
  },
];
