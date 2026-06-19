import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { APPLICATION_DOCS, ARRIVAL_TASKS, VISA_DOCS } from "@/lib/seed/checklists";

/** Document gathering — interactive checklists for the application, visa, and arrival phases. */
export default function DocumentsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Unterlagen · Documents"
        title="Document gathering"
        description="Master checklists for the whole journey: application, APS, visa, and enrolment paperwork — with where to obtain each."
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Why certified copies and translations matter</AlertTitle>
        <AlertDescription>
          German universities and missions accept <span className="font-medium">officially certified
          copies</span> (beglaubigte Kopien), not plain photocopies, and any document not already in
          German or English usually needs a <span className="font-medium">certified translation</span>{" "}
          from a sworn translator. Certification and translation each take time and money — start
          early, and order a couple of extra certified sets, because several offices keep the
          originals or want their own copy.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="application">
        <TabsList>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="visa">Visa</TabsTrigger>
          <TabsTrigger value="arrival">Arrival</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <Checklist items={APPLICATION_DOCS} title="Application documents" />
          <p className="mt-3 text-xs text-muted-foreground">
            Required vs. optional varies by program — always cross-check each university's own list.
          </p>
        </TabsContent>

        <TabsContent value="visa">
          <Checklist items={VISA_DOCS} title="Student-visa documents" />
          <p className="mt-3 text-xs text-muted-foreground">
            The exact list is mission-specific. Confirm requirements with your German embassy or
            consulate before your appointment.
          </p>
        </TabsContent>

        <TabsContent value="arrival">
          <Checklist items={ARRIVAL_TASKS} title="After you arrive" />
          <p className="mt-3 text-xs text-muted-foreground">
            Do these in roughly this order — Anmeldung within 14 days unlocks most of the rest.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
