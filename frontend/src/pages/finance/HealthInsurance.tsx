import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HEALTH_INSURANCE } from "@/lib/facts";
import { source } from "@/lib/sources";
import { INSURANCE_OPTIONS } from "@/lib/seed/finance";
import { useProfile } from "@/lib/profile/useProfile";
import { ageOn } from "@/lib/intake/derive";

type Tri = "yes" | "no";

interface Recommendation {
  primary: "statutory" | "private" | "depends";
  headline: string;
  detail: string;
}

/**
 * Rule-of-thumb recommendation from the facts pack. Most students under 30 are required to take
 * statutory student insurance (gesetzliche studentische Krankenversicherung). Over 30, or with a
 * social-security agreement that covers Germany, other paths can apply. This is guidance, not advice.
 */
function recommend(under30: boolean, hasAgreement: Tri): Recommendation {
  if (hasAgreement === "yes") {
    return {
      primary: "depends",
      headline: "Your home cover may exempt you — but verify",
      detail:
        "If your home country has a social-security agreement with Germany (e.g. EU/EHIC and certain bilateral agreements), your existing cover may be recognised, which can exempt you from statutory student insurance. You still must register the exemption with a German statutory insurer. Confirm whether your specific agreement covers studying in Germany.",
    };
  }
  if (under30) {
    return {
      primary: "statutory",
      headline: "Statutory student insurance (the standard route)",
      detail:
        "Students under 30 (roughly, up to the 14th subject semester) are generally required to take statutory student health insurance. The rate is set nationally and is the same across statutory insurers, so you choose on service rather than price.",
    };
  }
  return {
    primary: "private",
    headline: "Private / voluntary cover is the usual route over 30",
    detail:
      "Once you pass the student age/semester limit, the discounted statutory student tariff usually no longer applies. You typically move to voluntary statutory insurance (at a higher rate) or a private student plan. Compare carefully — terms and coverage differ a lot.",
  };
}

/** Feature 19 — Health-insurance selector. */
export default function FinanceHealthInsurance() {
  const { profile } = useProfile();
  // Default the under-30 toggle from the profile's date of birth when known — this is an irreversible
  // choice, so a 30+ career-switcher shouldn't silently get the under-30 default. Falls back to true
  // (the common student case) when no DOB is on file. The user can still flip it manually below.
  const profileAge = ageOn(profile.dateOfBirth, new Date().toISOString());
  const [under30, setUnder30] = useState(profileAge == null ? true : profileAge < 30);
  const [hasAgreement, setHasAgreement] = useState<Tri>("no");

  const rec = useMemo(() => recommend(under30, hasAgreement), [under30, hasAgreement]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 19 · Finance"
        title="Health-insurance selector"
        description="Health insurance is mandatory to enrol and for the visa. Answer two questions to see which route usually applies to you."
        category="finance"
        fileRef="§ 19"
      />

      <Disclaimer />

      <OfficialFactRow fact={HEALTH_INSURANCE} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your situation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Will you be under 30 (and within the student semester limit) when you enrol?
            </legend>
            <div className="flex flex-wrap gap-2">
              <ToggleChoice
                name="age"
                checked={under30}
                onChange={() => setUnder30(true)}
                label="Under 30"
              />
              <ToggleChoice
                name="age"
                checked={!under30}
                onChange={() => setUnder30(false)}
                label="30 or over"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Does your home country have a social-security agreement with Germany that covers your
              health insurance while studying?
            </legend>
            <div className="flex flex-wrap gap-2">
              <ToggleChoice
                name="agreement"
                checked={hasAgreement === "no"}
                onChange={() => setHasAgreement("no")}
                label="No / not sure"
              />
              <ToggleChoice
                name="agreement"
                checked={hasAgreement === "yes"}
                onChange={() => setHasAgreement("yes")}
                label="Yes"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This covers EU/EEA cover (EHIC) and certain bilateral agreements. If unsure, treat it as
              "No" and confirm with a German statutory insurer.
            </p>
          </fieldset>
        </CardContent>
      </Card>

      <Alert variant={rec.primary === "statutory" ? "success" : "info"}>
        {rec.primary === "statutory" ? <ShieldCheck aria-hidden /> : <AlertTriangle aria-hidden />}
        <AlertTitle>{rec.headline}</AlertTitle>
        <AlertDescription>{rec.detail}</AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Opting out of statutory insurance is usually irreversible</AlertTitle>
        <AlertDescription>
          If you choose private cover at the start of your studies, you generally cannot switch back to
          statutory student insurance for the rest of your studies in Germany. Weigh this carefully
          before exempting yourself — especially if your circumstances might change.
        </AlertDescription>
      </Alert>

      <section aria-labelledby="hi-options" className="space-y-3">
        <h2 id="hi-options" className="text-lg font-semibold tracking-tight">
          Insurers students commonly use
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Statutory student rates are identical across insurers, so people typically choose on
          service and English-language support. Listed neutrally — not an endorsement.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {INSURANCE_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div className="min-w-0">
                    <p className="font-medium">{opt.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{opt.summary}</p>
                  </div>
                  <Badge variant={opt.type === "statutory" ? "secondary" : "outline"} className="shrink-0">
                    {opt.type === "statutory" ? "Statutory" : "Private"}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-2">Source · Quelle</p>
        <SourceLink source={source("tk")} />
      </div>
    </div>
  );
}

/** A radio rendered as a selectable chip (accessible: a real labelled radio input). */
function ToggleChoice({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={
        "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors " +
        (checked
          ? "border-primary bg-primary/5 font-medium text-foreground"
          : "bg-card text-muted-foreground hover:bg-muted")
      }
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-primary"
      />
      {label}
    </label>
  );
}
