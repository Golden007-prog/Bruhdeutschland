import { source } from "@/lib/sources";
import type { ProcessStep, Source } from "@/lib/types";

/**
 * Visa & Relocation seed data (Bereich E). Derived from docs/research/facts-pack-2026-06.md
 * (§2 APS, §8 visa & Anmeldung) and the canonical source registry in src/lib/sources.ts.
 *
 * Grounding rules (CLAUDE.md §2/§3): no euro amount, fee, or processing/appointment time lives here
 * — those are official figures and belong in src/lib/facts.ts, rendered with their
 * grounded/needs-verification treatment. Steps that *reference* a varying official requirement carry
 * `needsVerification: true` and a SourceLink so the user is told where to confirm. Everything else
 * here is process guidance and illustrative reference data the UI displays.
 */

/* ── The end-to-end journey: offer letter → visa → arrival → Anmeldung ─────────── */

/**
 * The relocation arc shown on the Visa overview. Each step deep-links to the tool that performs it.
 * Mission-specific timing (appointment waits, processing) is flagged — it varies widely.
 */
export const VISA_JOURNEY_STEPS: ProcessStep[] = [
  {
    id: "vj-aps",
    title: "Get your APS certificate (if required)",
    detail:
      "Applicants from India, China, and Vietnam must hold an APS certificate before applying. Start it early — it gates both the university application and the visa.",
    durationHint: "Before applying",
    href: "/visa/aps",
    source: source("aps"),
    needsVerification: true,
  },
  {
    id: "vj-offer",
    title: "Receive your admission letter (Zulassung)",
    detail:
      "The university's formal offer is the document the visa process is built around. Decisions for winter intake typically land Aug–Sep.",
    durationHint: "After admission",
  },
  {
    id: "vj-finance",
    title: "Arrange proof of financing & insurance",
    detail:
      "Open a blocked account (Sperrkonto) and confirm health insurance — both are visa requirements you need in hand before the appointment.",
    durationHint: "~2–4 weeks",
    href: "/finance",
  },
  {
    id: "vj-appointment",
    title: "Book your visa appointment",
    detail:
      "Appointment availability varies widely by German mission and can be months out. Book as soon as you have an admission letter.",
    durationHint: "Book early",
    href: "/visa/checklist",
    source: source("autoVisa"),
    needsVerification: true,
  },
  {
    id: "vj-interview",
    title: "Attend the interview & submit your application",
    detail:
      "Bring the full document set and answer questions about your study plan, finances, and intent to return. Rehearse with the simulator first.",
    durationHint: "1 appointment",
    href: "/visa/simulator",
  },
  {
    id: "vj-decision",
    title: "Receive the visa & travel to Germany",
    detail:
      "Processing takes several weeks (sometimes months) after the appointment. The national D-visa lets you enter and start your studies.",
    durationHint: "Several weeks",
    source: source("autoVisaFaq"),
    needsVerification: true,
  },
  {
    id: "vj-housing",
    title: "Move into your accommodation",
    detail:
      "Secure a place before or just after arrival; you need a registered address to complete the next steps.",
    durationHint: "On arrival",
    href: "/visa/accommodation",
  },
  {
    id: "vj-anmeldung",
    title: "Register your address (Anmeldung)",
    detail:
      "Register at the local Bürgeramt within 14 days of moving in. The Meldebescheinigung you receive unlocks your bank account and residence permit.",
    durationHint: "Within 14 days",
    href: "/visa/anmeldung",
    source: source("bundesmeldegesetz"),
  },
];

/* ── APS process (Akademische Prüfstelle) ──────────────────────────────────────── */

/** The APS verification process. Country offices differ; the broad sequence is consistent. */
export const APS_STEPS: ProcessStep[] = [
  {
    id: "aps-account",
    title: "Register with your country's APS office",
    detail:
      "Create an account on the APS portal for your country (e.g. APS India, APS China, APS Vietnam) and complete the application form.",
    href: "/visa/aps",
    source: source("aps"),
  },
  {
    id: "aps-docs",
    title: "Assemble your academic documents",
    detail:
      "Degree certificates, mark sheets/transcripts, school-leaving certificates, and passport copy. Requirements differ by country office — follow its checklist exactly.",
    source: source("apsIndia"),
    needsVerification: true,
  },
  {
    id: "aps-fee",
    title: "Pay the APS fee and submit",
    detail:
      "Pay the processing fee set by your country's APS office and submit your documents (online and/or by post). The fee is set per office — confirm the current amount.",
    needsVerification: true,
    source: source("aps"),
  },
  {
    id: "aps-review",
    title: "APS verifies your documents",
    detail:
      "The Akademische Prüfstelle checks the authenticity and value of your qualifications. Some offices conduct a short interview.",
    durationHint: "~3–4 weeks",
    needsVerification: true,
    source: source("aps"),
  },
  {
    id: "aps-cert",
    title: "Receive your APS certificate",
    detail:
      "Use the certificate to apply to universities and, later, for the student visa. Keep both digital and physical copies.",
    source: source("apsIndia"),
  },
];

