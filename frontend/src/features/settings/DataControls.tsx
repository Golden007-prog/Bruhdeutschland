import { useState } from "react";
import { Download, RotateCcw, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/doc/export";
import { supabase } from "@/lib/supabase/client";
import { syncedStore } from "@/lib/persist/syncedStore";
import { clearAttempts } from "@/lib/exam/attempts";
import { clearAllProgress } from "@/lib/exam/examProgress";

/**
 * GDPR + data-isolation controls. Export downloads the CURRENT user's stored blob. "Reset my data"
 * clears this account's data (local namespaces + cloud settings) without deleting the account — the
 * remedy for anything left over from the pre-isolation-fix bug. "Delete my data" additionally removes
 * the profile row and signs out. All operate on the per-user namespace, never a shared global key.
 */
export function DataControls() {
  const [busy, setBusy] = useState(false);

  const exportData = () => {
    downloadText("deutschprep-data.json", JSON.stringify(syncedStore.snapshot(), null, 2), "application/json");
  };

  /** Clear every per-user local store for the current account (state, exam attempts, in-progress exams). */
  function clearLocalPersonal() {
    void syncedStore.resetCurrentUserData();
    clearAttempts();
    clearAllProgress();
  }

  const resetData = async () => {
    if (!window.confirm("Reset all your saved DeutschPrep data for this account (profile, progress, attempts)? Your login stays. This can't be undone.")) return;
    setBusy(true);
    try {
      clearLocalPersonal(); // also deletes the cloud settings row (resetCurrentUserData)
    } finally {
      window.location.href = import.meta.env.BASE_URL;
    }
  };

  const deleteData = async () => {
    if (!window.confirm("Delete all your DeutschPrep data and sign out? This can't be undone.")) return;
    setBusy(true);
    try {
      clearLocalPersonal();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        const id = data.user?.id;
        if (id) {
          await supabase.from("settings").delete().eq("user_id", id);
          await supabase.from("profiles").delete().eq("id", id);
          await supabase.auth.signOut();
        }
      }
    } finally {
      window.location.href = import.meta.env.BASE_URL;
    }
  };

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="eyebrow">Datenschutz · Your data</p>
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Export, reset, or delete your data</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your data is scoped to your account and stored in this browser (and synced to your account when
        signed in). You can take it with you or remove it at any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={exportData}>
          <Download aria-hidden /> Export my data (JSON)
        </Button>
        <Button variant="outline" onClick={() => void resetData()} disabled={busy}>
          <RotateCcw aria-hidden /> Reset my data
        </Button>
        <Button variant="outline" onClick={() => void deleteData()} disabled={busy} className="text-destructive">
          <Trash2 aria-hidden /> Delete &amp; sign out
        </Button>
      </div>
      <Alert variant="info" className="mt-4 text-xs">
        <AlertDescription>
          Data is isolated per account — a different login on this browser never sees yours. "Reset"
          gives this account a clean slate (keeps your login); "Delete &amp; sign out" also removes your
          profile row. To erase the login itself, email us.
        </AlertDescription>
      </Alert>
    </section>
  );
}
