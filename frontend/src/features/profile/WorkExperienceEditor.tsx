import { cloneElement, isValidElement, useId, type ReactElement } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { summarizeExperience, formatYearsMonths, currentYM } from "@/lib/profile/experience";
import { DEFAULT_PROFILE, type EmploymentType, type UserProfile, type WorkExperience } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  working_student: "Working student",
  freelance: "Freelance",
  research: "Research",
  volunteer: "Volunteer",
};

function newRole(): WorkExperience {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `we-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    title: "",
    employer: "",
    country: "",
    employmentType: "full_time",
    startDate: "",
    endDate: "",
    ongoing: false,
    domain: "",
    skills: [],
    description: "",
    relevantToTarget: true,
  };
}

/**
 * Editor for the user's professional history (addendum §1). A first-class profile dimension SEPARATE
 * from the academic GPA — adding roles never changes the German grade; it powers eligibility,
 * scholarships, skill-gap, and documents. Shows the live deterministic totals as the user edits.
 */
export function WorkExperienceEditor({
  value,
  onChange,
  graduationDate,
}: {
  value: WorkExperience[];
  onChange: (next: WorkExperience[]) => void;
  graduationDate?: string;
}) {
  const roles = value ?? [];
  const summary = summarizeExperience(
    { ...DEFAULT_PROFILE, workExperiences: roles, graduationDate: graduationDate ?? "" } as UserProfile,
    currentYM(),
  );

  const patch = (id: string, p: Partial<WorkExperience>) =>
    onChange(roles.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Briefcase className="h-4 w-4" aria-hidden /> Work experience
        </h3>
        {summary.hasExperience && (
          <p className="official-figure text-xs text-muted-foreground">
            {formatYearsMonths(summary.totalMonths)} total · {formatYearsMonths(summary.relevantMonths)} relevant
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Optional but powerful: experience unlocks scholarships (e.g. DAAD EPOS) and professional
        programmes. It does <strong>not</strong> change your German grade — that stays academic-only.
      </p>

      {roles.map((r, i) => (
        <div key={r.id} className="space-y-3 rounded-md border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Role {i + 1}</p>
            <button
              type="button"
              onClick={() => onChange(roles.filter((x) => x.id !== r.id))}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job title">
              <Input value={r.title} onChange={(e) => patch(r.id, { title: e.target.value })} placeholder="Software Engineer" />
            </Field>
            <Field label="Employer">
              <Input value={r.employer} onChange={(e) => patch(r.id, { employer: e.target.value })} placeholder="Acme Corp" />
            </Field>
            <Field label="Country">
              <Input value={r.country} onChange={(e) => patch(r.id, { country: e.target.value })} placeholder="India" />
            </Field>
            <Field label="Type">
              <select className={selectClass} value={r.employmentType} onChange={(e) => patch(r.id, { employmentType: e.target.value as EmploymentType })}>
                {Object.entries(TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Start (month)">
              <Input type="month" value={r.startDate} onChange={(e) => patch(r.id, { startDate: e.target.value })} />
            </Field>
            {/* Composite field: a labelled month input + its own "Ongoing" checkbox (each control
                carries its own label, so this one is built inline rather than via <Field>). */}
            <div className="space-y-1.5">
              <label htmlFor={`${r.id}-end`} className="text-xs font-medium text-muted-foreground">
                {r.ongoing ? "End (ongoing)" : "End (month)"}
              </label>
              <div className="flex items-center gap-2">
                <Input id={`${r.id}-end`} type="month" value={r.endDate} disabled={r.ongoing} onChange={(e) => patch(r.id, { endDate: e.target.value })} className="flex-1" />
                <label className="flex shrink-0 items-center gap-1 text-xs">
                  <input type="checkbox" checked={r.ongoing} onChange={(e) => patch(r.id, { ongoing: e.target.checked })} className="accent-[hsl(var(--primary))]" /> Ongoing
                </label>
              </div>
            </div>
            <Field label="Domain">
              <Input value={r.domain} onChange={(e) => patch(r.id, { domain: e.target.value })} placeholder="Data engineering" />
            </Field>
            <Field label="Skills (comma-separated)">
              <Input
                value={r.skills.join(", ")}
                onChange={(e) => patch(r.id, { skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Python, SQL, Airflow"
              />
            </Field>
          </div>

          <Field label="What you did (1–2 lines)">
            <textarea
              value={r.description}
              onChange={(e) => patch(r.id, { description: e.target.value })}
              rows={2}
              className="w-full rounded-md border bg-card p-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Built and owned the ETL pipeline serving…"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={r.relevantToTarget} onChange={(e) => patch(r.id, { relevantToTarget: e.target.checked })} className="accent-[hsl(var(--primary))]" />
            Relevant to my target field
          </label>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...roles, newRole()])}>
        <Plus aria-hidden /> Add a role
      </Button>
    </section>
  );
}

/**
 * Labels a single form control. Generates an id, renders a real <label htmlFor>, and injects the id
 * into the child control so screen readers announce the field name (WCAG 1.3.1/3.3.2/4.1.2) — fixes
 * the previously-unlabelled inputs (qa-findings P1-4).
 */
function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children, { id }) : children;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {control}
    </div>
  );
}
