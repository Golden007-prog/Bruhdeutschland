import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Gauge, GraduationCap, ScanLine, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { ResumeAnalyzer } from "@/components/ResumeAnalyzer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockParsedProfile } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface ProfileTool {
  to: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  feature: string;
}

const TOOLS: ProfileTool[] = [
  {
    to: "/profile/parse",
    title: "Resume & LinkedIn parsing",
    blurb: "Turn a resume, LinkedIn export, or intake form into structured facts.",
    icon: ScanLine,
    feature: "01",
  },
  {
    to: "/profile/evaluate",
    title: "Profile evaluation (GPA)",
    blurb: "Convert your grade to the German 1,0–4,0 scale — deterministically.",
    icon: Gauge,
    feature: "02",
  },
  {
    to: "/profile/matching",
    title: "Course & university matching",
    blurb: "Shortlist Master's programs at German public universities that fit you.",
    icon: GraduationCap,
    feature: "03",
  },
  {
    to: "/profile/skill-gap",
    title: "Skill-gap analysis",
    blurb: "See what target programs expect that your profile doesn't yet show.",
    icon: Target,
    feature: "04",
  },
  {
    to: "/profile/ects",
    title: "ECTS calculator",
    blurb: "Total and normalize your credits to ECTS for German admissions.",
    icon: Calculator,
    feature: "05",
  },
];

/** Profile & Assessment — category landing. Links to the five tools + a parsed-profile snapshot. */
export default function ProfileOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich A · Profile & Assessment"
        title="Profile & Assessment"
        description="A German admissions office reads your background through a fixed lens: a 1,0–4,0 grade, an ECTS total, and a curriculum match. These five tools translate your resume into that German-readable academic profile — facts extracted, grade converted, programs matched, and gaps named."
        category="profile"
        fileRef="§ A"
      />

      <section aria-labelledby="profile-tools-heading">
        <div className="mb-3">
          <p className="eyebrow">Werkzeuge · Tools</p>
          <h2 id="profile-tools-heading" className="mt-1 text-lg font-semibold tracking-tight">
            Five tools in this dossier
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className={cn(
                  "group relative block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-category-profile" />
                  <CardHeader className="pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-category-profile/10 text-category-profile">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="eyebrow">Feature {tool.feature}</span>
                    </div>
                    <CardTitle className="mt-3 text-base">{tool.title}</CardTitle>
                    <CardDescription>{tool.blurb}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-category-profile">
                      Open tool
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="profile-snapshot-heading">
        <div className="mb-3">
          <p className="eyebrow">Beispiel · Sample output</p>
          <h2 id="profile-snapshot-heading" className="mt-1 text-lg font-semibold tracking-tight">
            What a parsed profile looks like
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A snapshot of a finished evaluation. The German grade is computed deterministically and
            stamped; figures that depend on the specific program or year stay flagged for verification.
          </p>
        </div>
        <ResumeAnalyzer profile={mockParsedProfile} />
      </section>
    </div>
  );
}
