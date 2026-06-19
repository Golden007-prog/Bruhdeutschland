import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import AuthCallback from "@/pages/auth/AuthCallback";
import { NAV } from "@/lib/nav";

/**
 * Application router. Public, pre-auth pages (login/signup/callback) render in the minimal
 * {@link PublicLayout}; everything else renders inside the persistent {@link AppShell}. Guest-first:
 * the app routes work signed-out — {@link AuthProvider} just tracks the optional session.
 *
 * Routing strategy is env-driven: GitHub Pages has no server, so the hosted build uses HashRouter
 * (zero-config deep links) when `VITE_HASH_ROUTER` is set; local dev / Owner Mode use BrowserRouter.
 */
const useHash = import.meta.env.VITE_HASH_ROUTER === "true";
const Router = useHash ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public auth routes — no app shell. */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Route>

          {/* App routes — inside the grouped sidebar shell. */}
          <Route element={<AppShell />}>
            {NAV.map((item) => (
              <Route key={item.path} path={item.path} element={<item.Component />} />
            ))}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
