import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The dashboard's iron rule (real-data work order, Part B): it may render a value only from real user
 * data, a deterministic compute, or a grounded fact — never mock/placeholder/lorem. This guard fails
 * the build if the dashboard re-introduces fabricated data.
 */
const here = dirname(fileURLToPath(import.meta.url));
const DASHBOARD = resolve(here, "../pages/overview/Dashboard.tsx");
const src = readFileSync(DASHBOARD, "utf8");

describe("dashboard renders no garbage/placeholder data", () => {
  it("does not import or reference mock data", () => {
    expect(src).not.toMatch(/mockData|mockFeatureModules|mockRoadmapItems|mockParsedProfile/);
  });

  it("contains no placeholder literals", () => {
    expect(src.toLowerCase()).not.toMatch(/\blorem\b|\bdummy\b|\bsample data\b/);
  });
});
