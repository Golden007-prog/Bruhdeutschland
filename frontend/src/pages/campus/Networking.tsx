import { useState } from "react";
import { Check, Copy, Lightbulb, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { NETWORKING_TEMPLATES, NETWORKING_TIPS } from "@/lib/seed/campus";

/** A single editable, copyable outreach template (state lives in the parent map). */
function TemplateCard({
  id,
  title,
  context,
  value,
  onChange,
}: {
  id: string;
  title: string;
  context: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const fieldId = `template-${id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{context}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copy} aria-label={`Copy ${title} template`}>
            {copied ? (
              <>
                <Check className="text-emerald-600" aria-hidden /> Copied
              </>
            ) : (
              <>
                <Copy aria-hidden /> Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <label htmlFor={fieldId} className="eyebrow mb-1.5 block">
          Editable draft
        </label>
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="font-mono text-xs leading-relaxed"
          spellCheck
        />
      </CardContent>
    </Card>
  );
}

/** Academic networking — practical tips plus editable email templates for outreach. */
export default function CampusNetworking() {
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(NETWORKING_TEMPLATES.map((t) => [t.id, t.body])),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 28 · Campus"
        title="Academic networking"
        description="Build relationships with professors, peers, and student groups — how to reach out and what to say."
        category="campus"
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Your network shapes your German degree as much as your grades do — it&apos;s how you find a
        thesis supervisor, past exams, study partners, and later, HiWi roles and references. German
        academia values initiative: reaching out directly is expected, as long as you&apos;re specific
        and respectful of people&apos;s time.
      </p>

      <section aria-labelledby="networking-tips" className="space-y-3">
        <h2 id="networking-tips" className="eyebrow">
          Where to start · Praktische Tipps
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {NETWORKING_TIPS.map((tip) => (
            <Card key={tip.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-category-campus" aria-hidden />
                  {tip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tip.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="networking-templates" className="space-y-3">
        <h2 id="networking-templates" className="eyebrow">
          Email templates · Vorlagen
        </h2>
        <Alert variant="warning">
          <Sparkles aria-hidden />
          <AlertDescription>
            These are <strong>generated starting templates — personalise them</strong> before sending.
            Replace every bracketed placeholder, name the specific paper or topic you mention, and
            match the tone to the person. A copied-as-is email is easy to spot and easy to ignore.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          {NETWORKING_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              id={tpl.id}
              title={tpl.title}
              context={tpl.context}
              value={drafts[tpl.id]}
              onChange={(next) => setDrafts((d) => ({ ...d, [tpl.id]: next }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
