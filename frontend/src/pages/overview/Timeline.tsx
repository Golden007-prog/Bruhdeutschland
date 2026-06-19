import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PREP_TIMELINE } from "@/lib/seed/overview";

/** Preparation timeline — the typical 12–18 month arc, anchored to the application deadline. */
export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Zeitplan · Timeline"
        title="Preparation timeline"
        description="A month-by-month view of the typical 12–18 month preparation arc, from first research to arrival in Germany."
        fileRef={`${PREP_TIMELINE.length} phases`}
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertDescription>
          Windows are relative to your application deadline (<span className="font-medium">T</span>),
          not fixed calendar dates — plan backwards from the intake you're targeting. The{" "}
          <span className="font-medium">order</span> of these phases is what matters; allow extra buffer
          for anything involving certified documents, the APS, or a visa appointment.
        </AlertDescription>
      </Alert>

      <ol className="relative space-y-2">
        {PREP_TIMELINE.map((phase, idx) => {
          const last = idx === PREP_TIMELINE.length - 1;
          return (
            <li key={phase.id} className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-6">
              {!last && (
                <span
                  aria-hidden
                  className="absolute left-[1.25rem] top-10 -ml-px h-full w-px bg-border"
                />
              )}
              <div className="z-[1] flex h-10 w-10 items-center justify-center rounded-full border bg-card text-sm font-semibold text-primary">
                <span className="official-figure" aria-hidden>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="sr-only">Phase {idx + 1}:</span>
              </div>
              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight">{phase.phase}</h2>
                  <span className="official-figure rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {phase.window}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
