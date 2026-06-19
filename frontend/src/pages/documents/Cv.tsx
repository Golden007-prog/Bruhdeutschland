import { useState } from "react";
import { Loader2, Mail, MapPin, Phone, Sparkles, User } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { SourceLink } from "@/components/common/SourceLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { cvPolishSchema, type CvPolishResult } from "@/features/ai/schemas";
import { useGenerate } from "@/features/ai/useGenerate";
import { source } from "@/lib/sources";

interface CvForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: string;
  experience: string;
  skills: string;
  languages: string;
}

const EMPTY: CvForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  education: "",
  experience: "",
  skills: "",
  languages: "",
};

function entries(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Renders a preview section only when it has content. */
function PreviewSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-4">
      <h3 className="eyebrow text-category-documents">{title}</h3>
      <Separator className="my-1.5 bg-category-documents/30" />
      <ul className="space-y-1 text-sm">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Europass CV builder (Feature 07). Form sections in state → live preview. */
export default function DocumentsCv() {
  const [form, setForm] = useState<CvForm>(EMPTY);
  const ai = useGenerate<CvPolishResult>();

  const set =
    <K extends keyof CvForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const hasContact = form.email || form.phone || form.location;
  const canPolish = Boolean(form.summary.trim() || form.experience.trim() || form.skills.trim());

  const polishWithAi = async () => {
    const prompt = [
      "Polish this CV content for a Master's application at a German public university.",
      "Use ONLY the facts provided — do not invent roles, employers, dates, or metrics.",
      "Write a concise professional summary (2–3 sentences) and rewrite each work-experience line",
      "as a stronger, action-led bullet. Neutral professional English.",
      "",
      `Current summary: ${form.summary.trim() || "(none)"}`,
      `Skills: ${form.skills.trim() || "(none)"}`,
      `Education: ${form.education.trim() || "(none)"}`,
      `Work experience (one per line):\n${form.experience.trim() || "(none)"}`,
    ].join("\n");
    const result = await ai.generate(
      cvPolishSchema,
      prompt,
      "{ summary: string, experienceBullets: string[] }",
      0.6,
    );
    if (result) {
      setForm((prev) => ({
        ...prev,
        summary: result.summary,
        experience: result.experienceBullets.length
          ? result.experienceBullets.join("\n")
          : prev.experience,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 07 · Documents"
        title="Europass CV builder"
        description="Produce a Europass-format CV, the European standard German universities recognize."
        category="documents"
      />

      <Alert variant="info">
        <User aria-hidden />
        <AlertTitle>Europass is the recognised EU standard</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Europass is the European Union's standard CV format. German universities and uni-assist
            recognise it, and you can export an official version with the EU's free online editor.
            Build a draft here, then transfer it into the Europass editor for the final document.
          </p>
          <SourceLink source={source("europass")} />
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CV details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <fieldset className="space-y-3">
              <legend className="eyebrow mb-1">Personal information</legend>
              <div className="space-y-1.5">
                <label htmlFor="cv-name" className="eyebrow block">
                  Full name
                </label>
                <Input id="cv-name" value={form.fullName} onChange={set("fullName")} placeholder="Jane Doe" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="cv-email" className="eyebrow block">
                    Email
                  </label>
                  <Input id="cv-email" type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cv-phone" className="eyebrow block">
                    Phone
                  </label>
                  <Input id="cv-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+49 …" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cv-location" className="eyebrow block">
                  Location
                </label>
                <Input id="cv-location" value={form.location} onChange={set("location")} placeholder="Munich, Germany" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cv-summary" className="eyebrow block">
                  Personal statement
                </label>
                <Textarea id="cv-summary" value={form.summary} onChange={set("summary")} rows={3} placeholder="One short paragraph summarising your profile and goal." />
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="cv-education" className="eyebrow block">
                Education &amp; training (one entry per line)
              </label>
              <Textarea id="cv-education" value={form.education} onChange={set("education")} rows={3} placeholder={"2020–2024 · B.Sc. Computer Science · IIT Delhi · GPA 8.7/10\n2018 · Higher secondary · …"} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cv-experience" className="eyebrow block">
                Work experience (one entry per line)
              </label>
              <Textarea id="cv-experience" value={form.experience} onChange={set("experience")} rows={3} placeholder={"2024–present · Backend Engineer · Acme GmbH · …"} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cv-skills" className="eyebrow block">
                Skills (one per line)
              </label>
              <Textarea id="cv-skills" value={form.skills} onChange={set("skills")} rows={3} placeholder={"Python, Go, SQL\nDistributed systems\nDocker, Kubernetes"} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cv-languages" className="eyebrow block">
                Languages (one per line)
              </label>
              <Textarea id="cv-languages" value={form.languages} onChange={set("languages")} rows={2} placeholder={"English — C1 (IELTS 7.5)\nGerman — B1\nHindi — native"} />
            </div>

            <div className="space-y-2 border-t pt-4">
              <Button
                onClick={polishWithAi}
                disabled={ai.loading || !canPolish}
                aria-busy={ai.loading}
                className="w-full"
              >
                {ai.loading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Polishing with AI…
                  </>
                ) : (
                  <>
                    <Sparkles aria-hidden />
                    Polish summary &amp; bullets with AI
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Rewrites your summary and experience lines from the facts you entered. Review before
                using — nothing is invented.
              </p>
              <p className="sr-only" role="status" aria-live="polite">
                {ai.loading ? "Polishing your CV with AI." : ""}
              </p>
              {ai.noProvider && <NoProviderAlert />}
              {ai.error && <RetryAlert message={ai.error} onRetry={polishWithAi} />}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4 self-start">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Live preview</CardTitle>
              {ai.result && <AiGeneratedBadge />}
            </div>
            <p className="text-xs text-muted-foreground">Europass-style layout. Copy into the official editor to export.</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-card p-5">
              <header className="border-l-2 border-l-category-documents pl-3">
                <p className="text-lg font-bold tracking-tight">
                  {form.fullName || <span className="text-muted-foreground">Your name</span>}
                </p>
                {hasContact && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {form.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" aria-hidden /> {form.email}
                      </span>
                    )}
                    {form.phone && (
                      <span className="inline-flex items-center gap-1 official-figure">
                        <Phone className="h-3 w-3" aria-hidden /> {form.phone}
                      </span>
                    )}
                    {form.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden /> {form.location}
                      </span>
                    )}
                  </div>
                )}
              </header>

              {form.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{form.summary}</p>}

              <PreviewSection title="Education & training" items={entries(form.education)} />
              <PreviewSection title="Work experience" items={entries(form.experience)} />
              <PreviewSection title="Skills" items={entries(form.skills)} />
              <PreviewSection title="Languages" items={entries(form.languages)} />

              {!form.fullName &&
                !form.summary &&
                !entries(form.education).length &&
                !entries(form.experience).length && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Fill in the form to see your CV take shape here.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
