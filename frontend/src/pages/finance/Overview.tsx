import { Link } from "react-router-dom";
import { ArrowRight, Award, Briefcase, Coins, HeartPulse, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactList } from "@/components/common/OfficialFact";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FINANCE_FACTS } from "@/lib/facts";

interface Tool {
  to: string;
  title: string;
  feature: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: Tool[] = [
  {
    to: "/finance/sperrkonto",
    title: "Blocked account (Sperrkonto)",
    feature: "Feature 17",
    description:
      "How the blocked account works, the amount you must prove for the visa, and the alternatives to it.",
    icon: Landmark,
  },
  {
    to: "/finance/cost-of-living",
    title: "Cost-of-living calculator",
    feature: "Feature 18",
    description:
      "Estimate a monthly budget by city with a transparent, deterministic breakdown you can adjust.",
    icon: Coins,
  },
  {
    to: "/finance/health-insurance",
    title: "Health-insurance selector",
    feature: "Feature 19",
    description:
      "Work out whether statutory or private student insurance applies to you — required for enrolment.",
    icon: HeartPulse,
  },
  {
    to: "/finance/scholarships",
    title: "Scholarship finder",
    feature: "Feature 20",
    description:
      "Filter scholarships you may be eligible for: DAAD, Deutschlandstipendium, Erasmus+, and more.",
    icon: Award,
  },
  {
    to: "/finance/work",
    title: "HiWi & Werkstudent readiness",
    feature: "Feature 21",
    description:
      "The rules and norms for student jobs in Germany, including the legal working-hour limit.",
    icon: Briefcase,
  },
];

/** Finance & Logistics — landing page. Links to the five finance tools and the grounded key facts. */
export default function FinanceOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich D · Finance & Logistics"
        title="Finance & Logistics"
        description="Plan the money side of studying in Germany: the blocked account, your monthly costs, health insurance, scholarships, and part-time work. Funding is also a visa requirement, so start here early."
        category="finance"
      />

      <Disclaimer />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Two numbers do most of the planning: the <strong>blocked-account amount</strong> you must
        prove for the visa, and your <strong>realistic monthly budget</strong> once you arrive. Pin
        those down first, then look at how insurance, scholarships, and a student job change the
        picture. The key official figures are below; every tool links to where you can confirm them.
      </p>

      <section aria-labelledby="finance-key-facts" className="space-y-3">
        <h2 id="finance-key-facts" className="eyebrow">
          Key figures · Eckdaten
        </h2>
        <OfficialFactList facts={FINANCE_FACTS} />
      </section>

      <section aria-labelledby="finance-tools" className="space-y-3">
        <h2 id="finance-tools" className="eyebrow">
          Tools · Werkzeuge
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.to} className="flex flex-col transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-category-finance/10 text-category-finance">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="eyebrow">{tool.feature}</p>
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <CardDescription>{tool.description}</CardDescription>
                  <Link
                    to={tool.to}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
