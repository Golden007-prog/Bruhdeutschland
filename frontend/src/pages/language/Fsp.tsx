import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";

const PREP: ChecklistItemDef[] = [
  { id: "german", label: "German (compulsory) — written + oral", hint: "Tested in every Kurs; the college lifts you to ~C1." },
  { id: "subject1", label: "Main subject 1 for your Kurs", hint: "e.g. Maths (T/W/M), or Literature/History (G), depending on your stream." },
  { id: "subject2", label: "Main subject 2 for your Kurs" },
  { id: "subject3", label: "Subject 3 / oral exam", hint: "The FSP is typically 3 written subjects + at least one oral." },
  { id: "past-papers", label: "Work through past FSP papers from your Studienkolleg", optional: true },
];

/** G08 — Feststellungsprüfung (FSP) prep + per-subject tracker. */
export default function LanguageFsp() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G08 · Language"
        title="Feststellungsprüfung (FSP) prep"
        description="The FSP at the end of the Studienkolleg is what actually confers your HZB. Pass it and you can apply to Bachelor programmes in your stream nationwide."
        category="language"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          The FSP is typically <strong>3 written subjects plus at least one oral</strong>, always including
          German, with the other subjects set by your <strong>Kurs</strong> (T/M/W/G/S). It's recognised
          nationally for that stream.
        </AlertDescription>
      </Alert>

      <Checklist items={PREP} title="Per-subject prep tracker" storageKey="fsp-prep" />

      <Alert variant="info" className="text-sm">
        <BookOpenCheck aria-hidden />
        <AlertDescription>
          Prep tip: the Studienkolleg year is built to get you here — attend everything, collect past
          papers, and treat German as the through-line, since it's tested in writing and orally.
        </AlertDescription>
      </Alert>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/studienkolleg" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Studienkolleg & your Kurs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/profile/matching" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          After FSP: find Bachelor programmes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">Guidance only. Exact subjects, weighting, and oral format are set per Studienkolleg — confirm with yours.</p>

      <SourceList sources={[source("studienkolleg"), source("anabin")]} />
    </div>
  );
}
