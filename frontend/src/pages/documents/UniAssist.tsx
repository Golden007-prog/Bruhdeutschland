import { Building2, Send } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { StepList } from "@/components/common/StepList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { source } from "@/lib/sources";
import type { OfficialFact } from "@/lib/types";
import { UNI_ASSIST_STEPS } from "@/lib/seed/documents";

/** Volatile uni-assist figures — never hard-state them; flag + cite. (CLAUDE.md §2) */
const UNI_ASSIST_FEE: OfficialFact = {
  label: "uni-assist handling fee",
  value: "Set per application / semester — verify",
  source: source("uniAssist"),
  needsVerification: true,
  note: "uni-assist charges a fee that depends on how many programs you apply to and changes over time. Confirm the current fee before you pay.",
};

const UNI_ASSIST_PROCESSING: OfficialFact = {
  label: "uni-assist processing time",
  value: "~4–6 weeks",
  source: source("uniAssistDeadlines"),
  needsVerification: true,
  note: "Typical turnaround once your documents are complete; longer near deadlines. Submit early so the result reaches the university before its deadline.",
};

/** Uni-Assist walkthrough (Feature 09). */
export default function DocumentsUniAssist() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 09 · Documents"
        title="Uni-Assist walkthrough"
        description="Step through the uni-assist application: account, programs, documents, fees, and what happens after you submit."
        category="documents"
      />

      <Alert variant="info">
        <Building2 aria-hidden />
        <AlertTitle>uni-assist vs. applying directly</AlertTitle>
        <AlertDescription>
          uni-assist is a service that pre-checks international applications for many German
          universities. Whether you use it is a <span className="font-medium">per-university</span>{" "}
          choice: some universities require it, others want a direct application, and some only need
          a <span className="font-medium">VPD</span> from uni-assist that you then send to them
          yourself. Always check each program's page before you start — applying through the wrong
          channel wastes weeks.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-category-documents" aria-hidden />
            The uni-assist application, step by step
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepList steps={UNI_ASSIST_STEPS} />
        </CardContent>
      </Card>

      <section aria-labelledby="ua-facts" className="space-y-3">
        <h2 id="ua-facts" className="eyebrow">
          Fees &amp; processing — verify before you rely on these
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <OfficialFactRow fact={UNI_ASSIST_FEE} />
          <OfficialFactRow fact={UNI_ASSIST_PROCESSING} />
        </div>
      </section>

      <SourceList sources={[source("uniAssist"), source("uniAssistDeadlines"), source("daadProcess")]} />
    </div>
  );
}
