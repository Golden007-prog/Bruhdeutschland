import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CULTURE_NORMS } from "@/lib/seed/campus";
import { source } from "@/lib/sources";

/** Academic culture & plagiarism — German study norms, with a prominent plagiarism warning. */
export default function CampusCulture() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 30 · Campus"
        title="Academic culture & plagiarism"
        description="How German universities expect you to study, cite, and behave — including strict plagiarism rules."
        category="campus"
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        German academic culture rewards independence, punctuality, and direct, well-reasoned
        argument. Much of it is unwritten — these are the norms that most surprise international
        students. None of this is a legal requirement, but getting it right makes seminars,
        supervision, and exams far smoother.
      </p>

      <Alert variant="danger">
        <ShieldAlert aria-hidden />
        <AlertTitle>Plagiarism is taken extremely seriously</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            German universities treat plagiarism (<em>Plagiat</em>) as serious academic misconduct.
            Consequences range from a failing grade to expulsion — and, for theses, the later
            revocation of a degree. Submitted work is routinely run through plagiarism-detection
            software.
          </p>
          <p>
            Cite every source — including paraphrased ideas, not just direct quotes — with a
            consistent citation style, and never reuse your own previously submitted work without
            permission (self-plagiarism). Most programmes require a signed declaration
            (<em>Eigenständigkeitserklärung</em>) that the work is entirely your own. When in doubt,
            cite, and ask your chair about the expected style.
          </p>
        </AlertDescription>
      </Alert>

      <section aria-labelledby="culture-norms" className="space-y-3">
        <h2 id="culture-norms" className="eyebrow">
          The norms · Studienkultur
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CULTURE_NORMS.map((norm) => (
            <Card key={norm.id}>
              <CardHeader>
                <CardTitle className="text-base">{norm.title}</CardTitle>
                <p className="text-sm font-medium text-foreground">{norm.summary}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{norm.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="rounded-md border border-dashed bg-muted/30 p-3">
        <p className="eyebrow mb-2">More · Weiterführend</p>
        <p className="mb-2 text-sm text-muted-foreground">
          For general guidance on studying in Germany, including academic expectations:
        </p>
        <SourceLink source={source("daad")} />
      </div>
    </div>
  );
}
