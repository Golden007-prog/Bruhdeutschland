import { Link } from "react-router-dom";
import { ArrowRight, Backpack, BookOpen, TramFront, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Tool {
  to: string;
  title: string;
  feature: string;
  description: string;
  icon: LucideIcon;
}

const TOOLS: Tool[] = [
  {
    to: "/campus/pre-departure",
    title: "Pre-departure checklist",
    feature: "Feature 27",
    description:
      "Everything to arrange and pack before you fly, plus the first-week tasks waiting for you on arrival.",
    icon: Backpack,
  },
  {
    to: "/campus/networking",
    title: "Academic networking",
    feature: "Feature 28",
    description:
      "How to reach professors, peers, and student groups — with editable email templates to get you started.",
    icon: Users,
  },
  {
    to: "/campus/deutschlandticket",
    title: "Deutschlandticket guide",
    feature: "Feature 29",
    description:
      "The nationwide transit ticket vs. the discounted Deutschland-Semesterticket many universities include.",
    icon: TramFront,
  },
  {
    to: "/campus/culture",
    title: "Academic culture & plagiarism",
    feature: "Feature 30",
    description:
      "How German universities expect you to study, cite, and behave — including strict plagiarism rules.",
    icon: BookOpen,
  },
];

/** Campus Life — landing page. Links to the four campus tools with a short orientation intro. */
export default function CampusOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich F · Campus Life"
        title="Campus Life"
        description="Land well: pre-departure packing, academic networking, transit, and how German academic culture works."
        category="campus"
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        The work doesn&apos;t stop at the visa. Arriving prepared — knowing what to pack, how to
        register, how to talk to a professor, and how German seminars and exams actually run — is what
        turns a stressful first month into a smooth start. These four tools cover the practical and
        the cultural side of settling into student life in Germany.
      </p>

      <section aria-labelledby="campus-tools" className="space-y-3">
        <h2 id="campus-tools" className="eyebrow">
          Tools · Werkzeuge
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.to} className="flex flex-col transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-category-campus/10 text-category-campus">
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
