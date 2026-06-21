import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Info, Plus, Trash2, X } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { emptyOffer, normalizeOffer, OFFERS_KEY, type Offer, type OfferStatus } from "@/lib/offers/offers";
import { acceptOffer, openConditions } from "@/lib/offers/offerDeadlines";
import { useOfferDeadlineSync } from "@/lib/offers/useOfferDeadlineSync";
import { formatEur } from "@/lib/calc/costOfLiving";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

/** A tracker application — the shared programme identity offers link to (G5-04). Read-only here. */
interface TrackerApp {
  id: string;
  university: string;
  program: string;
}

const STATUS_META: Record<OfferStatus, { label: string; cls: string }> = {
  received: { label: "Received", cls: "bg-slate-100 text-slate-700" },
  accepted: { label: "Accepted", cls: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Declined", cls: "bg-red-100 text-red-900" },
};

/** G26 — Offer comparison board. Manually entered admits held side by side (shared offer store). */
export default function OfferComparisonPage() {
  const [rawOffers, setOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);
  const [apps] = useSyncedState<TrackerApp[]>("tracker:apps", []);
  // Feed accept-by / deposit dates into the central typed `deadlines` table + the .ics export (G5-01/06).
  useOfferDeadlineSync(offers);

  const add = () => setOffers((prev) => [...prev, emptyOffer(uid("offer"))]);
  const remove = (id: string) => setOffers((prev) => prev.filter((o) => o.id !== id));
  const patch = (id: string, p: Partial<Offer>) =>
    setOffers((prev) => prev.map((o) => (o.id === id ? normalizeOffer({ ...o, ...p }) : o)));
  const accept = (id: string) => setOffers((prev) => acceptOffer(prev.map(normalizeOffer), id));
  const decline = (id: string) => patch(id, { status: "declined" });
  const reopen = (id: string) => patch(id, { status: "received" });

  const addCondition = (id: string) =>
    setOffers((prev) =>
      prev.map((o) =>
        o.id === id ? normalizeOffer({ ...o, conditions: [...o.conditions, { id: uid("cond"), text: "", met: false }] }) : o,
      ),
    );
  const patchCondition = (offerId: string, condId: string, p: Partial<{ text: string; met: boolean }>) =>
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? normalizeOffer({ ...o, conditions: o.conditions.map((c) => (c.id === condId ? { ...c, ...p } : c)) })
          : o,
      ),
    );
  const removeCondition = (offerId: string, condId: string) =>
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId ? normalizeOffer({ ...o, conditions: o.conditions.filter((c) => c.id !== condId) }) : o,
      ),
    );

  // Cheapest across ALL offers — a tuition-free (€0) programme is the genuinely cheapest case and must be
  // eligible (qa COR-1). Only badge when there are ≥2 offers AND a real difference exists.
  const minTuition = offers.length ? Math.min(...offers.map((o) => o.tuitionPerSem)) : 0;
  const cheapestId =
    offers.length >= 2 && offers.some((o) => o.tuitionPerSem !== minTuition)
      ? (offers.find((o) => o.tuitionPerSem === minTuition)?.id ?? null)
      : null;
  const dated = offers.filter((o) => o.acceptBy);
  const soonestId = dated.length >= 2 ? dated.reduce((a, b) => (b.acceptBy < a.acceptBy ? b : a)).id : null;
  const acceptedCount = offers.filter((o) => o.status === "accepted").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G26 · Offers"
        title="Offer comparison board"
        description="Got more than one admit? Enter each here and compare them side by side — cost, city, language, the accept-by deadline — then record which you accept. Accepting one declines the rest, so you keep one honest answer to 'where am I going?'"
      />

      {offers.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No offers yet. Add each admission you receive — it'll also feed your{" "}
            <Link to="/offers/seat-deadlines" className="font-medium underline">seat-acceptance deadlines</Link>{" "}
            and your <Link to="/deadlines" className="font-medium underline">calendar</Link>.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => {
            const linkedApp = o.appId ? apps.find((a) => a.id === o.appId) : undefined;
            const unmet = o.conditional ? openConditions(o) : 0;
            return (
              <div
                key={o.id}
                className={cn(
                  "space-y-2 rounded-lg border bg-card p-4 shadow-sm",
                  o.status === "accepted" && "border-emerald-300",
                  o.status === "declined" && "opacity-70",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex flex-wrap gap-1">
                    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS_META[o.status].cls)}>{STATUS_META[o.status].label}</span>
                    {o.id === cheapestId && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-900">cheapest</span>}
                    {o.id === soonestId && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">soonest deadline</span>}
                  </span>
                  <button type="button" onClick={() => remove(o.id)} aria-label="Remove offer" className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <Field id={`${o.id}-prog`} label="Programme" value={o.programme} onChange={(v) => patch(o.id, { programme: v })} placeholder="M.Sc. Data Science" />
                <Field id={`${o.id}-uni`} label="University" value={o.university} onChange={(v) => patch(o.id, { university: v })} placeholder="TU Munich" />
                <div className="grid grid-cols-2 gap-2">
                  <Field id={`${o.id}-city`} label="City" value={o.city} onChange={(v) => patch(o.id, { city: v })} placeholder="Munich" />
                  <Field id={`${o.id}-lang`} label="Language" value={o.language} onChange={(v) => patch(o.id, { language: v })} placeholder="EN" />
                </div>

                {/* Link to the tracker application — the shared programme identity (G5-04). */}
                <div className="space-y-1">
                  <label htmlFor={`${o.id}-app`} className="text-xs font-medium text-muted-foreground">Linked application</label>
                  <select
                    id={`${o.id}-app`}
                    value={o.appId ?? ""}
                    onChange={(e) => patch(o.id, { appId: e.target.value || undefined })}
                    className="flex h-9 w-full rounded-md border bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— none —</option>
                    {apps.map((a) => (
                      <option key={a.id} value={a.id}>{a.program} · {a.university}</option>
                    ))}
                  </select>
                  {o.appId && !linkedApp && <p className="text-[0.68rem] text-amber-700">Linked application no longer exists — re-link or clear.</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor={`${o.id}-fee`} className="text-xs font-medium text-muted-foreground">Tuition / sem (€)</label>
                    <Input id={`${o.id}-fee`} type="number" min={0} value={o.tuitionPerSem} onChange={(e) => patch(o.id, { tuitionPerSem: Math.max(0, Number(e.target.value) || 0) })} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`${o.id}-by`} className="text-xs font-medium text-muted-foreground">Accept by</label>
                    <Input id={`${o.id}-by`} type="date" value={o.acceptBy} onChange={(e) => patch(o.id, { acceptBy: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${o.id}-dep`} className="text-xs font-medium text-muted-foreground">Deposit / enrolment-fee deadline (optional)</label>
                  <Input id={`${o.id}-dep`} type="date" value={o.depositBy ?? ""} onChange={(e) => patch(o.id, { depositBy: e.target.value || undefined })} />
                </div>
                <p className="text-xs text-muted-foreground">{o.tuitionPerSem > 0 ? `${formatEur(o.tuitionPerSem)}/sem` : "No tuition"}</p>

                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={o.conditional} onChange={(e) => patch(o.id, { conditional: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                  Conditional offer
                </label>

                {o.conditional && (
                  <div className="space-y-1.5 rounded-md border border-dashed bg-muted/30 p-2">
                    <p className="flex items-center justify-between text-[0.7rem] font-medium text-muted-foreground">
                      <span>Conditions {unmet > 0 ? `· ${unmet} still open` : o.conditions.length > 0 ? "· all met" : ""}</span>
                    </p>
                    {o.conditions.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={c.met} aria-label="Condition met" onChange={(e) => patchCondition(o.id, c.id, { met: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                        <Input value={c.text} onChange={(e) => patchCondition(o.id, c.id, { text: e.target.value })} placeholder="e.g. final transcript" className={cn("h-8 text-xs", c.met && "line-through text-muted-foreground")} />
                        <button type="button" onClick={() => removeCondition(o.id, c.id)} aria-label="Remove condition" className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => addCondition(o.id)} className="h-7 text-xs"><Plus className="h-3 w-3" aria-hidden /> Add condition</Button>
                  </div>
                )}

                {/* Accept / decline workflow (G5-03). */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {o.status !== "accepted" ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => accept(o.id)} className="h-8 text-xs">
                      <Check className="h-3.5 w-3.5" aria-hidden /> Accept this seat
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => reopen(o.id)} className="h-8 text-xs">Reopen</Button>
                  )}
                  {o.status === "received" && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => decline(o.id)} className="h-8 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5" aria-hidden /> Decline
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {acceptedCount > 1 && (
        <Alert variant="warning" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            You have <strong>{acceptedCount}</strong> offers marked accepted. You can enrol in only one — pick the
            one you're taking so your enrolment guide and deadlines scope to it.
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={add} variant="outline"><Plus aria-hidden /> Add an offer</Button>

      <section className="flex flex-wrap gap-2">
        <Link to="/offers/interpret" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Decode an admission letter <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/offers/seat-deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Seat-acceptance deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/arrival/enrolment" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Enrolment guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={cn("text-xs font-medium text-muted-foreground")}>{label}</label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
