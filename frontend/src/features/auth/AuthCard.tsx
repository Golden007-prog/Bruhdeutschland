import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, LogIn, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase/auth";

/**
 * Shared sign-in / sign-up card. Auth is passwordless (magic link) + Google OAuth, so "sign up" and
 * "log in" are the same action — the mode only changes the copy and the cross-link. Google sign-in is
 * for the ACCOUNT only; it is not a Gemini API key (those come from aistudio.google.com). Degrades to a
 * clear notice when Supabase isn't configured, with a "continue as guest" path (guest-first).
 */
export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signInWithEmail(email);
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
        <p className="eyebrow">{isSignup ? "Konto erstellen · Sign up" : "Anmelden · Log in"}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {isSignup ? "Create your DeutschPrep account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup
            ? "Save your roadmap, documents, and exam history — and sync across devices."
            : "Sign in to sync your progress across devices."}
        </p>

        {!isSupabaseConfigured ? (
          <Alert variant="info" className="mt-5 text-sm">
            <AlertDescription>
              Accounts aren’t configured in this build, so sign-in is unavailable. You can still use
              everything on this device.{" "}
              <Link to="/" className="font-medium text-primary hover:underline">
                Continue as guest →
              </Link>
            </AlertDescription>
          </Alert>
        ) : sent ? (
          <Alert variant="success" className="mt-5 text-sm">
            <CheckCircle2 aria-hidden />
            <AlertDescription>
              Check <span className="font-medium">{email}</span> for a one-tap sign-in link. You can
              close this tab — the link opens DeutschPrep signed in.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mt-6 space-y-4">
            <Button onClick={() => void signInWithGoogle()} className="w-full">
              <LogIn aria-hidden /> {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or with email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={sendLink} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={busy || !email}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
                Email me a magic link
              </Button>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </form>

            <p className="text-xs text-muted-foreground">
              Google sign-in is for your account only — it is <span className="font-medium">not</span>{" "}
              a Gemini API key.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to DeutschPrep?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
