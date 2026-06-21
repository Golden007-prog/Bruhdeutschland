import { Link } from "react-router-dom";
import { ArrowRight, Award, ExternalLink, FileText, Search, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DocActions } from "@/components/common/DocActions";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { fileSlug } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import {
  ARBEITSZEUGNIS_NOTES,
  CV_CONTRASTS,
  JOB_PORTALS,
  JOB_SEARCH_SOURCES,
  JOB_TEMPLATES,
  WERKSTUDENT_CONVERSION,
} from "@/lib/seed/jobSearch";

/** A single editable, copyable/downloadable application template (state lives in the parent map). */
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
  const fieldId = `jobtpl-${id}`;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{context}</p>
          </div>
          <DocActions text={value} filename={`application-${fileSlug(title)}.txt`} />
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
          rows={18}
          className="font-mono text-xs leading-relaxed"
          spellCheck
        />
      </CardContent>
    </Card>
  );
}

/** G9-02 — Active German job-search toolkit (portals, CV/Anschreiben, Arbeitszeugnis, conversion). */
export default function CareerJobSearch() {
  const [drafts, setDrafts] = useSyncedState<Record<string, string>>(
    "career:jobsearch:drafts",
    Object.fromEntries(JOB_TEMPLATES.map((t) => [t.id, t.body])),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="§ Job search"
        title="Finding & applying for a German job"
        description="The app helps you qualify for a job and network academically — this is the execution layer: where to look, how a German CV and Anschreiben differ from what you know, how to read an Arbeitszeugnis, and how a Werkstudent role becomes a permanent one."
        category="profile"
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        The German market rewards a tailored, complete application over a polished generic one. Use the
        portals below, adapt the CV habits, and personalise the templates — never send them as-is.
      </p>

      {/* ── Where to look ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="portals-heading" className="space-y-3">
        <h2 id="portals-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Search className="h-5 w-5 text-primary" aria-hidden /> Where to look
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {JOB_PORTALS.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 font-semibold">
                  {p.name}
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" aria-hidden />
                </h3>
                {p.official && (
                  <Badge variant="outline" className="text-xs text-emerald-700">official</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.detail}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── German CV vs Europass ─────────────────────────────────────────────── */}
      <section aria-labelledby="cv-heading" className="space-y-3">
        <h2 id="cv-heading" className="text-lg font-semibold tracking-tight">
          German market CV vs the academic Europass
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium"> </th>
                <th className="p-3 font-medium">German Lebenslauf (job market)</th>
                <th className="p-3 font-medium text-muted-foreground">Academic / Europass habit</th>
              </tr>
            </thead>
            <tbody>
              {CV_CONTRASTS.map((c) => (
                <tr key={c.id} className="border-b last:border-0 align-top">
                  <td className="p-3 font-medium">{c.aspect}</td>
                  <td className="p-3">{c.germanCv}</td>
                  <td className="p-3 text-muted-foreground">{c.europass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/documents/cv" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Build your Europass CV (then tailor it) <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      {/* ── Editable templates ────────────────────────────────────────────────── */}
      <section aria-labelledby="templates-heading" className="space-y-3">
        <h2 id="templates-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FileText className="h-5 w-5 text-primary" aria-hidden /> Anschreiben & follow-up templates
        </h2>
        <Alert variant="warning">
          <Sparkles aria-hidden />
          <AlertDescription>
            These are <strong>starting templates — personalise them</strong>. Replace every bracketed
            placeholder and mirror the posting's own wording. A copied-as-is cover letter is easy to
            spot and easy to reject.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          {JOB_TEMPLATES.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              id={tpl.id}
              title={tpl.title}
              context={tpl.context}
              value={drafts[tpl.id] ?? tpl.body}
              onChange={(next) => setDrafts((d) => ({ ...d, [tpl.id]: next }))}
            />
          ))}
        </div>
      </section>

      {/* ── Arbeitszeugnis literacy ───────────────────────────────────────────── */}
      <section aria-labelledby="zeugnis-heading" className="space-y-3">
        <h2 id="zeugnis-heading" className="text-lg font-semibold tracking-tight">
          Read your Arbeitszeugnis (work reference)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ARBEITSZEUGNIS_NOTES.map((z) => (
            <Card key={z.id}>
              <CardHeader>
                <CardTitle className="text-base">{z.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{z.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Werkstudent → permanent ───────────────────────────────────────────── */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-primary" aria-hidden /> Turn a Werkstudent role into a permanent one
        </h2>
        <ul className="mt-3 space-y-2">
          {WERKSTUDENT_CONVERSION.map((s) => (
            <li key={s} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/finance/work" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Werkstudent rules <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link to="/arrival/job-seeker-permit" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Convert before your permit expires <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link to="/career/outcomes" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            Demand by field <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <SourceList sources={JOB_SEARCH_SOURCES} />
    </div>
  );
}
