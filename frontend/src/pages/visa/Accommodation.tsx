import { Link } from "react-router-dom";
import { ArrowRight, Check, LifeBuoy, MapPinOff, ShieldAlert, X } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOMMODATION_CHANNELS, RENTAL_SCAM_FLAGS } from "@/lib/seed/visa";
import { source } from "@/lib/sources";

/**
 * Recovery steps if you've already been scammed (gap G7-05). Practical, non-official guidance — we
 * don't invent bank/police timelines; the student acts on these and confirms specifics locally.
 */
const SCAM_RECOVERY_STEPS = [
  "Stop the money immediately — contact your bank to try to recall or freeze the transfer; the sooner, the better the odds.",
  "Report it to the police (file a Strafanzeige). You can usually report online or at any station; keep the case number.",
  "Preserve every piece of evidence: the listing, all messages, the 'landlord's' details, payment receipts, and the address used.",
  "Warn the platform so the listing is removed, and tell your university's international office / Studierendenwerk — they often track local scams.",
  "If a fake landlord misused your ID, you can also flag it to consumer/credit bodies; don't send any further money to 'release' the first.",
];

/**
 * No-address-yet fallback (gap G7-05): you have an admission but nowhere permanent to live, and you
 * can't register (Anmeldung) without an address. Bridging tactics — confirm registrability before paying.
 */
const NO_ADDRESS_TACTICS = [
  "Book a temporary base first — a hostel, serviced apartment, or short sublet — and ask in writing whether the host will sign a Wohnungsgeberbestätigung so it counts for Anmeldung.",
  "Some hostels and Studierendenwerk short-stay options explicitly support registration; not all do, so confirm before booking.",
  "Keep house-hunting from that base; you can re-register (ummelden) once you sign a permanent lease.",
  "If a permanent room is offered later, your Anmeldung address simply updates — it doesn't have to be your final home from day one.",
];

/** Accommodation finder — compares housing channels and warns about rental scams. */
export default function VisaAccommodation() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 25 · Visa"
        title="Accommodation finder"
        description="Find student housing — Studierendenwerk dorms and the private market — and avoid common rental scams."
        category="visa"
        fileRef="§ 25"
      />

      <Disclaimer />

      <Alert variant="danger">
        <ShieldAlert aria-hidden />
        <AlertTitle>Beware of rental scams</AlertTitle>
        <AlertDescription className="text-red-900">
          <ul className="mt-1 space-y-1.5">
            {RENTAL_SCAM_FLAGS.map((flag) => (
              <li key={flag} className="flex gap-2">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <section aria-labelledby="channels-heading">
        <h2 id="channels-heading" className="eyebrow mb-3">
          Housing channels compared
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {ACCOMMODATION_CHANNELS.map((channel) => (
            <Card key={channel.id} className="relative overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-category-visa" />
              <CardHeader className="pl-6">
                <CardTitle className="text-base">{channel.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{channel.summary}</p>
              </CardHeader>
              <CardContent className="space-y-3 pl-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ul className="space-y-1">
                    {channel.pros.map((pro) => (
                      <li key={pro} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1">
                    {channel.cons.map((con) => (
                      <li key={con} className="flex gap-2 text-sm">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-muted-foreground">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                  <span className="eyebrow !tracking-[0.12em]">Tip · </span>
                  {channel.bestFor}
                </p>
                {channel.source && <SourceLink source={channel.source} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── G7-05 — if you've already been scammed ───────────────────────────── */}
      <section aria-labelledby="scam-recovery" className="rounded-lg border border-red-300 bg-red-50/40 p-5 shadow-sm">
        <h2 id="scam-recovery" className="flex items-center gap-2 text-base font-semibold text-red-900">
          <LifeBuoy className="h-4 w-4" aria-hidden />
          Already paid a scammer? Act fast
        </h2>
        <p className="mt-2 text-sm text-red-900/80">
          Prevention is above; if it's already happened, work through these in order. Quick action gives
          the best chance of recovering money and protecting your identity.
        </p>
        <ol className="mt-3 space-y-2">
          {SCAM_RECOVERY_STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-red-900">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── G7-05 — admission but no address yet, and you must register ───────── */}
      <section aria-labelledby="no-address" className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 id="no-address" className="flex items-center gap-2 text-base font-semibold">
          <MapPinOff className="h-4 w-4 text-category-visa" aria-hidden />
          No permanent address yet — but you have to register
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A common deadlock: you're admitted, dorms are waitlisted, and you can't do your Anmeldung
          without an address (the landlord's Wohnungsgeberbestätigung is a hard requirement). Bridge it:
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {NO_ADDRESS_TACTICS.map((t) => (
            <li key={t} className="flex items-start gap-3">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-category-visa" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/arrival/anmeldung-runbook"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            Anmeldung runbook <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          Rents vary widely by city, so no figures are quoted here — check current local listings.
          Dorms are administered by the regional Studierendenwerk; apply the moment you have an
          admission letter, as waiting lists are long.
        </p>
        <p className="mt-2">
          <SourceLink source={source("studentenwerk")} />
        </p>
      </div>
    </div>
  );
}
