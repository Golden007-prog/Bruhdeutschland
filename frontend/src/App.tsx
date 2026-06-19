import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/nav";

/**
 * Application router. All pages render inside the persistent {@link AppShell} (sidebar + disclaimer
 * footer). Routes are generated from the single-source-of-truth {@link NAV} registry.
 *
 * Routing strategy is env-driven: GitHub Pages has no server, so the hosted build uses HashRouter
 * (zero-config deep links) when `VITE_HASH_ROUTER` is set; local dev / Owner Mode use BrowserRouter.
 */
const useHash = import.meta.env.VITE_HASH_ROUTER === "true";
const Router = useHash ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          {NAV.map((item) => (
            <Route key={item.path} path={item.path} element={<item.Component />} />
          ))}
        </Route>
      </Routes>
    </Router>
  );
}
