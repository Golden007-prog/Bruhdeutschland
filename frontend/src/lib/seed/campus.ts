/**
 * Campus-life seed content (Bereich F). Non-official, general orientation copy — German academic
 * norms and editable outreach templates. No volatile official figures live here; the one grounded
 * figure on these pages (the Deutschlandticket price) comes from facts.ts. Anything a student must
 * act on legally (plagiarism, registration) still points at an official source on the page itself.
 */

/* ── Academic culture norms (Culture page) ───────────────────────────────────── */

export interface CultureNorm {
  id: string;
  title: string;
  /** One-line summary shown as the card lead. */
  summary: string;
  /** Concrete, practical detail. */
  detail: string;
}

export const CULTURE_NORMS: CultureNorm[] = [
  {
    id: "anrede",
    title: "Du vs. Sie — formality",
    summary: 'Default to the formal "Sie" until invited to switch.',
    detail:
      'Address professors and staff with "Sie" and their title (e.g. "Sehr geehrte Frau Professorin Müller"). Fellow students usually use the informal "du" with each other. Let the more senior person offer the switch to "du" — don\'t assume it.',
  },
  {
    id: "punctuality",
    title: "Punctuality (Pünktlichkeit)",
    summary: "On time means a few minutes early — lateness reads as disrespect.",
    detail:
      'Arrive before a seminar, meeting, or office hour starts. The phrase "akademisches Viertel" (c.t. / cum tempore) means a class listed at 10:00 may start at 10:15 — but verify it per course; "s.t." (sine tempore) means it starts exactly on the hour.',
  },
  {
    id: "participation",
    title: "Seminar participation",
    summary: "Seminars expect active, critical discussion — not silent note-taking.",
    detail:
      "In smaller seminars you are expected to read in advance, contribute arguments, and present (Referat). Disagreeing with a point — politely and with reasons — is welcomed, including with the professor. Lectures (Vorlesungen) are more one-directional.",
  },
  {
    id: "independence",
    title: "Self-directed study (Selbststudium)",
    summary: "You manage your own workload; nobody chases you.",
    detail:
      "There is little hand-holding. You choose many of your courses, register for exams yourself by the deadline, and are expected to do substantial independent reading. Missing an exam-registration window can cost you a whole semester — track it.",
  },
  {
    id: "exams",
    title: "Exam culture",
    summary: "High-stakes end-of-term exams; you register and can often deregister.",
    detail:
      "Grades frequently rest on one written exam (Klausur) or a term paper (Hausarbeit) rather than continuous assessment. Registration and deregistration run through the campus system within set windows. The German grade scale is 1.0 (best) to 4.0 (lowest pass); 5.0 fails.",
  },
  {
    id: "feedback",
    title: "Direct communication",
    summary: "Feedback is candid and factual — it isn't personal.",
    detail:
      "German academic feedback tends to be blunt and to the point. Critique of your work is about the work, not about you. Likewise, asking direct questions of staff is normal and expected — over-apologising or excessive small talk can feel out of place.",
  },
];

/* ── Editable outreach templates (Networking page) ───────────────────────────── */

export interface OutreachTemplate {
  id: string;
  title: string;
  /** Short description of when to use it. */
  context: string;
  /** Editable default body — clearly a starting point to personalise. */
  body: string;
}

export const NETWORKING_TEMPLATES: OutreachTemplate[] = [
  {
    id: "professor",
    title: "Email a professor (thesis / research interest)",
    context:
      "Reaching out to a potential supervisor or a professor whose research you want to discuss. Keep it short, specific, and easy to say yes to.",
    body: `Subject: Inquiry about [research topic] — prospective Master's student

Sehr geehrte Frau Professorin / Sehr geehrter Herr Professor [Surname],

My name is [Your name] and I am a [your current programme] student at [your university]. I am applying to the [programme name] Master's at [university] for the [WS/SS 20XX] intake.

I have read your work on [specific paper or topic] and I am especially interested in [one concrete point]. I would value the chance to ask a few questions about [thesis opportunities / your group's current projects].

Would you have 15 minutes for a short call or meeting in the coming weeks? I have attached my CV and transcript for context.

Thank you for your time.

Mit freundlichen Grüßen,
[Your name]
[Email] · [Phone]`,
  },
  {
    id: "fachschaft",
    title: "Join a Fachschaft / student group",
    context:
      "The Fachschaft is the elected student council for your department — a fast way to meet peers, find tutoring, and learn the unwritten rules. Most welcome new and international students.",
    body: `Subject: New Master's student — how can I get involved?

Hallo [Fachschaft / group name] team,

I'm [Your name], an incoming Master's student in [programme] starting this [WS/SS]. I'd love to get to know the department and meet other students.

A few questions:
- When is your next meeting or social event, and can newcomers just show up?
- Do you run a buddy/mentoring scheme for first-semester or international students?
- Is there a chat group (e.g. WhatsApp/Discord) I could join?

I'm happy to help out too. Thanks a lot, and looking forward to meeting you!

Viele Grüße,
[Your name]`,
  },
];

/* ── Practical networking tips (Networking page) ─────────────────────────────── */

export interface NetworkingTip {
  id: string;
  title: string;
  detail: string;
}

export const NETWORKING_TIPS: NetworkingTip[] = [
  {
    id: "office-hours",
    title: "Use office hours (Sprechstunde)",
    detail:
      "Every professor holds regular office hours — booked or drop-in. Coming with one specific, well-prepared question is the single best way to build an academic relationship.",
  },
  {
    id: "fachschaft",
    title: "Find your Fachschaft early",
    detail:
      "The departmental student council runs orientation (O-Phase), past-exam archives, and socials. They know which courses and supervisors are worth your time.",
  },
  {
    id: "events",
    title: "Show up to colloquia and Stammtische",
    detail:
      "Research colloquia, guest talks, and informal departmental get-togethers (Stammtisch) are low-pressure places to meet peers and staff. Going regularly matters more than going often.",
  },
  {
    id: "peers",
    title: "Form a study group (Lerngruppe)",
    detail:
      "German exam culture rewards collaborative preparation. A small Lerngruppe gives you notes, accountability, and your first real friendships in the programme.",
  },
];
