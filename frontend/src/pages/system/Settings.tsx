import { CheckCircle2, Lock, Map as MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { AccountPanel } from "@/features/settings/AccountPanel";
import { AiSettings } from "@/features/settings/AiSettings";
import { DataControls } from "@/features/settings/DataControls";
import { ThemeToggle } from "@/features/settings/ThemeToggle";
import { IntakeFields } from "@/features/profile/IntakeFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/lib/profile/useProfile";

/**
 * Profile & settings. The intake form writes the persisted profile store (page-audit §3.1): every
 * field autosaves to localStorage (and Supabase when signed in) and feeds the dashboard, GPA, and
 * roadmap. Fields are shared with the résumé review step via {@link IntakeFields}.
 */
export default function SettingsPage() {
  const { profile, update } = useProfile();
  const navigate = useNavigate();
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
      <DataControls />

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
          <CardTitle className="text-base">Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a light, dark, or system-matched theme.</p>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intake details</CardTitle>
          <p className="text-sm text-muted-foreground">
            These inputs tune which deadlines, programmes, and language steps your roadmap emphasises,
            and produce your German grade via the deterministic Modified Bavarian Formula.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <IntakeFields value={profile} onChange={update} />

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
