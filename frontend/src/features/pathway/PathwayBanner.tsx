import { Link } from "react-router-dom";
import { Route } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProfile } from "@/lib/profile/useProfile";
import { evaluatePathway, type PathwayRoute } from "@/lib/pathway/pathway";

const LABEL: Record<PathwayRoute, string> = {
  blocked: "finish Class 12 first",
  studienkolleg: "Bachelor via Studienkolleg",
  direct_bachelor: "direct Bachelor",
  master: "Master's",
  medicine: "Medicine (Humanmedizin)",
  phd: "Doctorate",
  unknown: "",
};

/**
 * A compact, pathway-aware notice (addendum §4). Shown on Master's-centric tools (matching, finance,
 * roadmap) when the user is NOT on the Master's path, so a school-leaver / medicine aspirant is never
 * silently handed Master's advice. Renders nothing for Master's or an unset level.
 */
export function PathwayBanner({ note }: { note?: string }) {
  const { profile } = useProfile();
  if (!profile.targetLevel || profile.targetLevel === "master") return null;
  const r = evaluatePathway({
    country: profile.homeCountry,
    highestQualification: profile.highestQualification,
    targetLevel: profile.targetLevel,
    targetSubject: profile.targetField || profile.currentDegree,
  });
  if (r.route === "master" || r.route === "unknown") return null;

  const variant = r.route === "blocked" ? "danger" : r.route === "medicine" ? "warning" : "info";
  return (
    <Alert variant={variant} className="text-sm">
      <Route aria-hidden />
      <AlertTitle>You're on the {LABEL[r.route]} pathway</AlertTitle>
      <AlertDescription>
        {note ?? r.summary}{" "}
        <Link to="/profile/pathway" className="font-medium underline">See your full pathway →</Link>
      </AlertDescription>
    </Alert>
  );
}
