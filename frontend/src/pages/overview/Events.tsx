import { AlertTriangle, CalendarClock } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { EVENT_WATCH } from "@/lib/seed/overview";

/** Event watch — recurring intake/scholarship/visa windows to keep an eye on. */
export default function EventsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Terminüberwachung · Event watch"
        title="Event watch"
        description="Recurring windows worth watching — portal openings, intake cycles, scholarship rounds, and visa-appointment lead times."
        fileRef={`${EVENT_WATCH.length} windows`}
      />

      <Alert variant="info">
        <AlertTriangle aria-hidden />
        <AlertDescription>
          These are <span className="font-medium">typical cadences</span>, not fixed dates. Intake
          deadlines, scholarship rounds, and processing times vary by university, program, year, and
          mission. Treat every window below as a planning bar and confirm the exact date against the
          linked source.
        </AlertDescription>
      </Alert>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {EVENT_WATCH.map((ev) => {
          const accent = CATEGORY_ACCENT[ev.category];
          return (
            <li
              key={ev.id}
              className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm"
            >
              <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", accent.bar)} />
              <div className="pl-3">
                <p className={cn("eyebrow !tracking-[0.12em]", accent.text)}>
                  {CATEGORY_LABELS[ev.category]}
                </p>
                <h3 className="mt-1 font-semibold leading-snug">{ev.title}</h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm">
                  <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="official-figure font-medium">{ev.timing}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{ev.note}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700">
                  <AlertTriangle className="h-3 w-3" aria-hidden /> timing varies — verify
                </p>
                {ev.source && (
                  <div className="mt-2">
                    <SourceLink source={ev.source} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
