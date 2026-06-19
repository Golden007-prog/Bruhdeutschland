import { Accessibility, AlertTriangle, CheckCircle2, Mail } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES: { title: string; detail: string }[] = [
  {
    title: "Keyboard navigation & visible focus",
    detail:
      "Every interactive control is reachable and operable by keyboard alone, and shows a clear focus ring so you always know where you are.",
  },
  {
    title: "Skip-to-content link",
    detail:
      "A skip link is the first focusable element on each page, letting keyboard and screen-reader users jump past the navigation straight to the main content.",
  },
  {
    title: "Semantic HTML & ARIA",
    detail:
      "Pages are built from landmarks, headings, and lists, with ARIA roles and labels added only where native semantics fall short.",
  },
  {
    title: "Labelled form inputs",
    detail:
      "Search boxes, key fields, and settings each have a programmatic label, so assistive technology announces their purpose.",
  },
  {
    title: "Status is never colour alone",
    detail:
      "Grounded versus needs-verification figures, deadline urgency, and progress are conveyed with text and icons in addition to colour.",
  },
  {
    title: "Live regions for async updates",
    detail:
      "Results that arrive after a request — AI drafts, calculations, sync state — are announced through aria-live regions rather than appearing silently.",
  },
  {
    title: "Reduced-motion honoured",
    detail:
      "When your system requests reduced motion (prefers-reduced-motion), we suppress non-essential animation and transitions.",
  },
  {
    title: "Responsive 320–1440px",
    detail:
      "Layouts reflow without loss of content or function from small phones (320px) up to large desktops (1440px), with no horizontal scrolling required.",
  },
];

/** Accessibility statement — our WCAG 2.1 AA commitment, implemented features, and how to report a barrier. */
export default function AccessibilityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Barrierefreiheit · Accessibility"
        title="Accessibility statement"
        description="Our commitment to WCAG 2.1 AA and how to report barriers."
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        DeutschPrep is built to be usable by everyone, including people who rely on keyboards,
        screen readers, magnification, or reduced-motion settings. We aim to conform to the{" "}
        <span className="font-medium text-foreground">
          Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
        </span>
        , and we treat accessibility as part of the definition of done for every page.
      </p>

      <section aria-labelledby="a11y-commitment" className="space-y-3">
        <h2 id="a11y-commitment" className="text-lg font-semibold tracking-tight">
          Our commitment
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Accessibility className="h-4 w-4 text-primary" aria-hidden />
              Conforming to WCAG 2.1 Level AA
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              We measure new and changed pages against the WCAG 2.1 AA success criteria —
              perceivable, operable, understandable, and robust. Where we fall short, we treat it as
              a bug to fix, and we welcome reports that help us find gaps faster.
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="a11y-features" className="space-y-3">
        <h2 id="a11y-features" className="text-lg font-semibold tracking-tight">
          What we have implemented
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{feature.title}</p>
                  <p className="mt-1">{feature.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="a11y-limitations" className="space-y-3">
        <h2 id="a11y-limitations" className="text-lg font-semibold tracking-tight">
          Known limitations
        </h2>
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>Some third-party features depend on your browser</AlertTitle>
          <AlertDescription>
            <p>
              A few features lean on capabilities your browser provides, which we do not fully
              control:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                The mock-exam speech and language pronunciation use the browser&apos;s{" "}
                <span className="font-medium">Web Speech API</span>. Voice availability, quality, and
                language coverage vary by browser and operating system, and some browsers do not
                support it at all. The exam content remains fully usable as text when speech is
                unavailable.
              </li>
              <li>
                Output from third-party AI providers (your bring-your-own-key model) is generated
                outside our interface; we structure and label it, but we cannot guarantee its
                internal accessibility.
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </section>

      <section aria-labelledby="a11y-report" className="space-y-3">
        <h2 id="a11y-report" className="text-lg font-semibold tracking-tight">
          Report a barrier
        </h2>
        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="space-y-2">
              <p>
                If you hit an accessibility barrier — something you cannot reach, operate, perceive,
                or understand — please tell us so we can fix it. Describe the page, what you were
                trying to do, and your browser and assistive technology if you can.
              </p>
              <p>
                Email{" "}
                <a
                  href="mailto:basuoikantik@gmail.com"
                  className="font-medium text-primary hover:underline"
                >
                  basuoikantik@gmail.com
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">Last reviewed: 19 June 2026.</p>
      </section>
    </div>
  );
}
