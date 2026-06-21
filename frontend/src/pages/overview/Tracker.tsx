import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ExternalLink, FileBadge, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { useTableSync } from "@/lib/persist/useTableSync";
import { stableUuid, type OwnedRow } from "@/lib/persist/syncTable";
import { emptyOffer, normalizeOffer, OFFERS_KEY, type Offer } from "@/lib/offers/offers";
import { cn } from "@/lib/utils";

type Stage = "researching" | "applying" | "submitted" | "decision";

interface Application {
  id: string;
  university: string;
  program: string;
  stage: Stage;
  deadline?: string;
  url?: string;
}

const STAGES: { key: Stage; label: string; accent: string }[] = [
  { key: "researching", label: "Researching", accent: "bg-slate-400" },
  { key: "applying", label: "Applying", accent: "bg-category-profile" },
  { key: "submitted", label: "Submitted", accent: "bg-category-finance" },
  { key: "decision", label: "Decision", accent: "bg-category-campus" },
];

const STAGE_ORDER: Stage[] = STAGES.map((s) => s.key);

/** Application tracker — a Kanban of programmes from researching to decision (work order §8D-32). */
export default function TrackerPage() {
  const [apps, setApps] = useSyncedState<Application[]>("tracker:apps", []);
  // Dual-write to the typed `applications` table when signed in (SEC-3); localStorage stays the cache.
  useTableSync(apps, setApps, {
    table: "applications",
    idOf: (a) => a.id,
    toRow: (a, _uid: string, i: number) => ({
      id: stableUuid(a.id), // client id isn't a uuid; the table PK is — derive a stable (idempotent) one
      university: a.university,
      program: a.program,
      stage: a.stage,
      deadline: a.deadline ?? null,
      url: a.url ?? null,
      sort_index: i,
    }),
    fromRow: (r: OwnedRow): Application => ({
      id: String(r.id), // on hydrate the table uuid becomes the client id; stableUuid passes it through
      university: String(r.university ?? ""),
      program: String(r.program ?? ""),
      stage: (STAGE_ORDER.includes(r.stage as Stage) ? r.stage : "researching") as Stage,
      deadline: (r.deadline as string | null) ?? undefined,
      url: (r.url as string | null) ?? undefined,
    }),
  });
  // Offers store — the spine link (G5-04). A decision-stage app can spawn/jump to its linked offer.
  const [rawOffers, setOffers] = useSyncedState<Offer[]>(OFFERS_KEY, []);
  const offers = rawOffers.map(normalizeOffer);
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");

  /** Create an offer linked to this application (shared programme identity), if one doesn't exist yet. */
  const recordOffer = (a: Application) => {
    if (offers.some((o) => o.appId === a.id)) return;
    setOffers((prev) => [
      ...prev.map(normalizeOffer),
      { ...emptyOffer(uid("offer")), appId: a.id, programme: a.program, university: a.university },
    ]);
  };

  const add = () => {
    const u = university.trim();
    const p = program.trim();
    if (!u || !p) return;
    setApps((prev) => [...prev, { id: uid("app"), university: u, program: p, stage: "researching" }]);
    setUniversity("");
    setProgram("");
  };

  const move = (id: string, dir: -1 | 1) =>
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const i = STAGE_ORDER.indexOf(a.stage);
        const next = Math.min(Math.max(i + dir, 0), STAGE_ORDER.length - 1);
        return { ...a, stage: STAGE_ORDER[next] };
      }),
    );

  const remove = (id: string) => setApps((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bewerbungen · Tracker"
        title="Application tracker"
        description="A Kanban board of every programme you're applying to — from researching to decision. Saved on this device and synced to your account when you sign in."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a programme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[10rem] flex-1 space-y-1">
              <label htmlFor="app-university" className="eyebrow block">University</label>
              <Input id="app-university" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="TU München" />
            </div>
            <div className="min-w-[10rem] flex-1 space-y-1">
              <label htmlFor="app-program" className="eyebrow block">Programme</label>
              <Input
                id="app-program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="M.Sc. Data Engineering"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
              />
            </div>
            <Button onClick={add} disabled={!university.trim() || !program.trim()}>
              <Plus aria-hidden /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((col, colIndex) => {
          const items = apps.filter((a) => a.stage === col.key);
          return (
            <section key={col.key} aria-label={col.label} className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                  <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", col.accent)} />
                  {col.label}
                </h2>
                <span className="official-figure text-xs text-muted-foreground">{items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.length === 0 ? (
                  <li className="rounded-md border border-dashed bg-card/60 p-3 text-center text-xs text-muted-foreground">
                    Nothing here yet.
                  </li>
                ) : (
                  items.map((a) => {
                    const linkedOffer = a.stage === "decision" ? offers.find((o) => o.appId === a.id) : undefined;
                    return (
                    <li key={a.id} className="rounded-md border bg-card p-3 shadow-sm">
                      <p className="text-sm font-medium leading-snug">{a.university}</p>
                      <p className="text-xs text-muted-foreground">{a.program}</p>
                      {a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Programme page <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                      {/* Spine hand-off: at decision, record/jump to the offer (G5-04). */}
                      {a.stage === "decision" && (
                        linkedOffer ? (
                          <Link to="/offers/compare" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
                            <Check className="h-3 w-3" aria-hidden /> Offer recorded ({linkedOffer.status})
                          </Link>
                        ) : (
                          <button type="button" onClick={() => recordOffer(a)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <FileBadge className="h-3 w-3" aria-hidden /> Record an offer
                          </button>
                        )
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => move(a.id, -1)}
                            disabled={colIndex === 0}
                            aria-label={`Move ${a.university} to the previous stage`}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronLeft className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(a.id, 1)}
                            disabled={colIndex === STAGES.length - 1}
                            aria-label={`Move ${a.university} to the next stage`}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(a.id)}
                          aria-label={`Remove ${a.university}`}
                          className="rounded p-1 text-muted-foreground hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                    );
                  })
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
