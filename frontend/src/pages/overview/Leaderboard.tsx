import { useCallback, useEffect, useState } from "react";
import { Trophy, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { percentileRank, rankFromBelow, topPercentLabel } from "@/lib/rank/percentile";

/** Ranking dimensions (must match the my_rank / leaderboard_top RPC whitelist). */
const DIMENSIONS = [
  { key: "readiness", label: "Readiness score" },
  { key: "roadmap_pct", label: "Roadmap completion" },
  { key: "best_band", label: "Best mock band" },
  { key: "streak", label: "Practice streak" },
] as const;

interface RankRow {
  value: number | null;
  // below/total are null when the opted-in cohort is too small to rank against (min-cohort guard in my_rank).
  below: number | null;
  total: number | null;
  avg: number | null;
  p50: number | null;
  p90: number | null;
}

interface TopRow {
  handle: string;
  value: number;
  rnk: number;
}

/**
 * Cross-user ranking (Section 9 §9.4). Reads the leak-safe `my_rank` RPC (the caller's own value +
 * anonymized cohort aggregates — never another user's row); the percentile/rank shown comes from the
 * tested `lib/rank/percentile` formula. An opt-in, pseudonymous board (default OFF) surfaces only chosen
 * handles via `leaderboard_top`. Available only when signed in.
 */
export default function LeaderboardPage() {
  const { user, configured } = useAuth();
  const [ranks, setRanks] = useState<Record<string, RankRow | null>>({});
  const [loading, setLoading] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [top, setTop] = useState<TopRow[]>([]);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    try {
      // Recompute the caller's own metrics server-side (readiness/roadmap/best-band/streak) before ranking,
      // so the leaderboard reflects current activity instead of waiting for the nightly cron.
      await supabase.rpc("refresh_my_leaderboard");
      const results = await Promise.all(DIMENSIONS.map((d) => supabase!.rpc("my_rank", { dimension: d.key })));
      const next: Record<string, RankRow | null> = {};
      DIMENSIONS.forEach((d, i) => {
        const data = results[i].data;
        next[d.key] = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
      });
      setRanks(next);
      const { data: row } = await supabase
        .from("leaderboard_stats").select("opted_in, handle").eq("user_id", user.id).maybeSingle();
      setOptedIn(Boolean(row?.opted_in));
      setHandle(row?.handle ?? "");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Refresh the opt-in board whenever the user is opted in with a handle.
  useEffect(() => {
    if (!supabase || !user || !optedIn) {
      setTop([]);
      return;
    }
    let active = true;
    void supabase.rpc("leaderboard_top", { dimension: "readiness", lim: 20 }).then(({ data }) => {
      if (active) setTop(Array.isArray(data) ? (data as TopRow[]) : []);
    });
    return () => { active = false; };
  }, [user, optedIn]);

  const saveOptIn = async (nextOptedIn: boolean) => {
    if (!supabase || !user) return;
    setSaving(true);
    try {
      await supabase.from("leaderboard_stats").upsert({
        user_id: user.id,
        opted_in: nextOptedIn,
        handle: handle.trim() || null,
        updated_at: new Date().toISOString(),
      });
      setOptedIn(nextOptedIn);
    } finally {
      setSaving(false);
    }
  };

  if (!configured || !user) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Rangliste · Leaderboard" title="Your standing"
          description="See how your readiness, roadmap progress, mock bands, and streak compare — anonymously — against everyone else preparing." />
        <Alert variant="info" className="text-sm">
          <AlertDescription>Ranking is available when you're signed in. Your standing is computed without ever exposing anyone else's identity.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Rangliste · Leaderboard" title="Your standing"
        description="How you compare against everyone preparing — computed from anonymized cohort aggregates, never another person's data. Stats refresh nightly as you complete activities." />

      <div className="grid gap-3 sm:grid-cols-2">
        {DIMENSIONS.map((d) => {
          const r = ranks[d.key];
          const hasValue = r != null && r.value != null;
          const ranked = hasValue && r!.below != null && r!.total != null && r!.total > 0;
          const pct = ranked ? percentileRank({ below: r!.below as number, total: r!.total as number }) : 0;
          return (
            <div key={d.key} className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="eyebrow">{d.label}</p>
              {loading && !r ? (
                <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
              ) : ranked ? (
                <>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{topPercentLabel(pct)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Rank <span className="font-mono">{rankFromBelow({ below: r!.below as number, total: r!.total as number })}</span> of{" "}
                    <span className="font-mono">{r!.total}</span>
                    {r!.avg != null && <> · cohort avg <span className="font-mono">{r!.avg}</span></>}
                  </p>
                </>
              ) : hasValue ? (
                <>
                  <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{r!.value}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Your score — ranking unlocks once ≥5 people opt into the board.</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Not ranked yet — complete more activities; stats refresh nightly.</p>
              )}
            </div>
          );
        })}
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="eyebrow flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Pseudonymous leaderboard</p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Opt in to the public board</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Off by default. If you opt in, only a handle you choose (no name or email) and your score appear to others. You can opt out any time.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Display handle</span>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. studienkolleg_kid"
              maxLength={24} className="rounded-md border bg-background px-3 py-1.5 text-sm" />
          </label>
          {optedIn ? (
            <Button variant="outline" disabled={saving} onClick={() => void saveOptIn(false)}>Opt out</Button>
          ) : (
            <Button disabled={saving || !handle.trim()} onClick={() => void saveOptIn(true)}>Opt in &amp; show me</Button>
          )}
        </div>

        {optedIn && top.length > 0 && (
          <ol className="mt-5 space-y-1.5">
            {top.map((t) => (
              <li key={`${t.rnk}-${t.handle}`} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">#{t.rnk}</span>
                  {t.handle === handle.trim() && <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden />}
                  <span className={t.handle === handle.trim() ? "font-semibold" : ""}>{t.handle}</span>
                </span>
                <span className="font-mono">{t.value}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-xs text-muted-foreground">Guidance, not a grade. Ranking math is deterministic and tested; the board never reveals another user's identity.</p>
    </div>
  );
}
