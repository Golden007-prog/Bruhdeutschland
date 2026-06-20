import { Link } from "react-router-dom";
import { ArrowRight, Compass, MessageSquare, Route as RouteIcon, School, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";

const TOOLS: { to: string; icon: LucideIcon; title: string; desc: string; q: string }[] = [
  { to: "/career/counseling", icon: MessageSquare, title: "Counseling & course choice", desc: "A quick interest self-check + optional AI consultation → fields to explore, then straight into matching.", q: "What should I even study?" },
  { to: "/career/outcomes", icon: TrendingUp, title: "Career outcomes & demand", desc: "Roles, demand, shortage-occupation status, and which Blue Card threshold each field maps to.", q: "Where does this lead?" },
  { to: "/career/education-system", icon: School, title: "German education system", desc: "Universität vs TU vs Fachhochschule, and the school structure behind the HZB.", q: "How does it all fit together?" },
  { to: "/arrival/immigration-pathway", icon: RouteIcon, title: "The immigration long-game", desc: "Study → 18-mo job-seeker → Blue Card → PR → Citizenship, with the current 2026 rules.", q: "Can I stay long-term?" },
];

/** Long-game §5 hub — front-of-funnel career & guidance. */
export default function CareerOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bereich · Career"
        title="Career & guidance"
        description="Before you pick a programme, get the direction right. These tools take you from “what should I study?” to “where does it lead and can I stay?” — grounded, honest, and wired into the rest of your plan."
      />

      <ol className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link to={t.to} className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
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

      <p className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
        <Compass className="h-4 w-4 shrink-0" aria-hidden />
        Guidance only — career and immigration outcomes depend on you, the market, and the law. Verify before deciding.
      </p>
    </div>
  );
}
