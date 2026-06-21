import { Link } from "react-router-dom";
import { ArrowRight, HeartPulse, Phone, ShieldCheck, Stethoscope, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceLink, SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EMERGENCY_NUMBERS,
  SEEING_A_DOCTOR,
  SUPPORT_RESOURCES,
  SUPPORT_SOURCES,
} from "@/lib/seed/support";

/** G8-05 — Emergency / health / community support directory + buddy connect. */
export default function ArrivalSupport() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G8-05 · Arrival"
        title="Help, health & community — who to call"
        description="The arrival cluster is all admin. This is the other side: the numbers to call in an emergency, how to actually see a doctor, and where to get peer and mental-health support when something goes wrong."
        category="visa"
      />

      <Disclaimer />

      {/* ── Emergency numbers (grounded, stable facts) ────────────────────────── */}
      <section aria-labelledby="numbers-heading" className="space-y-3">
        <h2 id="numbers-heading" className="text-lg font-semibold tracking-tight">
          Emergency & on-call numbers
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {EMERGENCY_NUMBERS.map((n) => (
            <Card key={n.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="official-figure flex items-center gap-2 text-2xl font-bold">
                    <Phone className="h-5 w-5 text-category-visa" aria-hidden /> {n.number}
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <ShieldCheck className="h-3 w-3" aria-hidden /> Grounded
                  </span>
                </div>
                <p className="text-sm font-medium">{n.label}</p>
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <p className="text-sm text-muted-foreground">{n.when}</p>
                <SourceLink source={n.source} />
              </CardContent>
            </Card>
          ))}
        </div>
        <Alert variant="warning" className="text-sm">
          <Phone aria-hidden />
          <AlertDescription>
            Keep these three straight: <strong>112</strong> = life-threatening emergency,{" "}
            <strong>110</strong> = police, <strong>116117</strong> = a doctor today when it's{" "}
            <em>not</em> an emergency. 112 and 116117 work nationwide and are free.
          </AlertDescription>
        </Alert>
      </section>

      {/* ── How to see a doctor ───────────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Stethoscope className="h-4 w-4 text-category-visa" aria-hidden /> How to actually see a doctor
        </h2>
        <ul className="mt-3 space-y-2">
          {SEEING_A_DOCTOR.map((s) => (
            <li key={s} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <Link to="/finance/health-insurance" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Set up your health insurance <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {/* ── Peer / mental-health / community support ──────────────────────────── */}
      <section aria-labelledby="support-heading" className="space-y-3">
        <div>
          <h2 id="support-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <HeartPulse className="h-5 w-5 text-category-visa" aria-hidden /> Peer & mental-health support
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            These services exist at almost every German university, but the specific one is yours to
            find. Each card tells you how to locate your version.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {SUPPORT_RESOURCES.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-category-visa" aria-hidden /> {r.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto space-y-2 text-sm">
                <p className="text-muted-foreground">{r.detail}</p>
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="mr-1.5 text-[0.65rem]">Find yours</Badge>
                  {r.findYours}
                </p>
                {r.href && (
                  <Link to={r.href} className="inline-flex items-center gap-1 text-primary hover:underline">
                    Related tool <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
                {r.source && <SourceLink source={r.source} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <SourceList sources={SUPPORT_SOURCES} />
    </div>
  );
}
