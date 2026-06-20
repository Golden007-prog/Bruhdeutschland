import { Link } from "react-router-dom";
import { ArrowRight, Info, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FAMILY_DOCS } from "@/lib/seed/arrival";
import { useProfile } from "@/lib/profile/useProfile";
import { source } from "@/lib/sources";

const QUALIFY = [
  "Your spouse / registered partner, and minor (under-18) children, are the usual eligible family members.",
  "You generally need to show adequate housing for the larger household and enough income/means to support them without state help.",
  "A spouse may need basic German (A1) before joining — exemptions exist (e.g. for certain qualifications); verify for your case.",
  "Family members get a residence permit tied to yours; a spouse can usually work without restriction.",
];

/** G45 — Family reunion (Familiennachzug) guide. Personalised by the profile's dependents field. */
export default function ArrivalFamilyReunion() {
  const { profile } = useProfile();
  const hasDependents = profile.dependents === "spouse" || profile.dependents === "spouse_children";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G45 · Ongoing"
        title="Bringing your family (Familiennachzug)"
        description="If a spouse or children join you in Germany, the family-reunion route has its own visa, income and housing expectations, and documents. Here's how to plan it."
        category="visa"
      />

      <Disclaimer />

      {hasDependents ? (
        <Alert variant="info" className="text-sm">
          <Users aria-hidden />
          <AlertDescription>
            Your profile lists <strong>{profile.dependents === "spouse_children" ? "a spouse and children" : "a spouse"}</strong> —
            this route applies to you. Factor their costs into your budget and start the housing/income proof early.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Planning to bring family later? Set your dependents in{" "}
            <Link to="/settings" className="font-medium underline">Settings</Link> and the budget and finance
            tools will account for them.
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Who qualifies & what's expected</h2>
        <ul className="mt-2 space-y-2">
          {QUALIFY.map((q) => (
            <li key={q} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>

      <Checklist items={FAMILY_DOCS} title="Family-reunion documents" storageKey="arrival-family" />

      <section className="flex flex-wrap gap-2">
        <Link to="/start/budget" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Re-check your budget <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/visa/accommodation" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find larger housing <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("familyReunion"), source("makeItInGermany"), source("bamf")]} />
    </div>
  );
}
