import { AlertCircle, AlertTriangle, CircleDot, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockParsedProfile } from "@/lib/mockData";
import type { SkillGap } from "@/lib/types";
import { cn } from "@/lib/utils";

type Severity = SkillGap["severity"];

const SEVERITY_META: Record<
  Severity,
  { label: string; icon: LucideIcon; dot: string; chip: string; order: number }
> = {
  high: {
    label: "High priority",
    icon: AlertCircle,
    dot: "text-red-600",
    chip: "bg-red-100 text-red-900",
    order: 0,
  },
  medium: {
    label: "Worth addressing",
    icon: AlertTriangle,
    dot: "text-amber-600",
    chip: "bg-amber-100 text-amber-900",
    order: 1,
  },
  low: {
    label: "Nice to have",
    icon: Info,
    dot: "text-muted-foreground",
    chip: "bg-muted text-muted-foreground",
    order: 2,
  },
};

/** AI-reasoned guidance on closing each gap. Labelled "AI-reasoned · not official" in the UI. */
const RECOMMENDATIONS: Record<string, string> = {
  s1: "Most German-taught programs require B2; even English-taught ones value it for everyday life and internships. Book a structured A1→B2 course now (Goethe-Institut or telc), aim for ~3–4 months per level, and schedule TestDaF/DSH once you reach B2.",
  s2: "Distributed systems is a common prerequisite for data/CS Masters. Close the gap with a recognized course (e.g. a MOOC with a certificate) plus a small portfolio project — a sharded key-value store or a message-queue demo reads strongly on an application.",
  s3: "A publication is rarely required for a Master's, but it strengthens research-track and scholarship cases. If a thesis or capstone exists, polish it into a workshop paper or a preprint; otherwise list relevant projects and a clear statement of research interest in your SOP.",
};

const FALLBACK_RECOMMENDATION =
  "Identify a concrete, verifiable way to demonstrate this skill — a certificate, a project, or coursework — and reference it explicitly in your application documents.";

function GapCard({ gap }: { gap: SkillGap }) {
  const meta = SEVERITY_META[gap.severity];
  const Icon = meta.icon;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.dot)} aria-hidden />
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{gap.skill}</CardTitle>
            <p className="mt-0.5 text-xs">
              <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-medium", meta.chip)}>
                {meta.label}
              </span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="eyebrow mb-1">How to close it</p>
        <p className="text-sm text-muted-foreground">
          {RECOMMENDATIONS[gap.id] ?? FALLBACK_RECOMMENDATION}
        </p>
      </CardContent>
    </Card>
  );
}

/** Feature 04 — Skill-gap analysis. Groups the profile's gaps by severity with concrete guidance. */
export default function ProfileSkillGap() {
  const gaps = mockParsedProfile.skillGaps;
  const groups = (["high", "medium", "low"] as const)
    .map((sev) => ({ sev, items: gaps.filter((g) => g.severity === sev) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 04 · Profile"
        title="Skill-gap analysis"
        description="What target programs typically expect that your current profile doesn't yet show — grouped by priority, each with a concrete way to close it before you apply."
        category="profile"
        fileRef="§ 04"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <CircleDot className="h-4 w-4 text-category-profile" aria-hidden />
          <span>
            <span className="official-figure font-semibold">{gaps.length}</span> gaps identified for
            this profile
          </span>
        </div>
        <span className="text-[0.68rem] text-muted-foreground">AI-reasoned · not official</span>
      </div>

      {groups.map(({ sev, items }) => {
        const meta = SEVERITY_META[sev];
        const Icon = meta.icon;
        return (
          <section key={sev} aria-labelledby={`gap-group-${sev}`}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", meta.dot)} aria-hidden />
              <h2 id={`gap-group-${sev}`} className="text-lg font-semibold tracking-tight">
                {meta.label}
              </h2>
              <span className="official-figure text-sm text-muted-foreground">
                ({items.length})
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((gap) => (
                <GapCard key={gap.id} gap={gap} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Recommendations are reasoned from your profile against common program expectations — they are
        guidance, not official admission requirements. Always confirm what a specific program
        requires on its own page.
      </p>
    </div>
  );
}
