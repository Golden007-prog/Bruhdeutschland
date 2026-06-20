import { cloneElement, isValidElement, useId, type ReactElement } from "react";
import { GraduationCap, Info, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { newEducationStage, summarizeEducation } from "@/lib/profile/education";
import type { EducationPathType, EducationStage, UserProfile } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const PATH_OPTIONS: { value: EducationPathType; label: string }[] = [
  { value: "", label: "Select your education path…" },
  { value: "regular", label: "Regular: 10th → 12th → Bachelor" },
  { value: "diploma_lateral", label: "10th → diploma → lateral-entry Bachelor (no class 12)" },
  { value: "diploma_only", label: "Diploma only (no Bachelor)" },
  { value: "class12_only", label: "Class 12 only (no Bachelor yet)" },
  { value: "integrated", label: "Integrated / dual degree" },
  { value: "other", label: "Other" },
];

const LEVEL_LABELS: Record<EducationStage["level"], string> = {
  class10: "Class 10 (secondary)",
  class12: "Class 12 / Higher Secondary",
  diploma: "Diploma (polytechnic / vocational)",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  integrated: "Integrated degree",
};

const DEGREE_LEVELS = new Set(["bachelor", "master", "integrated"]);
/** Path types that benefit from the structured stage editor (the linear default rarely needs it). */
const NEEDS_STAGES = new Set<EducationPathType>(["diploma_lateral", "diploma_only", "integrated", "other"]);

/**
 * Captures the SHAPE of the applicant's education (non-linear-paths addendum §1). Progressive: the
 * path-type selector is always shown; the structured stage editor appears for non-linear paths (or once
 * the user adds a stage). Shows the deterministic summary (total years, "no class 12") as live feedback.
 */
export function EducationTimelineEditor({
  value,
  onChange,
}: {
  value: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
}) {
  const stages = value.educationStages ?? [];
  const pathType = value.educationPathType ?? "";
  const showStages = NEEDS_STAGES.has(pathType) || stages.length > 0;
  const summary = summarizeEducation(value);

  const patchStage = (id: string, p: Partial<EducationStage>) =>
    onChange({ educationStages: stages.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const addStage = () => onChange({ educationStages: [...stages, newEducationStage("bachelor")] });
  const removeStage = (id: string) => onChange({ educationStages: stages.filter((s) => s.id !== id) });

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <GraduationCap className="h-4 w-4" aria-hidden /> Education path
      </h3>
      <p className="text-xs text-muted-foreground">
        Not everyone goes 10th → 12th → Bachelor. If you took a diploma + lateral entry (no class 12), tell
        us here — for a Master's, your <strong>Bachelor's recognition</strong> is what matters, not the route.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="edu-path-type" className="text-sm font-medium">Your path</label>
        <select
          id="edu-path-type"
          className={selectClass}
          value={pathType}
          onChange={(e) => onChange({ educationPathType: e.target.value as EducationPathType })}
        >
          {PATH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {summary.missingClass12 && (
        <p className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50/50 p-2 text-xs text-amber-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          No class 12 in your path. That's usually fine for a Master's (your Bachelor is the qualifying
          credential) — we'll route you to the anabin + uni-assist VPD check rather than guess.
        </p>
      )}

      {showStages && (
        <div className="space-y-3">
          {stages.map((s, i) => {
            const isDegree = DEGREE_LEVELS.has(s.level);
            return (
              <div key={s.id} className="space-y-3 rounded-md border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Stage {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeStage(s.id)}
                    className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Level">
                    <select className={selectClass} value={s.level} onChange={(e) => patchStage(s.id, { level: e.target.value as EducationStage["level"] })}>
                      {Object.entries(LEVEL_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={selectClass} value={s.status} onChange={(e) => patchStage(s.id, { status: e.target.value as EducationStage["status"] })}>
                      <option value="completed">Completed</option>
                      <option value="ongoing">Ongoing</option>
                    </select>
                  </Field>
                  <Field label="Start year">
                    <Input value={s.startYear} onChange={(e) => patchStage(s.id, { startYear: e.target.value })} placeholder="2019" inputMode="numeric" />
                  </Field>
                  <Field label={s.status === "ongoing" ? "Expected end year" : "End year"}>
                    <Input value={s.endYear} onChange={(e) => patchStage(s.id, { endYear: e.target.value })} placeholder="2022" inputMode="numeric" />
                  </Field>
                  <Field label="Institution">
                    <Input value={s.institution} onChange={(e) => patchStage(s.id, { institution: e.target.value })} placeholder="XYZ Polytechnic" />
                  </Field>
                  <Field label="Board / awarding body">
                    <Input value={s.board} onChange={(e) => patchStage(s.id, { board: e.target.value })} placeholder="State Board / University" />
                  </Field>
                  {isDegree && (
                    <Field label="Entry type">
                      <select className={selectClass} value={s.entryType ?? "regular"} onChange={(e) => patchStage(s.id, { entryType: e.target.value as EducationStage["entryType"] })}>
                        <option value="regular">Regular entry</option>
                        <option value="lateral">Lateral entry (e.g. from diploma)</option>
                      </select>
                    </Field>
                  )}
                  {isDegree && s.status === "ongoing" && (
                    <Field label="Current semester">
                      <Input value={s.currentSemester ?? ""} onChange={(e) => patchStage(s.id, { currentSemester: e.target.value })} placeholder="3" inputMode="numeric" />
                    </Field>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addStage}>
              <Plus aria-hidden /> Add a stage
            </Button>
            {summary.totalYears > 0 && (
              <p className="official-figure text-xs text-muted-foreground">
                ~{summary.totalYears} years total{summary.degreeCompleted ? " · degree completed" : summary.degreeOngoing ? " · degree ongoing" : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children, { id }) : children;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      {control}
    </div>
  );
}
