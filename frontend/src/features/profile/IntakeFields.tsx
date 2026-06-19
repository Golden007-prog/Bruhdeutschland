import { Input } from "@/components/ui/input";
import { formatGermanGrade } from "@/lib/calc/gpa";
import { SCALE_OPTIONS, deriveGermanGpa } from "@/lib/profile/profile";
import type { UserProfile } from "@/lib/profile/types";
import { WorkExperienceEditor } from "./WorkExperienceEditor";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * The shared intake form fields (name, country, degree, grade + scale, intake, field, German level).
 * Presentational and controlled — the parent owns the {@link UserProfile} value. Used by Settings
 * (bound to the persisted store, autosave) and the résumé review step (a local draft). Shows the live
 * deterministic German grade so the user sees the conversion as they type.
 */
export function IntakeFields({
  value,
  onChange,
  idPrefix = "intake",
}: {
  value: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  idPrefix?: string;
}) {
  const conv = deriveGermanGpa(value);
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor={id("name")} className="text-sm font-medium">Full name</label>
        <Input
          id={id("name")}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Jane Doe"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("country")} className="text-sm font-medium">Home country</label>
        <Input
          id={id("country")}
          value={value.homeCountry}
          onChange={(e) => onChange({ homeCountry: e.target.value })}
          placeholder="India"
          autoComplete="country-name"
        />
        <p className="text-xs text-muted-foreground">
          Drives APS and visa requirements (e.g. India requires APS; Bangladesh does not).
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("level")} className="text-sm font-medium">I'm applying for</label>
        <select
          id={id("level")}
          value={value.targetLevel}
          onChange={(e) => onChange({ targetLevel: e.target.value as UserProfile["targetLevel"] })}
          className={selectClass}
        >
          <option value="">Select study level…</option>
          <option value="bachelor">Bachelor's (after Class 12)</option>
          <option value="master">Master's</option>
          <option value="medicine">Medicine (Humanmedizin)</option>
          <option value="studienkolleg">Studienkolleg (foundation year)</option>
          <option value="phd">Doctorate (PhD)</option>
        </select>
        <p className="text-xs text-muted-foreground">Drives your whole pathway — school-leavers and doctors follow different German routes than Master's.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("qual")} className="text-sm font-medium">Highest qualification</label>
        <select
          id={id("qual")}
          value={value.highestQualification}
          onChange={(e) => onChange({ highestQualification: e.target.value as UserProfile["highestQualification"] })}
          className={selectClass}
        >
          <option value="">Select…</option>
          <option value="class10">Class 10 (secondary)</option>
          <option value="class12">Class 12 / Higher Secondary</option>
          <option value="some_bachelor">Some university (incomplete Bachelor)</option>
          <option value="bachelor">Bachelor's degree</option>
          <option value="master">Master's degree</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("degree")} className="text-sm font-medium">Current degree / field of study</label>
        <Input
          id={id("degree")}
          value={value.currentDegree}
          onChange={(e) => onChange({ currentDegree: e.target.value })}
          placeholder="B.Tech Computer Science"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("institution")} className="text-sm font-medium">Institution</label>
        <Input
          id={id("institution")}
          value={value.institution}
          onChange={(e) => onChange({ institution: e.target.value })}
          placeholder="IIT Delhi"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("graduation")} className="text-sm font-medium">Degree obtained (month)</label>
        <Input
          id={id("graduation")}
          type="month"
          value={value.graduationDate}
          onChange={(e) => onChange({ graduationDate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Used for scholarship rules like &ldquo;degree within the last 6 years&rdquo; (DAAD EPOS).
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("grade")} className="text-sm font-medium">Current grade / GPA</label>
        <Input
          id={id("grade")}
          value={value.gradeValue}
          onChange={(e) => onChange({ gradeValue: e.target.value })}
          placeholder="8.4"
          inputMode="decimal"
          aria-describedby={id("grade-hint")}
        />
        <p id={id("grade-hint")} className="text-xs text-muted-foreground">
          Enter the number; pick its scale to the right.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("scale")} className="text-sm font-medium">Grade scale</label>
        <select
          id={id("scale")}
          value={value.gradeScale}
          onChange={(e) => onChange({ gradeScale: e.target.value as UserProfile["gradeScale"] })}
          className={selectClass}
        >
          <option value="">Select…</option>
          {SCALE_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {conv && (
          <p className="text-xs font-medium text-emerald-700" role="status">
            → German grade {formatGermanGrade(conv.germanGrade)} (1,0 best · 4,0 pass)
          </p>
        )}
      </div>

      {value.gradeScale === "custom" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor={id("best")} className="text-sm font-medium">
              Best achievable grade (N<sub>max</sub>)
            </label>
            <Input
              id={id("best")}
              value={value.customBest}
              onChange={(e) => onChange({ customBest: e.target.value })}
              placeholder="20"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={id("minpass")} className="text-sm font-medium">
              Lowest passing grade (N<sub>min</sub>)
            </label>
            <Input
              id={id("minpass")}
              value={value.customMinPass}
              onChange={(e) => onChange({ customMinPass: e.target.value })}
              placeholder="6"
              inputMode="decimal"
            />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <label htmlFor={id("intake")} className="text-sm font-medium">Target intake</label>
        <select
          id={id("intake")}
          value={value.targetIntake}
          onChange={(e) => onChange({ targetIntake: e.target.value as UserProfile["targetIntake"] })}
          className={selectClass}
        >
          <option value="">Select…</option>
          <option value="WS">Wintersemester (WS) — starts ~Oct</option>
          <option value="SS">Sommersemester (SS) — starts ~Apr</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("field")} className="text-sm font-medium">Target field</label>
        <Input
          id={id("field")}
          value={value.targetField}
          onChange={(e) => onChange({ targetField: e.target.value })}
          placeholder="Data Engineering"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={id("german")} className="text-sm font-medium">German level</label>
        <select
          id={id("german")}
          value={value.germanLevel}
          onChange={(e) => onChange({ germanLevel: e.target.value as UserProfile["germanLevel"] })}
          className={selectClass}
        >
          <option value="">Select…</option>
          <option value="none">None / beginner</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
        <p className="text-xs text-muted-foreground">
          CEFR self-assessment — sets your language-prep starting point.
        </p>
      </div>
    </div>

    <WorkExperienceEditor
      value={value.workExperiences}
      graduationDate={value.graduationDate}
      onChange={(workExperiences) => onChange({ workExperiences })}
    />
    </div>
  );
}
