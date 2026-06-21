import { Link } from "react-router-dom";
import { ArrowRight, BellRing, LifeBuoy, RefreshCw, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { DeadlineReminder } from "@/components/common/DeadlineReminder";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RECOVERY_ROUTES, OUT_OF_STATUS_SOURCES } from "@/lib/seed/outOfStatus";

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

      <Alert variant="info" className="text-sm">
        <BellRing aria-hidden />
        <AlertDescription>
          Both dates above flow into your <Link to="/reminders" className="font-medium underline">reminders</Link>, where
          a one-click <strong>.ics export</strong> drops them into Google/Apple/Outlook so your own calendar does the
          nudging — not just this page.
        </AlertDescription>
      </Alert>

      {/* ── G9-03: recovery once a deadline has already been missed ───────────── */}
      <section aria-labelledby="recovery-heading" className="space-y-3">
        <div>
          <h2 id="recovery-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <LifeBuoy className="h-5 w-5 text-category-visa" aria-hidden /> Already missed one? Recovery, not just warnings
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            If the deadline has already passed — permit lapsed, exmatrikuliert, or a renewal refused —
            it is often still recoverable, but only if you act fast. Find your situation and the next
            step. Each route is case-specific; verify yours with the authority.
          </p>
        </div>

        <div className="space-y-4">
          {RECOVERY_ROUTES.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{r.situation}</CardTitle>
                  {r.needsVerification && (
                    <Badge variant="warning" className="gap-1">
                      <TriangleAlert className="h-3 w-3" aria-hidden /> Verify your case
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="space-y-2">
                  {r.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-3">
                  {r.href && (
                    <Link to={r.href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Open the related guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                  {r.source && <SourceLink source={r.source} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          See all deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/reminders" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Export to my calendar (.ics) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/residence-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Residence-permit guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={OUT_OF_STATUS_SOURCES} />

      <p className="text-xs text-muted-foreground">
        Guidance only, not legal advice. Exact renewal windows and Rückmeldung dates are set by your
        Ausländerbehörde and university — confirm them there.
      </p>
    </div>
  );
}
