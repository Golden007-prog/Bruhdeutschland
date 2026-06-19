import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface FaqItem {
  question: string;
  /** Plain-text answer used for search matching; rendered version lives in `answer`. */
  keywords: string;
  answer: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    question: "Is DeutschPrep free?",
    keywords:
      "free cost price pay payment money byok gemini key offline no charge open",
    answer: (
      <>
        Yes. DeutschPrep is free to use. You can run the AI features by bringing your own{" "}
        <span className="font-medium text-foreground">Gemini API key</span> (BYOK), or work fully
        offline — the guides, checklists, and deterministic calculators all run without any AI key.
      </>
    ),
  },
  {
    question: "How is my data handled?",
    keywords:
      "data privacy storage localstorage supabase sync row level security rls export delete settings gdpr",
    answer: (
      <>
        By default your work stays in your browser&apos;s{" "}
        <span className="font-medium text-foreground">localStorage</span> — nothing leaves your
        device. If you choose to sign in, you can optionally sync to{" "}
        <span className="font-medium text-foreground">Supabase</span>, where row-level security
        ensures you can only read and write your own rows. You can export or delete your data at any
        time from{" "}
        <Link to="/settings" className="font-medium text-primary hover:underline">
          Settings
        </Link>
        .
      </>
    ),
  },
  {
    question: "Do you use or scrape my LinkedIn?",
    keywords:
      "linkedin scrape scraping profile import upload pdf save export privacy",
    answer: (
      <>
        No. We never scrape LinkedIn or log in on your behalf. If you want to use your profile, open
        your LinkedIn profile, choose{" "}
        <span className="font-medium text-foreground">Save to PDF</span>, and upload that file — you
        stay in control of exactly what you share.
      </>
    ),
  },
  {
    question: "Which AI does DeutschPrep use?",
    keywords:
      "ai model gemini claude owner mode bridge byok llm provider numbers deterministic tested code",
    answer: (
      <>
        It is pluggable. You can bring your own{" "}
        <span className="font-medium text-foreground">Gemini</span> key, or use the Owner-Mode{" "}
        <span className="font-medium text-foreground">Claude</span> bridge when it is enabled. The
        AI plans and drafts text — but official numbers (GPA conversion, ECTS, cost-of-living,
        deadlines) are always computed in tested, deterministic code, never by the model.
      </>
    ),
  },
  {
    question: "How do I add my AI key?",
    keywords: "add key api gemini settings ai configure setup byok enter",
    answer: (
      <>
        Go to{" "}
        <Link to="/settings" className="font-medium text-primary hover:underline">
          Settings → AI
        </Link>{" "}
        and paste your Gemini API key. It is stored locally on your device and used only to make
        requests on your behalf.
      </>
    ),
  },
  {
    question: "Is this legal or financial advice?",
    keywords:
      "legal financial advice visa immigration disclaimer official figures verify guidance",
    answer: (
      <>
        No. DeutschPrep is guidance only — it is not legal, financial, or immigration advice. Always
        verify official figures (fees, blocked-account amounts, deadlines, visa requirements)
        against the cited official sources before you act on them.
      </>
    ),
  },
  {
    question: "How do I sync across devices?",
    keywords:
      "sync devices sign in login account supabase cross device share continue laptop phone",
    answer: (
      <>
        Sign in. Once you are signed in, your data syncs to your account so you can pick up your
        roadmap on another device. Until you sign in, everything stays local to the browser you are
        using.
      </>
    ),
  },
  {
    question: "How accurate are the German figures?",
    keywords:
      "accurate german figures fees deadlines numbers cited source verify yearly change updated official needs verification",
    answer: (
      <>
        Stable facts (such as the German grade scale and ECTS per year) are shown as grounded with a
        citation. Anything that changes yearly, by federal state, or by programme — fees,
        blocked-account amounts, deadlines, language thresholds — is flagged as{" "}
        <span className="font-medium text-foreground">needs verification</span>, with a link to
        confirm the current value at the official source. We never print a guessed official number.
      </>
    ),
  },
];

/** Help & FAQ — searchable answers to common questions, with the advisory disclaimer. */
export default function HelpPage() {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q) || faq.keywords.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hilfe · Help"
        title="Help & FAQ"
        description="Answers to common questions, with the advisory disclaimer and links to official sources."
      />

      <section aria-labelledby="help-search-heading" className="space-y-3">
        <h2 id="help-search-heading" className="text-lg font-semibold tracking-tight">
          Search the FAQ
        </h2>
        <div className="space-y-1.5">
          <label htmlFor={searchId} className="sr-only">
            Search frequently asked questions
          </label>
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. data, AI key, free, sync…"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {filtered.length} of {FAQS.length} questions shown.
          </p>
        </div>
      </section>

      <section aria-labelledby="help-faq-heading" className="space-y-3">
        <h2 id="help-faq-heading" className="text-lg font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No questions match &ldquo;{query}&rdquo;. Try a different word, or email{" "}
              <a
                href="mailto:basuoikantik@gmail.com"
                className="font-medium text-primary hover:underline"
              >
                basuoikantik@gmail.com
              </a>
              .
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filtered.map((faq) => (
              <li key={faq.question}>
                <Card>
                  <CardContent className="p-0">
                    <details className="group">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-md p-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span>{faq.question}</span>
                        <span
                          className="text-muted-foreground transition-transform group-open:rotate-90"
                          aria-hidden
                        >
                          ›
                        </span>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</div>
                    </details>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="help-advisory-heading" className="space-y-3">
        <h2 id="help-advisory-heading" className="text-lg font-semibold tracking-tight">
          Advisory
        </h2>
        <Disclaimer />
        <p className="text-xs text-muted-foreground">
          Still stuck? Email{" "}
          <a
            href="mailto:basuoikantik@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            basuoikantik@gmail.com
          </a>{" "}
          and we&apos;ll help.
        </p>
      </section>
    </div>
  );
}
