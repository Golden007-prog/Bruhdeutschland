import { AlertTriangle, FileText, Languages, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { DocActions } from "@/components/common/DocActions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { TRANSLATION_NEEDED, TRANSLATION_NOT_NEEDED } from "@/lib/seed/documents";

const DRAFT_TEMPLATE = `Translation request — working note (NOT a certified translation)

Language pair: [source language] -> German / English
Deadline: [date]

Documents to translate:
- [ ] Bachelor's degree certificate
- [ ] Transcript of records
- [ ] [other]

Notes for the translator:
- Please provide a certified (sworn) translation with stamp.
- University requires the translation stapled to a certified copy of the original: [yes/no].
`;

/** Translation assistant (Feature 11). */
export default function DocumentsTranslation() {
  const [draft, setDraft] = useSyncedState<string>("doc:translation:draft", DRAFT_TEMPLATE);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 11 · Documents"
        title="Translation assistant"
        description="Understand which documents need certified translations and prepare drafts to hand to a sworn translator."
        category="documents"
      />

      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Certified translations must come from a sworn translator</AlertTitle>
        <AlertDescription>
          German universities and authorities only accept translations produced by an officially
          recognised, <span className="font-medium">sworn (vereidigt/beeidigt)</span> translator, who
          stamps and certifies the document. Anything you prepare here is{" "}
          <span className="font-medium">only to organise your paperwork</span> — it is not a valid
          translation and cannot be submitted. Always have the final version done by a recognised
          translator.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Checklist items={TRANSLATION_NEEDED} title="Typically needs a certified translation" />
          <p className="px-1 text-xs text-muted-foreground">
            Required only when the document is not already in German or English. Check each program's
            language policy — many German public universities accept English-language originals.
          </p>
        </div>
        <div className="space-y-2">
          <Checklist items={TRANSLATION_NOT_NEEDED} title="Usually does not need translation" />
          <p className="px-1 text-xs text-muted-foreground">
            You author these directly in the application language, or they are never translated.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-category-documents" aria-hidden />
            Prepare a note for your translator
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            A working note to hand your sworn translator — list the documents, language pair, and
            deadline. This is organisation only; it is <strong>not</strong> a valid translation.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <label htmlFor="translation-draft" className="sr-only">
            Translator note (editable)
          </label>
          <Textarea
            id="translation-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            className="font-mono text-xs leading-relaxed"
          />
          <DocActions text={draft} filename="translator-note.txt" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-category-documents" aria-hidden />
            Finding a sworn translator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              In Germany, search the official register of sworn translators and interpreters at{" "}
              <a
                href="https://www.justiz-dolmetscher.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                justiz-dolmetscher.de
              </a>{" "}
              (the federal Justizportal database) and filter by your language pair.
            </li>
            <li>
              In your home country, a German embassy or consulate can often point you to translators
              whose certifications they accept.
            </li>
            <li>
              Confirm the translator is <span className="font-medium text-foreground">sworn for your
              language pair</span> and ask for the certification stamp — uncertified translations are
              routinely rejected.
            </li>
            <li>
              Send the translator clean, legible scans of the originals, and ask whether the
              university needs the translation stapled to a certified copy of the source document.
            </li>
            <li>
              <span className="inline-flex items-center gap-1">
                <Languages className="h-3.5 w-3.5" aria-hidden />
              </span>{" "}
              Budget time and cost: transcripts are long, and turnaround can take one to two weeks at
              busy periods.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
