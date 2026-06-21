import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Scale, Gavel, TriangleAlert, Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  REFUSAL_REASONS,
  REFUSAL_ROUTES,
  REFUSAL_SOURCES,
  SOURCE_REMONSTRATION,
  type RefusalRoute,
} from "@/lib/seed/visaRefusal";

const ROUTE_ICONS: Record<string, typeof RotateCcw> = {
  "ro-reapply": RotateCcw,
  "ro-legal": Scale,
  "ro-remonstration": Gavel,
};

/** G7-01 — Visa refusal & post-refusal (re-apply / legal action / remonstration) path. */
export default function VisaRefusal() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G7-01 · Visa"
        title="If your visa is refused — what now"
        description="A refusal is not the end of the road. Read the ground(s) the mission gave, fix them, and choose a deliberate next step: re-apply with stronger evidence, take legal action, or defer to the next intake."
        category="visa"
      />

      <Disclaimer />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertTitle>The appeal procedure changed — don't assume an old deadline</AlertTitle>
        <AlertDescription>
          <p>
            Germany <strong>abolished the remonstration (formal-objection) procedure worldwide from
            1&nbsp;July&nbsp;2025</strong>. For refusals dated on or after that date, the routes are
            to <strong>re-apply</strong> with improved evidence or to take <strong>legal action</strong>{" "}
            at the Administrative Court Berlin — not a one-month written objection. Any deadline and the
            exact procedure are mission-specific and change; confirm them on your own mission's page
            before relying on them.
          </p>
          <p className="mt-2">
            <SourceLink source={SOURCE_REMONSTRATION} />
          </p>
        </AlertDescription>
      </Alert>

      {/* ── Step 1: read the reasons, map to a remedy ─────────────────────────── */}
      <section aria-labelledby="reasons-heading" className="space-y-3">
        <div>
          <h2 id="reasons-heading" className="text-lg font-semibold tracking-tight">
            Common refusal grounds → how to fix each
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Since the procedure change, refusal notices give detailed reasons. Find the ground(s) your
            notice cites below, then act on the matching remedy before you re-apply or challenge it.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {REFUSAL_REASONS.map((r) => (
            <Card key={r.id} className="relative overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-category-visa" />
              <CardHeader className="pl-6">
                <CardTitle className="text-base">{r.reason}</CardTitle>
                <p className="text-sm text-muted-foreground">{r.why}</p>
              </CardHeader>
              <CardContent className="space-y-3 pl-6">
                <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    <Wrench className="h-4 w-4 text-category-visa" aria-hidden />
                    Remedy
                  </p>
                  <p className="mt-1 text-muted-foreground">{r.remedy}</p>
                </div>
                {r.href && (
                  <Link
                    to={r.href}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open the tool that helps <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Step 2: choose a route ────────────────────────────────────────────── */}
      <section aria-labelledby="routes-heading" className="space-y-3">
        <div>
          <h2 id="routes-heading" className="text-lg font-semibold tracking-tight">
            Your three routes after a refusal
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pick deliberately — re-applying is usually fastest when you can fix the ground; legal
            action is a real court case. Remonstration only still applies to old refusals.
          </p>
        </div>

        <div className="space-y-4">
          {REFUSAL_ROUTES.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </section>

      {/* ── Step 3: protect the intake (deferral) ─────────────────────────────── */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Don't lose your place — plan a deferral in parallel
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A refusal can run past your intake's enrolment deadline. Ask your university whether your
          admission can be deferred to the next intake, and re-plan your milestones from that new date
          so a second attempt isn't rushed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/start/timeline-planner"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            Re-plan from a new intake <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            to="/visa/appointment"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            Re-book a visa appointment <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            to="/visa/checklist"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted"
          >
            Rebuild the document set <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <SourceList sources={REFUSAL_SOURCES} />
    </div>
  );
}

/** One post-refusal route, with its steps and a needs-verification flag on the official procedure. */
function RouteCard({ route }: { route: RefusalRoute }) {
  const Icon = ROUTE_ICONS[route.id] ?? RotateCcw;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-category-visa" aria-hidden />
            {route.title}
          </CardTitle>
          {route.needsVerification && (
            <Badge variant="warning" className="gap-1">
              <TriangleAlert className="h-3 w-3" aria-hidden />
              Procedure varies — verify
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{route.when}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-2">
          {route.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {route.source && <SourceLink source={route.source} />}
      </CardContent>
    </Card>
  );
}
