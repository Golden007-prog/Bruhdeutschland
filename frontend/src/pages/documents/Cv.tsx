import { ExternalLink, Loader2, Mail, MapPin, Phone, Sparkles, User, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DocActions } from "@/components/common/DocActions";
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
import { fileSlug } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import type { UserProfile } from "@/lib/profile/types";
import { source } from "@/lib/sources";

/** "2024-03" → "03/2024" (EU date format). */
function ymToEu(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym ?? "");
  return m ? `${m[2]}/${m[1]}` : ym ?? "";
}

/** Render the profile's work experience as reverse-chronological Europass lines. */
function experienceLines(p: UserProfile): string {
  return [...(p.workExperiences ?? [])]
    .sort((a, b) => (b.ongoing ? "9999-99" : b.endDate || b.startDate).localeCompare(a.ongoing ? "9999-99" : a.endDate || a.startDate))
    .map((w) => {
      const end = w.ongoing ? "present" : ymToEu(w.endDate);
      const dates = [ymToEu(w.startDate), end].filter(Boolean).join("–");
      const place = [w.employer, w.country].filter(Boolean).join(", ");
      return [dates, w.title, place, w.description].filter(Boolean).join(" · ");
    })
    .join("\n");
}

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

/** Plain-text Europass-style export of the CV form (for copy/download). */
function cvToText(f: CvForm): string {
  const out: string[] = [f.fullName || "Your name"];
  const contact = [f.email, f.phone, f.location].filter(Boolean).join(" · ");
  if (contact) out.push(contact);
  if (f.summary.trim()) out.push("", f.summary.trim());
  const section = (title: string, text: string) => {
    const items = entries(text);
    if (!items.length) return;
    out.push("", title.toUpperCase(), ...items.map((i) => `- ${i}`));
  };
  section("Education & training", f.education);
  section("Work experience", f.experience);
  section("Skills", f.skills);
  section("Languages", f.languages);
  return out.join("\n");
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
  const [form, setForm] = useSyncedState<CvForm>("doc:cv:form", EMPTY);
  const { profile } = useProfile();
  const ai = useGenerate<CvPolishResult>();

  /** Pull structured profile data into empty CV fields (never overwrites what you've typed). */
  const fillFromProfile = () => {
    const expLines = experienceLines(profile);
    const eduLine = [profile.graduationDate ? ymToEu(profile.graduationDate) : "", profile.currentDegree, profile.institution]
      .filter(Boolean)
      .join(" · ");
    const expSkills = [...new Set((profile.workExperiences ?? []).flatMap((w) => w.skills))].join(", ");
    const lang = profile.germanLevel && profile.germanLevel !== "none" ? `German — ${profile.germanLevel}` : "";
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profile.name,
      education: prev.education || eduLine,
      experience: prev.experience || expLines,
      skills: prev.skills || expSkills,
      languages: prev.languages || lang,
    }));
  };
  const hasProfileData = Boolean(profile.name || (profile.workExperiences ?? []).length || profile.currentDegree);

  const set =
    <K extends keyof CvForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const hasContact = form.email || form.phone || form.location;
  const canPolish = Boolean(form.summary.trim() || form.experience.trim() || form.skills.trim());
  const hasContent = Boolean(
    form.fullName || form.summary || form.education || form.experience || form.skills || form.languages,
  );

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <SourceLink source={source("europass")} />
            <a
              href="https://europa.eu/europass/en/create-europass-cv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Open the Europass CV editor <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">CV details</CardTitle>
              {hasProfileData && (
                <Button variant="outline" size="sm" onClick={fillFromProfile}>
                  <Wand2 aria-hidden /> Fill from my profile
                </Button>
              )}
            </div>
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
            <p className="text-xs text-muted-foreground">Europass-style layout. Copy or download the text, then paste it into the official editor to export.</p>
            {hasContent && (
              <DocActions
                text={cvToText(form)}
                filename={`cv-${fileSlug(form.fullName || "europass")}.txt`}
                className="pt-1"
              />
            )}
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
