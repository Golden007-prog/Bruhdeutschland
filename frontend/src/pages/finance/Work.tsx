import { BookOpen, Building2, Coffee, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORK_LIMIT, WORK_LIMIT_DAYS } from "@/lib/facts";
import { source } from "@/lib/sources";

interface JobType {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  points: string[];
  /** Whether this kind of work counts against the 140/280-day limit. */
  countsToLimit: "no" | "yes";
}

const JOB_TYPES: JobType[] = [
  {
    id: "hiwi",
    name: "HiWi (student assistant)",
    tagline: "Academic job at your own university",
    icon: GraduationCap,
    countsToLimit: "no",
    points: [
      "Wissenschaftliche / studentische Hilfskraft — assisting with teaching, research, or labs.",
      "Paid by the hour, flexible, and directly relevant to your field.",
      "University student-assistant work is generally unrestricted and does not count against the day limit — but always confirm with the Ausländerbehörde.",
    ],
  },
  {
    id: "werkstudent",
    name: "Werkstudent",
    tagline: "Part-time role in industry alongside studies",
    icon: Building2,
    countsToLimit: "yes",
    points: [
      "A working-student contract with a company, usually in your field of study.",
      "Typically up to ~20 hours/week during the semester; more during breaks.",
      "Carries a reduced social-insurance status (the Werkstudentenprivileg) while you stay within the rules.",
    ],
  },
  {
    id: "minijob",
    name: "Mini-job / part-time",
    tagline: "General part-time work (cafés, retail, tutoring)",
    icon: Coffee,
    countsToLimit: "yes",
    points: [
      "A Minijob is a low-earning role under the official monthly earnings threshold.",
      "Flexible and easy to start, but usually unrelated to your studies.",
      "Counts toward your annual work-day allowance like other non-university jobs.",
    ],
  },
];

/** Feature 21 — HiWi & Werkstudent readiness. */
export default function FinanceWork() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 21 · Finance"
        title="HiWi & Werkstudent readiness"
        description="A student job can ease your budget and build experience — but international students work under a legal day limit. Here is how the common job types compare and what the limit means."
        category="finance"
        fileRef="§ 21"
      />

      <Disclaimer />

      <OfficialFactRow fact={WORK_LIMIT} />

      <Alert variant="info">
        <BookOpen aria-hidden />
        <AlertTitle>
          The {WORK_LIMIT_DAYS.full} / {WORK_LIMIT_DAYS.half}-day rule, in plain terms
        </AlertTitle>
        <AlertDescription>
          As a non-EU student you may work up to <strong>{WORK_LIMIT_DAYS.full} full days</strong> or{" "}
          <strong>{WORK_LIMIT_DAYS.half} half days</strong> per year without separate permission. A half day counts as up
          to four hours of work; two half days make a full day. Going over the limit needs approval
          from the foreigners&apos; authority and the employment agency. The exact conditions are
          written into your residence permit, so always check yours.
        </AlertDescription>
      </Alert>

      <section aria-labelledby="work-types" className="space-y-3">
        <h2 id="work-types" className="text-lg font-semibold tracking-tight">
          HiWi vs Werkstudent vs mini-job
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {JOB_TYPES.map((job) => {
            const Icon = job.icon;
            return (
              <Card key={job.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-category-finance/10 text-category-finance">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-snug">{job.name}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">{job.tagline}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <Badge variant={job.countsToLimit === "no" ? "success" : "secondary"} className="w-fit">
                    {job.countsToLimit === "no"
                      ? "Generally outside the day limit"
                      : "Counts toward the day limit"}
                  </Badge>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {job.points.map((point, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-category-finance" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Alert variant="success">
        <GraduationCap aria-hidden />
        <AlertTitle>University assistant jobs are the flexible exception</AlertTitle>
        <AlertDescription>
          Academic student-assistant (HiWi) jobs at your own university are generally unrestricted and
          usually do not count against your {WORK_LIMIT_DAYS.full}/{WORK_LIMIT_DAYS.half}-day allowance — which makes them the easiest job to
          take on while keeping within the rules. Even so, tell the foreigners&apos; authority and
          confirm it against the conditions on your residence permit.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-2">Source · Quelle</p>
        <SourceLink source={source("daadSideJobs")} />
      </div>
    </div>
  );
}
