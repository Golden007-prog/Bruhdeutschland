import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Lock, LogIn } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/supabase/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

/**
 * Gate for account-bound surfaces (cloud tracker, vault, GDPR export, notifications). Guest-first:
 * instead of hard-redirecting an anonymous visitor, it renders a friendly inline prompt with a
 * sign-in CTA that remembers where they were headed. Signed-in users see the real children.
 */
export function RequireAuth({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return <AuthGate feature={feature} returnTo={location.pathname} />;
}

function AuthGate({ feature, returnTo }: { feature?: string; returnTo: string }) {
  const remember = () => sessionStorage.setItem("auth:returnTo", returnTo);

  return (
    <section className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">Sign in to use {feature ?? "this"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isSupabaseConfigured
          ? "This feature saves to your account so it syncs across devices. The rest of DeutschPrep works without an account."
          : "Accounts aren’t configured in this build, so this cloud feature is unavailable. Everything else works on this device."}
      </p>
      {isSupabaseConfigured && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <Button onClick={() => void signInWithGoogle()} className="w-full">
            <LogIn aria-hidden /> Sign in with Google
          </Button>
          <Link
            to="/login"
            onClick={remember}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Other ways to sign in
          </Link>
        </div>
      )}
      <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to the dashboard
      </Link>
    </section>
  );
}
