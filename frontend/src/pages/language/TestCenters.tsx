import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Download, ExternalLink, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { syncedStore } from "@/lib/persist/syncedStore";
import { buildIcs, toIcsStamp } from "@/lib/calendar/ics";
import { sortByDate } from "@/lib/calc/deadlines";
import { TEST_CENTRES, type TestCentreInfo } from "@/lib/seed/testCenters";

type Family = "all" | TestCentreInfo["family"];

const FAMILIES: { value: Family; label: string }[] = [
  { value: "all", label: "All" },
  { value: "English", label: "English" },
  { value: "German", label: "German" },
  { value: "Aptitude", label: "Aptitude" },
  { value: "Medicine", label: "Medicine" },
];

/** The reminder storage key a test centre's booking date is saved under (shared with the Reminders hub). */
const reminderKey = (id: string) => `test-booking-${id}`;

/**
 * G3-5 — Test-centre locator + booking-date reminders. For each admission test, the OFFICIAL booking /
 * centre-finder link (so the student reaches the binding source) plus a personal booking-date reminder
 * that persists per-user and exports to their calendar via the shared .ics infra. No centre lists, dates,
 * or fees are shipped — every such fact is needs_verification and lives behind the official link.
 */
export default function LanguageTestCenters() {
  const [family, setFamily] = useState<Family>("all");
  // Re-render when any synced value changes (a DeadlineReminder date is set/cleared, or the cloud blob
  // loads), so the .ics summary reflects the booking dates without a manual refresh.
  const [, bump] = useState(0);
  useEffect(() => {
    syncedStore.start();
    return syncedStore.subscribe(() => bump((n) => n + 1));
  }, []);

  const shown = family === "all" ? TEST_CENTRES : TEST_CENTRES.filter((c) => c.family === family);

  // Build .ics from whatever per-test booking dates the user has set (read from the same synced keys
  // DeadlineReminder writes — `reminder:<storageKey>`). Recomputed each render; `bump` drives re-render.
  const events = sortByDate(
    TEST_CENTRES.map((c) => ({
      label: `Book ${c.test}`,
      date: syncedStore.get<string>(`reminder:${reminderKey(c.id)}`, ""),
    })).filter((e) => e.date),
  );

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(events, toIcsStamp(new Date()))], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deutschprep-test-bookings.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Übungstests · Booking"
        title="Test centres & booking-date reminders"
        description="When you're ready, this is the bridge to an actual sitting: the official place to register for each test, plus a personal booking-date reminder you can drop into your calendar."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Test dates, fees, and centre lists change constantly and are set by each test owner — we don&apos;t
          reproduce them here. Each card links to the <strong>official</strong> registration page where the
          current, binding information lives. Booking-window advice below is practical guidance, not a
          guaranteed schedule.
        </AlertDescription>
      </Alert>

      <div role="group" aria-label="Filter by test family" className="flex flex-wrap gap-1.5">
        {FAMILIES.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={family === f.value}
            onClick={() => setFamily(f.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${family === f.value ? "border-category-language bg-category-language/10 font-medium text-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {events.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
          <p className="text-sm text-muted-foreground">
            <span className="official-figure font-semibold text-foreground">{events.length}</span> booking
            date{events.length === 1 ? "" : "s"} set — they also appear on your{" "}
            <Link to="/reminders" className="underline">Reminders hub</Link>.
          </p>
          <Button onClick={downloadIcs} variant="outline" size="sm"><Download aria-hidden /> Export .ics</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((c) => (
          <article key={c.id} className="flex flex-col rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{c.test}</h2>
              <Badge variant="secondary">{c.family}</Badge>
            </div>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.note}</p>
            <p className="mt-2 text-xs italic text-amber-700">Dates & fees: verify on the official page.</p>
            <a
              href={c.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {c.sourceName} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <div className="mt-3">
              <DeadlineReminder
                storageKey={reminderKey(c.id)}
                label={`My ${c.test} booking date`}
                hint="Set the date you plan to register or sit — it exports to your calendar and the Reminders hub."
              />
            </div>
          </article>
        ))}
      </div>

      <section className="flex flex-wrap gap-2">
        <Link to="/language/exam-progress" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Am I ready to book?
        </Link>
        <Link to="/language/exams" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Practise first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
