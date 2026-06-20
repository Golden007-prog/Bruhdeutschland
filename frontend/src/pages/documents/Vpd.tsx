import { useState } from "react";
import { CheckCircle2, Clock, FileCheck, Plus, Send, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uid } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { source } from "@/lib/sources";
import type { OfficialFact } from "@/lib/types";
import { VPD_PREREQUISITES } from "@/lib/seed/documents";

type VpdStatus = "requested" | "processing" | "received";

interface VpdEntry {
  id: string;
  university: string;
  status: VpdStatus;
}

const STATUS_META: Record<VpdStatus, { label: string; icon: typeof Clock; classes: string }> = {
  requested: { label: "Requested", icon: Send, classes: "bg-muted text-muted-foreground" },
  processing: { label: "Processing", icon: Clock, classes: "bg-amber-100 text-amber-900" },
  received: { label: "Received", icon: CheckCircle2, classes: "bg-emerald-100 text-emerald-900" },
};

const STATUS_ORDER: VpdStatus[] = ["requested", "processing", "received"];


const VPD_PROCESSING: OfficialFact = {
  label: "VPD processing time",
  value: "~4–6 weeks",
  source: source("uniAssistVpd"),
  needsVerification: true,
  note: "Typical turnaround; varies by season and completeness. It must reach the university before its deadline — request it early.",
};

const VPD_VALIDITY: OfficialFact = {
  label: "VPD validity",
  value: "~1 year",
  source: source("uniAssistVpd"),
  needsVerification: true,
  note: "A VPD is generally usable for one application cycle. Confirm the exact validity on your VPD and with the university.",
};

/** VPD (Vorprüfungsdokumentation) tracker (Feature 10). */
export default function DocumentsVpd() {
  const [entries, setEntries] = useSyncedState<VpdEntry[]>("doc:vpd:entries", []);
  const [draft, setDraft] = useState("");

  const addEntry = () => {
    const name = draft.trim();
    if (!name) return;
    setEntries((prev) => [...prev, { id: uid("vpd"), university: name, status: "requested" }]);
    setDraft("");
  };

  const cycleStatus = (id: string) =>
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: STATUS_ORDER[(STATUS_ORDER.indexOf(e.status) + 1) % STATUS_ORDER.length] }
          : e,
      ),
    );

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 10 · Documents"
        title="VPD (Preliminary Documentation) tracker"
        description="Track the Vorprüfungsdokumentation some universities require before you apply directly."
        category="documents"
      />

      <Alert variant="info">
        <FileCheck aria-hidden />
        <AlertTitle>What a VPD is</AlertTitle>
        <AlertDescription>
          A <span className="font-medium">Vorprüfungsdokumentation (VPD)</span> is a certificate from
          uni-assist that states which German entrance qualification your foreign certificates
          confer and converts your grade to the German scale. Some universities require a VPD instead
          of a full uni-assist application — you request it from uni-assist and then submit it{" "}
          <span className="font-medium">directly to the university before its deadline</span>. Because
          it takes weeks to produce, request it as early as possible.
        </AlertDescription>
      </Alert>

      <section aria-labelledby="vpd-facts" className="space-y-3">
        <h2 id="vpd-facts" className="eyebrow">
          Timing — verify per program &amp; year
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <OfficialFactRow fact={VPD_PROCESSING} />
          <OfficialFactRow fact={VPD_VALIDITY} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Checklist items={VPD_PREREQUISITES} title="VPD prerequisites" storageKey="vpd-prereqs" />

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Status tracker</CardTitle>
            <p className="text-xs text-muted-foreground">
              Track each university you need a VPD for. Select a status to advance it
              (requested → processing → received).
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="vpd-university" className="sr-only">
                  University name
                </label>
                <Input
                  id="vpd-university"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEntry();
                    }
                  }}
                  placeholder="Add a university…"
                />
              </div>
              <Button onClick={addEntry} variant="outline" aria-label="Add university">
                <Plus aria-hidden />
                Add
              </Button>
            </div>

            {entries.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                No universities tracked yet. Add the ones that require a VPD.
              </p>
            ) : (
              <ul className="space-y-2">
                {entries.map((entry) => {
                  const meta = STATUS_META[entry.status];
                  const Icon = meta.icon;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-md border bg-card p-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {entry.university}
                      </span>
                      <button
                        type="button"
                        onClick={() => cycleStatus(entry.id)}
                        aria-label={`Status: ${meta.label}. Select to advance.`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          meta.classes,
                        )}
                      >
                        <Icon className="h-3 w-3" aria-hidden />
                        {meta.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Remove ${entry.university}`}
                        className="rounded text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <SourceList sources={[source("uniAssistVpd"), source("uniAssistDeadlines"), source("uniAssist")]} />
    </div>
  );
}
