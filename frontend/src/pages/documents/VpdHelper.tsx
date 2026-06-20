import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileSearch, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Path = "vpd" | "uniassist" | "direct" | "unknown";

const OPTIONS: { value: Exclude<Path, "unknown">; label: string }[] = [
  { value: "vpd", label: "It asks for a VPD (Vorprüfungsdokumentation)" },
  { value: "uniassist", label: "It says apply via uni-assist" },
  { value: "direct", label: "It says apply directly to the university" },
];

const GUIDANCE: Record<Exclude<Path, "unknown">, { title: string; body: string; to: string; cta: string }> = {
  vpd: {
    title: "Request a VPD from uni-assist",
    body: "Order a Vorprüfungsdokumentation from uni-assist, then send it directly to the university before its deadline. It takes weeks — start now.",
    to: "/documents/vpd",
    cta: "VPD tracker",
  },
  uniassist: {
    title: "Apply through uni-assist",
    body: "Create a uni-assist account, add your programmes, upload documents, and pay the fees. uni-assist checks and forwards your application to the universities.",
    to: "/documents/uni-assist",
    cta: "Uni-assist walkthrough",
  },
  direct: {
    title: "Apply directly to the university",
    body: "Use the university's own portal. You may still need certified copies and translations — and sometimes a VPD as part of the direct application. Read the programme page carefully.",
    to: "/documents/translation-tracker",
    cta: "Prepare your documents",
  },
};

/** G23 — VPD-or-direct decision helper. */
export default function DocumentsVpdHelper() {
  const [choice, setChoice] = useState<Path>("unknown");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G23 · Documents"
        title="VPD or direct application — decision helper"
        description="Different German universities want different things: a uni-assist VPD, a full uni-assist application, or a direct application on their own portal. This points you to the right path."
        category="documents"
      />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><FileSearch className="h-4 w-4 text-category-documents" aria-hidden /> What does your target programme's page say?</h2>
        <div className="mt-3 space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setChoice(o.value)}
              aria-pressed={choice === o.value}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                choice === o.value ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50",
              )}
            >
              <span className={cn("h-3.5 w-3.5 rounded-full border", choice === o.value ? "border-primary bg-primary" : "")} aria-hidden />
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {choice !== "unknown" ? (
        <Alert variant="info">
          <Info aria-hidden />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">{GUIDANCE[choice].title}</p>
            <p>{GUIDANCE[choice].body}</p>
            <Link to={GUIDANCE[choice].to} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">
              {GUIDANCE[choice].cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Not sure? The programme's <strong>"How to apply"</strong> page states it. If it's unclear, the
            university's international office will tell you — when in doubt, a VPD is widely accepted.
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">Guidance only. The programme page is the source of truth — always confirm there.</p>
    </div>
  );
}
