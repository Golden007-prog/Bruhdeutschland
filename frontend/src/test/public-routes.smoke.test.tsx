import type { ComponentType } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Landing from "@/pages/marketing/Landing";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";

/**
 * The marketing + auth pages live outside the NAV registry (no sidebar entry), so the route smoke
 * test doesn't cover them. This guards that they mount and expose a heading.
 */
describe("public routes render without crashing", () => {
  const cases: [string, ComponentType][] = [
    ["landing", Landing],
    ["login", Login],
    ["signup", Signup],
  ];

  for (const [name, Comp] of cases) {
    it(`${name} mounts with a heading`, () => {
      render(
        <MemoryRouter>
          <Comp />
        </MemoryRouter>,
      );
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });
  }
});
