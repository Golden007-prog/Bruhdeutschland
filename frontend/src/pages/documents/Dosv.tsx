import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, ExternalLink, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";

const STEPS = [
  "Check whether your programme is allocated via DoSV — many NC (numerus clausus) Bachelor subjects and Medicine are.",
  "Register once at hochschulstart.de to get your BID and BAN identifiers; you'll reuse them everywhere.",
  "Apply to each programme (often still via the university or uni-assist), then link them in your hochschulstart account.",
  "Set your PRIORITIES — rank your choices. In the dialogue-oriented procedure, offers are made top-priority first.",
  "Watch for offers and accept promptly; an accepted higher-priority offer automatically withdraws the lower ones.",
];

/** G24 — DoSV / hochschulstart walkthrough (NC Bachelor & Medicine central allocation). */
export default function DocumentsDosv() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G24 · Documents"
        title="DoSV / hochschulstart walkthrough"
        description="For many NC Bachelor subjects and for Medicine, places are coordinated centrally through hochschulstart's dialogue-oriented service procedure (DoSV). Here's how it actually works."
        category="documents"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          DoSV coordinates offers across universities so you don't block multiple seats. Your{" "}
          <strong>priority order</strong> matters: the system makes you the highest-priority offer you
          qualify for and clears the rest.
        </AlertDescription>
      </Alert>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4 text-category-documents" aria-hidden /> The procedure, step by step</h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <a href={source("hochschulstart").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          hochschulstart.de <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <Alert variant="warning" className="text-sm">
        <AlertDescription>
          International (non-EU) applicants sometimes apply through a different quota or directly to the
          university rather than DoSV — confirm which route your programme uses for your nationality.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/pathway" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Your pathway <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/documents/vpd-helper" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          VPD or direct? <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. The exact procedure and which programmes use DoSV are set by hochschulstart and the universities — verify there.</p>

      <SourceList sources={[source("hochschulstart"), source("daadProcess")]} />
    </div>
  );
}
