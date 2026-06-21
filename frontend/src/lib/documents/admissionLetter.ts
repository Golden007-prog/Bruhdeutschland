/**
 * Deterministic admission-letter (Zulassungsbescheid) reader (gap G4-04). Pure + tested: it scans the
 * pasted letter for the two things students miss — the enrolment/acceptance DEADLINE and any CONDITIONS
 * (bedingte Zulassung / unter Vorbehalt) — plus the university and whether it's a rejection. It NEVER
 * fabricates: every extracted value is the student's own pasted text, returned with a `confidence` flag
 * so the UI can mark a guess as "low confidence — verify". No official German fact is asserted here.
 */

/** Result of reading a pasted letter. Empty strings / empty arrays mean "not found — check by hand". */
export interface LetterReading {
  /** Detected university / institution name, "" if none stood out. */
  university: string;
  /** Enrolment / acceptance deadline as "YYYY-MM-DD", "" if no date was found near a deadline cue. */
  enrolmentDeadline: string;
  /** True when the letter looks conditional (bedingt / unter Vorbehalt / subject to). */
  conditional: boolean;
  /** Condition sentences pulled verbatim from the text (deduped, trimmed). */
  conditions: string[];
  /** True when the letter looks like a rejection (Ablehnung) rather than an admission. */
  rejection: boolean;
  /** "high" when a deadline sat right next to a deadline cue; "low" when we took a best-effort date; "none". */
  confidence: "high" | "low" | "none";
}

const MONTHS_DE: Record<string, number> = {
  januar: 1, februar: 2, "märz": 3, maerz: 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
};
const MONTHS_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Normalise a (y, m, d) triple to "YYYY-MM-DD", or "" when out of range. */
function iso(y: number, m: number, d: number): string {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return "";
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Find every date in `text`, each with its character offset. Supports dd.mm.yyyy, yyyy-mm-dd, and "15 July 2026". */
export function findDates(text: string): { iso: string; index: number }[] {
  const out: { iso: string; index: number }[] = [];

  // dd.mm.yyyy or dd/mm/yyyy (German default day-first)
  for (const m of text.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g)) {
    const v = iso(+m[3], +m[2], +m[1]);
    if (v) out.push({ iso: v, index: m.index ?? 0 });
  }
  // yyyy-mm-dd
  for (const m of text.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    const v = iso(+m[1], +m[2], +m[3]);
    if (v) out.push({ iso: v, index: m.index ?? 0 });
  }
  // "15. Juli 2026" / "15 July 2026" / "July 15, 2026"
  for (const m of text.matchAll(/\b(\d{1,2})\.?\s+([A-Za-zäöü]+)\s+(\d{4})\b/gi)) {
    const mon = MONTHS_DE[m[2].toLowerCase()] ?? MONTHS_EN[m[2].toLowerCase()];
    if (mon) {
      const v = iso(+m[3], mon, +m[1]);
      if (v) out.push({ iso: v, index: m.index ?? 0 });
    }
  }
  for (const m of text.matchAll(/\b([A-Za-zäöü]+)\s+(\d{1,2}),?\s+(\d{4})\b/gi)) {
    const mon = MONTHS_DE[m[1].toLowerCase()] ?? MONTHS_EN[m[1].toLowerCase()];
    if (mon) {
      const v = iso(+m[3], mon, +m[2]);
      if (v) out.push({ iso: v, index: m.index ?? 0 });
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Cues that mark an enrolment / acceptance deadline (German + English). */
const DEADLINE_CUES = /(immatrikulationsfrist|einschreibefrist|frist zur einschreibung|enrol|enroll|deadline|bis sp[äa]testens|annahmefrist|accept(?:ance)? by|fristgerecht)/i;
const CONDITION_CUES = /(bedingte? zulassung|unter vorbehalt|vorbehaltlich|auflage|subject to|conditional|provided that|sofern|nachreichen|noch vorzulegen)/i;
const REJECTION_CUES = /(ablehnungsbescheid|leider (?:können|koennen) wir|abgelehnt|we regret to inform|are unable to offer|rejection)/i;

/** Split into sentence-ish chunks (German letters use ; and newlines a lot). */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Pull a university / institution name from a line that names one, else "". Best-effort, never asserted. */
function findUniversity(text: string): string {
  const m = text.match(/\b((?:Technische |Freie |Humboldt-?|Ludwig-Maximilians-?|Rheinisch-Westf[äa]lische )?Universit[äa]t[^\n,.;]{0,40}|[A-ZÄÖÜ][\w.\- ]*?(?:Hochschule|University|Institute of Technology)[^\n,.;]{0,30})/);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

/**
 * Read a pasted letter. Deterministic; no network. Picks the deadline date that's nearest *after* a
 * deadline cue (high confidence); if none, falls back to the latest date in the text (low confidence).
 */
export function readLetter(text: string): LetterReading {
  const clean = (text || "").trim();
  if (!clean) {
    return { university: "", enrolmentDeadline: "", conditional: false, conditions: [], rejection: false, confidence: "none" };
  }

  const dates = findDates(clean);
  let deadline = "";
  let confidence: LetterReading["confidence"] = dates.length ? "low" : "none";

  // High confidence: a date that appears shortly after a deadline cue.
  const cueMatches = [...clean.matchAll(new RegExp(DEADLINE_CUES, "gi"))];
  for (const cue of cueMatches) {
    const cueEnd = (cue.index ?? 0) + cue[0].length;
    const near = dates.find((d) => d.index >= cue.index! && d.index - cueEnd < 80);
    if (near) {
      deadline = near.iso;
      confidence = "high";
      break;
    }
  }
  // Low-confidence fallback: the latest date in the letter (deadlines are usually the furthest-out date).
  if (!deadline && dates.length) {
    deadline = dates.reduce((a, b) => (a.iso >= b.iso ? a : b)).iso;
  }

  const rejection = REJECTION_CUES.test(clean);
  const conditions = Array.from(
    new Set(sentences(clean).filter((s) => CONDITION_CUES.test(s))),
  ).slice(0, 6);
  const conditional = conditions.length > 0 || /\bbedingt/i.test(clean);

  return {
    university: findUniversity(clean),
    enrolmentDeadline: deadline,
    conditional,
    conditions,
    rejection,
    confidence,
  };
}
