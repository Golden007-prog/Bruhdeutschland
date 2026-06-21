import type { Source } from "@/lib/types";

/**
 * Active German job-search toolkit — gap G9-02. PRACTICAL FRAMEWORK, no official figures.
 *
 * Grounding (CLAUDE.md §2/§3): this surface ships no salary, fee, or deadline — it is process
 * guidance (where to look, how a German CV/Anschreiben differs, what an Arbeitszeugnis is, how
 * Werkstudent converts to permanent). The only official anchor is the Federal Employment Agency
 * job portal; everything else is a portal link or an editable template. No invented numbers.
 */

/* ── Job portals (official + major; links only, no rankings invented) ──────────── */

export interface JobPortal {
  id: string;
  name: string;
  /** What it's best for, in plain terms. */
  detail: string;
  url: string;
  /** True for the official Federal Employment Agency portal. */
  official?: boolean;
}

export const JOB_PORTALS: JobPortal[] = [
  {
    id: "jp-ba",
    name: "Bundesagentur für Arbeit — Jobbörse",
    detail:
      "The Federal Employment Agency's official job board — the widest public listing in Germany, and the agency that also advises jobseekers free of charge.",
    url: "https://www.arbeitsagentur.de/jobsuche/",
    official: true,
  },
  {
    id: "jp-mig",
    name: "Make it in Germany — Job listings",
    detail:
      "The federal government's portal for international skilled workers, with English-language listings and visa-aware employer guidance.",
    url: "https://www.make-it-in-germany.com/en/looking-for-foreign-professionals/jobs",
    official: true,
  },
  {
    id: "jp-stepstone",
    name: "StepStone",
    detail: "A large general German job board, strong for professional and graduate roles.",
    url: "https://www.stepstone.de/",
  },
  {
    id: "jp-linkedin",
    name: "LinkedIn",
    detail:
      "Best for networking your way in and for roles at international/English-speaking employers; filter for 'visa sponsorship' signals and recruiters.",
    url: "https://www.linkedin.com/jobs/",
  },
  {
    id: "jp-career-service",
    name: "Your university career service",
    detail:
      "Every German university has a Career Service / Career Center with a job board, employer fairs, and CV checks — often the best route to Werkstudent and graduate roles. Find yours on your university site.",
    url: "https://www.arbeitsagentur.de/bildung/studium/career-service",
  },
];

/* ── German CV vs the academic Europass ────────────────────────────────────────── */

export interface CvContrast {
  id: string;
  /** The dimension being contrasted. */
  aspect: string;
  /** What a German market CV (Lebenslauf) expects. */
  germanCv: string;
  /** How the academic / Europass habit differs. */
  europass: string;
}

/**
 * How a German-market CV (Lebenslauf) differs from the academic Europass many applicants default to.
 * The app already builds a Europass CV; this is the contrast for the JOB market specifically.
 */
export const CV_CONTRASTS: CvContrast[] = [
  {
    id: "cv-length",
    aspect: "Length & focus",
    germanCv: "Tight 1–2 pages, reverse-chronological, tailored to the specific role.",
    europass: "Can run long and generic; the academic Europass favours completeness over targeting.",
  },
  {
    id: "cv-photo",
    aspect: "Photo & personal data",
    germanCv:
      "A professional photo is still common (though optional and never legally required), with date of birth often included.",
    europass: "Photo optional; anti-discrimination norms in some countries omit photo and age entirely.",
  },
  {
    id: "cv-zeugnisse",
    aspect: "Attachments",
    germanCv:
      "German applications attach a full set: cover letter + CV + references/Zeugnisse (degrees, work references).",
    europass: "Usually CV-only; references are 'on request'.",
  },
  {
    id: "cv-gaps",
    aspect: "Completeness",
    germanCv: "Employers expect a gap-free timeline (months), and signed/dated at the end is traditional.",
    europass: "Year-level granularity is often accepted.",
  },
];

/* ── Editable application templates (Anschreiben etc.) ─────────────────────────── */

export interface JobTemplate {
  id: string;
  title: string;
  /** When to use it. */
  context: string;
  /** Editable default body — a starting point to personalise, never to send as-is. */
  body: string;
}

/**
 * Editable cover-letter (Anschreiben) and follow-up templates, mirroring the networking-templates
 * pattern. Heavy on bracketed placeholders so it cannot be sent unedited.
 */
