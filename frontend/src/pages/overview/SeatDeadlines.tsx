import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CalendarX, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { offerLabel, openConditions } from "@/lib/offers/offerDeadlines";
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

/** Sub-label for an offer: its status + any open conditions, so a "looks fine" row can't hide a snag. */
function subLabel(o: Offer): string {
  const bits = [o.university, o.city].filter(Boolean);
  if (o.status === "accepted") bits.push("accepted");
  else if (o.status === "declined") bits.push("declined");
  const unmet = o.conditional ? openConditions(o) : 0;
  if (unmet > 0) bits.push(`${unmet} condition${unmet === 1 ? "" : "s"} open`);
  else if (o.conditional) bits.push("conditional");
  return bits.join(" · ");
}

/** G28 — Seat-acceptance deadline tracker (reads the shared offer store). */
export default function SeatDeadlinesPage() {
  const [rawOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);

  // An accept-by date forfeits a place if missed — so a DECLINED offer no longer needs chasing, but a
  // RECEIVED/ACCEPTED offer without a date is exactly the dangerous "calm screen" case (G5-02): surface it.
  const live = useMemo(() => offers.filter((o) => o.status !== "declined"), [offers]);
  const dated = useMemo(
    () => sortByDate(live.filter((o) => o.acceptBy).map((o) => ({ ...o, date: o.acceptBy }))),
    [live],
  );
  const undated = useMemo(() => live.filter((o) => !o.acceptBy), [live]);

  const nothingLogged = offers.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G28 · Offers"
        title="Seat-acceptance deadline tracker"
        description="Accepting a seat (and paying any enrolment fee) has its own hard deadline — separate from, and often much sooner than, the application. Miss it and the place is gone."
      />

      {nothingLogged ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No offers logged yet. Add your offers and their deadlines on the{" "}
            <Link to="/offers/compare" className="font-medium underline">offer comparison board</Link>.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {dated.length > 0 && (
            <ul className="space-y-3">
              {dated.map((o) => {
                const sev = severityFor(o.acceptBy);
                return (
                  <li key={o.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4", SEV_CLS[sev])}>
                    <div className="min-w-0">
                      <p className="font-semibold">{offerLabel(o)}</p>
                      <p className="text-sm text-muted-foreground">{subLabel(o)}</p>
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

          {/* G5-02 — never silently drop a dateless offer: show it as "needs a date", not a calm blank. */}
          {undated.length > 0 && (
            <section className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <CalendarX className="h-4 w-4" aria-hidden /> Offers still missing an accept-by date
              </h2>
              <p className="text-xs text-amber-800">
                These are admits you've logged with no deadline filled in. A missing date is the easiest way to
                forfeit a place — add the accept-by date on the comparison board.
              </p>
              <ul className="space-y-2">
                {undated.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium">{offerLabel(o)}</span>
                      <span className="text-muted-foreground"> · {subLabel(o)}</span>
                    </span>
                    <Link to="/offers/compare" className="text-xs font-medium text-primary underline">Add a date</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dated.length === 0 && undated.length === 0 && (
            <Alert variant="info" className="text-sm">
              <Info aria-hidden />
              <AlertDescription>
                Every offer you logged is declined — nothing left to accept. Re-open one on the{" "}
                <Link to="/offers/compare" className="font-medium underline">comparison board</Link> if that's not right.
              </AlertDescription>
            </Alert>
          )}
        </>
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
