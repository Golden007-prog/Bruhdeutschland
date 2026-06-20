import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { careerAdviceSchema, type CareerAdviceResult } from "@/features/ai/schemas";
import { useGenerate } from "@/features/ai/useGenerate";
import { INTEREST_QUESTIONS, scoreInterests } from "@/lib/career/fields";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";

/** Long-game §5 — career counseling: a deterministic interest self-check + optional AI consultation. */
export default function CareerCounseling() {
  const { profile } = useProfile();
  const [selected, setSelected] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const ai = useGenerate<CareerAdviceResult>();

  const ranked = useMemo(() => scoreInterests(selected), [selected]);
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const consult = async () => {
    const interests = INTEREST_QUESTIONS.filter((q) => selected.includes(q.id)).map((q) => q.prompt);
    const prompt = [
      "Act as a study-and-career counsellor for someone planning to study at a German university.",
      "Suggest 3–5 study FIELDS (subjects/programme areas) that fit them. For each, give a short 'why' and",
      "honest 'tradeoffs'. This is guidance, not a guarantee — do not promise admission, salaries, or jobs.",
      "Prefer fields with real demand in Germany where relevant, but stay honest about competitiveness.",
      "",
      `Background: ${profile.currentDegree || "—"}, target field so far: ${profile.targetField || "undecided"}.`,
      interests.length ? `Selected interests: ${interests.join("; ")}.` : "",
      context.trim() ? `Extra context: ${context.trim()}.` : "",
    ].filter(Boolean).join("\n");
    await ai.generate(careerAdviceSchema, prompt, "{ fields: { field, why, tradeoffs }[] }", 0.6);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="§ Counseling"
        title="Career counseling & course selection"
        description="Not sure what to study? Tick what genuinely interests you for instant field suggestions, then (optionally) get an AI consultation. Everything feeds straight into university matching."
        category="profile"
      />

      {/* Interest self-check */}
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">What genuinely interests you?</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Tick all that apply — this is a quick, non-clinical self-check.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {INTEREST_QUESTIONS.map((q) => {
            const on = selected.includes(q.id);
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => toggle(q.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "border-emerald-300 bg-emerald-50/50" : "bg-card hover:bg-muted/50",
                  )}
                >
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", on ? "border-emerald-500 bg-emerald-500 text-white" : "bg-card")}>
                    {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                  <span>{q.prompt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Deterministic suggestions */}
      {ranked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Fields that fit your interests</h2>
          <ul className="space-y-2">
            {ranked.map(({ field }) => (
              <li key={field.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{field.name}</span>
                  {field.shortage && <Badge variant="outline" className="ml-2 text-xs text-emerald-700">in demand</Badge>}
                  <span className="mt-0.5 block text-xs text-muted-foreground">{field.roles.slice(0, 3).join(" · ")}</span>
                </span>
                <Link to={`/profile/matching?q=${encodeURIComponent(field.name)}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Find programmes <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/career/outcomes" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            See demand & outcomes for these fields <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </section>
      )}

      {/* AI consultation */}
      <section className="space-y-3 rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-category-profile" aria-hidden /> Optional: AI consultation</h2>
        <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="Anything else? e.g. strengths, constraints, dream role, subjects you liked or hated." aria-label="Extra context for the AI consultation" />
        <Button onClick={consult} disabled={ai.loading} aria-busy={ai.loading}>
          {ai.loading ? <><Loader2 className="animate-spin" aria-hidden /> Thinking…</> : <><Sparkles aria-hidden /> Get AI suggestions</>}
        </Button>
        {ai.noProvider && <NoProviderAlert />}
        {ai.error && <RetryAlert message={ai.error} onRetry={consult} />}
        {ai.result && (
          <div className="space-y-3" aria-live="polite">
            <div className="flex items-center justify-between"><p className="eyebrow">Suggested fields</p><AiGeneratedBadge /></div>
            {ai.result.fields.map((f, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{f.field}</p>
                <p className="mt-1"><span className="font-medium text-emerald-800">Why: </span><span className="text-muted-foreground">{f.why}</span></p>
                <p className="mt-1"><span className="font-medium text-amber-800">Trade-offs: </span><span className="text-muted-foreground">{f.tradeoffs}</span></p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">AI guidance, not a decision — verify every field against real requirements and your own goals.</p>
      </section>

      <Alert variant="info" className="text-sm">
        <AlertDescription>
          Once you have a field, jump to <Link to="/profile/matching" className="font-medium underline">university matching</Link> to find real programmes, and <Link to="/career/outcomes" className="font-medium underline">career outcomes</Link> to see where it leads.
        </AlertDescription>
      </Alert>
    </div>
  );
}
