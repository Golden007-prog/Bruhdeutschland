import { Link } from "react-router-dom";
import { ArrowRight, Info, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { emptyOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { formatEur } from "@/lib/calc/costOfLiving";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

/** G26 — Offer comparison board. Manually entered admits held side by side (shared offer store). */
export default function OfferComparisonPage() {
  const [offers, setOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);

  const add = () => setOffers((prev) => [...prev, emptyOffer(uid("offer"))]);
  const remove = (id: string) => setOffers((prev) => prev.filter((o) => o.id !== id));
  const patch = (id: string, p: Partial<Offer>) => setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...p } : o)));

  // Cheapest across ALL offers — a tuition-free (€0) programme is the genuinely cheapest case and must be
  // eligible (qa COR-1). Only badge when there are ≥2 offers AND a real difference exists.
  const minTuition = offers.length ? Math.min(...offers.map((o) => o.tuitionPerSem)) : 0;
  const cheapestId =
    offers.length >= 2 && offers.some((o) => o.tuitionPerSem !== minTuition)
      ? (offers.find((o) => o.tuitionPerSem === minTuition)?.id ?? null)
      : null;
  const dated = offers.filter((o) => o.acceptBy);
  const soonestId = dated.length >= 2 ? dated.reduce((a, b) => (b.acceptBy < a.acceptBy ? b : a)).id : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G26 · Offers"
        title="Offer comparison board"
        description="Got more than one admit? Enter each here and compare them side by side — cost, city, language, and the accept-by deadline — instead of juggling a dozen browser tabs."
      />

      {offers.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No offers yet. Add each admission you receive — it'll also feed your{" "}
            <Link to="/offers/seat-deadlines" className="font-medium underline">seat-acceptance deadlines</Link>.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex gap-1">
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
              <p className="text-xs text-muted-foreground">{o.tuitionPerSem > 0 ? `${formatEur(o.tuitionPerSem)}/sem` : "No tuition"}</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={o.conditional} onChange={(e) => patch(o.id, { conditional: e.target.checked })} className="accent-[hsl(var(--primary))]" />
                Conditional offer
              </label>
            </div>
          ))}
        </div>
      )}

      <Button onClick={add} variant="outline"><Plus aria-hidden /> Add an offer</Button>

      <section className="flex flex-wrap gap-2">
        <Link to="/offers/interpret" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Decode an admission letter <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/offers/seat-deadlines" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Seat-acceptance deadlines <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
