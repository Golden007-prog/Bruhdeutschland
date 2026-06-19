import { CheckCircle2, Lock, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { AccountPanel } from "@/features/settings/AccountPanel";
import { AiSettings } from "@/features/settings/AiSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatGermanGrade } from "@/lib/calc/gpa";
import { SCALE_OPTIONS, deriveGermanGpa } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/**
 * Profile & settings. The intake form now writes the persisted profile store (page-audit §3.1): every
 * field autosaves to localStorage (and Supabase when signed in) and feeds the dashboard, GPA, and
 * roadmap. The grade is captured as a value + scale so the German conversion is deterministic.
 */
export default function SettingsPage() {
  const { profile, update } = useProfile();
  const navigate = useNavigate();

  const conv = deriveGermanGpa(profile);
  const saved = Boolean(profile.updatedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Einstellungen · Settings"
        title="Profile & settings"
        description="Manage the intake details that personalize your roadmap. Changes save automatically to this device — and sync across devices when you sign in."
      />

      <AiSettings />
      <AccountPanel />

      <Alert variant="info">
        <Lock aria-hidden />
        <AlertDescription>
          Your AI key and intake details stay in this browser. With an account (above), your profile,
          roadmap, flashcards, and exam attempts sync across devices; signed out, they stay on this
          device only.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intake details</CardTitle>
          <p className="text-sm text-muted-foreground">
            These inputs tune which deadlines, programmes, and language steps your roadmap emphasises,
            and produce your German grade via the deterministic Modified Bavarian Formula.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="intake-name" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="intake-name"
                value={profile.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-country" className="text-sm font-medium">
                Home country
              </label>
              <Input
                id="intake-country"
                value={profile.homeCountry}
                onChange={(e) => update({ homeCountry: e.target.value })}
                placeholder="India"
                autoComplete="country-name"
              />
              <p className="text-xs text-muted-foreground">
                Drives APS and visa requirements (e.g. India requires APS; Bangladesh does not).
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-degree" className="text-sm font-medium">
                Current degree
              </label>
              <Input
                id="intake-degree"
                value={profile.currentDegree}
                onChange={(e) => update({ currentDegree: e.target.value })}
                placeholder="B.Tech Computer Science"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-institution" className="text-sm font-medium">
                Institution
              </label>
              <Input
                id="intake-institution"
                value={profile.institution}
                onChange={(e) => update({ institution: e.target.value })}
                placeholder="IIT Delhi"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-grade" className="text-sm font-medium">
                Current grade / GPA
              </label>
              <Input
                id="intake-grade"
                value={profile.gradeValue}
                onChange={(e) => update({ gradeValue: e.target.value })}
                placeholder="8.4"
                inputMode="decimal"
                aria-describedby="intake-grade-hint"
              />
              <p id="intake-grade-hint" className="text-xs text-muted-foreground">
                Enter the number; pick its scale to the right.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-scale" className="text-sm font-medium">
                Grade scale
              </label>
              <select
                id="intake-scale"
                value={profile.gradeScale}
                onChange={(e) =>
                  update({ gradeScale: e.target.value as typeof profile.gradeScale })
                }
                className={selectClass}
              >
                <option value="">Select…</option>
                {SCALE_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              {conv && (
                <p className="text-xs font-medium text-emerald-700" role="status">
                  → German grade {formatGermanGrade(conv.germanGrade)} (1,0 best · 4,0 pass)
                </p>
              )}
            </div>

            {profile.gradeScale === "custom" && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="intake-best" className="text-sm font-medium">
                    Best achievable grade (N<sub>max</sub>)
                  </label>
                  <Input
                    id="intake-best"
                    value={profile.customBest}
                    onChange={(e) => update({ customBest: e.target.value })}
                    placeholder="20"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="intake-minpass" className="text-sm font-medium">
                    Lowest passing grade (N<sub>min</sub>)
                  </label>
                  <Input
                    id="intake-minpass"
                    value={profile.customMinPass}
                    onChange={(e) => update({ customMinPass: e.target.value })}
                    placeholder="6"
                    inputMode="decimal"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label htmlFor="intake-intake" className="text-sm font-medium">
                Target intake
              </label>
              <select
                id="intake-intake"
                value={profile.targetIntake}
                onChange={(e) =>
                  update({ targetIntake: e.target.value as typeof profile.targetIntake })
                }
                className={selectClass}
              >
                <option value="">Select…</option>
                <option value="WS">Wintersemester (WS) — starts ~Oct</option>
                <option value="SS">Sommersemester (SS) — starts ~Apr</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-field" className="text-sm font-medium">
                Target field
              </label>
              <Input
                id="intake-field"
                value={profile.targetField}
                onChange={(e) => update({ targetField: e.target.value })}
                placeholder="Data Engineering"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="intake-german" className="text-sm font-medium">
                German level
              </label>
              <select
                id="intake-german"
                value={profile.germanLevel}
                onChange={(e) =>
                  update({ germanLevel: e.target.value as typeof profile.germanLevel })
                }
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

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="button" onClick={() => navigate("/roadmap")}>
              <MapIcon aria-hidden /> View my roadmap
            </Button>
            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                All changes saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
