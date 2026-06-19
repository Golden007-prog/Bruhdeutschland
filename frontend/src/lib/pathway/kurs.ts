/**
 * Studienkolleg course (Kurs) selection by target subject (addendum §2). A Studienkolleg streams
 * applicants into a one-year foundation course that confers the HZB via the Feststellungsprüfung (FSP).
 * RULE: a University-Studienkolleg qualifies you for ALL institutions; an FH-Studienkolleg only for FHs.
 * These are the standard university streams; the choice is indicative — confirm with the target college.
 */
export type KursCode = "T" | "M" | "W" | "G" | "S";

export interface KursInfo {
  code: KursCode;
  name: string;
  desc: string;
}

export const KURSE: Record<KursCode, KursInfo> = {
  T: { code: "T", name: "T-Kurs", desc: "Engineering, computer science, maths & natural sciences (technical)." },
  M: { code: "M", name: "M-Kurs", desc: "Medicine, biology, pharmacy & other life sciences." },
  W: { code: "W", name: "W-Kurs", desc: "Business, economics & social sciences." },
  G: { code: "G", name: "G-Kurs", desc: "Humanities, German studies & the arts." },
  S: { code: "S", name: "S-Kurs", desc: "Language degrees." },
};

/** Map a target subject (and level) to the most likely Studienkolleg course. Medicine always → M-Kurs. */
export function kursForSubject(subject: string, isMedicine = false): KursInfo {
  if (isMedicine) return KURSE.M;
  const s = (subject || "").toLowerCase();
  if (/\b(medic|biolog|pharma|health|nurs|life scien|dentist|veterin)/.test(s)) return KURSE.M;
  if (/\b(engineer|computer|comput|software|data|math|physic|chem|electr|mechanic|civil|robot|tech|informat)/.test(s)) return KURSE.T;
  if (/\b(business|econom|management|finance|account|commerce|mba|social|polit|psycholog)/.test(s)) return KURSE.W;
  if (/\b(language|linguist|translat)/.test(s)) return KURSE.S;
  if (/\b(human|histor|philosoph|art|literatur|cultur|law|design|music)/.test(s)) return KURSE.G;
  return KURSE.T; // technical is the most common default; the page flags this as a guess
}
