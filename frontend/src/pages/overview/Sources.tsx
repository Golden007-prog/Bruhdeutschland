import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SOURCES, type SourceKey } from "@/lib/sources";

/** Grouped view of the citation registry — every official source the copilot cites. */
const GROUPS: { label: string; blurb: string; keys: SourceKey[] }[] = [
  {
    label: "Application & admissions",
    blurb: "Pathways, requirements, uni-assist, and the VPD.",
    keys: [
      "daad",
      "daadProcess",
      "daadRequirements",
      "studyInGermany",
      "uniAssist",
      "uniAssistVpd",
      "uniAssistDeadlines",
      "ects",
    ],
  },
  {
    label: "Language & tests",
    blurb: "German and English certificates, plus graduate admission tests.",
    keys: ["goethe", "testdaf", "telc", "ielts", "toefl", "gre", "gmat"],
  },
  {
    label: "Finance & funding",
    blurb: "Blocked account, costs, insurance, side jobs, and scholarships.",
    keys: [
      "studyFinance",
      "daadCosts",
      "daadSideJobs",
      "tk",
      "krankenkassenZentrale",
      "daadScholarships",
      "deutschlandstipendium",
      "erasmus",
    ],
  },
  {
    label: "Visa & relocation",
    blurb: "The national visa, APS, blocked account, and address registration.",
    keys: [
      "autoVisa",
      "autoVisaFaq",
      "autoSperrkonto",
      "bamf",
      "makeItInGermany",
      "aps",
      "apsIndia",
      "bundesmeldegesetz",
    ],
  },
  {
    label: "Campus & logistics",
    blurb: "Student services, transit, and CV standards.",
    keys: ["studentenwerk", "deutschlandticket", "deutschlandticketPrice", "semesterticket", "europass"],
  },
];

/** Source registry — the grounding policy and every official source, grouped. */
export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quellen · Sources"
        title="Source registry"
        description="Every official source DeutschPrep cites. Specific figures are grounded against these or flagged for verification."
        fileRef={`${Object.keys(SOURCES).length} sources`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
            How grounding works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            DeutschPrep separates <span className="font-medium text-foreground">grounded</span> facts
            from <span className="font-medium text-foreground">unverified</span> ones, and never
            invents an official German figure. A value is shown as{" "}
            <span className="font-medium text-emerald-700">grounded</span> only when it is stable and
            backed by one of the sources below (for example: ECTS per year, the German grade scale, or
            the 14-day Anmeldung window).
          </p>
          <p>
            Anything that changes yearly, by federal state, or by program — fees, blocked-account
            amounts, deadlines, and language thresholds — is rendered{" "}
            <span className="font-medium text-amber-700">needs verification</span> with a link to the
            source where you can confirm the current value before acting on it.
          </p>
          <p>
            <Link
              to="/about"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Read the full methodology <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <Card key={group.label}>
            <CardHeader>
              <CardTitle className="text-base">{group.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{group.blurb}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.keys.map((key) => (
                  <li key={key}>
                    <SourceLink source={SOURCES[key]} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