/* ── Anmeldung process (address registration) ─────────────────────────────────── */

/** The Bürgeramt address-registration walkthrough. The 14-day statutory window is grounded. */
export const ANMELDUNG_STEPS: ProcessStep[] = [
  {
    id: "anm-termin",
    title: "Book a Bürgeramt appointment (Termin)",
    detail:
      "Most cities require an online appointment. Slots can be scarce in large cities — book as soon as you have a move-in date.",
  },
  {
    id: "anm-docs",
    title: "Gather your documents",
    detail:
      "Your passport, the completed registration form (Anmeldeformular), and the landlord's confirmation (Wohnungsgeberbestätigung) signed within two weeks of moving in.",
    source: source("bundesmeldegesetz"),
  },
  {
    id: "anm-attend",
    title: "Attend the Bürgeramt in person",
    detail:
      "Hand over your documents at the counter. The clerk records your new address in the population register.",
  },
  {
    id: "anm-receive",
    title: "Receive your Meldebescheinigung",
    detail:
      "You usually get the registration confirmation on the spot. Keep it safe — banks, the Ausländerbehörde, and your university will ask for it.",
  },
];

/* ── Anmeldung required documents (kept as visa-domain checklist) ──────────────── */

/** Minimal document set the Bürgeramt asks for. City-specific extras may apply. */
export const ANMELDUNG_DOCS = [
  {
    id: "anm-doc-passport",
    label: "Valid passport (and visa/residence document)",
    hint: "Bring all household members' passports if registering a family.",
    category: "visa" as const,
  },
  {
    id: "anm-doc-wgb",
    label: "Wohnungsgeberbestätigung (landlord's confirmation)",
    hint: "Your landlord must sign this within two weeks of your move-in date — without it you cannot register.",
    category: "visa" as const,
  },
  {
    id: "anm-doc-form",
    label: "Completed Anmeldeformular (registration form)",
    hint: "Download it from your city's Bürgeramt website, or fill it in at the counter.",
    category: "visa" as const,
  },
  {
    id: "anm-doc-marriage",
    label: "Marriage / birth certificates",
    hint: "Only if registering a spouse or children with you.",
    optional: true,
    category: "visa" as const,
  },
];

/* ── Visa interview Q&A (simulator) ───────────────────────────────────────────── */

export interface InterviewQA {
  id: string;
  /** The question the visa officer is likely to ask. */
  question: string;
  /** What the officer is really assessing — the intent behind the question. */
  checking: string;
  /** Practical guidance on how to answer well. No scripted lies — honest, prepared answers. */
  tips: string[];
}

/**
 * Common German student-visa interview questions. Officers assess that you are a genuine student
 * with a coherent plan, sufficient funds, and credible ties — answer honestly and specifically.
 */
export const INTERVIEW_QUESTIONS: InterviewQA[] = [
  {
    id: "iq-why-germany",
    question: "Why do you want to study in Germany?",
    checking:
      "That you have a genuine, researched reason — not just a generic wish to live abroad or to migrate.",
    tips: [
      "Name concrete reasons: the program's strength, tuition-free public universities, research groups, or industry links in your field.",
      "Connect Germany specifically to your subject and career — avoid answers that could apply to any country.",
      "Keep it personal and honest; rehearsed slogans sound hollow.",
    ],
  },
  {
    id: "iq-why-program",
    question: "Why this university and this Master's program?",
    checking:
      "That you actually chose the program deliberately and understand what it involves.",
    tips: [
      "Mention specific modules, specializations, or professors that fit your goals.",
      "Explain how it builds on your Bachelor's and fills a gap you can articulate.",
      "Know the basics: program length, language of instruction, and the city.",
    ],
  },
  {
    id: "iq-finance",
    question: "How will you finance your studies and living costs?",
    checking:
      "That you can support yourself for the whole stay without unauthorized work — usually via the blocked account.",
    tips: [
      "Reference your blocked account (Sperrkonto) and any scholarship or family sponsorship.",
      "Be clear who funds you and that the money is genuinely available.",
      "Do not overstate part-time earnings — work is limited and cannot be your main funding.",
    ],
  },
  {
    id: "iq-after-studies",
    question: "What are your plans after you finish your studies?",
    checking:
      "Your intent and the credibility of your plan — whether for an EU career path or returning home.",
    tips: [
      "Give an honest, coherent plan; Germany offers an 18-month post-study job-seeker route, so career intent is legitimate.",
      "Tie your plans back to the skills the program gives you.",
      "Avoid contradicting other answers — consistency matters more than any single 'right' answer.",
    ],
  },
  {
    id: "iq-ties",
    question: "Do you have family or ties in your home country?",
    checking:
      "Your overall profile and credibility as a genuine applicant, considered alongside everything else.",
    tips: [
      "Answer truthfully about family, commitments, or property.",
      "Do not invent ties — officers weigh your whole application, not a single factor.",
      "Stay calm; this is a routine question, not a trap.",
    ],
  },
  {
    id: "iq-language",
    question: "What is the language of instruction, and how is your German/English?",
    checking:
      "That you can actually follow your program and cope with daily life.",
    tips: [
      "State your language test result (IELTS/TOEFL, or TestDaF/DSH) and that it meets the program's bar.",
      "If the program is in English, show you also have basic German for daily life or a plan to learn it.",
      "Be ready to hold a short part of the conversation in the program's language.",
    ],
  },
  {
    id: "iq-gap",
    question: "Why is there a gap between your Bachelor's and this application?",
    checking:
      "That any gap in your timeline has a reasonable, documented explanation.",
    tips: [
      "Explain the gap factually — work, exams, family, or test preparation.",
      "Show how that time strengthened your application rather than detracting from it.",
      "Have supporting documents ready if the gap was for work or another course.",
    ],
  },
  {
    id: "iq-accommodation",
    question: "Where will you live in Germany, and do you have accommodation arranged?",
    checking:
      "That you have thought through the practical side of relocating, not just enrolment.",
    tips: [
      "Mention your housing plan: a dorm offer, a temporary booking, or your search strategy.",
      "It is fine if housing is not final — show you understand the options and the Anmeldung step.",
      "Note that you will register your address within 14 days of moving in.",
    ],
  },
];

