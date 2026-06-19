import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/doc/export";
import { supabase } from "@/lib/supabase/client";

const STATE_KEY = "deutschprep:state";

/**
 * GDPR data controls (work order §8B-19/20). Export downloads everything stored on this device as
 * JSON. Delete clears local data and best-effort wipes the signed-in user's cloud rows, then reloads.
 * (Full auth-account deletion requires the operator's admin tooling — noted to the user.)
 */
export function DataControls() {
  const [busy, setBusy] = useState(false);

  const exportData = () => {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STATE_KEY) ?? "{}" : "{}";
    downloadText("deutschprep-data.json", raw, "application/json");
  };

  const deleteData = async () => {
    if (!window.confirm("Delete all your DeutschPrep data on this device? This can't be undone.")) return;
    setBusy(true);
    try {
      localStorage.removeItem(STATE_KEY);
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
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Export or delete your data</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your data lives in this browser (and your account, if signed in). You can take it with you or
        remove it at any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={exportData}>
          <Download aria-hidden /> Export my data (JSON)
        </Button>
        <Button variant="outline" onClick={() => void deleteData()} disabled={busy} className="text-destructive">
          <Trash2 aria-hidden /> Delete my data
        </Button>
      </div>
      <Alert variant="info" className="mt-4 text-xs">
        <AlertDescription>
          Delete removes your data from this device and your synced rows. To erase your account login
          itself, email us and we&apos;ll remove it from authentication.
        </AlertDescription>
      </Alert>
    </section>
  );
}
