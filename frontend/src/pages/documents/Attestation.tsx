import { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

type AType = "certified_copy" | "notarised" | "apostille";
type AStatus = "needed" | "done";
interface AttRow { id: string; document: string; type: AType; status: AStatus }

const TYPE_LABEL: Record<AType, string> = {
  certified_copy: "Certified copy (beglaubigte Kopie)",
  notarised: "Notarised",
  apostille: "Apostille / legalisation",
};
const selectClass = cn("h-8 rounded-md border bg-card px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring");

/** G22 — Attestation & legalization tracker (certified copies, notarisation, apostille). */
export default function DocumentsAttestation() {
  const [rows, setRows] = useSyncedState<AttRow[]>("attestation:tracker", []);
  const [doc, setDoc] = useState("");

  const add = () => {
    if (!doc.trim()) return;
    setRows((p) => [...p, { id: uid("att"), document: doc.trim(), type: "certified_copy", status: "needed" }]);
    setDoc("");
  };
  const patch = (id: string, p: Partial<AttRow>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const done = rows.filter((r) => r.status === "done").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G22 · Documents"
        title="Attestation & legalization tracker"
        description="German universities and authorities often want certified copies, notarised documents, or an apostille on originals. Track which of yours are authenticated and which still need it."
        category="documents"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          A <strong>certified copy</strong> is a stamped true-copy of an original. An <strong>apostille</strong>
          (or legalisation, for non-Hague-Convention countries) authenticates the document internationally.
          Check exactly what each university and your mission require — over-certifying wastes time and money.
        </AlertDescription>
      </Alert>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold">Documents</h2>
          <span className="official-figure text-sm text-muted-foreground"><span className="font-semibold text-foreground">{done}</span>/{rows.length} done</span>
        </div>
        <div className="flex gap-2">
          <Input value={doc} onChange={(e) => setDoc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="e.g. Degree certificate (original)" aria-label="Document name" />
          <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
        </div>

        {rows.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No documents added yet.</p>
        )}
        {rows.length > 0 && (
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                <span className="min-w-0 font-medium">{r.document}</span>
                <span className="flex items-center gap-2">
                  <select className={selectClass} value={r.type} onChange={(e) => patch(r.id, { type: e.target.value as AType })} aria-label={`Type for ${r.document}`}>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button type="button" onClick={() => patch(r.id, { status: r.status === "done" ? "needed" : "done" })} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", r.status === "done" ? "bg-emerald-100 text-emerald-900" : "bg-muted text-muted-foreground")}>
                    {r.status === "done" ? "Done" : "Needed"}
                  </button>
                  <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.document}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. Requirements differ by university and country — verify before paying for authentication.</p>
    </div>
  );
}
