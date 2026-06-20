/**
 * Minimal RFC-5545 iCalendar builder (gap G51 export). Pure + tested so the reminders page can hand
 * users a `.ics` their own calendar app accepts. Fixes qa COR-6 (missing DTSTAMP — strict importers
 * reject events without it) and SEC-4 (proper text escaping / line handling).
 */

export interface IcsEvent {
  /** "YYYY-MM-DD" all-day date. */
  date: string;
  /** Free-text summary (will be escaped). */
  label: string;
}

/** Escape per RFC 5545 §3.3.11: backslash, semicolon, comma, and newlines. */
export function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "YYYY-MM-DD" → "YYYYMMDD" (DATE value). Empty/invalid → "". */
export function toIcsDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.replace(/-/g, "") : "";
}

/** Exclusive end for an all-day event = the next calendar day, "YYYYMMDD". */
export function nextDayIcsDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
}

/** A UTC DTSTAMP "YYYYMMDDTHHMMSSZ" from a Date (caller passes `new Date()` — keeps this fn pure). */
export function toIcsStamp(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}` +
    `T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`
  );
}

/** Fold a content line to ≤75 octets per RFC 5545 §3.1 (continuation lines start with a space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

/** Build a complete VCALENDAR. `dtstamp` is a UTC stamp (see {@link toIcsStamp}). */
export function buildIcs(events: IcsEvent[], dtstamp: string): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DeutschPrep//Reminders//EN", "CALSCALE:GREGORIAN"];
  events
    .filter((e) => toIcsDate(e.date))
    .forEach((e, i) => {
      const d = toIcsDate(e.date);
      lines.push(
        "BEGIN:VEVENT",
        `UID:deutschprep-${i}-${d}-${dtstamp}@deutschprep.local`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${d}`,
        `DTEND;VALUE=DATE:${nextDayIcsDate(e.date)}`,
        fold(`SUMMARY:${escapeIcsText(e.label)}`),
        "END:VEVENT",
      );
    });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
