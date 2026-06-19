import { useState } from "react";
import { FileText, Lightbulb, Wand2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SopForm {
  program: string;
  university: string;
  background: string;
  motivation: string;
  whyProgram: string;
  careerGoal: string;
}

const EMPTY: SopForm = {
  program: "",
  university: "",
  background: "",
  motivation: "",
  whyProgram: "",
  careerGoal: "",
};

/** Split a textarea of newline-separated bullets into clean lines. */
function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

/** Deterministic, template-based SOP composition — no LLM, no backend. */
function composeDraft(f: SopForm): string {
  const program = f.program.trim() || "[target program]";
  const university = f.university.trim() || "[university]";
  const motivationBullets = lines(f.motivation);

  const intro = `I am applying for the ${program} at ${university}. ${
    f.background.trim()
      ? f.background.trim()
      : "[Open with who you are academically and professionally, and the single thread that ties your story to this program.]"
  }`;

  const motivation = motivationBullets.length
    ? `My motivation is grounded in concrete experience:\n` +
      motivationBullets.map((b) => `  • ${b}`).join("\n")
    : "[State what draws you to this field, with one or two specific experiences as evidence — a project, a course, a problem you could not put down.]";

  const fit = f.whyProgram.trim()
    ? `${university}'s ${program} is the right fit for me because ${lowerFirst(f.whyProgram.trim())}`
    : `[Name specific modules, research groups, professors, or labs at ${university} and explain why they match your goals. Generic praise reads as filler.]`;

  const goal = f.careerGoal.trim()
    ? `After completing the program, my goal is to ${lowerFirst(f.careerGoal.trim())} The ${program} is the deliberate next step toward it.`
    : "[Close with a clear, realistic goal for after graduation and how this degree connects to it.]";

  return [
    `Statement of Purpose`,
    `${program} — ${university}`,
    ``,
    `1. Introduction`,
    intro,
    ``,
    `2. Motivation & background`,
    motivation,
    ``,
    `3. Why this program`,
    fit,
    ``,
    `4. Career goals`,
    goal,
    ``,
    `Sincerely,`,
    `[Your name]`,
  ].join("\n");
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Statement of Purpose generator (Feature 06). Form → template-composed editable draft. */
export default function DocumentsSop() {
  const [form, setForm] = useState<SopForm>(EMPTY);
  const [draft, setDraft] = useState("");

  const set =
    <K extends keyof SopForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const generate = () => setDraft(composeDraft(form));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 06 · Documents"
        title="Statement of Purpose generator"
        description="Build a tailored SOP from your profile and a target program — structured, specific, and yours to edit."
        category="documents"
      />

      <Alert variant="info">
        <Lightbulb aria-hidden />
        <AlertTitle>How to write a strong SOP</AlertTitle>
        <AlertDescription>
          Admissions committees read hundreds of these. Be specific over superlative: name real
          courses, projects, and outcomes. Aim for roughly 500–800 words across four sections —
          introduction, motivation, fit with the program, and career goals.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-category-documents" aria-hidden />
              Your inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="sop-program" className="eyebrow block">
                  Target program
                </label>
                <Input
                  id="sop-program"
                  value={form.program}
                  onChange={set("program")}
                  placeholder="M.Sc. Data Engineering"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sop-university" className="eyebrow block">
                  University
                </label>
                <Input
                  id="sop-university"
                  value={form.university}
                  onChange={set("university")}
                  placeholder="TU München"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sop-background" className="eyebrow block">
                Your background
              </label>
              <Textarea
                id="sop-background"
                value={form.background}
                onChange={set("background")}
                placeholder="One or two sentences: your degree, focus area, and a defining experience."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sop-motivation" className="eyebrow block">
                Motivation (one point per line)
              </label>
              <Textarea
                id="sop-motivation"
                value={form.motivation}
                onChange={set("motivation")}
                placeholder={"Led a 3-person team building a recommender system\nThesis on distributed stream processing"}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Each line becomes a bullet. Use concrete, evidenced points.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sop-why" className="eyebrow block">
                Why this program
              </label>
              <Textarea
                id="sop-why"
                value={form.whyProgram}
                onChange={set("whyProgram")}
                placeholder="its data-systems track and Prof. X's research group align exactly with my interests."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sop-goal" className="eyebrow block">
                Career goal
              </label>
              <Textarea
                id="sop-goal"
                value={form.careerGoal}
                onChange={set("careerGoal")}
                placeholder="work as a data platform engineer building large-scale pipelines in Europe."
                rows={2}
              />
            </div>

            <Button onClick={generate} className="w-full">
              <Wand2 aria-hidden />
              Generate draft
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated draft — edit before sending</CardTitle>
            <p className="text-xs text-muted-foreground">
              This is a template-assembled starting point, not a finished essay. Rewrite it in your
              own voice, tighten the prose, and verify every detail before you submit.
            </p>
          </CardHeader>
          <CardContent>
            <label htmlFor="sop-draft" className="sr-only">
              Generated SOP draft (editable)
            </label>
            <Textarea
              id="sop-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Fill in the form and select “Generate draft”. Your editable SOP will appear here."
              rows={22}
              className="official-figure font-mono text-xs leading-relaxed"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
