import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Home, Mic, ShieldCheck, Stamp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactList } from "@/components/common/OfficialFact";
import { StepList } from "@/components/common/StepList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VISA_FACTS } from "@/lib/facts";
import { VISA_JOURNEY_STEPS } from "@/lib/seed/visa";

interface ToolLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: ToolLink[] = [
  {
    href: "/visa/aps",
    title: "APS certificate guide",
    description: "Check whether you need the Akademische Prüfstelle certificate and how to obtain it.",
    icon: Stamp,
  },
  {
    href: "/visa/simulator",
    title: "Visa interview simulator",
    description: "Rehearse common interview questions with spoken practice and answer tips.",
    icon: Mic,
  },
  {
    href: "/visa/checklist",
    title: "Visa document checklist",
    description: "Track the documents a national student-visa application needs.",
    icon: ClipboardList,
  },
  {
    href: "/visa/accommodation",
    title: "Accommodation finder",
    description: "Compare housing channels and learn to spot rental scams.",
    icon: Home,
  },
  {
    href: "/visa/anmeldung",
    title: "Anmeldung walkthrough",
    description: "Register your address at the Bürgeramt — the step that unlocks everything else.",
    icon: ShieldCheck,
  },
];

/** Visa & Relocation — overview of the offer-letter → visa → arrival → Anmeldung journey. */
export default function VisaOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich E · Visa & Relocation"
        title="Visa & Relocation"
        description="Get from offer letter to Anmeldung: APS, the student visa, accommodation, and registering your address."
        category="visa"
        fileRef="§ E"
      />

      <Disclaimer />

      <section aria-labelledby="visa-facts-heading">
        <h2 id="visa-facts-heading" className="eyebrow mb-3">
          Key official facts
        </h2>
        <OfficialFactList facts={VISA_FACTS} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>The relocation journey</CardTitle>
          <CardDescription>
            A dependency-ordered path from your admission letter to your registered address in Germany.
            Appointment and processing times vary by German mission — always confirm them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StepList steps={VISA_JOURNEY_STEPS} />
        </CardContent>
      </Card>

      <section aria-labelledby="visa-tools-heading">
        <h2 id="visa-tools-heading" className="eyebrow mb-3">
          Tools in this section
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                to={tool.href}
                className="group relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-category-visa" />
                <div className="flex items-start gap-3 pl-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-card text-category-visa">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1 font-medium leading-snug">
                      {tool.title}
                      <ArrowRight
                        className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
