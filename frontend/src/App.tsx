import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";

import { AppGate } from "@/components/auth/AppGate";
import { AppShell } from "@/components/layout/AppShell";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { PublicContentLayout } from "@/components/layout/PublicContentLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ConsentBanner } from "@/components/system/ConsentBanner";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import Landing from "@/pages/marketing/Landing";
import Onboarding from "@/pages/onboarding/Onboarding";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import AuthCallback from "@/pages/auth/AuthCallback";
import { NAV } from "@/lib/nav";

/**
 * Application router. Public, pre-auth pages (landing/login/signup/callback) render in the minimal
 * layouts; the app is GATED by {@link AppGate} — anonymous visitors and not-yet-onboarded users are
 * routed to the landing or the onboarding wizard, so no app content shows before sign-in + setup.
 *
 * Routing strategy is env-driven: GitHub Pages has no server, so the hosted build uses HashRouter
 * (zero-config deep links) when `VITE_HASH_ROUTER` is set; local dev / Owner Mode use BrowserRouter.
 */
const useHash = import.meta.env.VITE_HASH_ROUTER === "true";
const Router = useHash ? HashRouter : BrowserRouter;

/** Informational pages readable without sign-in (legal — linked from the landing + consent banner). */
const PUBLIC_PATHS = new Set(["/legal/privacy", "/legal/terms", "/legal/accessibility"]);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
        <Routes>
          {/* First-run onboarding — full-screen, its own layout. */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Public marketing routes — full-width, no app shell. */}
          <Route element={<MarketingLayout />}>
            <Route path="/welcome" element={<Landing />} />
          </Route>

          {/* Public auth routes — no app shell. */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Route>

          {/* Public legal/info pages — readable without signing in. */}
          <Route element={<PublicContentLayout />}>
            {NAV.filter((n) => PUBLIC_PATHS.has(n.path)).map((item) => (
              <Route key={item.path} path={item.path} element={<item.Component />} />
            ))}
          </Route>

          {/* App routes — gated (sign-in + onboarding) inside the grouped sidebar shell. */}
          <Route element={<AppGate />}>
            <Route element={<AppShell />}>
              {NAV.filter((n) => !PUBLIC_PATHS.has(n.path)).map((item) => (
                <Route key={item.path} path={item.path} element={<item.Component />} />
              ))}
            </Route>
          </Route>
        </Routes>
        </ErrorBoundary>
        <ConsentBanner />
      </AuthProvider>
    </Router>
  );
}