export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "anschreiben",
    title: "Anschreiben (cover letter) — graduate / professional role",
    context:
      "The German cover letter is its own document, not a CV summary. One page, formal, tied to the specific role and employer. Replace every bracket.",
    body: `[Your name]
[Your address]
[Email · phone]

[Company name]
[Hiring contact, if named]
[Company address]

[City], [date]

Bewerbung als [exact job title] — [Referenznummer, if any]

Sehr geehrte Frau [Surname] / Sehr geehrter Herr [Surname],
(use "Sehr geehrte Damen und Herren," only if no contact is named)

mit großem Interesse habe ich Ihre Stellenausschreibung für [job title] gelesen. [One sentence: why THIS company and role specifically — name something concrete about them.]

In meinem Studium [programme] an der [university] habe ich [the 2–3 skills the posting asks for]. [One concrete result or project that proves it — numbers if you have them.]

[One short paragraph linking your background to the posting's top requirement. Mirror the posting's wording.]

Meinen Aufenthaltstitel / meine Arbeitserlaubnis bringe ich mit; [if relevant: gerne erläutere ich meinen aufenthaltsrechtlichen Status im Gespräch.]

Über die Gelegenheit zu einem persönlichen Gespräch freue ich mich sehr.

Mit freundlichen Grüßen
[Your name]

Anlagen: Lebenslauf, Zeugnisse`,
  },
  {
    id: "english-cover",
    title: "Cover letter — English / international employer",
    context:
      "For English-speaking or international employers (often via LinkedIn). Keep it concrete and signal your right to work.",
    body: `Subject: Application — [exact job title] ([Ref no.])

Dear [Hiring manager name / Hiring team],

I'm applying for the [job title] role at [company]. [One sentence on why this company and role specifically.]

I recently completed my [degree] at [university], where I [the 2–3 capabilities the posting asks for, with one proof point or measurable result].

[One short paragraph mapping your experience to the role's main requirement, mirroring their language.]

On work authorisation: I [hold / am eligible for] a residence permit that allows me to work in Germany [e.g. the 18-month post-study job-seeker permit, convertible to a work permit / EU Blue Card on an offer]. I'm happy to walk through the details.

I'd welcome the chance to talk. Thank you for your consideration.

Best regards,
[Your name] · [email] · [phone] · [LinkedIn]`,
  },
  {
    id: "followup",
    title: "Follow-up after an application or interview",
    context: "A short, polite nudge. Send ~1–2 weeks after applying, or the day after an interview.",
    body: `Subject: Follow-up — [job title] application

Dear [name],

Thank you for [considering my application / taking the time to meet on [date]]. I remain very interested in the [job title] role and in [one specific thing you discussed or that excites you about the team].

Please let me know if you need anything further from me — references or my Zeugnisse are ready to share.

Best regards,
[Your name]`,
  },
];

/* ── Arbeitszeugnis literacy ───────────────────────────────────────────────────── */

export interface ZeugnisNote {
  id: string;
  title: string;
  detail: string;
}

/**
 * What a German work reference (Arbeitszeugnis) is and why its coded language matters — a thing
 * international graduates routinely under-read.
 */
export const ARBEITSZEUGNIS_NOTES: ZeugnisNote[] = [
  {
    id: "az-what",
    title: "You're entitled to one",
    detail:
      "At the end of a job (including a Werkstudent role or internship) you can request a written reference — either a short Arbeitsbescheinigung or a full qualified Arbeitszeugnis that assesses your performance and conduct.",
  },
  {
    id: "az-code",
    title: "The grades are coded",
    detail:
      "By law a Zeugnis must be benevolent, but German references use a settled code. 'Stets zu unserer vollsten Zufriedenheit' is top marks; drop a word ('vollsten' → 'vollen', or just 'Zufriedenheit') and each step quietly signals a worse grade. Read yours carefully.",
  },
  {
    id: "az-redflags",
    title: "Watch for silent negatives",
    detail:
      "Omissions matter: a missing thank-you/good-wishes closing line, or vague 'bemüht' ('made efforts'), reads as criticism. If yours is weak, you can ask for a correction — politely and in writing.",
  },
];

/* ── Werkstudent → permanent conversion ────────────────────────────────────────── */

export const WERKSTUDENT_CONVERSION: string[] = [
  "A Werkstudent role is the strongest on-ramp: you're already inside the company, known, and trained — converting beats applying cold.",
  "Signal intent early. Tell your manager well before graduation that you want to stay on as a working graduate, and ask what a permanent role would require.",
  "Time it to your status: line up the offer so you can convert your student permit to a work permit / EU Blue Card before the student permit (or the 18-month job-seeker window) runs out.",
  "Make your value legible: keep a running list of what you shipped, so your manager can justify a headcount request — and so it lands in your Arbeitszeugnis.",
];

/* ── Sources ───────────────────────────────────────────────────────────────────── */

/** Federal Employment Agency — official jobseeker portal & advice. */
export const SOURCE_BA: Source = {
  name: "Bundesagentur für Arbeit — Job search (official)",
  url: "https://www.arbeitsagentur.de/jobsuche/",
};

/** Make it in Germany — finding a job as an international graduate. */
export const SOURCE_MIG_JOBS: Source = {
  name: "Make it in Germany — Working in Germany (job market)",
  url: "https://www.make-it-in-germany.com/en/working-in-germany",
};

export const JOB_SEARCH_SOURCES: Source[] = [SOURCE_BA, SOURCE_MIG_JOBS];
