import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoadmapTracker } from "./RoadmapTracker";
import type { RoadmapItem } from "@/lib/types";

const items: RoadmapItem[] = [
  { id: "a", category: "profile", title: "Evaluate profile", status: "done" },
  { id: "b", category: "documents", title: "Draft SOP", status: "active" },
  {
    id: "c",
    category: "finance",
    title: "Open a Sperrkonto",
    status: "locked",
    deadline: "2026-05-15",
    needsVerification: true,
  },
];

describe("RoadmapTracker", () => {
  it("renders every roadmap item", () => {
    render(<RoadmapTracker items={items} />);
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Open a Sperrkonto")).toBeInTheDocument();
  });

  it("reports progress from completed items (1 of 3 = 33%)", () => {
    render(<RoadmapTracker items={items} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });

  it("flags ungrounded official values for verification", () => {
    render(<RoadmapTracker items={items} />);
    expect(screen.getByText(/needs verification/i)).toBeInTheDocument();
  });

  it("renders a machine-readable, human-formatted deadline", () => {
    render(<RoadmapTracker items={items} />);
    const time = screen.getByText("15 May 2026");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-05-15");
  });

  it("flags a past-due, unfinished item as overdue", () => {
    render(<RoadmapTracker items={items} />);
    // item "c" is locked with a deadline in the past.
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("marks the active step with aria-current", () => {
    render(<RoadmapTracker items={items} />);
    expect(screen.getByText("Draft SOP").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("conveys status with text, not color alone", () => {
    render(<RoadmapTracker items={items} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("shows an empty state when there is no roadmap", () => {
    render(<RoadmapTracker items={[]} />);
    expect(screen.getByText(/no roadmap yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
