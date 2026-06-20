import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, Plus, Send, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

type LorStatus = "asked" | "reminded" | "received";

interface LorRequest {
  id: string;
  recommender: string;
  role: string;
  deadline: string;
  status: LorStatus;
}

const STATUS_META: Record<LorStatus, { label: string; icon: typeof Clock; cls: string }> = {
  asked: { label: "Asked", icon: Send, cls: "bg-muted text-muted-foreground" },
  reminded: { label: "Reminded", icon: Clock, cls: "bg-amber-100 text-amber-900" },
  received: { label: "Received", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-900" },
};
const ORDER: LorStatus[] = ["asked", "reminded", "received"];

/** G20 — LOR request tracker (ask → remind → received), complementing the LOR drafting page. */
export default function DocumentsLorTracker() {
  const [items, setItems] = useSyncedState<LorRequest[]>("lor:requests", []);
  const [recommender, setRecommender] = useState("");
  const [role, setRole] = useState("");
  const [deadline, setDeadline] = useState("");

  const add = () => {
    if (!recommender.trim()) return;
    setItems((prev) => [...prev, { id: uid("lor"), recommender: recommender.trim(), role: role.trim(), deadline, status: "asked" }]);
    setRecommender("");
    setRole("");
    setDeadline("");
  };
  const cycle = (id: string) => setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: ORDER[(ORDER.indexOf(r.status) + 1) % ORDER.length] } : r)));
  const remove = (id: string) => setItems((prev) => prev.filter((r) => r.id !== id));

  const received = items.filter((i) => i.status === "received").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G20 · Documents"
        title="Recommendation-letter request tracker"
        description="Drafting a letter is half the job — chasing it is the other half. Track who you asked, when each is due, and whether it's in, so no recommendation arrives late."
        category="documents"
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold">Your requests</h2>
          <span className="official-figure text-sm text-muted-foreground"><span className="font-semibold text-foreground">{received}</span>/{items.length} received</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div className="space-y-1">
            <label htmlFor="lor-name" className="text-xs font-medium text-muted-foreground">Recommender</label>
            <Input id="lor-name" value={recommender} onChange={(e) => setRecommender(e.target.value)} placeholder="Prof. A. Sharma" />
          </div>
          <div className="space-y-1">
            <label htmlFor="lor-role" className="text-xs font-medium text-muted-foreground">Role / relationship</label>
            <Input id="lor-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Thesis supervisor" />
          </div>
          <div className="space-y-1">
            <label htmlFor="lor-deadline" className="text-xs font-medium text-muted-foreground">Needed by</label>
            <Input id="lor-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
          </div>
        </div>

        {items.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No requests yet.</p>
        )}
        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{r.recommender}</span>
                    {r.role && <span className="text-muted-foreground"> · {r.role}</span>}
                    {r.deadline && <span className="text-muted-foreground"> · due {r.deadline}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => cycle(r.id)} aria-label={`Status: ${meta.label}. Select to advance.`} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", meta.cls)}>
                      <Icon className="h-3 w-3" aria-hidden /> {meta.label}
                    </button>
                    <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.recommender}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert variant="info" className="text-sm">
        <AlertDescription>
          Give recommenders 3–4 weeks and a strong starting draft. Send a polite reminder a week before the
          deadline — that's what the "Reminded" status is for.
        </AlertDescription>
      </Alert>

      <Link to="/documents/lor" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Draft a recommendation letter <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
