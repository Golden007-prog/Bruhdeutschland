import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DeadlineList } from "@/components/common/DeadlineList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { alertable } from "@/lib/calc/deadlines";
import { SEED_EVENTS } from "@/lib/seed/events";

/** Deadlines & alerts — urgency computed deterministically; volatile official dates flagged. */
export default function DeadlinesPage() {
  const needsAttention = alertable(SEED_EVENTS);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fristen · Deadlines"
        title="Deadlines & alerts"
        description="Every date that matters, soonest first, with urgency computed deterministically. Official dates that change yearly are flagged for verification."
        fileRef={`${SEED_EVENTS.length} dates`}
      />

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Official dates change every year</AlertTitle>
        <AlertDescription>
          Application deadlines, scholarship rounds, and visa appointment windows are set per
          university, program, and mission — and most shift annually. Dates flagged{" "}
          <span className="font-medium">date varies — verify</span> are illustrative; always confirm
          the current date against the linked official source before you plan around it.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            Needs attention now
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needsAttention.length > 0 ? (
            <DeadlineList events={needsAttention} />
          ) : (
            <p className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Nothing urgent right now — the soonest dates are still more than four weeks away.
            </p>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="all-deadlines-heading" className="space-y-3">
        <div>
          <p className="eyebrow">Alle Fristen · All deadlines</p>
          <h2 id="all-deadlines-heading" className="mt-1 text-lg font-semibold tracking-tight">
            Full schedule
          </h2>
        </div>
        <DeadlineList events={SEED_EVENTS} />
      </section>
    </div>
  );
}
