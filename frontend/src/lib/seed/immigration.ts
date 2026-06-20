/**
 * The post-graduation immigration ladder (long-game addendum §2). Node content for the visual pathway:
 * Study → 18-mo job-seeker → job → Blue Card / Employment permit → experience → PR → citizenship. Figures
 * come from the grounded OfficialFacts in lib/facts (current 2026, needs_verification) — referenced here
 * by source so nothing is restated as a bare literal.
 */
import { source } from "@/lib/sources";
import type { Source } from "@/lib/types";

export interface LadderStep {
  key: string;
  phase: string;
  title: string;
  detail: string;
  /** Indicative timing/duration. */
  timing: string;
  source: Source;
}

export const IMMIGRATION_LADDER: LadderStep[] = [
  {
    key: "study",
    phase: "Now",
    title: "Study in Germany",
    detail: "Your student residence permit is the start of the ladder. Build German alongside your degree — it speeds up every later step.",
    timing: "Programme length",
    source: source("residencePermit"),
  },
  {
    key: "jobseeker",
    phase: "After graduation",
    title: "18-month job-seeker permit",
    detail: "On finishing, you may stay up to 18 months to find qualified work, working without restriction meanwhile.",
    timing: "Up to 18 months",
    source: source("jobSeekerPermit"),
  },
  {
    key: "work",
    phase: "Employed",
    title: "Get a qualified job → choose your permit",
    detail: "With a job matching your degree you switch to a work residence permit — or, if the salary qualifies, the EU Blue Card (the faster track to PR).",
    timing: "On signing a contract",
    source: source("blueCard"),
  },
  {
    key: "bluecard",
    phase: "Employed",
    title: "EU Blue Card (if salary qualifies)",
    detail: "For graduates earning above the threshold (lower for shortage occupations, STEM & recent graduates). It shortens the path to permanent residence considerably.",
    timing: "€50,700 / €45,934.20 (2026)",
    source: source("blueCard"),
  },
  {
    key: "pr",
    phase: "Settle",
    title: "Permanent residence (Niederlassungserlaubnis)",
    detail: "On a Blue Card you can reach PR in 21 months with B1 German (27 without) — much faster than a standard permit (~5 years).",
    timing: "21 / 27 months (Blue Card)",
    source: source("settlement"),
  },
  {
    key: "citizenship",
    phase: "Citizenship",
    title: "German citizenship",
    detail: "After 5 years' legal residence (dual citizenship now allowed), with B1 German and a civics test. The 3-year fast-track was repealed on 30 Oct 2025 — plan for 5 years.",
    timing: "From 5 years' residence",
    source: source("citizenship"),
  },
];
