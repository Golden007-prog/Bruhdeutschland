import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VISA_FEE, VISA_PROCESSING } from "@/lib/facts";
import { VISA_DOCS } from "@/lib/seed/checklists";
import { source } from "@/lib/sources";

/** Student-visa document checklist with the official fee and processing-time facts. */
export default function VisaChecklist() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 23 · Visa"
        title="Visa checklist & deadlines"
        description="The documents a German national student-visa application needs, plus the fee and lead times to plan around."
        category="visa"
        fileRef="§ 23"
      />

      <Disclaimer />

      <div className="grid gap-3 sm:grid-cols-2">
        <OfficialFactRow fact={VISA_FEE} />
        <OfficialFactRow fact={VISA_PROCESSING} />
      </div>

      <Checklist items={VISA_DOCS} title="Student visa documents" storageKey="visa-docs" />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertDescription>
          <p className="font-medium">The exact document list is mission-specific.</p>
          <p className="mt-1 text-muted-foreground">
            Each German embassy and consulate publishes its own checklist and may require additional
            documents, certified copies, or translations. Confirm the current requirements for your
            mission before booking your appointment.
          </p>
          <p className="mt-2">
            <SourceLink source={source("autoVisaFaq")} />
          </p>
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link
          to="/visa/refusal"
          className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        >
          Refused? Your next steps <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
