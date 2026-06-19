import { useMemo, useState } from "react";
import { Briefcase, GraduationCap, Mail } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { LOR_TEMPLATES } from "@/lib/seed/documents";
import type { LorRelationship } from "@/lib/seed/documents";

const RELATIONSHIPS: { key: LorRelationship; label: string; icon: typeof GraduationCap }[] = [
  { key: "professor", label: "Professor / academic", icon: GraduationCap },
  { key: "manager", label: "Manager / supervisor", icon: Briefcase },
];

/** Letter of Recommendation templates (Feature 08). Relationship + program → tailored template. */
export default function DocumentsLor() {
  const [relationship, setRelationship] = useState<LorRelationship>("professor");
  const [program, setProgram] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    LOR_TEMPLATES.find((t) => t.relationship === "professor")?.id ?? LOR_TEMPLATES[0].id,
  );

  const variants = useMemo(
    () => LOR_TEMPLATES.filter((t) => t.relationship === relationship),
    [relationship],
  );

  const selected = useMemo(
    () => variants.find((t) => t.id === selectedId) ?? variants[0],
    [variants, selectedId],
  );

  const filled = useMemo(() => {
    let body = selected?.body ?? "";
    if (program.trim()) body = body.split("{{Program name}}").join(program.trim());
    if (university.trim()) body = body.split("{{University name}}").join(university.trim());
    return body;
  }, [selected, program, university]);

  const chooseRelationship = (key: LorRelationship) => {
    setRelationship(key);
    const first = LOR_TEMPLATES.find((t) => t.relationship === key);
    if (first) setSelectedId(first.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 08 · Documents"
        title="Letter of Recommendation templates"
        description="Give recommenders a strong starting draft tailored to the program and your relationship."
        category="documents"
      />

      <Alert variant="info">
        <Mail aria-hidden />
        <AlertTitle>How to ask for a recommendation</AlertTitle>
        <AlertDescription>
          Ask early — at least four to six weeks before the deadline — and only people who know your
          work well. Make it easy for them: share your CV, the program link, your deadline, and a
          short note on what you'd like them to highlight. Offer this template as a starting point,
          but let the recommender write in their own words. They keep the
          <span className="font-mono"> {"{{placeholders}}"} </span>and fill in the specifics.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1 · Relationship</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RELATIONSHIPS.map(({ key, label, icon: Icon }) => {
                const active = relationship === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseRelationship(key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-category-documents bg-category-documents/10 font-medium text-foreground"
                        : "bg-card hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 text-category-documents" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2 · Program details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="lor-program" className="eyebrow block">
                  Program name
                </label>
                <Input
                  id="lor-program"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="M.Sc. Data Engineering"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lor-university" className="eyebrow block">
                  University
                </label>
                <Input
                  id="lor-university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="TU München"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3 · Variant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {variants.map((t) => {
                const active = t.id === selected?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-category-documents bg-category-documents/10" : "bg-card hover:bg-muted",
                    )}
                  >
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{t.blurb}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{selected?.label}</CardTitle>
              <Badge variant="secondary">Template — for the recommender to complete</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Placeholders in <span className="font-mono">{"{{double braces}}"}</span> are filled by
              your recommender. Program and university are pre-filled from the fields on the left.
            </p>
          </CardHeader>
          <CardContent>
            <label htmlFor="lor-body" className="sr-only">
              Recommendation letter template (editable)
            </label>
            <Textarea
              id="lor-body"
              readOnly
              value={filled}
              rows={26}
              className="font-mono text-xs leading-relaxed"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
