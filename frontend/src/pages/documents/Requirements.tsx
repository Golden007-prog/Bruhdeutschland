import { useState } from "react";
import { FileSearch, Info, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";

interface ReqRecord { id: string; programme: string; deadline: string; requirements: string }

/** G15 — Per-programme requirement capture. A structured, persisted record so you stop re-reading portals. */
export default function DocumentsRequirements() {
  const [records, setRecords] = useSyncedState<ReqRecord[]>("programme:requirements", []);
  const [programme, setProgramme] = useState("");

  const add = () => {
    if (!programme.trim()) return;
    setRecords((p) => [...p, { id: uid("req"), programme: programme.trim(), deadline: "", requirements: "" }]);
    setProgramme("");
  };
  const patch = (id: string, p: Partial<ReqRecord>) => setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G15 · Documents"
        title="Per-programme requirement capture"
        description="Every programme buries its requirements on its own page. Capture each one here — paste the 'admission requirements' text, note the deadline — so you have one organised record instead of 20 open tabs."
        category="documents"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Paste from the official programme page so it's accurate. This is <strong>your</strong> record — the
          programme's page stays the source of truth; re-check it before the deadline.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Input value={programme} onChange={(e) => setProgramme(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Programme + university" aria-label="Programme name" />
        <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
      </div>

      {records.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No programmes captured yet.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r.id} className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-medium"><FileSearch className="h-4 w-4 text-category-documents" aria-hidden /> {r.programme}</p>
                <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.programme}`} className="rounded text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
              </div>
              <div className="space-y-1">
                <label htmlFor={`${r.id}-deadline`} className="text-xs font-medium text-muted-foreground">Application deadline</label>
                <Input id={`${r.id}-deadline`} type="date" value={r.deadline} onChange={(e) => patch(r.id, { deadline: e.target.value })} className="w-44" />
              </div>
              <div className="space-y-1">
                <label htmlFor={`${r.id}-req`} className="text-xs font-medium text-muted-foreground">Requirements (paste from the programme page)</label>
                <Textarea id={`${r.id}-req`} value={r.requirements} onChange={(e) => patch(r.id, { requirements: e.target.value })} rows={5} className="text-xs" placeholder="Required degree, GPA, language certificate, GRE/TestAS, documents, …" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
