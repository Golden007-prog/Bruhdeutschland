import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Github } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LAST_UPDATED = "19 June 2026";

/** Terms of Service — the terms under which you may use DeutschPrep. */
export default function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nutzungsbedingungen · Terms"
        title="Terms of Service"
        description="The terms for using DeutschPrep."
      />

      <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}.</p>

      <p className="max-w-2xl text-sm text-muted-foreground">
        DeutschPrep is a free, open-source tool that helps you plan applications to Master&apos;s
        programmes at German public universities. By using it, you agree to these terms. They are kept
        deliberately short and plain. If you do not agree, please do not use the app.
      </p>

      <section aria-labelledby="tos-not-advice" className="space-y-3">
        <h2 id="tos-not-advice" className="text-lg font-semibold tracking-tight">
          Guidance only — not professional advice
        </h2>
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>This is not legal, financial, or immigration advice</AlertTitle>
          <AlertDescription>
            DeutschPrep provides general guidance to help you organise your application. It is not a
            substitute for advice from a lawyer, financial adviser, immigration consultant, or an
            official body. Decisions about your visa, finances, and immigration are yours, and you make
            them at your own risk. Always confirm requirements with the relevant authority before
            acting.
          </AlertDescription>
        </Alert>
      </section>

      <section aria-labelledby="tos-accuracy" className="space-y-3">
        <h2 id="tos-accuracy" className="text-lg font-semibold tracking-tight">
          Accuracy of official figures
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden />
              Cited, but subject to change
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Official German figures shown in the app — such as fees, blocked-account amounts,
              deadlines, and language thresholds — are cited to their sources. These values change
              over time, by federal state, and by programme. Where a value is volatile or could not be
              grounded, the app flags it as needing verification rather than guessing. You are
              responsible for confirming any figure against the cited official source before you rely
              on it. See the{" "}
              <Link to="/about" className="font-medium text-primary hover:underline">
                About &amp; methodology
              </Link>{" "}
              page for how grounding works.
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="tos-ai" className="space-y-3">
        <h2 id="tos-ai" className="text-lg font-semibold tracking-tight">
          AI features and your own key
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          AI features are bring-your-own-key: you supply your own Google Gemini API key (stored only in
          your browser) or run the local Owner-Mode Claude bridge. You are responsible for your API
          key, for any usage and costs charged by your AI provider, and for complying with that
          provider&apos;s terms. AI output can be incomplete or wrong; review it critically and verify
          anything important. DeutschPrep is not responsible for the content your provider generates.
        </p>
      </section>

      <section aria-labelledby="tos-your-data" className="space-y-3">
        <h2 id="tos-your-data" className="text-lg font-semibold tracking-tight">
          Your data and acceptable use
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Your profile and progress are stored in your browser by default, and synced to Supabase
            only if you choose to sign in. See the{" "}
            <Link to="/legal/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for details, and the{" "}
            <Link to="/settings" className="font-medium text-primary hover:underline">
              Settings page
            </Link>{" "}
            to export or delete your data.
          </li>
          <li>You are responsible for the accuracy of the information you enter.</li>
          <li>
            Use the app lawfully. Do not use it to misrepresent your qualifications, submit fraudulent
            applications, or attempt to disrupt, attack, or reverse-engineer the service.
          </li>
        </ul>
      </section>

      <section aria-labelledby="tos-warranty" className="space-y-3">
        <h2 id="tos-warranty" className="text-lg font-semibold tracking-tight">
          No warranty and limitation of liability
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          DeutschPrep is provided free of charge, &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
          without warranties of any kind, express or implied. We do not guarantee that the app will be
          accurate, complete, uninterrupted, or error-free. To the fullest extent permitted by law, the
          project and its maintainers are not liable for any loss or damage — including missed
          deadlines, rejected applications, or financial loss — arising from your use of, or reliance
          on, the app. Nothing in these terms limits liability that cannot be excluded under applicable
          law.
        </p>
      </section>

      <section aria-labelledby="tos-oss" className="space-y-3">
        <h2 id="tos-oss" className="text-lg font-semibold tracking-tight">
          Open source, changes, and contact
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-4 w-4 text-primary" aria-hidden />
              Built in the open
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              DeutschPrep is an open-source project. The source code, and any licence governing your
              use of it, is available at{" "}
              <a
                href="https://github.com/Golden007-prog/Bruhdeutschland"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                github.com/Golden007-prog/Bruhdeutschland
              </a>
              . We may update these terms as the app evolves; the &ldquo;last updated&rdquo; date above
              reflects the current version. Continued use after a change means you accept the updated
              terms. Questions? Contact{" "}
              <a
                href="mailto:basuoikantik@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                basuoikantik@gmail.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </section>

      <Disclaimer />
    </div>
  );
}
