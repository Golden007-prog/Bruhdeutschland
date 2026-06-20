import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Columns3, Database, LayoutGrid, List, Loader2, MapPin, Save, Search, Sparkles, X } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { PathwayBanner } from "@/features/pathway/PathwayBanner";
import { FilterPanel } from "@/features/programs/FilterPanel";
import { ProgramCard } from "@/features/programs/ProgramCard";
import { MapView } from "@/features/programs/MapView";
import { facetValueLabel } from "@/features/programs/labels";
import { AiGeneratedBadge, NoProviderAlert, RetryAlert } from "@/features/ai/AiNotices";
import { useGenerate } from "@/features/ai/useGenerate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { eligibility } from "@/lib/programs/eligibility";
import { useProgramData } from "@/lib/programs/useProgramData";
import { type Filters, type FacetKey, type SortKey, autocomplete, runSearch } from "@/lib/programs/search";
import type { Program } from "@/lib/programs/types";
import { isProfileStarted } from "@/lib/profile/profile";
import { useProfile } from "@/lib/profile/useProfile";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { uid } from "@/lib/doc/export";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
type View = "grid" | "list" | "map";
const matchSchema = z.object({ query: z.string(), subjectGroup: z.string().optional() });

const FACET_PARAMS: FacetKey[] = ["language", "subjectGroup", "degree", "bundesland", "city", "institutionType", "intake", "admissionMode", "mode", "tuition"];

function parseList(sp: URLSearchParams, key: string): string[] | undefined {
  const v = sp.get(key);
  return v ? v.split(",").filter(Boolean) : undefined;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
}

type ProgramLevel = "bachelor" | "master" | "medicine" | "all";

/** Map the user's pathway target level to the programme pool to show by default. */
function levelForTarget(t: string): ProgramLevel {
  if (t === "medicine") return "medicine";
  if (t === "bachelor" || t === "studienkolleg") return "bachelor";
  return "master";
}

const LEVEL_TABS: { key: ProgramLevel; label: string }[] = [
  { key: "bachelor", label: "Bachelor" },
  { key: "master", label: "Master's" },
  { key: "medicine", label: "Medicine" },
  { key: "all", label: "All" },
];

