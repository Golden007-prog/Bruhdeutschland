import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Download, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { formatDate, relativeLabel, severityFor, sortByDate } from "@/lib/calc/deadlines";
import { buildIcs, toIcsStamp } from "@/lib/calendar/ics";
import type { DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEV_CLS: Record<DeadlineSeverity, string> = {
  overdue: "border-red-300 bg-red-50/50",
  urgent: "border-amber-300 bg-amber-50/50",
  soon: "border-sky-200 bg-sky-50/50",
  info: "border-emerald-200 bg-emerald-50/50",
};

/** The personal reminder keys set across the app (each via <DeadlineReminder>). */
const REMINDER_DEFS: { key: string; label: string }[] = [
  { key: "enrolment-deadline", label: "Enrolment / acceptance deadline" },
  { key: "visa-appointment", label: "Visa appointment" },
  { key: "visa-docs-ready", label: "Visa documents ready" },
  { key: "visa-expiry", label: "Entry visa expires" },
  { key: "abh-appointment", label: "Ausländerbehörde appointment" },
  { key: "permit-renewal", label: "Residence permit expires" },
  { key: "rueckmeldung", label: "Semester Rückmeldung" },
];

/** G51 — Reminders hub + calendar (.ics) export. Surfaces every personal deadline you've set. */
export default function RemindersPage() {
  // One synced value per known reminder key; offers carry their own accept-by dates.
  const r0 = useSyncedState<string>(`reminder:${REMINDER_DEFS[0].key}`, "")[0];
  const r1 = useSyncedState<string>(`reminder:${REMINDER_DEFS[1].key}`, "")[0];
  const r2 = useSyncedState<string>(`reminder:${REMINDER_DEFS[2].key}`, "")[0];
  const r3 = useSyncedState<string>(`reminder:${REMINDER_DEFS[3].key}`, "")[0];
  const r4 = useSyncedState<string>(`reminder:${REMINDER_DEFS[4].key}`, "")[0];
  const r5 = useSyncedState<string>(`reminder:${REMINDER_DEFS[5].key}`, "")[0];
  const r6 = useSyncedState<string>(`reminder:${REMINDER_DEFS[6].key}`, "")[0];
  const [offers] = useSyncedState<Offer[]>(OFFERS_KEY, []);

  const events = useMemo(() => {
    const raw = [r0, r1, r2, r3, r4, r5, r6];
    const fromReminders = REMINDER_DEFS.map((d, i) => ({ label: d.label, date: raw[i] })).filter((e) => e.date);
    const fromOffers = offers.filter((o) => o.acceptBy).map((o) => ({ label: `Accept seat: ${o.programme || o.university || "offer"}`, date: o.acceptBy }));
    return sortByDate([...fromReminders, ...fromOffers]);
  }, [r0, r1, r2, r3, r4, r5, r6, offers]);

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(events, toIcsStamp(new Date()))], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deutschprep-reminders.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G51 · Overview"
        title="Reminders & calendar export"
        description="Every personal deadline you've set across the app, in one place — and a one-click export to your own calendar so the reminders live where you'll actually see them."
      />

      {events.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No dated reminders yet. Set dates on pages like the{" "}
            <Link to="/arrival/renewals" className="font-medium underline">renewals</Link>,{" "}
            <Link to="/visa/appointment" className="font-medium underline">visa appointment</Link>, or{" "}
            <Link to="/offers/compare" className="font-medium underline">offers</Link>, and they'll appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground"><span className="official-figure font-semibold text-foreground">{events.length}</span> reminder{events.length === 1 ? "" : "s"}</p>
            <Button onClick={downloadIcs} variant="outline" size="sm"><Download aria-hidden /> Export .ics</Button>
          </div>
          <ul className="space-y-2">
            {events.map((e, i) => {
              const sev = severityFor(e.date);
              return (
                <li key={`${e.label}-${i}`} className={cn("flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm", SEV_CLS[sev])}>
                  <span className="font-medium">{e.label}</span>
                  <span className="official-figure inline-flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" aria-hidden /> {formatDate(e.date)} · {relativeLabel(e.date)}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Link to="/deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Programme & official deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>

      <p className="text-xs text-muted-foreground">
        Email/push notifications need a backend; for now the .ics export drops these into Google/Apple/Outlook
        calendar, which does the reminding for you.
      </p>
    </div>
  );
}
