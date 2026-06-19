import { useEffect, useState } from "react";
import { LogIn, LogOut, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { onAuthChange, signInWithEmail, signInWithGoogle, signOut } from "@/lib/supabase/auth";

/**
 * Account panel (work-order §5G). Email magic-link + Google OAuth via Supabase, so progress syncs
 * across devices and run modes. Google login is for the ACCOUNT only — not AI billing. Degrades to a
 * clear notice when Supabase isn't configured (the app still works signed-out via localStorage).
 */
export function AccountPanel() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthChange((session) => setUserEmail(session?.user?.email ?? null)), []);

  if (!isSupabaseConfigured) {
    return (
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="eyebrow">Konto · Account</p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Accounts</h2>
        <Alert variant="info" className="mt-3 text-xs">
          <AlertDescription>
            Accounts aren&apos;t configured in this build, so your progress stays on this device only.
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable cross-device sync.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  async function sendLink() {
    setError("");
    const res = await signInWithEmail(email);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="eyebrow">Konto · Account</p>
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Account</h2>

      {userEmail ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Signed in as <span className="font-medium">{userEmail}</span></p>
          <Button size="sm" variant="outline" onClick={() => void signOut()}>
            <LogOut aria-hidden /> Sign out
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <Button onClick={() => void signInWithGoogle()}>
            <LogIn aria-hidden /> Sign in with Google
          </Button>
          <p className="text-xs text-muted-foreground">
            Google sign-in is for your account only — it is <span className="font-medium">not</span> a
            Gemini API key.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="auth-email" className="sr-only">Email for magic link</label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="max-w-xs flex-1"
            />
            <Button size="sm" variant="outline" onClick={() => void sendLink()} disabled={!email}>
              <Mail aria-hidden /> Email me a link
            </Button>
          </div>
          {sent && <p className="text-xs text-emerald-700">Check your inbox for a sign-in link.</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
