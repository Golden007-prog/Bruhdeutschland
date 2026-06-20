/**
 * Deterministic feasibility heuristic (gap analysis G02). Gives a blunt, transparent read on how
 * realistic a German study plan is and roughly how many years it takes end-to-end. This is an
 * explainable HEURISTIC for orientation, not an admission prediction or guarantee — every factor that
 * moves the score is shown to the user, and the route logic itself comes from the grounded pathway
 * engine. No official thresholds are asserted.
 */
import type { GermanLevel, HighestQualification, TargetLevel } from "@/lib/profile/types";
import type { PathwayRoute } from "@/lib/pathway/pathway";

export interface FeasibilityInput {
  route: PathwayRoute;
  targetLevel: TargetLevel;
  highestQualification: HighestQualification;
  germanLevel: GermanLevel;
  /** True when the target programme is taught in English (German matters less for admission). */
  englishTaught: boolean;
}

export interface FeasibilityFactor {
  label: string;
  /** Points contributed (can be negative). */
  delta: number;
  detail: string;
}

export type FeasibilityBand = "strong" | "workable" | "challenging" | "blocked";

export interface FeasibilityResult {
  /** 0–100 orientation score. */
  score: number;
  band: FeasibilityBand;
  factors: FeasibilityFactor[];
  /** Estimated whole years from "starting prep" to "graduated", min–max. */
  estYearsMin: number;
  estYearsMax: number;
  caveats: string[];
}

const LEVEL_RANK: Record<GermanLevel, number> = {
  "": 0, none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

/** Years for the degree itself (the study, not prep). */
function degreeYears(level: TargetLevel): [number, number] {
  switch (level) {
    case "bachelor": return [3, 4];
    case "master": return [2, 2];
    case "medicine": return [6, 7];
    case "phd": return [3, 5];
    case "studienkolleg": return [3, 4]; // Studienkolleg leads to a Bachelor
    default: return [2, 3];
  }
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function computeFeasibility(input: FeasibilityInput): FeasibilityResult {
  const factors: FeasibilityFactor[] = [];
  const caveats: string[] = [];

  if (input.route === "blocked") {
    return {
      score: 0,
      band: "blocked",
      factors: [{ label: "Not yet eligible", delta: 0, detail: "On your current qualification there is no direct route — you need a higher school-leaving qualification (or a year of university at home) first." }],
      estYearsMin: 0,
      estYearsMax: 0,
      caveats: ["Re-check once you have completed Class 12 (or 1–2 years of a Bachelor's at home)."],
    };
  }

  // Base by route clarity.
  let score = 55;
  factors.push({ label: "Route is defined", delta: 55, detail: "You have a recognised route into the German system — that's the baseline." });

  // Route-specific adjustments.
  if (input.route === "master") {
    score += 15;
    factors.push({ label: "Direct Master's entry", delta: 15, detail: "With a completed Bachelor's you apply directly — the most straightforward route." });
  } else if (input.route === "studienkolleg") {
    score -= 5;
    factors.push({ label: "Studienkolleg first", delta: -5, detail: "You add a ~1-year foundation year (Studienkolleg + FSP) before the Bachelor — doable, but a longer path." });
    caveats.push("Studienkolleg places are competitive and require passing an entrance exam (Aufnahmeprüfung).");
  } else if (input.route === "medicine") {
    score -= 15;
    factors.push({ label: "Medicine is highly competitive", delta: -15, detail: "Humanmedizin has very high grade bars (NC), limited international quotas, and usually requires C1 German." });
    caveats.push("Medicine admission is among the hardest in Germany — have a backup plan.");
  } else if (input.route === "phd") {
    score += 5;
    factors.push({ label: "PhD is supervisor-led", delta: 5, detail: "Doctoral entry hinges on finding a supervisor who accepts you, more than on a central application." });
  }

  // Language readiness.
  const rank = LEVEL_RANK[input.germanLevel] ?? 0;
  const needsHighGerman = input.route === "medicine" || input.route === "studienkolleg" || (input.route === "direct_bachelor") || !input.englishTaught;
  if (needsHighGerman) {
    if (rank >= 5) {
      score += 15;
      factors.push({ label: "German already at C1+", delta: 15, detail: "You're at or near the level German-taught programmes require — a major head start." });
    } else if (rank >= 4) {
      score += 5;
      factors.push({ label: "German at B2", delta: 5, detail: "Close — one level (B2→C1) to go for most German-taught programmes." });
    } else {
      score -= 15;
      factors.push({ label: "German gap", delta: -15, detail: "You need German up to ~C1 for this route, which typically takes 12–24 months from a low level." });
      caveats.push("Budget real time for German: reaching C1 from scratch is often 1–2 years of consistent study.");
    }
  } else {
    score += 5;
    factors.push({ label: "English-taught target", delta: 5, detail: "An English-taught programme means German isn't the admission bottleneck (you'll still want everyday German)." });
  }

  // Qualification strength for the level.
  if ((input.targetLevel === "master") && input.highestQualification === "bachelor") {
    score += 10;
    factors.push({ label: "Qualification matches target", delta: 10, detail: "A completed Bachelor's is exactly what a Master's expects." });
  } else if (input.targetLevel === "master" && input.highestQualification === "some_bachelor") {
    score -= 10;
    factors.push({ label: "Bachelor's not finished", delta: -10, detail: "A Master's needs a completed Bachelor's — finish it first." });
    caveats.push("Complete your Bachelor's degree before a Master's application can succeed.");
  }

  score = clamp(score);
  const band: FeasibilityBand = score >= 75 ? "strong" : score >= 55 ? "workable" : "challenging";

  // Years estimate: prep + (Studienkolleg if applicable) + degree.
  const [degMin, degMax] = degreeYears(input.targetLevel === "" ? (input.route === "master" ? "master" : "bachelor") : input.targetLevel);
  let prepMin = 1;
  let prepMax = 2;
  if (needsHighGerman && rank < 4) {
    prepMin += 1;
    prepMax += 1;
  }
  const skMin = input.route === "studienkolleg" ? 1 : 0;
  const skMax = input.route === "studienkolleg" ? 1 : 0;

  return {
    score,
    band,
    factors,
    estYearsMin: prepMin + skMin + degMin,
    estYearsMax: prepMax + skMax + degMax,
    caveats,
  };
}
