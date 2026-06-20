import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPLICATION_DOCS, ARRIVAL_TASKS, VISA_DOCS } from "@/lib/seed/checklists";
import { useProfile } from "@/lib/profile/useProfile";
import { documentsStillNeeded } from "@/lib/intake/derive";

/** Document gathering — interactive checklists for the application, visa, and arrival phases. */
export default function DocumentsHubPage() {
  const { profile } = useProfile();
  const { have, needed } = documentsStillNeeded(profile);
  const showPersonal = have.length > 0 || (profile.documentsOnHand ?? []).length > 0;

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

      {/* Auto-derived from your intake "documents you have" (data-engine work order §2.G). */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Your personalised checklist</h2>
        {showPersonal ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-1 text-amber-700">Still needed ({needed.length})</p>
              <ul className="space-y-1 text-sm">
                {needed.map((d) => (
                  <li key={d.key} className="flex items-center gap-2"><CircleDashed className="h-3.5 w-3.5 text-amber-600" aria-hidden /> {d.label}</li>
                ))}
                {needed.length === 0 && <li className="text-emerald-700">Everything on the core list is in hand — verify each programme's own requirements.</li>}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-1 text-emerald-700">You already have ({have.length})</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {have.map((d) => (
                  <li key={d.key} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> {d.label}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Tick the documents you already hold in{" "}
            <Link to="/settings" className="font-medium text-primary underline">Settings</Link> and we'll
            list exactly what you still need (APS is added only for APS countries).
          </p>
        )}
      </section>

      <Tabs defaultValue="application">
        <TabsList>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="visa">Visa</TabsTrigger>
          <TabsTrigger value="arrival">Arrival</TabsTrigger>
        </TabsList>

        <TabsContent value="application">
          <Checklist items={APPLICATION_DOCS} title="Application documents" storageKey="app-docs" />
          <p className="mt-3 text-xs text-muted-foreground">
            Required vs. optional varies by program — always cross-check each university's own list.
          </p>
        </TabsContent>

        <TabsContent value="visa">
          <Checklist items={VISA_DOCS} title="Student-visa documents" storageKey="visa-docs" />
          <p className="mt-3 text-xs text-muted-foreground">
            The exact list is mission-specific. Confirm requirements with your German embassy or
            consulate before your appointment.
          </p>
        </TabsContent>

        <TabsContent value="arrival">
          <Checklist items={ARRIVAL_TASKS} title="After you arrive" storageKey="arrival" />
          <p className="mt-3 text-xs text-muted-foreground">
            Do these in roughly this order — Anmeldung within 14 days unlocks most of the rest.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
