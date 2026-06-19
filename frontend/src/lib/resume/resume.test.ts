import { describe, expect, it } from "vitest";

import { guessProfileFields } from "./resume";

describe("guessProfileFields", () => {
  it("returns empty fields for empty text", () => {
    expect(guessProfileFields("")).toMatchObject({ name: "", gradeScale: "", gradeValue: "" });
  });

  it("extracts name, degree, and institution from a résumé", () => {
    const text = `Jane Doe — Backend Engineer
B.Tech Computer Science, IIT Delhi (2024)
Experience: 1 yr backend (Python, Go)`;
    const g = guessProfileFields(text);
    expect(g.name).toBe("Jane Doe");
    expect(g.currentDegree.toLowerCase()).toContain("tech");
    expect(g.institution).toContain("IIT Delhi");
  });

  it("detects a 10-point CGPA", () => {
    const g = guessProfileFields("Academic record: CGPA 8.4/10");
    expect(g.gradeValue).toBe("8.4");
    expect(g.gradeScale).toBe("cgpa10");
  });

  it("detects a percentage", () => {
    const g = guessProfileFields("Final marks: 75%");
    expect(g.gradeValue).toBe("75");
    expect(g.gradeScale).toBe("percent");
  });

  it("detects a 4-point GPA", () => {
    const g = guessProfileFields("Cumulative GPA 3.6 / 4.0");
    expect(g.gradeValue).toBe("3.6");
    expect(g.gradeScale).toBe("gpa4");
  });
});
