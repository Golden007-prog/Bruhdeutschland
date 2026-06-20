import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Trash2, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

type Stage = "identified" | "emailed" | "replied" | "meeting";
interface Contact { id: string; name: string; group: string; stage: Stage }

const META: Record<Stage, { label: string; cls: string }> = {
  identified: { label: "Identified", cls: "bg-muted text-muted-foreground" },
  emailed: { label: "Emailed", cls: "bg-sky-100 text-sky-900" },
  replied: { label: "Replied", cls: "bg-amber-100 text-amber-900" },
  meeting: { label: "Meeting / interested", cls: "bg-emerald-100 text-emerald-900" },
};
const ORDER: Stage[] = ["identified", "emailed", "replied", "meeting"];

const HOWTO = [
  "Find groups whose published work overlaps your interests (department pages, recent papers, group websites).",
  "Read 1–2 of their recent papers before contacting — your email must show genuine, specific fit.",
  "Write a short, tailored email: who you are, why this group, what you'd contribute, and your CV + a one-line research idea.",
  "Follow up once after ~2 weeks. Professors are busy; a polite nudge is normal.",
];

/** G16 — Professor / research-group outreach guide + tracker (PhD & research track). */
export default function ProfileSupervisors() {
  const [items, setItems] = useSyncedState<Contact[]>("supervisors:outreach", []);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");

  const add = () => {
    if (!name.trim()) return;
    setItems((p) => [...p, { id: uid("sup"), name: name.trim(), group: group.trim(), stage: "identified" }]);
    setName("");
    setGroup("");
  };
  const cycle = (id: string) => setItems((prev) => prev.map((c) => (c.id === id ? { ...c, stage: ORDER[(ORDER.indexOf(c.stage) + 1) % ORDER.length] } : c)));
  const remove = (id: string) => setItems((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G16 · Profile"
        title="Professor & research-group outreach"
        description="A PhD in Germany hinges on a supervisor who accepts you — more than on a central application. Here's how to find and approach one, with a tracker for your outreach."
        category="profile"
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">How to approach a supervisor</h2>
        <ol className="mt-3 space-y-2">
          {HOWTO.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-category-profile" aria-hidden /> Outreach tracker</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prof. / group lead" aria-label="Professor or group lead" />
          <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="University / group" aria-label="University or group" />
          <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
        </div>
        {items.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No outreach tracked yet.</p>
        )}
        {items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {items.map((c) => {
              const meta = META[c.stage];
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                  <span className="min-w-0"><span className="font-medium">{c.name}</span>{c.group && <span className="text-muted-foreground"> · {c.group}</span>}</span>
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => cycle(c.id)} aria-label={`Stage: ${meta.label}. Select to advance.`} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", meta.cls)}>{meta.label}</button>
                    <button type="button" onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert variant="info" className="text-sm">
        <AlertDescription>
          Funding follows the supervisor: ask about a position/stipend or point to a scholarship (e.g. DAAD).
        </AlertDescription>
      </Alert>

      <Link to="/finance/scholarships" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Scholarships for research <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
