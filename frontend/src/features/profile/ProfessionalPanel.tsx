import { Link } from "react-router-dom";
import { Briefcase, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/lib/profile/useProfile";
import { currentYM, formatYearsMonths, summarizeExperience, yearsFrom } from "@/lib/profile/experience";

function seniority(totalMonths: number): string {
  const y = yearsFrom(totalMonths);
  if (y >= 10) return "Lead / Principal";
  if (y >= 5) return "Senior";
  if (y >= 2) return "Mid-level";
  if (totalMonths > 0) return "Early career";
  return "—";
}

/**
 * Professional profile panel (addendum §2). A SEPARATE dimension from the academic GPA — it never
 * changes the German grade; it strengthens specific applications (professional/MBA programmes,
 * experience-required scholarships). Reads the saved profile; honest empty state when there's none.
 */
export function ProfessionalPanel() {
  const { profile } = useProfile();
  const s = summarizeExperience(profile, currentYM());

  if (!s.hasExperience) {
    return (
      <section className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <Briefcase className="h-4 w-4" aria-hidden /> Professional profile
        </p>
        <p className="mt-1 text-muted-foreground">
          No work experience added yet. Add roles in{" "}
          <Link to="/settings" className="font-medium text-primary hover:underline">Settings</Link> or via{" "}
          <Link to="/profile/parse" className="font-medium text-primary hover:underline">résumé parsing</Link>{" "}
          to unlock experience-based scholarships (e.g. DAAD EPOS) and professional programmes. It won&apos;t
          change your German grade.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Briefcase className="h-4 w-4" aria-hidden /> Professional profile
        </h2>
        {s.currentlyEmployed && <Badge variant="success">Currently employed</Badge>}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total experience" value={formatYearsMonths(s.totalMonths)} />
        <Stat label="Relevant to target" value={formatYearsMonths(s.relevantMonths)} />
        <Stat label="Post-degree full-time" value={formatYearsMonths(s.postDegreeFullTimeMonths)} sub="counts for EPOS-style rules" />
        <Stat label="Seniority" value={seniority(s.totalMonths)} />
      </div>

      {s.domains.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow mb-1">Domains</p>
          <div className="flex flex-wrap gap-1.5">
            {s.domains.map((d) => <Badge key={d} variant="secondary"><MapPin className="mr-0.5 h-3 w-3" aria-hidden /> {d}</Badge>)}
          </div>
        </div>
      )}

      {s.relevantMonths > 0 ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-emerald-700">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatYearsMonths(s.relevantMonths)} of your experience maps to{" "}
          <strong>{profile.targetField || "your target field"}</strong> — surface it in your SOP and CV.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Mark roles &ldquo;relevant to my target field&rdquo; to highlight transferable experience.
        </p>
      )}

      {s.gapMonths != null && s.gapMonths >= 6 && (
        <p className="mt-2 text-xs text-amber-700">
          ~{formatYearsMonths(s.gapMonths)} since graduation isn&apos;t covered by a role — address this
          briefly and positively in your CV/SOP.
        </p>
      )}

      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        Experience is a <strong>separate</strong> dimension — it strengthens specific applications but
        does <strong>not</strong> change your deterministic German grade.
      </p>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="eyebrow">{label}</p>
      <p className="official-figure mt-0.5 text-lg font-semibold">{value}</p>
      {sub && <p className="text-[0.65rem] text-muted-foreground">{sub}</p>}
    </div>
  );
}
