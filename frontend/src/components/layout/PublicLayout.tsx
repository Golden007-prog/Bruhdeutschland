import { Link, Outlet } from "react-router-dom";

import { DISCLAIMER_TEXT } from "@/components/common/Disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Chrome for public, pre-auth pages (login, signup, callback, and later the marketing landing).
 * No app sidebar — just a minimal header, the routed page, and the persistent advisory disclaimer.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Deutsch<span className="text-primary">Prep</span>
          </Link>
          <Link to="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <p className="text-xs text-muted-foreground">{DISCLAIMER_TEXT}</p>
        </div>
      </footer>
    </div>
  );
}
