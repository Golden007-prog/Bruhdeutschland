import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ONBOARDING_TASKS } from "@/lib/seed/arrival";
import { SourceList } from "@/components/common/SourceLink";
import { source } from "@/lib/sources";

/** G41 — First-weeks university onboarding checklist. */
export default function ArrivalUniversityOnboarding() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G41 · Arrival"
        title="First-weeks university onboarding"
        description="The campus admin that turns enrolment into actually being a student: your number, ID, accounts, and — crucially — registering for courses and exams on time."
        category="campus"
      />

      <Checklist items={ONBOARDING_TASKS} title="Your first-weeks checklist" storageKey="arrival-onboarding" />

      <Alert variant="warning" className="text-sm">
        <CalendarClock aria-hidden />
        <AlertDescription>
          <strong>Exam registration is separate from course registration</strong> and often closes weeks
          before the exam. And every semester you must re-register (<strong>Rückmeldung</strong>) by paying
          the semester contribution — miss it and you can be de-registered (exmatrikuliert).
        </AlertDescription>
      </Alert>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Your university email is the official channel — staff will assume you read it. Forward it to your
          phone so you don't miss deadlines or room changes.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/arrival/renewals" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Set Rückmeldung reminders <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/campus/culture" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          German academic culture <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/campus/deutschlandticket" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Semesterticket & transit <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("enrolment"), source("studentenwerk")]} />
    </div>
  );
}
