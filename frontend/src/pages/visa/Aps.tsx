import { AlertTriangle, BadgeCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { StepList } from "@/components/common/StepList";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APS_INDIA, APS_REQUIRED_COUNTRIES } from "@/lib/facts";
import { APS_STEPS } from "@/lib/seed/visa";
import { source } from "@/lib/sources";

/** APS guide — what the Akademische Prüfstelle is, who needs it, and the process to obtain it. */
export default function VisaAps() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 24 · Visa"
        title="APS certificate guide"
        description="Understand the Akademische Prüfstelle check required for students from some countries, and how to get it."
        category="visa"
        fileRef="§ 24"
      />

      <Disclaimer />

      <OfficialFactRow fact={APS_INDIA} />

      <Card>
        <CardHeader>
          <CardTitle>What is the APS?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The <strong className="text-foreground">Akademische Prüfstelle (APS)</strong> is an
            office of the German embassy that verifies your academic documents and confirms they
            meet the requirements for university study in Germany. Once verified, it issues an{" "}
            <strong className="text-foreground">APS certificate</strong>.
          </p>
          <p>
            For applicants from the affected countries, this certificate is mandatory: it{" "}
            <strong className="text-foreground">gates both the university application and the
            student visa</strong>. Universities will not process your application, and the mission
            will not process your visa, without it — so start it early.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Which countries need an APS certificate?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {APS_REQUIRED_COUNTRIES.map((country) => (
                <Badge key={country} variant="warning" className="gap-1">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {country}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              If you studied in {APS_REQUIRED_COUNTRIES.join(", ")}, you must obtain the APS
              certificate before applying. Each country has its own APS office with its own portal,
              fee, and processing time — follow your country office's checklist exactly.
            </p>
          </CardContent>
        </Card>

        {/* Granted-status indicator — the dossier "seal" moment. Decorative here; unverified style. */}
        <div
          role="img"
          aria-label="APS certificate — the seal that unlocks your application and visa"
          className="stamp-seal stamp-seal--unverified mx-auto flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full text-center"
        >
          <BadgeCheck className="h-6 w-6" aria-hidden />
          <span className="eyebrow mt-1 !text-[0.5rem] !tracking-[0.1em] opacity-80">APS</span>
          <span className="official-figure text-[0.65rem] font-semibold leading-tight">
            certificate
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The APS process</CardTitle>
        </CardHeader>
        <CardContent>
          <StepList steps={APS_STEPS} />
        </CardContent>
      </Card>

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Start early — the APS gates everything that follows</AlertTitle>
        <AlertDescription className="text-amber-900">
          Without the APS certificate you cannot apply to universities or for the visa. Processing
          times and fees are set per country office and are not nationally published — confirm the
          current details with your country's APS office before you plan your timeline.
        </AlertDescription>
      </Alert>

      <SourceList sources={[source("aps"), source("apsIndia")]} />
    </div>
  );
}
