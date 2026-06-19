import { PageHeader } from "@/components/common/PageHeader";
import { StepList } from "@/components/common/StepList";
import { RoadmapTracker } from "@/components/RoadmapTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockRoadmapItems } from "@/lib/mockData";
import { ROADMAP_STEPS } from "@/lib/seed/process";

/** Step-by-step roadmap — the canonical dependency-ordered preparation plan. */
export default function RoadmapPage() {
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
        <CardContent>
          <StepList steps={ROADMAP_STEPS} />
        </CardContent>
      </Card>

      <section aria-labelledby="tracked-heading" className="space-y-3">
        <div>
          <p className="eyebrow">Verfolgt · Tracked</p>
          <h2 id="tracked-heading" className="mt-1 text-lg font-semibold tracking-tight">
            Your tracked progress
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The same journey as your live checklist — what's done, what's active now, and what's still
            locked behind an earlier step.
          </p>
        </div>
        <RoadmapTracker items={mockRoadmapItems} />
      </section>
    </div>
  );
}
