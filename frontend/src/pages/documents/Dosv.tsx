import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, ClipboardList, ExternalLink, IdCard, Info, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { source } from "@/lib/sources";

/** A ranked DoSV priority (the order that decides which offer hochschulstart makes) — the student's own data. */
interface Priority { id: string; programme: string }

const STEPS = [
  "Check whether your programme is allocated via DoSV — many NC (numerus clausus) Bachelor subjects and Medicine are.",
  "Register once at hochschulstart.de to get your BID and BAN identifiers; you'll reuse them everywhere.",
  "Apply to each programme (often still via the university or uni-assist), then link them in your hochschulstart account.",
  "Set your PRIORITIES — rank your choices. In the dialogue-oriented procedure, offers are made top-priority first.",
  "Watch for offers and accept promptly; an accepted higher-priority offer automatically withdraws the lower ones.",
];

/** G24 / G4-07 — DoSV walkthrough + a persisted BID/BAN + priority record for the NC/Medicine persona. */
export default function DocumentsDosv() {
  const [bid, setBid] = useSyncedState<string>("dosv:bid", "");
  const [ban, setBan] = useSyncedState<string>("dosv:ban", "");
  const [priorities, setPriorities] = useSyncedState<Priority[]>("dosv:priorities", []);
  const [draft, setDraft] = useState("");

  const addPriority = () => {
    if (!draft.trim()) return;
    setPriorities((p) => [...p, { id: uid("pri"), programme: draft.trim() }]);
    setDraft("");
  };
  const removePriority = (id: string) => setPriorities((p) => p.filter((x) => x.id !== id));
  const movePriority = (id: string, dir: -1 | 1) =>
    setPriorities((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G24 · Documents"
        title="DoSV / hochschulstart walkthrough"
        description="For many NC Bachelor subjects and for Medicine, places are coordinated centrally through hochschulstart's dialogue-oriented service procedure (DoSV). Here's how it actually works."
        category="documents"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          DoSV coordinates offers across universities so you don't block multiple seats. Your{" "}
          <strong>priority order</strong> matters: the system makes you the highest-priority offer you
          qualify for and clears the rest.
        </AlertDescription>
      </Alert>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4 text-category-documents" aria-hidden /> The procedure, step by step</h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <a href={source("hochschulstart").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          hochschulstart.de <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><IdCard className="h-4 w-4 text-category-documents" aria-hidden /> Your hochschulstart record</h2>
        <p className="text-xs text-muted-foreground">Your BID and BAN identify you across every DoSV application — keep them here, and rank your priorities so you know exactly what you told the system. Saved to your account.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="dosv-bid" className="eyebrow block">BID (Bewerber-ID)</label>
            <Input id="dosv-bid" value={bid} onChange={(e) => setBid(e.target.value)} placeholder="e.g. B-1234567" className="official-figure" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dosv-ban" className="eyebrow block">BAN (authentication number)</label>
            <Input id="dosv-ban" value={ban} onChange={(e) => setBan(e.target.value)} placeholder="kept secret — like a password" className="official-figure" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your priorities — top of the list is offered first</p>
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPriority(); } }} placeholder="Programme + university" aria-label="Priority programme" />
            <Button onClick={addPriority} variant="outline"><Plus aria-hidden /> Add</Button>
          </div>
          {priorities.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">No priorities ranked yet.</p>
          ) : (
            <ol className="space-y-1.5">
              {priorities.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.programme}</span>
                  <button type="button" onClick={() => movePriority(p.id, -1)} disabled={i === 0} aria-label={`Move ${p.programme} up`} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronUp className="h-4 w-4" aria-hidden /></button>
                  <button type="button" onClick={() => movePriority(p.id, 1)} disabled={i === priorities.length - 1} aria-label={`Move ${p.programme} down`} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronDown className="h-4 w-4" aria-hidden /></button>
                  <button type="button" onClick={() => removePriority(p.id)} aria-label={`Remove ${p.programme}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <Alert variant="warning" className="text-sm">
        <AlertDescription>
          International (non-EU) applicants sometimes apply through a different quota or directly to the
          university rather than DoSV — confirm which route your programme uses for your nationality.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Your pathway <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/vpd-helper" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          VPD or direct? <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. The exact procedure and which programmes use DoSV are set by hochschulstart and the universities — verify there.</p>

      <SourceList sources={[source("hochschulstart"), source("daadProcess")]} />
    </div>
  );
}
