import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, FileSearch, Info, Link2, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import { uid } from "@/lib/doc/export";
import { formatDate, relativeLabel, severityFor } from "@/lib/calc/deadlines";
import type { DeadlineSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  deriveRequirementNeeds,
  programmeTargets,
  type OfferLike,
  type RequirementNeed,
  type TrackerApp,
} from "@/lib/documents/programmes";

/** A captured per-programme requirement record. `targetKey` links it to a tracker app / offer (no double entry). */
interface ReqRecord {
  id: string;
  programme: string;
  /** Stable id of the linked application/offer target, or "" when free-typed. */
  targetKey: string;
  deadline: string;
  requirements: string;
}

const SEV_BADGE: Record<DeadlineSeverity, string> = {
  overdue: "bg-red-100 text-red-900",
  urgent: "bg-amber-100 text-amber-900",
  soon: "bg-sky-100 text-sky-900",
  info: "bg-emerald-100 text-emerald-900",
};

/** Icon + tone for a single derived need (detected / not-needed / unknown). */
function needTone(n: RequirementNeed) {
  if (n.needed === true) return { Icon: CheckCircle2, cls: "text-emerald-700", word: "needed" };
  if (n.needed === false) return { Icon: CircleHelp, cls: "text-muted-foreground", word: "not for your country" };
  return { Icon: CircleHelp, cls: "text-amber-700", word: "check the page" };
}

