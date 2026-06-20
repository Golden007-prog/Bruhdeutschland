import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { formatDate, relativeLabel, severityFor, sortByDate } from "@/lib/calc/deadlines";
import type { DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const SEV_CLS: Record<DeadlineSeverity, string> = {
  overdue: "border-red-300 bg-red-50/50",
  urgent: "border-amber-300 bg-amber-50/50",
  soon: "border-sky-200 bg-sky-50/50",
  info: "border-emerald-200 bg-emerald-50/50",
};
const SEV_LABEL: Record<DeadlineSeverity, string> = { overdue: "Overdue", urgent: "Urgent", soon: "Soon", info: "Upcoming" };

/** G28 — Seat-acceptance deadline tracker (reads the shared offer store). */
export default function SeatDeadlinesPage() {
  const [offers] = useSyncedState<Offer[]>(OFFERS_KEY, []);

  const dated = useMemo(
    () => sortByDate(offers.filter((o) => o.acceptBy).map((o) => ({ ...o, date: o.acceptBy }))),
    [offers],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G28 · Offers"
        title="Seat-acceptance deadline tracker"
        description="Accepting a seat (and paying any enrolment fee) has its own hard deadline — separate from, and often much sooner than, the application. Miss it and the place is gone."
      />

      {dated.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No accept-by dates yet. Add your offers and their deadlines on the{" "}
            <Link to="/offers/compare" className="font-medium underline">offer comparison board</Link>.
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-3">
          {dated.map((o) => {
            const sev = severityFor(o.acceptBy);
            return (
              <li key={o.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4", SEV_CLS[sev])}>
                <div className="min-w-0">
                  <p className="font-semibold">{o.programme || "Untitled offer"}</p>
                  <p className="text-sm text-muted-foreground">{[o.university, o.city].filter(Boolean).join(", ")}{o.conditional ? " · conditional" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="official-figure inline-flex items-center gap-1 text-sm font-semibold">
                    <CalendarClock className="h-4 w-4" aria-hidden /> {formatDate(o.acceptBy)}
                  </p>
                  <p className="text-xs font-medium">{SEV_LABEL[sev]} · {relativeLabel(o.acceptBy)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="flex flex-wrap gap-2">
        <Link to="/offers/compare" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Edit offers <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          All deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
