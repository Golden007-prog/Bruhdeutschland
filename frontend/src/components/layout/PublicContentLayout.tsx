import { Link, Outlet } from "react-router-dom";

import { DISCLAIMER_TEXT } from "@/components/common/Disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Chrome for public informational pages that must be readable WITHOUT signing in (the legal pages —
 * Privacy/Terms/Accessibility — linked from the landing and the consent banner). Top-aligned, padded,
 * max-width content; no app sidebar.
 */
export function PublicContentLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/welcome" className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Deutsch<span className="text-primary">Prep</span>
          </Link>
          <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <p className="text-xs text-muted-foreground">{DISCLAIMER_TEXT}</p>
        </div>
      </footer>
    </div>
  );
}
