import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink, FileBadge, Info, OctagonAlert, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

const CATEGORIES: { tag: string; label: string; detail: string; tone: "ok" | "warn" | "block" }[] = [
  { tag: "H+", label: "Direct general access", detail: "Your certificate gives direct access to study any subject — closest to a German Abitur.", tone: "ok" },
  { tag: "H+- / restricted", label: "Subject- or route-restricted", detail: "Access only to certain subjects, or only after a Studienkolleg + Feststellungsprüfung (FSP).", tone: "warn" },
  { tag: "H- / direct-after-uni", label: "Only after university at home", detail: "No direct access from school; you typically need 1–2 years of recognised university study in your home country first.", tone: "warn" },
  { tag: "not listed", label: "Not (yet) recognised", detail: "Your qualification isn't in anabin as access-granting — a Studienkolleg or other bridge is usually required.", tone: "block" },
];

const STEPS = [
  "Open anabin and search your country under “Schulabschlüsse mit Hochschulzugang” (school-leaving) or “Hochschulen” (your university/degree).",
  "Find your exact certificate / institution and read its access note (allgemeiner Hochschulzugang, fachgebunden, or via Studienkolleg).",
  "Cross-check with your target university's international office — they make the binding call and may ask for a VPD from uni-assist.",
  "If access is restricted or absent, plan the Studienkolleg → FSP route (school-leavers) or complete university study at home first.",
];

const TONE_CLS = {
  ok: "border-emerald-200 bg-emerald-50/50",
  warn: "border-amber-200 bg-amber-50/50",
  block: "border-red-200 bg-red-50/50",
} as const;

const TONE_ICON = { ok: CheckCircle2, warn: TriangleAlert, block: OctagonAlert } as const;

/** G05 — Recognition (anabin / HZB) guided lookup. We orient; anabin/the university decides. */
export default function ProfileRecognition() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G05 · Foundations"
        title="Qualification recognition — anabin & HZB"
        description="Whether you can study in Germany hinges on your Hochschulzugangsberechtigung (HZB) — how your certificates are recognised. This explains the categories and walks you through the binding anabin lookup."
        category="profile"
      />

      <Alert variant="warning" className="text-sm">
        <TriangleAlert aria-hidden />
        <AlertDescription>
          We <strong>do not compute or guess</strong> your recognition. The binding decision is anabin's
          (the KMK database) and your university's — this page tells you exactly how to find it.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The HZB categories</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const Icon = TONE_ICON[c.tone];
            return (
              <div key={c.tag} className={cn("rounded-md border p-3", TONE_CLS[c.tone])}>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden /> {c.tag}
                </p>
                <p className="mt-0.5 text-sm font-medium">{c.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileBadge className="h-4 w-4 text-category-profile" aria-hidden /> How to look yourself up on anabin
        </h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <a href={source("anabin").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          Open anabin <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          anabin is in German. Use the browser's translate, and note the key terms: <em>allgemeiner
          Hochschulzugang</em> (general access), <em>fachgebunden</em> (subject-restricted), and{" "}
          <em>Studienkolleg</em> (foundation year required).
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          See your study pathway <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/profile/studienkolleg" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Studienkolleg route <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/vpd" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Get a VPD <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <SourceList sources={[source("anabin"), source("uniAssistVpd"), source("daadRequirements")]} />
    </div>
  );
}
