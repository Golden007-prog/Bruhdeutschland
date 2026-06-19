import { Circle, CircleCheck, CircleDot } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StepList } from "@/components/common/StepList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { ROADMAP_STEPS } from "@/lib/seed/process";

type StepStatus = "todo" | "active" | "done";
type StatusMap = Record<string, StepStatus>;

const EMPTY_STATUS: StatusMap = {};

/** Cycle a step's status: todo → active → done → todo. */
const NEXT_STATUS: Record<StepStatus, StepStatus> = {
  todo: "active",
  active: "done",
  done: "todo",
};

const STATUS_META: Record<
  StepStatus,
  { label: string; icon: typeof Circle; badge: "secondary" | "warning" | "success" }
> = {
  todo: { label: "To do", icon: Circle, badge: "secondary" },
  active: { label: "Active", icon: CircleDot, badge: "warning" },
  done: { label: "Done", icon: CircleCheck, badge: "success" },
};

/** Step-by-step roadmap — the canonical dependency-ordered preparation plan. */
export default function RoadmapPage() {
  // Per-step status persists across reloads (localStorage now, Supabase when signed in).
  const [status, setStatus] = useSyncedState<StatusMap>("roadmap:status", EMPTY_STATUS);

  const statusOf = (id: string): StepStatus => status[id] ?? "todo";
  const cycle = (id: string): void =>
    setStatus((prev) => ({ ...prev, [id]: NEXT_STATUS[prev[id] ?? "todo"] }));

  const total = ROADMAP_STEPS.length;
  const doneCount = ROADMAP_STEPS.filter((s) => statusOf(s.id) === "done").length;
  const progressPct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aktenplan · Roadmap"
        title="Step-by-step roadmap"
        description="A dependency-ordered plan from profile evaluation to enrolment. Each step links to the tool that completes it."
        fileRef={`${ROADMAP_STEPS.length} steps`}
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Work top to bottom — each step depends on the one before it. Steps that reference an official
        requirement (a deadline, fee, or threshold that changes yearly or by program) are flagged{" "}
        <span className="font-medium text-amber-700">needs verification</span> with a link to the
        source where you can confirm the current value. Use the duration hints to plan backwards from
        your target intake.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>The plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-2 flex items-end justify-between gap-3">
              <p className="eyebrow">Overall progress</p>
              <p className="official-figure text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{doneCount}</span>/{total} done
              </p>
            </div>
            <Progress value={progressPct} label={`Roadmap progress: ${progressPct}%`} className="h-1.5" />
          </div>

          <StepList steps={ROADMAP_STEPS} />

          <div className="space-y-2 border-t pt-4">
            <p className="eyebrow">Track each step</p>
            <ul className="space-y-1.5">
              {ROADMAP_STEPS.map((step) => {
                const s = statusOf(step.id);
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <li
                    key={step.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-transparent p-2 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{step.title}</span>
                    <Badge variant={meta.badge} className="gap-1">
                      <Icon className="h-3 w-3" aria-hidden />
                      {meta.label}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cycle(step.id)}
                      aria-label={`Step "${step.title}" is ${meta.label}. Activate to advance status.`}
                    >
                      Advance
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