/** Feature 03 — a faceted, hybrid-search programme finder over real, provenance-stamped programmes. */
export default function ProfileMatching() {
  const { programs, loading, source } = useProgramData();
  const { profile } = useProfile();
  const hasProfile = isProfileStarted(profile);
  // Show the programme pool for the user's pathway (Bachelor / Master / Medicine), switchable.
  const [level, setLevel] = useState<ProgramLevel>(() => levelForTarget(profile.targetLevel));
  const pooled = useMemo(
    () => (level === "all" ? programs : programs.filter((p) => (p.courseType || "master") === level)),
    [programs, level],
  );
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [view, setView] = useState<View>("grid");
  const [page, setPage] = useState(0);
  const [shortlist, setShortlist] = useSyncedState<string[]>("programs:shortlist", []);
  const [saved, setSaved] = useSyncedState<SavedSearch[]>("programs:savedSearches", []);
  const [apps, setApps] = useSyncedState<{ id: string; university: string; program: string; stage: string; url?: string }[]>("tracker:apps", []);
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [goal, setGoal] = useState("");
  const ai = useGenerate<z.infer<typeof matchSchema>>();

  // Debounce the search box into the URL `q`.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (query.trim()) next.set("q", query.trim());
          else next.delete("q");
          return next;
        },
        { replace: true },
      );
      setPage(0);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filters: Filters = {
    q: params.get("q") ?? undefined,
    language: parseList(params, "language") as Filters["language"],
    subjectGroup: parseList(params, "subjectGroup"),
    degree: parseList(params, "degree"),
    bundesland: parseList(params, "bundesland"),
    city: parseList(params, "city"),
    institutionType: parseList(params, "institutionType") as Filters["institutionType"],
    intake: parseList(params, "intake") as Filters["intake"],
    admissionMode: parseList(params, "admissionMode") as Filters["admissionMode"],
    mode: parseList(params, "mode") as Filters["mode"],
    tuition: parseList(params, "tuition") as Filters["tuition"],
    tests: parseList(params, "tests"),
    jointDouble: params.get("jointDouble") === "1" || undefined,
    semestersMax: params.get("semestersMax") ? Number(params.get("semestersMax")) : undefined,
    eligibility: parseList(params, "eligibility") as Filters["eligibility"],
  };

  const { results, total, facets } = useMemo(
    () => runSearch(pooled, filters, sort, hasProfile ? profile : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pooled, params.toString(), sort, profile],
  );

  const setListParam = (key: string, list: string[] | undefined) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (list && list.length) next.set(key, list.join(","));
      else next.delete(key);
      return next;
    });

  const toggleFacet = (key: FacetKey, value: string) => {
    const cur = parseList(params, key) ?? [];
    setListParam(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
    setPage(0);
  };

  const setSpecial = (patch: Partial<Filters>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if ("jointDouble" in patch) {
        if (patch.jointDouble) next.set("jointDouble", "1");
        else next.delete("jointDouble");
      }
      if ("tests" in patch) {
        if (patch.tests?.length) next.set("tests", patch.tests.join(","));
        else next.delete("tests");
      }
      if ("semestersMax" in patch) {
        if (patch.semestersMax) next.set("semestersMax", String(patch.semestersMax));
        else next.delete("semestersMax");
      }
      if ("eligibility" in patch) {
        if (patch.eligibility?.length) next.set("eligibility", patch.eligibility.join(","));
        else next.delete("eligibility");
      }
      return next;
    });
    setPage(0);
  };

  const clearAll = () => {
    setParams(new URLSearchParams());
    setQuery("");
    setPage(0);
  };

  const toggleShortlist = (id: string) => setShortlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleCompare = (id: string) => setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));
  // A programme is "tracked" once an app row matches its university + "name · degree" label.
  const trackedKey = (university: string, program: string) => `${university}::${program}`;
  const trackedKeys = useMemo(
    () => new Set(apps.map((a) => trackedKey(a.university, a.program))),
    [apps],
  );
  const programLabel = (p: { name: string; degree: string }) => `${p.name} · ${p.degree}`;
  const addToTracker = (id: string) => {
    const p = programs.find((x) => x.id === id);
    if (!p) return;
    const key = trackedKey(p.university, programLabel(p));
    if (trackedKeys.has(key)) return; // already tracked — no silent duplicate
    setApps((prev) => [...prev, { id: uid("app"), university: p.university, program: programLabel(p), stage: "researching", url: p.sourceUrl }]);
  };

  async function matchWithAi() {
    const result = await ai.generate(
      matchSchema,
      `A prospective Master's student describes their goal. Turn it into a concise search query of 2-6 keywords for a German programme finder, and optionally one subject group from: Engineering, Mathematics & Natural Sciences, Law Economics & Social Sciences, Language & Cultural Studies, Art Music & Design, Medicine & Health.\n\nGoal: ${goal.trim()}`,
      "{ query: string, subjectGroup?: string }",
      0.3,
    );
    setQuery(result?.query?.trim() || goal.trim());
    if (result?.subjectGroup) setListParam("subjectGroup", [result.subjectGroup]);
  }

  const activeChips: { label: string; clear: () => void }[] = [
    ...FACET_PARAMS.flatMap((key) => (parseList(params, key) ?? []).map((v) => ({ label: facetValueLabel(key, v), clear: () => toggleFacet(key, v) }))),
    ...(filters.tests ?? []).map((t) => ({ label: t.toUpperCase(), clear: () => setSpecial({ tests: (filters.tests ?? []).filter((x) => x !== t) }) })),
    ...(filters.jointDouble ? [{ label: "Joint/double degree", clear: () => setSpecial({ jointDouble: undefined }) }] : []),
    ...(filters.semestersMax ? [{ label: `≤ ${filters.semestersMax} sem`, clear: () => setSpecial({ semestersMax: undefined }) }] : []),
    ...(filters.eligibility ?? []).map((e) => ({ label: e, clear: () => setSpecial({ eligibility: (filters.eligibility ?? []).filter((x) => x !== e) }) })),
  ];

  const suggestions = query.trim().length >= 2 ? autocomplete(programs, query) : [];
  const paged = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pages = Math.ceil(results.length / PAGE_SIZE);
  const compareItems = programs.filter((p) => compare.includes(p.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 03 · Profile"
        title="Course & university finder"
        description="Search real Master's programmes at German public universities. Filter, compare, and check your eligibility — requirements are indicative and link to the official page to verify."
        category="profile"
        fileRef="§ 03"
      />

      <PathwayBanner note="Pick your study level below — Bachelor/Medicine follow a Studienkolleg / quota route, shown on your pathway page." />

      <div role="group" aria-label="Study level" className="flex flex-wrap gap-1.5">
        {LEVEL_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={level === t.key}
            onClick={() => { setLevel(t.key); setPage(0); }}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${level === t.key ? "border-primary bg-primary/5 font-medium text-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Alert variant="info" className="text-xs">
        <Database aria-hidden />
        <AlertTitle>{pooled.length} {level === "all" ? "" : `${level} `}programmes · {source === "supabase" ? "live from your database" : "bundled curated set"}</AlertTitle>
        <AlertDescription>
          A hand-verified subset of real programmes (DAAD &amp; Hochschulkompass are the authoritative
          directories). Admission requirements change yearly and per programme — confirm each one on its
          official page before applying.
        </AlertDescription>
      </Alert>

      <details className="rounded-lg border bg-card p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Match with AI — describe your goal
        </summary>
        <div className="mt-3 space-y-3">
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="e.g. a research-focused master in machine learning, taught in English, ideally low tuition." />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => void matchWithAi()} disabled={!goal.trim() || ai.loading} aria-busy={ai.loading}>
              {ai.loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} Find programmes
            </Button>
            {ai.result && <AiGeneratedBadge />}
          </div>
          {ai.noProvider && <NoProviderAlert />}
          {ai.error && <RetryAlert message={ai.error} onRetry={matchWithAi} />}
        </div>
      </details>

      <div className="relative">
        <label htmlFor="prog-search" className="sr-only">Search programmes</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input id="prog-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programme, university, city, or subject…" className="pl-9" list="prog-ac" />
        <datalist id="prog-ac">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <FilterPanel facets={facets} filters={filters} hasProfile={hasProfile} onToggleFacet={toggleFacet} onSpecial={setSpecial} onClear={clearAll} />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              {loading ? "Loading programmes…" : <><span className="official-figure font-semibold text-foreground">{total}</span> programme{total === 1 ? "" : "s"} for your criteria</>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="sort" className="sr-only">Sort</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-8 rounded-md border bg-card px-2 text-sm">
                <option value="relevance">Relevance</option>
                <option value="az">University A–Z</option>
                <option value="tuition">Tuition (low→high)</option>
                <option value="duration">Duration</option>
                <option value="deadline">Deadline</option>
              </select>
              <div className="flex rounded-md border bg-card p-0.5" role="group" aria-label="View">
                {([["grid", LayoutGrid], ["list", List], ["map", MapPin]] as const).map(([v, Icon]) => (
                  <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`} className={cn("rounded p-1.5", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(activeChips.length > 0 || filters.q) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.q && <Badge variant="secondary" className="gap-1">“{filters.q}”<button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X className="h-3 w-3" aria-hidden /></button></Badge>}
              {activeChips.map((c, i) => (
                <Badge key={`${c.label}-${i}`} variant="secondary" className="gap-1">
                  {c.label}<button type="button" onClick={c.clear} aria-label={`Remove ${c.label}`}><X className="h-3 w-3" aria-hidden /></button>
                </Badge>
              ))}
              <button type="button" onClick={() => setSaved((prev) => [...prev, { id: uid("ss"), name: filters.q || activeChips.map((c) => c.label).slice(0, 2).join(" + ") || "Search", query: params.toString() }])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <Save className="h-3 w-3" aria-hidden /> Save search
              </button>
            </div>
          )}

          {saved.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Saved:</span>
              {saved.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5">
                  <button type="button" onClick={() => { setParams(new URLSearchParams(s.query)); setQuery(new URLSearchParams(s.query).get("q") ?? ""); }} className="hover:underline">{s.name}</button>
                  <button type="button" onClick={() => setSaved((prev) => prev.filter((x) => x.id !== s.id))} aria-label={`Delete saved search ${s.name}`}><X className="h-3 w-3" aria-hidden /></button>
                </span>
              ))}
            </div>
          )}

          {total === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No programmes match every filter.</p>
              <p className="mt-1">Try removing a filter, or <button type="button" onClick={clearAll} className="text-primary hover:underline">clear all</button>.</p>
            </div>
          ) : view === "map" ? (
            <MapView items={results} onCity={(city) => setListParam("city", [city])} />
          ) : (
            <div className={cn(view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4")}>
              {paged.map(({ program, relevance }) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  relevance={relevance}
                  hasQuery={Boolean(filters.q)}
                  eligibility={hasProfile ? eligibility(profile, program) : undefined}
                  shortlisted={shortlist.includes(program.id)}
                  inCompare={compare.includes(program.id)}
                  compareDisabled={compare.length >= 4}
                  onShortlist={() => toggleShortlist(program.id)}
                  onCompare={() => toggleCompare(program.id)}
                  onTrack={() => addToTracker(program.id)}
                  tracked={trackedKeys.has(trackedKey(program.university, programLabel(program)))}
                />
              ))}
            </div>
          )}

          {view !== "map" && pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="official-figure text-sm text-muted-foreground">{page + 1} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>

      {compare.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm font-medium"><Columns3 className="mr-1 inline h-4 w-4" aria-hidden /> Comparing {compare.length}/4</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowCompare(true)}>Compare</Button>
              <Button size="sm" variant="ghost" onClick={() => setCompare([])}>Clear</Button>
            </div>
          </div>
        </div>
      )}

      {showCompare && compareItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label="Compare programmes">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-lg border bg-card p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Compare programmes</h2>
              <button type="button" onClick={() => setShowCompare(false)} aria-label="Close"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {([
                    ["Programme", (p: Program) => `${p.name} · ${p.degree}`],
                    ["University", (p: Program) => p.university],
                    ["City", (p: Program) => `${p.city}, ${p.bundesland}`],
                    ["Language", (p: Program) => p.languages],
                    ["Tuition", (p: Program) => (p.tuitionPerSemester ? `€${p.tuitionPerSemester}/sem` : "None")],
                    ["Intake", (p: Program) => p.intake],
                    ["Admission", (p: Program) => p.admissionMode ?? "—"],
                  ] as [string, (p: Program) => string][]).map(([label, get]) => (
                    <tr key={label} className="border-b">
                      <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left align-top font-medium text-muted-foreground">{label}</th>
                      {compareItems.map((p) => (
                        <td key={p.id} className="py-2 pr-3 align-top">{get(p)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="py-2 pr-3 text-left align-top font-medium text-muted-foreground">Official</th>
                    {compareItems.map((p) => (
                      <td key={p.id} className="py-2 pr-3 align-top">
                        <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open ↗</a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
