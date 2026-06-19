import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FeatureModuleGrid } from "./FeatureModuleGrid";
import type { FeatureModule } from "@/lib/types";

const modules: FeatureModule[] = [
  { key: "profile", label: "Profile & Assessment", featureCount: 5, completedCount: 3 },
  { key: "documents", label: "Document Prep", featureCount: 6, completedCount: 0 },
];

describe("FeatureModuleGrid", () => {
  it("renders one card per module", () => {
    render(<FeatureModuleGrid modules={modules} />);
    expect(screen.getByText("Profile & Assessment")).toBeInTheDocument();
    expect(screen.getByText("Document Prep")).toBeInTheDocument();
  });

  it("computes completion percentage (3 of 5 = 60%)", () => {
    render(<FeatureModuleGrid modules={modules} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "60");
  });

  it("renders static articles when not interactive", () => {
    render(<FeatureModuleGrid modules={modules} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("becomes activatable and reports the selected category", async () => {
    const onSelect = vi.fn();
    render(<FeatureModuleGrid modules={modules} onSelect={onSelect} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith("profile");
  });
});
