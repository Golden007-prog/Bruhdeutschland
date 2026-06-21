import { Building2, ClipboardCheck, Send } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { StepList } from "@/components/common/StepList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { formatDate, relativeLabel, severityFor } from "@/lib/calc/deadlines";
import { source } from "@/lib/sources";
import type { DeadlineSeverity, OfficialFact } from "@/lib/types";
import { UNI_ASSIST_STEPS } from "@/lib/seed/documents";

/** The structured submission record a real applicant needs to keep (G4-07) — purely the student's own data. */
interface UniAssistRecord {
  applicantNumber: string;
  submittedOn: string;
  feePaid: string;
  responseExpected: string;
  responseOn: string;
}

const EMPTY_RECORD: UniAssistRecord = { applicantNumber: "", submittedOn: "", feePaid: "", responseExpected: "", responseOn: "" };

const SEV_BADGE: Record<DeadlineSeverity, string> = {
  overdue: "bg-red-100 text-red-900",
  urgent: "bg-amber-100 text-amber-900",
  soon: "bg-sky-100 text-sky-900",
  info: "bg-emerald-100 text-emerald-900",
};

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

/** Uni-Assist walkthrough (Feature 09) + persisted submission record (G4-07). */
export default function DocumentsUniAssist() {
  const [rec, setRec] = useSyncedState<UniAssistRecord>("uni-assist:record", EMPTY_RECORD);
  const set = (k: keyof UniAssistRecord) => (e: React.ChangeEvent<HTMLInputElement>) => setRec((p) => ({ ...p, [k]: e.target.value }));
  const expectedSev = rec.responseExpected && !rec.responseOn ? severityFor(rec.responseExpected) : null;

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4 text-category-documents" aria-hidden />
            Your uni-assist submission record
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Keep the details once you've submitted — your applicant number, the date, and when you expect a
            result — so the process shows on your status board, not just in your email. Saved to your account.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="ua-num" className="eyebrow block">Applicant number (My-assist)</label>
            <Input id="ua-num" value={rec.applicantNumber} onChange={set("applicantNumber")} placeholder="e.g. 1234567" className="official-figure" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ua-sub" className="eyebrow block">Submitted on</label>
            <Input id="ua-sub" type="date" value={rec.submittedOn} onChange={set("submittedOn")} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ua-fee" className="eyebrow block">Fee paid (€)</label>
            <Input id="ua-fee" value={rec.feePaid} onChange={set("feePaid")} placeholder="e.g. 75" className="official-figure" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ua-exp" className="eyebrow block">Response expected by</label>
            <Input id="ua-exp" type="date" value={rec.responseExpected} onChange={set("responseExpected")} />
            {expectedSev && (
              <span className={`official-figure mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${SEV_BADGE[expectedSev]}`}>
                {formatDate(rec.responseExpected)} · {relativeLabel(rec.responseExpected)}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ua-resp" className="eyebrow block">Response received on</label>
            <Input id="ua-resp" type="date" value={rec.responseOn} onChange={set("responseOn")} />
          </div>
        </CardContent>
      </Card>

      <SourceList sources={[source("uniAssist"), source("uniAssistDeadlines"), source("daadProcess")]} />
    </div>
  );
}
