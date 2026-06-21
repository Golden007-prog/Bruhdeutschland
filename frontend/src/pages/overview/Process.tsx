import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, CircleDashed, Clock, GraduationCap, Info, Send } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { offerLabel, openConditions } from "@/lib/offers/offerDeadlines";
import { cn } from "@/lib/utils";

/** Tracker application (the spine's first link). Mirrors the shape Tracker.tsx persists. */
interface TrackerApp {
  id: string;
  university: string;
  program: string;
  stage: "researching" | "applying" | "submitted" | "decision";
}

const STAGE_META: Record<TrackerApp["stage"], { label: string; icon: typeof Check; cls: string }> = {
  researching: { label: "Researching", icon: CircleDashed, cls: "text-slate-500" },
  applying: { label: "Applying", icon: Clock, cls: "text-category-profile" },
  submitted: { label: "Submitted", icon: Send, cls: "text-category-finance" },
  decision: { label: "Decision", icon: Check, cls: "text-category-campus" },
};

/** The four FSM states an application thread moves through, in order — orientation legend. */
const STATE_LEGEND: { label: string; icon: typeof Check; description: string }[] = [
  { label: "Researching", icon: CircleDashed, description: "Queued or scoping the programme — not yet drafting the application." },
  { label: "Applying", icon: Clock, description: "Actively working on it — drafting, gathering documents, filling the portal." },
  { label: "Submitted", icon: Send, description: "Handed off and out of your hands — awaiting a decision." },
  { label: "Decision", icon: Check, description: "A verdict is in. Record the offer and move to accept → enrol." },
];

/** Application status board — the live apply → admit → accept → enrol spine (G5-04). */
export default function ProcessPage() {
  const [apps] = useSyncedState<TrackerApp[]>("tracker:apps", []);
  const [rawOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = useMemo(() => rawOffers.map(normalizeOffer), [rawOffers]);

  // Index offers by the application they're linked to — the shared programme identity.
  const offerByApp = useMemo(() => {
    const m = new Map<string, Offer>();
    for (const o of offers) if (o.appId) m.set(o.appId, o);
    return m;
  }, [offers]);

  // Offers entered without a linked application still belong on the spine (admit with no tracked apply).
  const unlinkedOffers = useMemo(() => offers.filter((o) => !o.appId || !apps.some((a) => a.id === o.appId)), [offers, apps]);

  const decided = apps.filter((a) => a.stage === "decision").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bearbeitungsstand · Status"
        title="Application status board"
        description="Your real apply → admit → accept → enrol spine, in one thread per programme — pulled live from your tracker and your offers, not a demo snapshot."
      />

      {apps.length === 0 && offers.length === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            No applications yet. Add programmes on the{" "}
            <Link to="/tracker" className="font-medium underline">application tracker</Link>, record admits on the{" "}
            <Link to="/offers/compare" className="font-medium underline">offer board</Link>, and each one's thread appears here.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="rounded-lg border bg-card p-4 shadow-sm" aria-label="Application spine">
            <header className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-semibold tracking-tight">Application pipeline</h2>
              <p className="official-figure text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{decided}</span>/{apps.length} at decision
              </p>
            </header>
            <ul className="space-y-2">
              {apps.map((a) => {
                const meta = STAGE_META[a.stage];
                const Icon = meta.icon;
                const offer = offerByApp.get(a.id);
                const unmet = offer && offer.conditional ? openConditions(offer) : 0;
                return (
                  <li key={a.id} className="rounded-md border bg-card p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{a.program}</p>
                        <p className="text-xs text-muted-foreground">{a.university}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <Icon className={cn("h-3 w-3", meta.cls)} aria-hidden /> {meta.label}
                      </Badge>
                    </div>
                    {/* The spine: admit → accept → enrol, driven by the linked offer. */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {offer ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                            Offer: {offer.status}
                          </span>
                          {unmet > 0 && <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-amber-900">{unmet} condition{unmet === 1 ? "" : "s"} open</span>}
                          {offer.status === "accepted" && (
                            <Link to="/arrival/enrolment" className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900 hover:underline">
                              <GraduationCap className="h-3 w-3" aria-hidden /> Enrol
                            </Link>
                          )}
                        </>
                      ) : a.stage === "decision" ? (
                        <Link to="/offers/compare" className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900 hover:underline">
                          Record the offer <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">No offer yet</span>
                      )}
                    </div>
                  </li>
                );
              })}

              {unlinkedOffers.map((o) => (
                <li key={o.id} className="rounded-md border border-dashed bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{offerLabel(o)}</p>
                      <p className="text-xs text-muted-foreground">Offer not linked to a tracked application</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 gap-1">Offer: {o.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs">
                    <Link to="/offers/compare" className="text-primary underline">Link it to an application</Link>{" "}
                    so the thread is continuous.
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-wrap gap-2">
            <Link to="/tracker" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Open the tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link to="/offers/compare" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
              Compare offers <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </section>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How the spine works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Each programme advances through four stages on the tracker. At <strong>decision</strong> you record the
            admit as an offer; accepting an offer declines the others and links straight to the enrolment guide — one
            continuous thread from apply to enrol.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {STATE_LEGEND.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border bg-card p-3">
                  <dt className="flex items-center gap-2 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{s.description}</dd>
                </div>
              );
            })}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
