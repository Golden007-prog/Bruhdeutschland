import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_TEXT } from "@/components/common/Disclaimer";
import { cn } from "@/lib/utils";

/**
 * Application shell: a fixed grouped sidebar on desktop, a slide-over drawer on mobile, and the
 * routed page in the main column. The advisory disclaimer is pinned in the footer site-wide so it is
 * never missed on finance/visa pages. Scrolls to top and closes the drawer on every navigation.
 */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close the mobile drawer and reset scroll whenever the route changes.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Modal a11y for the slide-over drawer: move focus in on open, trap Tab, close on Escape, and restore
  // focus to the trigger on close so keyboard / screen-reader users can't Tab behind the overlay.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const panel = drawerRef.current;
    panel?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus(); // restore focus to the menu button that opened the drawer
    };
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r bg-card lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <p className="text-lg font-bold tracking-tight">
          Deutsch<span className="text-primary">Prep</span>
        </p>
        <Button ref={triggerRef} variant="outline" size="icon" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu aria-hidden />
        </Button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r bg-card shadow-xl focus:outline-none"
          >
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <X aria-hidden />
              </Button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-col">
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            {/* Subtle enter transition per route; disabled under prefers-reduced-motion. */}
            <motion.div
              key={location.pathname}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
        <footer className="border-t bg-card">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
            <p className="text-xs text-muted-foreground">{DISCLAIMER_TEXT}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-28 rounded-lg bg-muted")} />
        ))}
      </div>
    </div>
  );
}
