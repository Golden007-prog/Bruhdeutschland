import { Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NAV } from "@/lib/nav";

/**
 * Smoke test: every route in the NAV registry must render without throwing and must expose at least
 * one heading (the PageHeader <h1>). A clean `tsc`/`build` proves the pages compile; this proves they
 * actually mount — catching runtime crashes (undefined data access, missing Router context, ungated
 * browser-API calls) that the compiler can't see.
 */
describe("every route renders without crashing", () => {
  for (const item of NAV) {
    const entry = item.path === "*" ? "/__missing__" : item.path;
    it(`renders ${item.path}`, async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[entry]}>
          <Suspense fallback={<div data-testid="loading">loading</div>}>
            <item.Component />
          </Suspense>
        </MemoryRouter>,
      );
      // Wait for the lazy chunk to resolve (the Suspense fallback to disappear). Heavy pages (the
      // mock-exam feature pulls in recharts/katex/framer-motion) can take a moment in jsdom.
      await waitFor(() => expect(screen.queryByTestId("loading")).toBeNull(), { timeout: 5000 });
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
      unmount();
    });
  }
});
