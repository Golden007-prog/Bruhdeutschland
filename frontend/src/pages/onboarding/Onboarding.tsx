import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, LogOut, Map as MapIcon, ScanLine, Sparkles } from "lucide-react";

import { GateLoader } from "@/components/auth/AppGate";
import { AiSettings } from "@/features/settings/AiSettings";
import { IntakeFields } from "@/features/profile/IntakeFields";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatGermanGrade } from "@/lib/calc/gpa";
import { deriveGermanGpa } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { useSyncHydrated, useSyncedState } from "@/lib/persist/useSyncedState";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signOut } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

const STEPS = ["Welcome", "Set up AI", "Your background", "Done"];

/**
 * The required setup funnel (gated model): sign-in → AI setup → intake → unlock. Redirects out only on
 * the EXPLICIT onboarded flag (not profile-started), so filling intake mid-wizard doesn't eject the user.
 */
export default function Onboarding() {
  const { configured, loading, user } = useAuth();
  const hydrated = useSyncHydrated();
  const { profile, update } = useProfile();
  const [onboarded, setOnboarded] = useSyncedState<boolean>("onboarded:v1", false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const conv = deriveGermanGpa(profile);

  // Guard: require sign-in; send already-onboarded users to the app.
  if (configured) {
    if (loading || !hydrated) return <GateLoader />;
    if (!user) return <Navigate to="/welcome" replace />;
  }
  // Already-onboarded users skip the wizard — applies in guest mode too (configured === false), so a
  // returning guest who reopens /onboarding isn't made to re-run setup.
  if (onboarded) return <Navigate to="/" replace />;

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
          {configured && user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Log out
            </button>
          ) : (
            <Link to="/welcome" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
          )}
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
              {i < STEPS.length - 1 && <span aria-hidden className={cn("h-px w-6 sm:w-8", i < step ? "bg-primary" : "bg-border")} />}
            </li>
          ))}
        </ol>

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Welcome — let&apos;s set you up</h1>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                A quick three-step setup unlocks your personalized dashboard: choose how AI runs, tell us
                your background, and we build your roadmap. You only do this once.
              </p>
              <ul className="mx-auto max-w-sm space-y-2 text-left text-sm">
                {["Pick free Gemini, your own Claude plan (Owner Mode), or offline", "Add your degree, grade, and target field", "Get an ordered roadmap, tracker, and German grade"].map((t) => (
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
                <h1 className="text-xl font-bold tracking-tight">Set up AI</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a free Google Gemini key, or run your own Claude plan with the Owner-Mode installer.
                  Not now? You can continue and add it later in Settings — the app falls back to bundled
                  content offline.
                </p>
              </div>
              <AiSettings />
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft aria-hidden /> Back</Button>
                <Button onClick={() => setStep(2)}>Continue <ArrowRight aria-hidden /></Button>
              </div>
            </div>
          )}

          {step === 2 && (
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
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft aria-hidden /> Back</Button>
                <Button onClick={() => setStep(3)}>Continue <ArrowRight aria-hidden /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
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
