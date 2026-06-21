import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { deriveRequirementNeeds } from "@/lib/documents/programmes";
import { cn } from "@/lib/utils";

type TStatus = "needed" | "sent" | "received";
interface TransRow { id: string; document: string; translator: string; cost: string; status: TStatus }

/** Captured per-programme requirement record (read-only here) — drives the "translation needed?" seeding. */
interface ReqRecord { id: string; programme: string; requirements: string }

const META: Record<TStatus, { label: string; cls: string }> = {
  needed: { label: "Needed", cls: "bg-muted text-muted-foreground" },
  sent: { label: "With translator", cls: "bg-amber-100 text-amber-900" },
  received: { label: "Received", cls: "bg-emerald-100 text-emerald-900" },
};
const ORDER: TStatus[] = ["needed", "sent", "received"];

/** The default rows we offer to seed when a programme's pasted requirements mention a translation. */
const SEED_DOCS = ["Bachelor's degree certificate", "Transcript of records"];

/** G21 / G4-05 — Certified-translation tracker, now seeded from programmes that actually require one. */
export default function DocumentsTranslationTracker() {
  const [rows, setRows] = useSyncedState<TransRow[]>("translation:tracker", []);
  const [reqs] = useSyncedState<ReqRecord[]>("programme:requirements", []);
  const [doc, setDoc] = useState("");

  // Programmes whose captured requirements mention a certified/sworn translation (deterministic, country-agnostic).
  const needingProgrammes = useMemo(
    () =>
      reqs
        .filter((r) => deriveRequirementNeeds(r.requirements, "").find((n) => n.id === "translation")?.needed === true)
        .map((r) => r.programme),
    [reqs],
  );

  const add = () => {
    if (!doc.trim()) return;
    setRows((p) => [...p, { id: uid("tr"), document: doc.trim(), translator: "", cost: "", status: "needed" }]);
    setDoc("");
  };
  const seed = () => {
    const have = new Set(rows.map((r) => r.document.toLowerCase()));
    const toAdd = SEED_DOCS.filter((d) => !have.has(d.toLowerCase())).map((d) => ({ id: uid("tr"), document: d, translator: "", cost: "", status: "needed" as const }));
    if (toAdd.length) setRows((p) => [...p, ...toAdd]);
  };
  const patch = (id: string, p: Partial<TransRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const cycle = (id: string) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: ORDER[(ORDER.indexOf(r.status) + 1) % ORDER.length] } : r)));
  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G21 · Documents"
        title="Certified-translation tracker"
        description="Translations of your certificates take time and money. Track each document — which sworn translator, the cost, and whether it's back — so none holds up an application."
        category="documents"
      />

      {needingProgrammes.length > 0 && (
        <Alert variant="info" className="text-sm">
          <Sparkles aria-hidden />
          <AlertDescription>
            From your captured requirements, {needingProgrammes.length === 1 ? "this programme calls" : "these programmes call"} for a certified translation:{" "}
            <span className="font-medium">{needingProgrammes.join("; ")}</span>. Seed the usual documents below to get started.
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Documents to translate</h2>
        <div className="flex flex-wrap gap-2">
          <Input value={doc} onChange={(e) => setDoc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="e.g. Bachelor's degree certificate" aria-label="Document name" className="min-w-[12rem] flex-1" />
          <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
          <Button onClick={seed} variant="outline"><Sparkles aria-hidden /> Seed usual documents</Button>
        </div>

        {rows.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No documents added yet.</p>
        )}
        {rows.length > 0 && (
          <ul className="mt-4 space-y-2">
            {rows.map((r) => {
              const meta = META[r.status];
              return (
                <li key={r.id} className="space-y-2 rounded-md border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.document}</span>
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={() => cycle(r.id)} aria-label={`Status: ${meta.label}. Select to advance.`} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", meta.cls)}>{meta.label}</button>
                      <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.document}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={r.translator} onChange={(e) => patch(r.id, { translator: e.target.value })} placeholder="Translator" aria-label={`Translator for ${r.document}`} className="h-8 text-xs" />
                    <Input value={r.cost} onChange={(e) => patch(r.id, { cost: e.target.value })} placeholder="Cost (€)" aria-label={`Cost for ${r.document}`} className="h-8 text-xs" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert variant="info" className="text-sm">
        <AlertDescription>
          Only a <strong>sworn (vereidigt/beeidigt)</strong> translator's certified translation is accepted.
          See the translation assistant to find one and prepare the hand-off note.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/documents/translation" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Find a sworn translator <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/requirements" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Per-programme requirements <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
