import { Train, Ticket } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEUTSCHLANDTICKET_PRICE } from "@/lib/facts";
import { source } from "@/lib/sources";

/** Deutschlandticket vs. Deutschland-Semesterticket — what each covers and which is worth it. */
export default function CampusDeutschlandticket() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 29 · Campus"
        title="Deutschlandticket guide"
        description="Use Germany's nationwide public-transport ticket and the discounted student semester ticket."
        category="campus"
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        The <strong>Deutschlandticket</strong> is a single monthly subscription that covers all
        regional and local public transport (buses, trams, U-Bahn, S-Bahn, and regional trains —
        RB/RE) across the whole of Germany. It does <em>not</em> cover long-distance trains (ICE, IC,
        EC) or FlixBus. Most students, though, get a cheaper variant through their university.
      </p>

      <section aria-labelledby="dt-price" className="space-y-3">
        <h2 id="dt-price" className="eyebrow">
          Key figure · Eckdaten
        </h2>
        <OfficialFactRow fact={DEUTSCHLANDTICKET_PRICE} />
      </section>

      <section aria-labelledby="dt-compare" className="space-y-3">
        <h2 id="dt-compare" className="eyebrow">
          Two tickets · Vergleich
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Train className="h-4 w-4 text-category-campus" aria-hidden />
                Deutschlandticket (standalone)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                A nationwide monthly subscription anyone can buy. Cancellable monthly. Valid on all
                regional and local transit, everywhere in Germany.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Buy it directly if your university has no semester ticket.</li>
                <li>Best if you travel between cities often or live outside your study region.</li>
                <li>Paid separately, on top of any university fees.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-4 w-4 text-category-campus" aria-hidden />
                Deutschland-Semesterticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Many universities now offer a discounted, Deutschland-wide semester ticket as part of
                — or as an add-on to — the <strong>Semesterbeitrag</strong> you pay at enrolment.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Bundled into student fees, so the monthly cost is usually well below the standalone price.</li>
                <li>Tied to your enrolment; it lapses if you don&apos;t re-register each semester.</li>
                <li>Coverage and price differ by university — confirm with your Studierendenwerk / AStA.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Alert variant="info">
        <Ticket aria-hidden />
        <AlertDescription>
          <span className="font-medium">Is the standalone ticket worth it?</span> If your university
          already includes a Deutschland-Semesterticket in the Semesterbeitrag, you almost never need
          to buy the standalone Deutschlandticket on top — you&apos;d be paying twice for overlapping
          coverage. Check what your semester contribution covers first; only buy the standalone ticket
          if your university offers no semester ticket, or if you need transit before you&apos;re
          enrolled.
        </AlertDescription>
      </Alert>

      <SourceList sources={[source("deutschlandticketPrice"), source("semesterticket")]} />
    </div>
  );
}
