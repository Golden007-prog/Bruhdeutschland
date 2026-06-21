import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, Mail, Plus, Send, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DocActions } from "@/components/common/DocActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { formatDate, relativeLabel, severityFor } from "@/lib/calc/deadlines";
import type { DeadlineSeverity } from "@/lib/types";
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

const SEV_BADGE: Record<DeadlineSeverity, string> = {
  overdue: "bg-red-100 text-red-900",
  urgent: "bg-amber-100 text-amber-900",
  soon: "bg-sky-100 text-sky-900",
  info: "bg-emerald-100 text-emerald-900",
};

/** A polite reminder email the student can copy and send to a busy referee — no fabricated specifics. */
function reminderEmail(r: LorRequest): string {
  const due = r.deadline ? ` by ${formatDate(r.deadline)} (${relativeLabel(r.deadline)})` : "";
  return [
    `Subject: Gentle reminder — recommendation letter${r.deadline ? ` due ${formatDate(r.deadline)}` : ""}`,
    ``,
    `Dear ${r.recommender || "[recommender]"},`,
    ``,
    `Thank you again for agreeing to write a letter of recommendation for my Master's application.`,
    `I wanted to send a gentle reminder that the letter is needed${due}.`,
    ``,
    `If it would help, I'm happy to resend my CV, statement of purpose, or a short summary of the`,
    `points we discussed. Please let me know if there is anything you need from me.`,
    ``,
    `With sincere thanks,`,
    `[Your name]`,
  ].join("\n");
}

/** G4-02 — LOR request tracker with due-date urgency + a referee reminder draft. */
export default function DocumentsLorTracker() {
  const [items, setItems] = useSyncedState<LorRequest[]>("lor:requests", []);
  const [recommender, setRecommender] = useState("");
  const [role, setRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emailFor, setEmailFor] = useState<string | null>(null);

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
  // Open requests with a deadline that's already pressing — the nudge the page was missing.
  const pressing = items.filter((i) => i.status !== "received" && i.deadline && severityFor(i.deadline) !== "info" && severityFor(i.deadline) !== "soon").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G20 · Documents"
        title="Recommendation-letter request tracker"
        description="Drafting a letter is half the job — chasing it is the other half. Track who you asked, when each is due, and whether it's in, with a deterministic urgency badge so no recommendation arrives late."
        category="documents"
      />

      {pressing > 0 && (
        <Alert variant="warning" className="text-sm">
          <Clock aria-hidden />
          <AlertDescription>
            <span className="font-semibold">{pressing}</span> outstanding {pressing === 1 ? "letter is" : "letters are"} due within a week or overdue. Send a reminder now.
          </AlertDescription>
        </Alert>
      )}

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
              const sev = r.deadline && r.status !== "received" ? severityFor(r.deadline) : null;
              return (
                <li key={r.id} className="space-y-2 rounded-md border bg-card p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-medium">{r.recommender}</span>
                      {r.role && <span className="text-muted-foreground"> · {r.role}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      {sev && (
                        <span className={cn("official-figure inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", SEV_BADGE[sev])}>
                          {formatDate(r.deadline)} · {relativeLabel(r.deadline)}
                        </span>
                      )}
                      <button type="button" onClick={() => cycle(r.id)} aria-label={`Status: ${meta.label}. Select to advance.`} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", meta.cls)}>
                        <Icon className="h-3 w-3" aria-hidden /> {meta.label}
                      </button>
                      {r.status !== "received" && (
                        <button type="button" onClick={() => setEmailFor((cur) => (cur === r.id ? null : r.id))} aria-expanded={emailFor === r.id} aria-label={`Draft a reminder email to ${r.recommender}`} className="rounded p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Mail className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.recommender}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </span>
                  </div>
                  {emailFor === r.id && (
                    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                      <p className="text-xs font-medium text-muted-foreground">Reminder email — copy, personalise, send</p>
                      <pre className="official-figure max-h-56 overflow-auto whitespace-pre-wrap rounded border bg-card p-2 text-xs leading-relaxed">{reminderEmail(r)}</pre>
                      <DocActions text={reminderEmail(r)} filename={`lor-reminder-${r.recommender.toLowerCase().replace(/\s+/g, "-") || "letter"}.txt`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert variant="info" className="text-sm">
        <AlertDescription>
          Give recommenders 3–4 weeks and a strong starting draft. Send a polite reminder a week before the
          deadline — the urgency badge turns amber then red, and the mail icon drafts the message for you.
        </AlertDescription>
      </Alert>

      <Link to="/documents/lor" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Draft a recommendation letter <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
