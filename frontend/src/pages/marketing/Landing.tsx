import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileText,
  Languages,
  ListChecks,
  Map as MapIcon,
  Plane,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import type { FeatureCategoryKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ScanLine,
    title: "Add your profile",
    body: "Upload a résumé or fill a short intake form. DeutschPrep extracts your degree, grade, and field — handled as personal data, on your device.",
  },
  {
    icon: MapIcon,
    title: "Get a grounded roadmap",
    body: "Your German grade is computed deterministically (Modified Bavarian Formula), programs are matched, and a dependency-ordered plan is built — every official figure cited.",
  },
  {
    icon: ListChecks,
    title: "Execute & track",
    body: "Work the plan with tools for documents, language tests, finances, the visa, and arrival — tracking deadlines and progress the whole way.",
  },
];

const FEATURES: { key: FeatureCategoryKey; icon: LucideIcon; blurb: string }[] = [
  { key: "profile", icon: UserCircle, blurb: "Résumé parsing, GPA → German grade, university matching, skill-gap, ECTS." },
  { key: "documents", icon: FileText, blurb: "SOP, Europass CV, recommendation letters, uni-assist & VPD, translations." },
  { key: "language", icon: Languages, blurb: "German A1–B2, SRS flashcards, and full timed IELTS/TOEFL/TestDaF/GRE/GMAT mocks." },
  { key: "finance", icon: Wallet, blurb: "Sperrkonto, cost-of-living, health insurance, scholarships, work rules." },
  { key: "visa", icon: Plane, blurb: "Visa interview simulator, checklist, APS, accommodation, Anmeldung." },
  { key: "campus", icon: Sparkles, blurb: "Pre-departure, academic networking, Deutschlandticket, academic culture." },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is it really free?",
    a: "Yes. The whole app is free and open-source. AI features use your own free Google Gemini key (BYOK) or run offline against bundled content — there is no paid tier and no credit card.",
  },
  {
    q: "Is this legal or financial advice?",
    a: "No. DeutschPrep is guidance only, not legal or financial advice. Visa, finance, and immigration pages carry that disclaimer, and every official figure is cited so you can verify it against the source before acting.",
  },
  {
    q: "How is my data handled?",
    a: "Guest-first: your profile, documents, and progress stay in your browser's local storage. Sign in (optional) to sync across devices via Supabase, where row-level security means only you can read your rows. You can export or delete your data anytime.",
  },
  {
    q: "Do you use my LinkedIn?",
    a: "We never scrape LinkedIn. If you want to use it, export your profile via LinkedIn's “Save to PDF” and upload that file — we parse it like a résumé.",
  },
  {
    q: "Which AI does it use?",
    a: "A pluggable provider layer: free Google Gemini with your own key by default, or an Owner-Mode bridge to Claude for the operator. The LLM writes and plans; all official numbers are computed in tested code, never by the model.",
  },
];

/** Public marketing landing — the front door (work order §9). Guest-first, outcome-driven. */
export default function Landing() {
  return (
    <div className="bg-dossier-grid">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="eyebrow">German Master&apos;s admission copilot</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            From your résumé to a German Master&apos;s offer.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            DeutschPrep turns your profile into a personalized, end-to-end plan for applying to
            Master&apos;s programs at German public universities — grades converted, programs matched,
            documents drafted, deadlines tracked. Grounded in official sources, free to use.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started free <ArrowRight aria-hidden />
            </Link>
            <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Log in
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No credit card. Sign up with one field — we email you a magic link.
          </p>
        </div>

        {/* Outcome visual: the deterministic grade seal — the product's signature element. */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
            <p className="eyebrow">Profilauswertung · Specimen</p>
            <div className="mt-4 flex items-center gap-5">
              <div
                role="img"
                aria-label="Converted German grade 1,8, computed via the Modified Bavarian Formula"
                className="stamp-seal flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full text-center"
              >
                <span className="eyebrow !text-[0.55rem] !tracking-[0.12em] opacity-80">Note</span>
                <span className="official-figure text-3xl font-bold leading-none">1,8</span>
                <span className="official-figure mt-0.5 text-[0.6rem] opacity-70">1,0–4,0</span>
              </div>
              <div className="min-w-0 text-sm">
                <p className="text-muted-foreground">CGPA 8.4 / 10</p>
                <p className="official-figure mt-1 text-base font-semibold">→ German 1,8</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <ShieldCheck className="h-3 w-3" aria-hidden /> Computed, not guessed
                </p>
              </div>
            </div>
            <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              Deterministic math runs in tested code. Official figures (fees, deadlines, thresholds)
              are cited and flagged for verification — never invented.
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section aria-label="Grounded in official sources" className="border-y bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
          <span>Grounded in</span>
          <span>DAAD</span>
          <span aria-hidden>·</span>
          <span>uni-assist</span>
          <span aria-hidden>·</span>
          <span>Auswärtiges Amt</span>
          <span aria-hidden>·</span>
          <span>APS</span>
          <span aria-hidden>·</span>
          <span>make-it-in-germany</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="eyebrow text-center">How it works</p>
        <h2 id="how-heading" className="mt-2 text-center text-3xl font-bold tracking-tight">
          Three steps, one finished application
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="official-figure text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature bento */}
      <section id="features" aria-labelledby="features-heading" className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="eyebrow text-center">Everything in one place</p>
          <h2 id="features-heading" className="mt-2 text-center text-3xl font-bold tracking-tight">
            Six areas. Thirty tools.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const accent = CATEGORY_ACCENT[f.key];
              return (
                <div key={f.key} className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm">
                  <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", accent.bar)} />
                  <div className="flex items-center gap-2 pt-1">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-md bg-muted", accent.text)}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="text-base font-semibold tracking-tight">{CATEGORY_LABELS[f.key]}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{f.blurb}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-labelledby="pricing-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="eyebrow text-center">Pricing</p>
        <h2 id="pricing-heading" className="mt-2 text-center text-3xl font-bold tracking-tight">
          Free, honestly
        </h2>
        <div className="mx-auto mt-10 max-w-md rounded-xl border bg-card p-7 shadow-sm">
          <div className="flex items-baseline gap-2">
            <span className="official-figure text-4xl font-bold">€0</span>
            <span className="text-sm text-muted-foreground">/ forever</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The entire app, all 30 tools, no paid tier. AI runs on your own free Google Gemini key
            (BYOK) or offline — so you control your usage and cost.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {[
              "All six areas + the mock-exam centre",
              "Deterministic grade & cost calculators",
              "Bring-your-own-key AI (free Gemini) — or offline",
              "Optional account to sync across devices",
              "Open-source; your data stays yours",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
            Get started free
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-heading" className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <p className="eyebrow text-center">FAQ</p>
          <h2 id="faq-heading" className="mt-2 text-center text-3xl font-bold tracking-tight">
            Questions, answered
          </h2>
          <div className="mt-8 divide-y rounded-lg border bg-card">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {faq.q}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary/5">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Start your German Master&apos;s plan today</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            It&apos;s free and open-source. Create an account to set up your AI, add your background,
            and unlock your personalized dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started free <ArrowRight aria-hidden />
            </Link>
            <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
