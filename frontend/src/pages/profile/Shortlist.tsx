import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, Loader2, Target } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useProfile } from "@/lib/profile/useProfile";
import { isProfileStarted } from "@/lib/profile/profile";
import { useProgramData } from "@/lib/programs/useProgramData";
import { eligibility, type EligibilityRollup } from "@/lib/programs/eligibility";
import type { Program } from "@/lib/programs/types";
import { cn } from "@/lib/utils";

type Tier = "reach" | "match" | "safety" | "unknown";

const TIER_OF: Record<EligibilityRollup, Tier> = {
  stretch: "reach",
  borderline: "match",
  likely: "safety",
  unknown: "unknown",
};

const TIER_META: Record<Tier, { label: string; blurb: string; cls: string }> = {
  reach: { label: "Reach", blurb: "Ambitious — you don't clearly meet every bar yet. Worth a few, not your whole list.", cls: "border-red-200 bg-red-50/40" },
  match: { label: "Match", blurb: "Realistic — you're borderline-to-competitive. The core of a healthy list.", cls: "border-amber-200 bg-amber-50/40" },
  safety: { label: "Safety", blurb: "You likely meet the visible criteria. Always keep at least one.", cls: "border-emerald-200 bg-emerald-50/40" },
  unknown: { label: "Needs your profile", blurb: "We can't tier these until your profile is complete.", cls: "border-dashed" },
};

const TIER_ORDER: Tier[] = ["reach", "match", "safety", "unknown"];

/** G14 — Reach / match / safety shortlist. Tiers the user's shortlisted programmes by honest eligibility. */
export default function ProfileShortlist() {
  const { profile } = useProfile();
  const hasProfile = isProfileStarted(profile);
  const { programs, loading } = useProgramData();
  const [shortlist] = useSyncedState<string[]>("programs:shortlist", []);

  const tiered = useMemo(() => {
    const byTier: Record<Tier, Program[]> = { reach: [], match: [], safety: [], unknown: [] };
    const picked = programs.filter((p) => shortlist.includes(p.id));
    for (const p of picked) {
      const tier = hasProfile ? TIER_OF[eligibility(profile, p).rollup] : "unknown";
      byTier[tier].push(p);
    }
    return byTier;
  }, [programs, shortlist, profile, hasProfile]);

  const total = shortlist.length;
  const balanced = tiered.safety.length >= 1 && tiered.match.length >= 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G14 · Profile"
        title="Reach / match / safety shortlist"
        description="A portfolio view of your shortlist, tiered by your honest per-programme eligibility. Aim for a balanced spread — a couple of reaches, several matches, and at least one safety."
        category="profile"
      />

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading programmes…
        </div>
      ) : total === 0 ? (
        <Alert variant="info" className="text-sm">
          <Info aria-hidden />
          <AlertDescription>
            Your shortlist is empty. Shortlist programmes (the bookmark on each card) in{" "}
            <Link to="/profile/matching" className="font-medium underline">University matching</Link>, then
            come back to see them tiered.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {!hasProfile && (
            <Alert variant="warning" className="text-sm">
              <Info aria-hidden />
              <AlertDescription>
                Complete your <Link to="/settings" className="font-medium underline">profile</Link> so we can
                tier these by eligibility instead of listing them as "needs profile".
              </AlertDescription>
            </Alert>
          )}
          {hasProfile && !balanced && (
            <Alert variant="warning" className="text-sm">
              <Target aria-hidden />
              <AlertDescription>
                Your list looks <strong>unbalanced</strong>. {tiered.safety.length === 0 ? "Add at least one safety you clearly qualify for. " : ""}{tiered.match.length === 0 ? "Add some realistic matches. " : ""}Don't bet everything on reaches.
              </AlertDescription>
            </Alert>
          )}

          {TIER_ORDER.filter((t) => tiered[t].length > 0).map((t) => {
            const meta = TIER_META[t];
            return (
              <section key={t} className={cn("rounded-lg border p-4", meta.cls)}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{meta.label}</h2>
                  <Badge variant="outline" className="official-figure">{tiered[t].length}</Badge>
                  <span className="text-xs text-muted-foreground">{meta.blurb}</span>
                </div>
                <ul className="space-y-2">
                  {tiered[t].map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card p-3 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">{p.name}</span>{" "}
                        <span className="text-muted-foreground">· {p.university}, {p.city} · {p.languages}</span>
                      </span>
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline">
                        Official page <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/matching" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Add more programmes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/finance/application-costs" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Estimate application costs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Tiers are computed from the criteria DeutschPrep can see and are indicative only — the programme's
        official page is the source of truth for every requirement.
      </p>
    </div>
  );
}
