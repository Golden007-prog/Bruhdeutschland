import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Plane } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { source } from "@/lib/sources";
import { cn } from "@/lib/utils";

type Situation = "admitted" | "applying" | "language" | "none";

const OPTIONS: { value: Exclude<Situation, "none">; label: string }[] = [
  { value: "admitted", label: "I have an admission (Zulassung) from a university" },
  { value: "applying", label: "I still need to apply / be in Germany to sort out admission" },
  { value: "language", label: "I'm going for a German language course (not a degree yet)" },
];

const GUIDANCE: Record<Exclude<Situation, "none">, { title: string; body: string }> = {
  admitted: {
    title: 'Student visa — National visa "D" for study',
    body: "With a full admission you apply for the student visa (study purpose). It's the standard route; convert it to a student residence permit after you arrive.",
  },
  applying: {
    title: "Student applicant visa (Visum zur Studienbewerbung)",
    body: "If you don't yet have admission but need to be in Germany to apply or finalise it (e.g. take an exam, attend Studienkolleg selection), the applicant visa lets you do that for a limited time, then switch to a study permit once admitted.",
  },
  language: {
    title: "Language-course visa",
    body: "For a German course alone, a language-course visa applies. Important: it usually cannot be converted to a study visa from inside Germany — confirm whether you'll need to return home to apply for the student visa afterwards.",
  },
};

/** G36 — visa-type selector. */
export default function VisaType() {
  const [situation, setSituation] = useState<Situation>("none");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G36 · Visa"
        title="Visa-type selector"
        description="Different situations need different German visas. Pick where you are and we'll point you to the right category — then verify the exact requirements with your mission."
        category="visa"
      />

      <Disclaimer />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Plane className="h-4 w-4 text-category-visa" aria-hidden /> Where are you right now?</h2>
        <div className="mt-3 space-y-2">
          {OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setSituation(o.value)} aria-pressed={situation === o.value}
              className={cn("flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", situation === o.value ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50")}>
              <span className={cn("h-3.5 w-3.5 rounded-full border", situation === o.value ? "border-primary bg-primary" : "")} aria-hidden />
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {situation !== "none" ? (
        <Alert variant="info">
          <Info aria-hidden />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">{GUIDANCE[situation].title}</p>
            <p>{GUIDANCE[situation].body}</p>
            <Link to="/visa/checklist" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">
              Visa document checklist <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>All of these are national (category D) long-stay visas. Your situation decides which one — pick an option above.</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Guidance only, not legal advice. Visa categories and their conditions are set by the Federal Foreign
        Office and your specific mission — always confirm before applying.
      </p>

      <SourceList sources={[source("autoVisa"), source("autoVisaFaq"), source("makeItInGermany")]} />
    </div>
  );
}
