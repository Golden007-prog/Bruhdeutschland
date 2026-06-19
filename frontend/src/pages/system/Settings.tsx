import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { AccountPanel } from "@/features/settings/AccountPanel";
import { AiSettings } from "@/features/settings/AiSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IntakeForm {
  name: string;
  homeCountry: string;
  currentDegree: string;
  grade: string;
  targetIntake: "" | "WS" | "SS";
  targetField: string;
  germanLevel: "" | "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
}

const EMPTY_FORM: IntakeForm = {
  name: "",
  homeCountry: "",
  currentDegree: "",
  grade: "",
  targetIntake: "",
  targetField: "",
  germanLevel: "",
};

const selectClass = cn(
  "flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/** Profile & settings — intake form that personalizes the roadmap. State only; no persistence. */
export default function SettingsPage() {
  const [form, setForm] = useState<IntakeForm>(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Einstellungen · Settings"
        title="Profile & settings"
        description="Manage the intake details that personalize your roadmap. Your data stays on this device in this build."
      />

      <AiSettings />
      <AccountPanel />

      <Alert variant="info">
        <Lock aria-hidden />
        <AlertDescription>
          Your AI key and intake details stay in this browser. With an account (above), your roadmap,
          flashcards, and exam attempts sync across devices; signed out, they stay on this device only.
        </AlertDescription>
      </Alert>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intake details</CardTitle>
            <p className="text-sm text-muted-foreground">
              These inputs tune which deadlines, programmes, and language steps your roadmap
              emphasises.
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
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
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
                  value={form.homeCountry}
                  onChange={(e) => set("homeCountry", e.target.value)}
                  placeholder="India"
                  autoComplete="country-name"
                />
                <p className="text-xs text-muted-foreground">
                  Drives APS and visa requirements (e.g. India, China, Vietnam).
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="intake-degree" className="text-sm font-medium">
                  Current degree
                </label>
                <Input
                  id="intake-degree"
                  value={form.currentDegree}
                  onChange={(e) => set("currentDegree", e.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="intake-grade" className="text-sm font-medium">
                  Current grade / GPA
                </label>
                <Input
                  id="intake-grade"
                  value={form.grade}
                  onChange={(e) => set("grade", e.target.value)}
                  placeholder="8.4 / 10 CGPA"
                  inputMode="decimal"
                />
                <p className="text-xs text-muted-foreground">
                  Converted to the German scale deterministically (Modified Bavarian Formula).
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="intake-intake" className="text-sm font-medium">
                  Target intake
                </label>
                <select
                  id="intake-intake"
                  value={form.targetIntake}
                  onChange={(e) => set("targetIntake", e.target.value as IntakeForm["targetIntake"])}
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
                  value={form.targetField}
                  onChange={(e) => set("targetField", e.target.value)}
                  placeholder="Data Engineering"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="intake-german" className="text-sm font-medium">
                  German level
                </label>
                <select
                  id="intake-german"
                  value={form.germanLevel}
                  onChange={(e) => set("germanLevel", e.target.value as IntakeForm["germanLevel"])}
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
              <Button type="submit">Save details</Button>
              {saved && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Saved for this session
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
