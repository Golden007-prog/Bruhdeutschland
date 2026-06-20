import { Link } from "react-router-dom";
import { ArrowRight, Calculator, CalendarRange, ClipboardCheck, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";

const TOOLS: { to: string; icon: LucideIcon; title: string; desc: string; q: string }[] = [
  { to: "/start/eligibility", icon: ClipboardCheck, title: "Eligibility quick-check", desc: "Four questions → the correct German route (Bachelor, Studienkolleg, Master, Medicine).", q: "Can I even apply?" },
  { to: "/start/feasibility", icon: Gauge, title: "Reality check", desc: "A blunt feasibility score and an honest estimate of how many years it takes.", q: "Is this realistic for me?" },
  { to: "/start/timeline-planner", icon: CalendarRange, title: "Reverse timeline", desc: "Pick a target intake; we back-date every milestone so you know what to start when.", q: "What do I do, and by when?" },
  { to: "/start/budget", icon: Calculator, title: "Total-journey budget", desc: "One-time fees + blocked account + living, summed end-to-end with grounded figures.", q: "What will it cost?" },
];

/** Gap G01–G04 hub — the orientation funnel entry point. */
export default function StartOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 0 · Orientation"
        title="Start here — orient yourself in 5 minutes"
        description="New to studying in Germany? These four quick tools answer the questions everyone has at the start — before you invest time in the full plan. No signup needed."
      />

      <ol className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t, i) => {
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="official-figure text-xs text-muted-foreground">Step {i + 1}</span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">“{t.q}”</p>
                <h2 className="mt-0.5 font-semibold tracking-tight">{t.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
        Ready to go deeper? Build your full profile in{" "}
        <Link to="/profile/parse" className="font-medium text-primary hover:underline">Résumé parsing</Link>{" "}
        and your personalised plan appears across the dashboard, roadmap, and every tool.
      </p>
    </div>
  );
}
