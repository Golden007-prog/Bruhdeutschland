import { Link, Outlet } from "react-router-dom";

import { DISCLAIMER_TEXT } from "@/components/common/Disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/Golden007-prog/Bruhdeutschland";
const CONTACT_MAILTO = "mailto:basuoikantik@gmail.com?subject=DeutschPrep";

/**
 * Chrome for the public marketing pages (landing). Sticky header with anchor nav + a single repeated
 * primary CTA, full-bleed main, and a footer carrying trust signals (disclaimer, sources, GitHub).
 * Separate from {@link PublicLayout} (auth) because marketing is full-width, not a centered card.
 */
export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/welcome"
            className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Deutsch<span className="text-primary">Prep</span>
          </Link>
          <nav aria-label="Marketing" className="hidden items-center gap-6 text-sm md:flex">
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Log in
            </Link>
            <Link to="/signup" className={cn(buttonVariants({ size: "sm" }))}>
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-tight">
              Deutsch<span className="text-primary">Prep</span>
            </p>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Open the app</Link>
              <Link to="/about" className="hover:text-foreground">Methodology</Link>
              <Link to="/sources" className="hover:text-foreground">Sources</Link>
              <a href={CONTACT_MAILTO} className="hover:text-foreground">Contact</a>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                GitHub
              </a>
            </nav>
          </div>
          <p className="text-xs text-muted-foreground">{DISCLAIMER_TEXT}</p>
          <p className="text-xs text-muted-foreground">
            Free &amp; open. Your data stays on your device unless you sign in to sync. Official figures
            are cited and re-verifiable — never presented as final.
          </p>
        </div>
      </footer>
    </div>
  );
}
