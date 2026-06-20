import { Link } from "react-router-dom";
import { ArrowRight, BellRing, RefreshCw, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** G46 + G47 — recurring renewals: residence-permit renewal and the semester Rückmeldung. */
export default function ArrivalRenewals() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G46 · G47 · Ongoing"
        title="Permit renewals & semester re-registration"
        description="Two recurring deadlines quietly end people's studies or residence: the residence-permit renewal, and the semester Rückmeldung. Set both here and they'll show in your countdowns."
        category="campus"
      />

      <Disclaimer />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          Miss the <strong>Rückmeldung</strong> and you can be de-registered (exmatrikuliert); let your{" "}
          <strong>residence permit</strong> lapse and you're out of status. Both are avoidable with a reminder.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-category-visa" aria-hidden /> Residence-permit renewal
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Apply 4–8 weeks before expiry at the Ausländerbehörde. Re-use your document folder; bring
              up-to-date enrolment and financial proof.
            </p>
          </CardHeader>
          <CardContent>
            <DeadlineReminder storageKey="permit-renewal" label="My residence permit expires on" hint="We'll start nudging you well before this." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="h-4 w-4 text-category-campus" aria-hidden /> Semester re-registration (Rückmeldung)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pay the semester contribution within your university's Rückmeldung window each semester to stay
              enrolled. The date is on your university portal.
            </p>
          </CardHeader>
          <CardContent>
            <DeadlineReminder storageKey="rueckmeldung" label="Next Rückmeldung deadline" hint="Update it each semester from your university portal." />
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-wrap gap-2">
        <Link to="/deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          See all deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/residence-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Residence-permit guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Guidance only, not legal advice. Exact renewal windows and Rückmeldung dates are set by your
        Ausländerbehörde and university — confirm them there.
      </p>
    </div>
  );
}
