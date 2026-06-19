import { Check, CircleDashed, Clock, Send } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusBoard } from "@/components/common/StatusBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationStageState } from "@/lib/types";
import { APPLICATION_STAGES } from "@/lib/seed/process";

/** The four FSM states every application thread moves through, in order. */
const STATE_LEGEND: {
  state: ApplicationStageState;
  label: string;
  icon: typeof Check;
  description: string;
}[] = [
  {
    state: "not_started",
    label: "Not started",
    icon: CircleDashed,
    description: "Queued, but blocked or not yet begun — often waiting on an earlier step.",
  },
  {
    state: "in_progress",
    label: "In progress",
    icon: Clock,
    description: "You're actively working on it — drafting, booking, or gathering documents.",
  },
  {
    state: "submitted",
    label: "Submitted",
    icon: Send,
    description: "Handed off and out of your hands — awaiting a decision, verification, or receipt.",
  },
  {
    state: "complete",
    label: "Complete",
    icon: Check,
    description: "Finished and confirmed. Nothing more to do on this thread.",
  },
];

/** Application status board — process polling across every application thread. */
export default function ProcessPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bearbeitungsstand · Status"
        title="Application status board"
        description="Process polling for every application thread — where each one stands in the not-started → submitted → complete pipeline."
      />

      <StatusBoard stages={APPLICATION_STAGES} />

      <Card>
        <CardHeader>
          <CardTitle>How states work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Each thread advances through four states in order. The four-segment bar on every card
            shows how far along it is. States only ever move forward.
          </p>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium">
            {STATE_LEGEND.map((s, i) => (
              <li key={s.state} className="flex items-center gap-2">
                <span className="official-figure rounded bg-muted px-2 py-0.5 text-xs">{s.label}</span>
                {i < STATE_LEGEND.length - 1 && (
                  <span aria-hidden className="text-muted-foreground">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
          <dl className="grid gap-3 sm:grid-cols-2">
            {STATE_LEGEND.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.state} className="rounded-md border bg-card p-3">
                  <dt className="flex items-center gap-2 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{s.description}</dd>
                </div>
              );
            })}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