/** Compact list of the derived needs for one record, with the APS country source shown when present. */
function NeedsPanel({ text, homeCountry }: { text: string; homeCountry: string }) {
  const needs = deriveRequirementNeeds(text, homeCountry);
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {needs.map((n) => {
        const tone = needTone(n);
        return (
          <li key={n.id} className="flex items-start gap-2 text-xs">
            <tone.Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone.cls)} aria-hidden />
            <span className="min-w-0">
              <span className="font-medium">{n.label}</span>{" "}
              <span className={tone.cls}>· {tone.word}</span>
              {n.id === "aps" && n.needsVerification && <span className="text-amber-700"> — verify</span>}
              {n.source && (
                <span className="ml-1 inline-block">
                  <SourceLink source={n.source} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * G2-2 / G4-03 / G4-05 — Per-programme requirement capture, now connected.
 *  • link each record to a programme you already entered in the tracker / offers (shared identity, no double entry)
 *  • paste the requirement text → a deterministic "you'll also need" panel (translation / VPD / test / language)
 *  • APS need is auto-derived from your home country (Bangladesh = none), not a tracker you must remember to add.
 */
export default function DocumentsRequirements() {
  const [records, setRecords] = useSyncedState<ReqRecord[]>("programme:requirements", []);
  const [apps] = useSyncedState<TrackerApp[]>("tracker:apps", []);
  const [offers] = useSyncedState<OfferLike[]>("offers:list", []);
  const { profile } = useProfile();
  const [programme, setProgramme] = useState("");
  const [pickKey, setPickKey] = useState("");

  const targets = useMemo(() => programmeTargets(apps, offers), [apps, offers]);
  const usedKeys = useMemo(() => new Set(records.map((r) => r.targetKey).filter(Boolean)), [records]);
  const available = targets.filter((t) => !usedKeys.has(t.key));

  const addFromTarget = () => {
    const t = targets.find((x) => x.key === pickKey);
    if (!t) return;
    setRecords((p) => [
      ...p,
      { id: uid("req"), programme: t.label, targetKey: t.key, deadline: "", requirements: "" },
    ]);
    setPickKey("");
  };
  const addFreeText = () => {
    if (!programme.trim()) return;
    setRecords((p) => [...p, { id: uid("req"), programme: programme.trim(), targetKey: "", deadline: "", requirements: "" }]);
    setProgramme("");
  };
  const patch = (id: string, p: Partial<ReqRecord>) => setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) => setRecords((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G15 · Documents"
        title="Per-programme requirement capture"
        description="Every programme buries its requirements on its own page. Capture each one here — paste the 'admission requirements' text and we'll surface what you'll also need (translation, VPD, a test) and whether your country needs an APS, so you stop juggling 20 open tabs."
        category="documents"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Paste from the official programme page so it's accurate. This is <strong>your</strong> record — the
          programme's page stays the source of truth; re-check it before the deadline. The "you'll also need"
          panel is a deterministic hint over your own paste, not an official requirement.
        </AlertDescription>
      </Alert>

      {/* Link an existing programme (shared identity) or free-type a new one. */}
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        {targets.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="req-pick" className="text-xs font-medium text-muted-foreground">
              Link a programme from your tracker / offers
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                id="req-pick"
                value={pickKey}
                onChange={(e) => setPickKey(e.target.value)}
                className="h-9 min-w-[16rem] flex-1 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">
                  {available.length ? "Pick a programme you already added…" : "All your programmes are already captured"}
                </option>
                {available.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.origin})
                  </option>
                ))}
              </select>
              <Button onClick={addFromTarget} disabled={!pickKey} variant="outline">
                <Link2 aria-hidden /> Capture
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="req-free" className="text-xs font-medium text-muted-foreground">
            …or add one not in your tracker yet
          </label>
          <div className="flex gap-2">
            <Input id="req-free" value={programme} onChange={(e) => setProgramme(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFreeText(); } }} placeholder="Programme + university" />
            <Button onClick={addFreeText} variant="outline"><Plus aria-hidden /> Add</Button>
          </div>
          {targets.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Tip: add programmes in the{" "}
              <Link to="/tracker" className="underline">application tracker</Link> and they'll appear here to link.
            </p>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No programmes captured yet.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => {
            const sev = r.deadline ? severityFor(r.deadline) : null;
            const linked = r.targetKey ? targets.find((t) => t.key === r.targetKey) : undefined;
            const orphaned = !!r.targetKey && !linked;
            return (
              <li key={r.id} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 font-medium">
                    <FileSearch className="h-4 w-4 shrink-0 text-category-documents" aria-hidden /> <span className="truncate">{r.programme}</span>
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {linked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        <Link2 className="h-3 w-3" aria-hidden /> linked · {linked.origin}
                      </span>
                    )}
                    {sev && (
                      <span className={cn("official-figure inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium", SEV_BADGE[sev])}>
                        {formatDate(r.deadline)} · {relativeLabel(r.deadline)}
                      </span>
                    )}
                    <button type="button" onClick={() => remove(r.id)} aria-label={`Remove ${r.programme}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                </div>

                {orphaned && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> The linked programme was removed from your tracker/offers — this record is now standalone.
                  </p>
                )}

                <div className="space-y-1">
                  <label htmlFor={`${r.id}-deadline`} className="text-xs font-medium text-muted-foreground">Application deadline</label>
                  <Input id={`${r.id}-deadline`} type="date" value={r.deadline} onChange={(e) => patch(r.id, { deadline: e.target.value })} className="w-44" />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${r.id}-req`} className="text-xs font-medium text-muted-foreground">Requirements (paste from the programme page)</label>
                  <Textarea id={`${r.id}-req`} value={r.requirements} onChange={(e) => patch(r.id, { requirements: e.target.value })} rows={5} className="text-xs" placeholder="Required degree, GPA, language certificate, GRE/TestAS, certified translations, VPD, documents, …" />
                </div>

                <div className="space-y-1.5 rounded-md border bg-muted/20 p-3">
                  <p className="text-xs font-semibold">You'll also need — derived from your paste + home country</p>
                  <NeedsPanel text={r.requirements} homeCountry={profile.homeCountry} />
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[0.7rem] text-muted-foreground">
                    Track these in:
                    <Link to="/documents/translation-tracker" className="inline-flex items-center gap-0.5 underline">translation <ArrowRight className="h-3 w-3" aria-hidden /></Link>
                    <Link to="/documents/vpd" className="inline-flex items-center gap-0.5 underline">VPD <ArrowRight className="h-3 w-3" aria-hidden /></Link>
                    <Link to="/documents/sop" className="inline-flex items-center gap-0.5 underline">SOP <ArrowRight className="h-3 w-3" aria-hidden /></Link>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
