import { Plane, Home } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ARRIVAL_TASKS, PRE_DEPARTURE } from "@/lib/seed/checklists";

/**
 * Pre-departure checklist — two phases as tabs: what to pack/arrange before the flight, and the
 * tasks that begin the moment you land. Check state is in-component only (no storage).
 */
export default function CampusPreDeparture() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 27 · Campus"
        title="Pre-departure checklist"
        description="Everything to arrange and pack before you fly — documents, money, tech, and first-week essentials."
        category="campus"
      />

      <Alert variant="info">
        <Plane aria-hidden />
        <AlertDescription>
          Pack the &ldquo;Before you fly&rdquo; list in your carry-on, not checked luggage — your
          passport, admission letter, blocked-account confirmation, and certificates are irreplaceable
          and may be checked on arrival. The &ldquo;First weeks&rdquo; tasks are time-sensitive:
          address registration (Anmeldung) is due within 14 days, and enrolment plus health insurance
          gate almost everything else.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="pack">
        <TabsList>
          <TabsTrigger value="pack">Before you fly</TabsTrigger>
          <TabsTrigger value="arrive">First weeks</TabsTrigger>
        </TabsList>

        <TabsContent value="pack" className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Start this two to three weeks out. The required items are non-negotiable for entry and
            enrolment; the optional ones simply make the first days easier.
          </p>
          <Checklist items={PRE_DEPARTURE} title="Pre-departure" />
        </TabsContent>

        <TabsContent value="arrive" className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Work through these in roughly this order — Anmeldung and a bank account unlock the
            residence permit, enrolment, and your transit ticket.
          </p>
          <Checklist items={ARRIVAL_TASKS} title="After arrival" />
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Home className="h-3.5 w-3.5" aria-hidden />
            Tip: book a temporary address for your first nights so you can register early.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
