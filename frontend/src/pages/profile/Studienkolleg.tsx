import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Info, Library, MapPin } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Checklist } from "@/components/common/Checklist";
import { SourceList } from "@/components/common/SourceLink";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KURSE, type KursCode } from "@/lib/pathway/kurs";
import type { ChecklistItemDef } from "@/lib/types";
import { source } from "@/lib/sources";
import {
  SEED_STUDIENKOLLEGS,
  filterStudienkollegs,
  studienkollegBundeslaender,
} from "@/lib/seed/studienkollegs";

const CHOOSE: ChecklistItemDef[] = [
  { id: "kurs", label: "Confirm the right course (Kurs) for your target subject", hint: "T/M/W/G/S — see the streams below." },
  { id: "type", label: "Choose University-Studienkolleg (qualifies for all unis) vs FH-Studienkolleg (Fachhochschulen only)" },
  { id: "public", label: "Prefer a state (public) Studienkolleg — free; private ones charge tuition", hint: "Verify cost and recognition before paying." },
  { id: "apply-via-uni", label: "Apply through a TARGET UNIVERSITY / uni-assist, not to the Studienkolleg directly" },
  { id: "aufnahme", label: "Prepare for the entrance exam (Aufnahmeprüfung) — German B1–B2 + subject basics" },
  { id: "german", label: "Reach the required German level before the entrance exam" },
];

/** G06 — Studienkolleg finder & Kurs guide. Course streams from the grounded KURSE map. */
export default function ProfileStudienkolleg() {
  const [kurs, setKurs] = useState<KursCode | "">("");
  const [bundesland, setBundesland] = useState("");
  const [skType, setSkType] = useState<"university" | "fh" | "">("");
  const blaender = useMemo(() => studienkollegBundeslaender(), []);
  const directory = useMemo(
    () => filterStudienkollegs(SEED_STUDIENKOLLEGS, { kurs, bundesland, type: skType }),
    [kurs, bundesland, skType],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="G06 · Foundations"
        title="Studienkolleg finder & course (Kurs) guide"
        description="If your school certificate isn't Abitur-equivalent, a one-year Studienkolleg confers your HZB via the Feststellungsprüfung (FSP). Here's the right course stream and how to actually get a place."
        category="profile"
      />

      <Alert variant="info" className="text-sm">
        <Info aria-hidden />
        <AlertDescription>
          You apply to a Studienkolleg <strong>through a university</strong> (often via uni-assist), not by
          contacting the college directly. A <strong>University</strong>-Studienkolleg qualifies you for all
          institutions; an <strong>FH</strong>-Studienkolleg only for universities of applied sciences.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">The course streams (Kurse)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(KURSE).map((k) => (
            <div key={k.code} className="rounded-md border bg-card p-3 text-sm">
              <p className="font-semibold">
                <span className="official-figure mr-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">{k.code}-Kurs</span>
                {k.name}
              </p>
              <p className="mt-1 text-muted-foreground">{k.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Checklist items={CHOOSE} title="Choosing & applying — what to check" storageKey="studienkolleg-checklist" />

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Library className="h-4 w-4 text-category-profile" aria-hidden /> Studienkolleg directory
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {directory.length} of {SEED_STUDIENKOLLEGS.length}
          </span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A curated sample of state (free) Studienkollegs — not the full national list. Apply through the
          partner university; confirm courses, regions, and entrance rules on each college's official page.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={kurs}
            onChange={(e) => setKurs(e.target.value as KursCode | "")}
            aria-label="Filter by course stream (Kurs)"
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="">All Kurse</option>
            {(Object.keys(KURSE) as KursCode[]).map((k) => (
              <option key={k} value={k}>{KURSE[k].name}</option>
            ))}
          </select>
          <select
            value={bundesland}
            onChange={(e) => setBundesland(e.target.value)}
            aria-label="Filter by Bundesland"
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="">All Bundesländer</option>
            {blaender.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={skType}
            onChange={(e) => setSkType(e.target.value as "university" | "fh" | "")}
            aria-label="Filter by Studienkolleg type"
            className="rounded-md border bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="">Uni + FH</option>
            <option value="university">University-Studienkolleg</option>
            <option value="fh">FH-Studienkolleg</option>
          </select>
        </div>

        {directory.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {SEED_STUDIENKOLLEGS.length === 0
              ? "Directory is being assembled."
              : "No Studienkollegs match these filters — "}
            <a href={source("studienkolleg").url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
              browse the national overview
            </a>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {directory.map((sk) => (
              <li key={sk.id} className="rounded-md border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{sk.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {sk.city} · {sk.bundesland} · via {sk.partnerUniversity}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
                    {sk.type === "university" ? "Uni" : "FH"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {sk.kurse.length > 0 ? (
                    sk.kurse.map((k) => (
                      <span key={k} className="official-figure rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] text-primary">{k}-Kurs</span>
                    ))
                  ) : (
                    <span className="text-[0.65rem] text-muted-foreground">streams: verify on site</span>
                  )}
                  <span className="text-[0.65rem] text-muted-foreground">· {sk.publicState ? "state · free" : "private · tuition"}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={sk.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline">
                    Official site <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                  {sk.needsVerification && <span className="text-[0.65rem] text-amber-600">verify details</span>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <a href={source("studienkolleg").url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground underline">
          National Studienkolleg overview <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/profile/recognition" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Check your recognition first <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link to="/language/german-plan" className="inline-flex items-center gap-1 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
          Reach the German level <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <p className="text-xs text-muted-foreground">
        Guidance only. Courses, regions, entrance-exam rules, and FSP subjects are set per Studienkolleg and
        change — confirm with the specific college and partner university.
      </p>

      <SourceList sources={[source("studienkolleg"), source("uniAssist"), source("anabin")]} />
    </div>
  );
}
