import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Flashcards from "./Flashcards";
import { FLASHCARD_DECK } from "@/lib/seed/language";

/**
 * Regression guard for the SRS queue: "Good" and "Easy" must retire a card so the session always
 * completes; "Again" must keep the card in the queue. (Previously "Good" re-queued forever, so the
 * session never reached "Session complete" and progress overshot 100%.)
 */
describe("Flashcards SRS session", () => {
  it("completes after rating every card Good", () => {
    render(<Flashcards />);
    for (let i = 0; i < FLASHCARD_DECK.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Card showing/ })); // flip
      fireEvent.click(screen.getByRole("button", { name: "Good" })); // retire
    }
    expect(screen.getByText("Session complete")).toBeInTheDocument();
  });

  it("keeps the card in the queue on Again (does not complete prematurely)", () => {
    render(<Flashcards />);
    fireEvent.click(screen.getByRole("button", { name: /Card showing/ }));
    fireEvent.click(screen.getByRole("button", { name: "Again" }));
    expect(screen.queryByText("Session complete")).toBeNull();
  });
});
