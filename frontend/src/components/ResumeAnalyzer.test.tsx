import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResumeAnalyzer } from "./ResumeAnalyzer";
import type { ParsedProfile } from "@/lib/types";

const profile: ParsedProfile = {
  fileName: "jane_doe_resume.pdf",
  facts: [{ label: "Degree", value: "B.Tech Computer Science" }],
  germanGpa: { value: 1.7, sourceName: "Modified Bavarian Formula", needsVerification: false },
  gpaMethod: "Modified Bavarian Formula",
  totalEcts: { value: null, needsVerification: true },
  skillGaps: [{ id: "s1", skill: "German B2", severity: "high" }],
};

describe("ResumeAnalyzer", () => {
  it("shows the parsed file name", () => {
    render(<ResumeAnalyzer profile={profile} />);
    expect(screen.getByText("jane_doe_resume.pdf")).toBeInTheDocument();
  });

  it("formats the German grade with a comma decimal", () => {
    render(<ResumeAnalyzer profile={profile} />);
    expect(screen.getAllByText("1,7").length).toBeGreaterThan(0);
  });

  it("renders the grade as an accessible verified seal", () => {
    render(<ResumeAnalyzer profile={profile} />);
    const seal = screen.getByRole("img");
    expect(seal).toHaveAccessibleName(/german grade 1,7/i);
    expect(seal.className).not.toContain("stamp-seal--unverified");
  });

  it("flags an ungrounded ECTS value for verification", () => {
    render(<ResumeAnalyzer profile={profile} />);
    expect(screen.getByText(/needs verification/i)).toBeInTheDocument();
  });

  it("records the conversion method once and marks it deterministic", () => {
    render(<ResumeAnalyzer profile={profile} />);
    // Method name appears exactly once as visible text (no duplicate label).
    expect(screen.getByText("Modified Bavarian Formula")).toBeInTheDocument();
    expect(screen.getByText("Deterministic")).toBeInTheDocument();
  });

  it("labels skill gaps as AI-reasoned and shows severity", () => {
    render(<ResumeAnalyzer profile={profile} />);
    expect(screen.getByText("German B2")).toBeInTheDocument();
    expect(screen.getByText(/not official/i)).toBeInTheDocument();
  });

  it("renders an unstamped seal when the grade is ungrounded", () => {
    const unverified: ParsedProfile = {
      ...profile,
      germanGpa: { value: null, needsVerification: true },
    };
    render(<ResumeAnalyzer profile={unverified} />);
    const seal = screen.getByRole("img");
    expect(seal).toHaveAccessibleName(/not yet verified/i);
    expect(seal.className).toContain("stamp-seal--unverified");
  });
});
