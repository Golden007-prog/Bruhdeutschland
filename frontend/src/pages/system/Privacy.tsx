import { Link } from "react-router-dom";
import { Database, KeyRound, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LAST_UPDATED = "19 June 2026";

/** Privacy Policy — how DeutschPrep stores, processes, and lets you remove your personal data. */
export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Datenschutz · Privacy"
        title="Privacy Policy"
        description="How DeutschPrep handles your personal data, including GDPR export and deletion."
      />

      <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}.</p>

      <p className="max-w-2xl text-sm text-muted-foreground">
        DeutschPrep is a free, open-source, guest-first copilot for applying to Master&apos;s
        programmes at German public universities. It is designed so that your data stays with you: by
        default everything you enter lives in your own browser, and nothing about your profile is sent
        anywhere unless you choose to sign in or to connect your own AI key. This policy explains, in
        plain terms, what is stored, where, and how you stay in control.
      </p>

      <section aria-labelledby="pp-summary" className="space-y-3">
        <h2 id="pp-summary" className="text-lg font-semibold tracking-tight">
          The short version
        </h2>
        <Alert variant="info">
          <ShieldCheck aria-hidden />
          <AlertTitle>Your data stays with you by default</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Your profile and roadmap are saved in your browser&apos;s <code>localStorage</code> by
                default — not on our servers.
              </li>
              <li>
                Signing in is optional. It syncs your data to Supabase (Postgres) under row-level
                security, so only you can read your rows.
              </li>
              <li>
                AI is bring-your-own-key: your Google Gemini API key is stored only in your browser, or
                you use a local Owner-Mode Claude bridge.
              </li>
              <li>
                Résumé and LinkedIn parsing runs in your browser. Your résumé is never uploaded to us
                for parsing.
              </li>
              <li>
                No third-party tracking or advertising cookies. You can export or delete your data at
                any time.
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </section>

      <section aria-labelledby="pp-what" className="space-y-3">
        <h2 id="pp-what" className="text-lg font-semibold tracking-tight">
          What we mean by personal data
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your personal data is the content you provide to personalise your roadmap: your
          résumé/LinkedIn content and the intake details in your profile (education, grades,
          target programmes, language level, and similar fields). Deterministic outputs the app
          computes from that — such as your converted German grade, ECTS totals, flashcard progress,
          and saved exam attempts — are stored alongside it.
        </p>
      </section>

      <section aria-labelledby="pp-where" className="space-y-3">
        <h2 id="pp-where" className="text-lg font-semibold tracking-tight">
          Where your data is stored
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" aria-hidden />
                In your browser (default)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                When you use DeutschPrep as a guest, your profile, roadmap, flashcards, and exam
                attempts are saved in this browser&apos;s <code>localStorage</code>. They never leave
                your device. Clearing your browser storage erases this data permanently.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                In Supabase (only if you sign in)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Signing in is optional and only there to sync your progress across devices. Your data
                is stored in Supabase (a hosted Postgres database) protected by row-level security, so
                only your authenticated account can read or write your rows. We do not sell or share
                this data.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="pp-ai" className="space-y-3">
        <h2 id="pp-ai" className="text-lg font-semibold tracking-tight">
          How AI processing works (bring your own key)
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden />
              Your key, your provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              DeutschPrep does not run a paid AI service for you. To use AI features you either provide
              your own{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Google Gemini API key
              </a>{" "}
              or run the local Owner-Mode Claude bridge. Your Gemini key is stored only in your
              browser&apos;s <code>localStorage</code> and is sent directly from your browser to
              Google when you make a request — we never receive or store it.
            </p>
            <p>
              When you use an AI feature, the prompt and the relevant parts of your profile are sent to
              your chosen provider (Google, or your local Claude bridge) to generate the response. That
              provider processes the request under its own terms and privacy policy. Résumé and
              LinkedIn parsing happens in your browser, so the raw document is never uploaded to us for
              parsing.
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="pp-cookies" className="space-y-3">
        <h2 id="pp-cookies" className="text-lg font-semibold tracking-tight">
          Cookies and tracking
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          We do not use third-party tracking or advertising cookies, and we do not build advertising
          profiles. The only browser storage we rely on is the local storage that keeps the app
          working — your profile data and, if you sign in, the session token Supabase uses to keep you
          authenticated.
        </p>
      </section>

      <section aria-labelledby="pp-rights" className="space-y-3">
        <h2 id="pp-rights" className="text-lg font-semibold tracking-tight">
          Your GDPR rights: export and deletion
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          You stay in control of your data at all times. From the{" "}
          <Link to="/settings" className="font-medium text-primary hover:underline">
            Settings page
          </Link>{" "}
          you can:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Export your data</span> — download a JSON
            file containing your profile and progress, so you keep a portable copy.
          </li>
          <li>
            <span className="font-medium text-foreground">Delete your data</span> — clear the data
            stored in this browser, and, if you signed in, delete your account and the rows synced to
            Supabase.
          </li>
        </ul>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Because guest data lives entirely in your browser, clearing your browser storage also removes
          it. If you have questions or a data request we have not covered, contact{" "}
          <a
            href="mailto:basuoikantik@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            basuoikantik@gmail.com
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="pp-children" className="space-y-3">
        <h2 id="pp-children" className="text-lg font-semibold tracking-tight">
          Children and changes to this policy
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          DeutschPrep is intended for prospective university applicants and is not directed at children
          under 16. As an open-source project this policy may change as the app evolves; the
          &ldquo;last updated&rdquo; date above always reflects the current version, and the full
          history is visible in the public repository at{" "}
          <a
            href="https://github.com/Golden007-prog/Bruhdeutschland"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            github.com/Golden007-prog/Bruhdeutschland
          </a>
          .
        </p>
      </section>

      <Disclaimer />
    </div>
  );
}
