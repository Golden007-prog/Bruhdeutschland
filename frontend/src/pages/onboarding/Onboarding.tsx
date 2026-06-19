import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Map as MapIcon, ScanLine, Sparkles } from "lucide-react";

import { IntakeFields } from "@/features/profile/IntakeFields";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatGermanGrade } from "@/lib/calc/gpa";
import { deriveGermanGpa } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { cn } from "@/lib/utils";

const STEPS = ["Welcome", "Your background", "Done"];

/** First-run onboarding wizard (work order §10) → ends on the roadmap so the user never dead-ends. */
export default function Onboarding() {
  const { profile, update } = useProfile();
  const [, setOnboarded] = useSyncedState<boolean>("onboarded:v1", false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const conv = deriveGermanGpa(profile);

  const finish = (to: string) => {
    setOnboarded(true);
    navigate(to);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/welcome" className="text-lg font-bold tracking-tight">
            Deutsch<span className="text-primary">Prep</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Skip for now</Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        {/* Progress */}
        <ol className="mb-8 flex items-center justify-center gap-2" aria-label="Onboarding progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "border-2 border-primary text-primary" : "border text-muted-foreground",
                )}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              {i < STEPS.length - 1 && <span aria-hidden className={cn("h-px w-8", i < step ? "bg-primary" : "bg-border")} />}
            </li>
          ))}
        </ol>

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Let&apos;s build your roadmap</h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                In two minutes we&apos;ll turn your background into a personalized plan for applying to a
                German Master&apos;s — grade converted, programs to explore, and the steps in order.
              </p>
              <ul className="mx-auto max-w-sm space-y-2 text-left text-sm">
                {["Tell us your degree, grade, and target field", "We compute your German grade deterministically", "You get an ordered roadmap and a tracker"].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-center pt-2">
                <Button onClick={() => setStep(1)}>Get started <ArrowRight aria-hidden /></Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Your background</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill what you know — you can change it later in Settings. Prefer to upload a résumé?{" "}
                  <Link to="/profile/parse" className="font-medium text-primary hover:underline">
                    <ScanLine className="mr-0.5 inline h-3.5 w-3.5" aria-hidden />Parse a résumé
                  </Link>{" "}
                  and come back.
                </p>
              </div>
              <IntakeFields value={profile} onChange={update} idPrefix="onb" />
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft aria-hidden /> Back</Button>
                <Button onClick={() => setStep(2)}>Continue <ArrowRight aria-hidden /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Sparkles aria-hidden />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">You&apos;re set up</h1>
              {conv ? (
                <p className="text-sm text-muted-foreground">
                  Your German grade is <span className="official-figure font-semibold text-foreground">{formatGermanGrade(conv.germanGrade)}</span>{" "}
                  (computed via the Modified Bavarian Formula). Your roadmap is ready.
                </p>
              ) : (
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Your profile is saved. Add a grade and scale in Settings any time to compute your
                  German grade. Your roadmap is ready.
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button onClick={() => finish("/roadmap")}><MapIcon aria-hidden /> Go to my roadmap</Button>
                <button onClick={() => finish("/")} className={cn(buttonVariants({ variant: "outline" }))}>
                  Open dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
