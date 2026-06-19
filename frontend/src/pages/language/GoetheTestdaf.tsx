import { Link } from "react-router-dom";
import { ArrowRight, Compass, Info } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { source } from "@/lib/sources";
import { TESTDAF_TYPICAL } from "@/lib/facts";
import { GERMAN_CERTIFICATES } from "@/lib/seed/language";

interface ChooserHint {
  situation: string;
  pick: string;
}

const CHOOSER: ChooserHint[] = [
  {
    situation: "You're preparing abroad and want a fixed, internationally-available test date.",
    pick: "TestDaF (digital) or Goethe-Zertifikat C1 — both run at centres worldwide.",
  },
  {
    situation: "You'll already be in Germany at your host university.",
    pick: "DSH-2 — run by the university itself and accepted there directly.",
  },
  {
    situation: "You want a test built specifically around university entry.",
    pick: "telc Deutsch C1 Hochschule — academic-context tasks, recognised for admission.",
  },
  {
    situation: "You're aiming at German-language teaching or research tracks.",
    pick: "Goethe-Zertifikat C2 (GDS) — the highest CEFR level.",
  },
];

export default function LanguageGoetheTestdaf() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 16 · Language"
        title="Goethe & TestDaF guides"
        description="Pick the right German certificate (TestDaF, DSH, Goethe, telc) and prepare for each section."
        category="language"
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>One accepted certificate is enough — but acceptance is per program</AlertTitle>
        <AlertDescription>
          German-taught programs publish which certificates and which level they accept. The four
          below are the most common; confirm the exact requirement (and any per-section minimum) on
          your program page before choosing.
        </AlertDescription>
      </Alert>

      <OfficialFactRow fact={TESTDAF_TYPICAL} />

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificate comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                German-language certificates accepted for university admission
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Certificate
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Result / level
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Format
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Notes &amp; source
                  </th>
                </tr>
              </thead>
              <tbody>
                {GERMAN_CERTIFICATES.map((c) => (
                  <tr key={c.id} className="border-b align-top last:border-0">
                    <th scope="row" className="py-3 pr-3 text-left font-medium">
                      {c.name}
                    </th>
                    <td className="py-3 pr-3">
                      <span className="official-figure">{c.result}</span>
                      <p className="mt-1 text-xs text-muted-foreground">{c.acceptance}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{c.format}</td>
                    <td className="py-3">
                      <p className="text-muted-foreground">{c.notes}</p>
                      <div className="mt-2">
                        <SourceLink source={c.source} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Help me choose */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-category-language" aria-hidden />
            <CardTitle className="text-base">Which one should I take?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {CHOOSER.map((h) => (
              <li key={h.situation} className="rounded-md border p-3">
                <p className="text-sm font-medium">{h.situation}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Consider:</span> {h.pick}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Practice links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Practice these exams</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            to="/language/exams/testdaf"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            TestDaF practice exam <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/language/exams/goethe"
            className="inline-flex items-center gap-1 rounded-md border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Goethe practice exam <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <SourceLink source={source("goethe")} className="self-center" />
          <SourceLink source={source("testdaf")} className="self-center" />
          <SourceLink source={source("telc")} className="self-center" />
        </CardContent>
      </Card>
    </div>
  );
}
