import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

type SchStatus = "researching" | "applied" | "awarded" | "rejected";

interface Scholarship {
  id: string;
  name: string;
  deadline: string;
  status: SchStatus;
}

const STATUS_META: Record<SchStatus, { label: string; cls: string }> = {
  researching: { label: "Researching", cls: "bg-muted text-muted-foreground" },
  applied: { label: "Applied", cls: "bg-sky-100 text-sky-900" },
  awarded: { label: "Awarded", cls: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Not awarded", cls: "bg-red-100 text-red-900" },
};
const ORDER: SchStatus[] = ["researching", "applied", "awarded", "rejected"];

/** G31 — Scholarship application tracker (complements the finder). */
export default function FinanceScholarshipTracker() {
  const [items, setItems] = useSyncedState<Scholarship[]>("scholarship:apps", []);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");

  const add = () => {
    if (!name.trim()) return;
    setItems((prev) => [...prev, { id: uid("sch"), name: name.trim(), deadline, status: "researching" }]);
    setName("");
    setDeadline("");
  };
  const cycle = (id: string) => setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status: ORDER[(ORDER.indexOf(s.status) + 1) % ORDER.length] } : s)));
  const remove = (id: string) => setItems((prev) => prev.filter((s) => s.id !== id));

  const awarded = items.filter((i) => i.status === "awarded").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G31 · Finance"
        title="Scholarship application tracker"
        description="The finder shows what you're eligible for; this tracks what you actually applied to — deadline, status, and outcome — so nothing slips through the cracks."
        category="finance"
      />

      <Disclaimer />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Award className="h-4 w-4 text-category-finance" aria-hidden /> Your applications</h2>
          <span className="official-figure text-sm text-muted-foreground"><span className="font-semibold text-foreground">{awarded}</span> awarded</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-1">
            <label htmlFor="sch-name" className="text-xs font-medium text-muted-foreground">Scholarship</label>
            <Input id="sch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="DAAD EPOS" />
          </div>
          <div className="space-y-1">
            <label htmlFor="sch-deadline" className="text-xs font-medium text-muted-foreground">Deadline</label>
            <Input id="sch-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
          </div>
        </div>

        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    {s.deadline && <span className="text-muted-foreground"> · due {s.deadline}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => cycle(s.id)} aria-label={`Status: ${meta.label}. Select to advance.`} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", meta.cls)}>
                      {meta.label}
                    </button>
                    <button type="button" onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="rounded text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link to="/finance/scholarships" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Find scholarships to add <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