/* ── Accommodation channels ───────────────────────────────────────────────────── */

export interface AccommodationChannel {
  id: string;
  name: string;
  /** One-line description of the channel. */
  summary: string;
  pros: string[];
  cons: string[];
  /** Practical tip on how/when to use it. */
  bestFor: string;
  source?: Source;
}

/**
 * The main routes to student housing in Germany, compared neutrally. Costs vary hugely by city, so
 * no rent figures are quoted here — students should check current local listings (CLAUDE.md §2/§3).
 */
export const ACCOMMODATION_CHANNELS: AccommodationChannel[] = [
  {
    id: "ac-dorm",
    name: "Studierendenwerk dorms (Studentenwohnheim)",
    summary:
      "Subsidized student halls run by the regional Studierendenwerk — the cheapest and most popular route.",
    pros: [
      "Lowest rent and student-friendly contracts.",
      "Furnished rooms with utilities usually included.",
      "Run by an official, non-profit body — low scam risk.",
    ],
    cons: [
      "Long waiting lists — apply the moment you have an admission letter.",
      "Limited choice of room and location.",
    ],
    bestFor: "Apply as early as possible; demand far exceeds supply in popular cities.",
    source: source("studentenwerk"),
  },
  {
    id: "ac-wg",
    name: "Shared flat (Wohngemeinschaft / WG)",
    summary:
      "A room in a flat shared with other students or young professionals — the most common private option.",
    pros: [
      "Affordable and social; great for practicing German.",
      "Flexible move-in dates and shorter commitments.",
    ],
    cons: [
      "You are often interviewed by current flatmates before being offered the room.",
      "Quality and contract terms vary; read the lease carefully.",
    ],
    bestFor: "A realistic first home if dorms are full — start contacting WGs early.",
  },
  {
    id: "ac-private",
    name: "Private rental (own flat)",
    summary:
      "Renting your own apartment directly from a landlord or via an agency.",
    pros: [
      "Full privacy and your own contract.",
      "Best for couples, families, or longer stays.",
    ],
    cons: [
      "Most expensive; often a deposit of up to three months' rent (Kaution).",
      "Landlords may want proof of income and a Schufa credit record you won't have yet.",
    ],
    bestFor: "Better once you are settled and can show income or a guarantor.",
  },
  {
    id: "ac-temp",
    name: "Temporary first-nights stay",
    summary:
      "A hostel, short-term sublet, or serviced room for your first days while you search and register.",
    pros: [
      "Lets you arrive without a permanent contract in place.",
      "Buys time to view flats in person before committing.",
    ],
    cons: [
      "Not all temporary stays can be used for Anmeldung — confirm before booking.",
      "More expensive per night than a permanent room.",
    ],
    bestFor: "A safe landing while you finalize permanent housing — verify it allows registration.",
  },
];

/* ── Rental-scam red flags (Accommodation alert) ──────────────────────────────── */

/** Warnings shown in the danger Alert on the accommodation page. */
export const RENTAL_SCAM_FLAGS: string[] = [
  "Never pay a deposit or rent before you have viewed the property (or had a trusted person view it) and signed a contract.",
  "Be wary of deals that look too good — far-below-market rent is the most common bait.",
  "A landlord who is 'abroad' and asks you to wire money or pay via gift cards / crypto is a red flag.",
  "Never send money through untraceable transfer services; use a German bank transfer once a contract is signed.",
  "Verify the landlord's identity and that the address and listing are real before paying anything.",
];
