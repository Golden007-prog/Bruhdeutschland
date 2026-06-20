import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Landmark, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";

const FACTORS = [
  { name: "Interest rate (APR)", detail: "Fixed vs floating, and the all-in annual rate — the single biggest cost driver." },
  { name: "Collateral / co-applicant", detail: "Secured (property/FD) vs unsecured; many lenders need a co-applicant with income." },
  { name: "Moratorium", detail: "Whether repayment is paused during study + a grace period after — and if interest still accrues." },
  { name: "Margin money", detail: "The share you must fund yourself; some lenders cover 100% of costs, others less." },
  { name: "Currency risk", detail: "A home-currency loan against euro costs means FX swings change your real burden." },
  { name: "Processing time & fees", detail: "Sanction speed matters for the visa; watch processing fees and insurance add-ons." },
];

interface LoanOffer { id: string; lender: string; notes: string }

/** G29 — Education-loan comparison framework + offer notes (no invented rates). */
export default function FinanceLoans() {
  const [offers, setOffers] = useSyncedState<LoanOffer[]>("loans:offers", []);
  const [lender, setLender] = useState("");

  const add = () => {
    if (!lender.trim()) return;
    setOffers((p) => [...p, { id: uid("loan"), lender: lender.trim(), notes: "" }]);
    setLender("");
  };
  const patch = (id: string, p: Partial<LoanOffer>) => setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...p } : o)));
  const remove = (id: string) => setOffers((prev) => prev.filter((o) => o.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G29 · Finance"
        title="Education-loan comparison framework"
        description="For many students a loan is the main funding route. We won't invent rates — instead, here are the terms that actually decide which offer is best, and a place to compare yours."
        category="finance"
      />

      <Disclaimer />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          Loan terms change constantly and vary per applicant — get written quotes from your own banks (and
          public options like KfW for eligible students) and compare them on the factors below.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Compare offers on these</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FACTORS.map((f) => (
            <div key={f.name} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-medium">{f.name}</p>
              <p className="mt-1 text-muted-foreground">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Landmark className="h-4 w-4 text-category-finance" aria-hidden /> Your offers</h2>
        <div className="flex gap-2">
          <Input value={lender} onChange={(e) => setLender(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Lender / bank" aria-label="Lender" />
          <Button onClick={add} variant="outline"><Plus aria-hidden /> Add</Button>
        </div>
        {offers.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">No offers added yet.</p>
        )}
        {offers.length > 0 && (
          <ul className="mt-4 space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="space-y-2 rounded-md border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{o.lender}</span>
                  <button type="button" onClick={() => remove(o.id)} aria-label={`Remove ${o.lender}`} className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </div>
                <Input value={o.notes} onChange={(e) => patch(o.id, { notes: e.target.value })} placeholder="Rate, collateral, moratorium, margin…" aria-label={`Notes for ${o.lender}`} className="h-8 text-xs" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/finance/funding-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
        Plug a loan into your funding plan <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
