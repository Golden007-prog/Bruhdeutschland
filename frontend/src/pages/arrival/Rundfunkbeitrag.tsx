import { Info, Radio, Users, FileWarning } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RUNDFUNK_FEE } from "@/lib/seed/arrival";
import type { ChecklistItemDef, Source } from "@/lib/types";
import { source } from "@/lib/sources";

/** Official student-facing exemption page on rundfunkbeitrag.de (grounded landing). */
const SOURCE_RUNDFUNK_STUDENTS: Source = {
  name: "Rundfunkbeitrag — information for students (Befreiung / Ermäßigung)",
  url: "https://www.rundfunkbeitrag.de/buergerinnen_und_buerger/informationen/informationen_fuer_studierende/index_ger.html",
};

/** How to apply for an exemption (Befreiung). Process guidance; the eligibility detail is flagged. */
const EXEMPTION_STEPS = [
  "Check eligibility: the main route is receiving certain state benefits — for students, German BAföG while living away from your parents. Most international students who don't get German benefits won't qualify.",
  "Apply in writing to the Beitragsservice with proof — your current, valid BAföG decision (Bescheid). Re-apply each time your BAföG is renewed; the exemption only lasts as long as the benefit.",
  "If you're just over the threshold, a hardship application (Härtefall) may apply when your income exceeds the benefit limit by less than one monthly fee.",
  "Exemptions can be granted retroactively for a limited period — apply promptly rather than ignoring letters.",
];

/** What to do about the two things that blindside arrivals: WG double-billing and a back-dated demand. */
const DISPUTES = [
  {
    icon: Users,
    title: "Double-billed in a shared flat (WG)",
    detail:
      "The fee is per dwelling, not per person — one flat pays one fee. If a second flatmate is also being billed for the same flat, the extra registration must be cancelled: the already-paying flatmate gives their Beitragsnummer so the office links you to the existing account instead of opening a new one.",
  },
  {
    icon: FileWarning,
    title: "A back-dated demand or enforcement notice (Festsetzungsbescheid)",
    detail:
      "If you ignored the letters, the office can formally assess unpaid fees back to when you registered your address. Don't ignore it: respond in writing — register/clarify your dwelling, apply for any exemption (which can be backdated), or object (Widerspruch) within the deadline stated on the notice. A formal demand has its own appeal window — read it.",
  },
];

const UTILITIES: ChecklistItemDef[] = [
  { id: "rundfunk", label: "Register for the Rundfunkbeitrag", hint: "One fee per dwelling; register at rundfunkbeitrag.de after your Anmeldung." },
  { id: "liability", label: "Private liability insurance (Haftpflichtversicherung)", hint: "Not mandatory but near-universal in Germany — very cheap, covers accidental damage." },
  { id: "electricity", label: "Electricity contract (Strom)", hint: "If not included in rent — you usually choose a provider yourself.", optional: true },
  { id: "internet", label: "Home internet / mobile (Handyvertrag)", optional: true },
  { id: "household", label: "Household / contents insurance", optional: true },
];

/** G43 — Rundfunkbeitrag & utilities setup. */
export default function ArrivalRundfunkbeitrag() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G43 · Arrival"
        title="Rundfunkbeitrag & utilities setup"
        description="The bills that blindside new arrivals — starting with the mandatory broadcasting fee charged to every household, plus the utilities and insurance everyone sets up in the first month."
        category="finance"
      />

      <Alert variant="warning" className="text-sm">
        <Radio aria-hidden />
        <AlertDescription>
          The <strong>Rundfunkbeitrag is mandatory and per dwelling</strong>, not per person or per TV — you
          owe it even without a television. You'll get a letter after registering your address; flatmates
          share a single fee, so coordinate who registers.
        </AlertDescription>
      </Alert>

      <OfficialFactRow fact={RUNDFUNK_FEE} />

      <Checklist items={UTILITIES} title="Set-up checklist" storageKey="arrival-utilities" />

      {/* ── G8-03: exemption how-to ───────────────────────────────────────────── */}
      <section aria-labelledby="exemption-heading" className="space-y-3">
        <h2 id="exemption-heading" className="text-lg font-semibold tracking-tight">
          Applying for an exemption (Befreiung)
        </h2>
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Most international students <strong>don't qualify</strong> — the main student route is German
            BAföG. But if you do, here's how to actually apply, and you can be exempted retroactively.{" "}
            <SourceLink source={SOURCE_RUNDFUNK_STUDENTS} />
          </AlertDescription>
        </Alert>
        <ol className="space-y-2">
          {EXEMPTION_STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── G8-03: disputes — WG double-billing & back-dated demand ────────────── */}
      <section aria-labelledby="dispute-heading" className="space-y-3">
        <h2 id="dispute-heading" className="text-lg font-semibold tracking-tight">
          Disputes that blindside arrivals
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DISPUTES.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-category-finance" aria-hidden /> {d.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{d.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <SourceList sources={[source("rundfunkbeitrag"), SOURCE_RUNDFUNK_STUDENTS, source("makeItInGermany")]} />
    </div>
  );
}
