import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkCheck, BookmarkPlus, Check, ExternalLink, GraduationCap, School, Search } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  UNIVERSITY_PROGRAMS,
  type ProgramLanguage,
  type UniversityProgram,
} from "@/lib/seed/universities";
import { useProgramData } from "@/lib/programs/useProgramData";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import type { Program } from "@/lib/programs/types";
import { cn } from "@/lib/utils";

/** Normalise a name for matching the explorer's curated row to the canonical SEED_PROGRAMS row. */
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

type LanguageFilter = "all" | ProgramLanguage;

const LANGUAGE_FILTERS: { value: LanguageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "EN", label: "English" },
  { value: "DE", label: "German" },
];

const LANGUAGE_BADGE_LABEL: Record<ProgramLanguage, string> = {
  EN: "English-taught",
  DE: "German-taught",
};

const MAX_COMPARE = 3;

/** A single programme card: identity, language badge, indicative note, official link, compare toggle. */
function ProgramCard({
  program,
  selected,
  canSelect,
  onToggleCompare,
  shortlisted,
  canShortlist,
  onToggleShortlist,
}: {
  program: UniversityProgram;
  selected: boolean;
  canSelect: boolean;
  onToggleCompare: (id: string) => void;
  /** True when this programme is already in the matching shortlist. */
  shortlisted: boolean;
  /** False when no canonical programme could be resolved (so it can't feed the shared shortlist). */
  canShortlist: boolean;
  onToggleShortlist: (id: string) => void;
}) {
  const compareDisabled = !selected && !canSelect;
  return (
    <Card className="relative flex h-full flex-col overflow-hidden">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-category-profile" />
      <CardHeader className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{program.program}</CardTitle>
            <p className="mt-1 text-sm font-medium">{program.university}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {program.city} · {program.degree} · {program.field}
            </p>
          </div>
          <Badge variant={program.language === "EN" ? "secondary" : "outline"}>
            {program.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground">{program.note}</p>

        <p className="text-xs italic text-muted-foreground">
          Requirements vary — verify per programme.
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <a
            href={program.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-category-profile underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Official page
            <span className="sr-only"> for {program.program} at {program.university} (opens in a new tab)</span>
          </a>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={shortlisted ? "secondary" : "outline"}
              size="sm"
              aria-pressed={shortlisted}
              aria-disabled={!canShortlist}
              disabled={!canShortlist}
              title={canShortlist ? undefined : "This explorer entry isn't linked to a matching programme yet."}
              onClick={() => onToggleShortlist(program.id)}
            >
              {shortlisted ? <BookmarkCheck aria-hidden /> : <BookmarkPlus aria-hidden />}
              {shortlisted ? "Shortlisted" : "Shortlist"}
            </Button>
            <Button
              type="button"
              variant={selected ? "secondary" : "outline"}
              size="sm"
              role="checkbox"
              aria-checked={selected}
              aria-disabled={compareDisabled}
              disabled={compareDisabled}
              onClick={() => onToggleCompare(program.id)}
            >
              {selected ? <Check aria-hidden /> : null}
              {selected ? "Comparing" : "Compare"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Universities & Programs Explorer — a filterable grid of real Master's programmes at German
 * public universities, with a side-by-side comparison of up to three. Every requirement is
 * indicative only (CLAUDE.md §2): no official cut-offs are asserted, and each card links to the
 * programme's own page to re-verify. Feeds the matching shortlist at /profile/matching.
 */
export default function UniversitiesExplorer() {
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  // G2-5: feed the SAME shortlist store Matching/Shortlist use, so a programme found here isn't re-found.
  const { programs } = useProgramData();
  const [shortlist, setShortlist] = useSyncedState<string[]>("programs:shortlist", []);

  // Resolve each explorer entry to its canonical SEED_PROGRAMS row (by university + programme name) so
  // "Shortlist" adds the id Matching/Shortlist resolve against — the two datasets are otherwise separate.
  const canonicalIdFor = useMemo(() => {
    const byKey = new Map<string, Program>();
    for (const p of programs) byKey.set(`${norm(p.university)}|${norm(p.name)}`, p);
    const map = new Map<string, string>();
    for (const u of UNIVERSITY_PROGRAMS) {
      const hit =
        byKey.get(`${norm(u.university)}|${norm(u.program)}`) ??
        programs.find((p) => norm(p.university) === norm(u.university) && norm(p.name).includes(norm(u.program)));
      if (hit) map.set(u.id, hit.id);
    }
    return map;
  }, [programs]);

  const toggleShortlist = (uniProgramId: string) => {
    const canonical = canonicalIdFor.get(uniProgramId);
    if (!canonical) return;
    setShortlist((prev) => (prev.includes(canonical) ? prev.filter((x) => x !== canonical) : [...prev, canonical]));
  };
  const isShortlisted = (uniProgramId: string) => {
    const canonical = canonicalIdFor.get(uniProgramId);
    return canonical ? shortlist.includes(canonical) : false;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIVERSITY_PROGRAMS.filter((p) => {
      if (language !== "all" && p.language !== language) return false;
      if (!q) return true;
      return (
        p.university.toLowerCase().includes(q) ||
        p.program.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });
  }, [language, query]);

  const compared = useMemo(
    () =>
      compareIds
        .map((id) => UNIVERSITY_PROGRAMS.find((p) => p.id === id))
        .filter((p): p is UniversityProgram => Boolean(p)),
    [compareIds],
  );

  const canSelectMore = compareIds.length < MAX_COMPARE;

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hochschulen · Universities"
        title="Universities & programs explorer"
        description="Browse Master's programmes at German public universities, filter by language and field, and compare up to three side by side. Requirements shown are indicative — confirm each on the official programme page before applying."
        category="profile"
        fileRef="§ 03+"
      />

      <Card className="relative overflow-hidden border-category-profile/30">
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-category-profile" />
        <CardHeader className="pt-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-category-profile" aria-hidden />
            Before you shortlist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Applicants from India, China, and Vietnam</span>{" "}
            usually need an <span className="font-medium text-foreground">APS certificate</span>{" "}
            (Akademische Prüfstelle) verifying their academic documents{" "}
            <span className="font-medium text-foreground">before</span> applying to most universities.
            Start that early — see the{" "}
            <Link
              to="/visa/aps"
              className="font-medium text-category-profile underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              APS guide
            </Link>
            .
          </p>
          <p>
            Found programmes that fit? <span className="font-medium text-foreground">Shortlist</span> them
            here and they feed the same list your{" "}
            <Link
              to="/profile/matching"
              className="font-medium text-category-profile underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              course &amp; university matching
            </Link>{" "}
            and{" "}
            <Link
              to="/profile/shortlist"
              className="font-medium text-category-profile underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              reach/match/safety shortlist
            </Link>{" "}
            use — no need to re-find them.
            {shortlist.length > 0 && (
              <span className="ml-1 font-medium text-foreground">
                {shortlist.length} programme{shortlist.length === 1 ? "" : "s"} shortlisted.
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <section
        className="rounded-lg border bg-card p-4 shadow-sm"
        aria-labelledby="uni-filter-heading"
      >
        <h2 id="uni-filter-heading" className="sr-only">
          Filter programmes
        </h2>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <fieldset>
            <legend className="eyebrow mb-1.5">Language</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLanguage(opt.value)}
                  aria-pressed={language === opt.value}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    language === opt.value
                      ? "border-category-profile bg-category-profile/10 text-category-profile"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="min-w-[16rem] flex-1">
            <label htmlFor="uni-search" className="eyebrow mb-1.5 block">
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="uni-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="University, programme, field, or city…"
                className="pl-8"
              />
            </div>
          </div>

          <p className="ml-auto text-xs text-muted-foreground" aria-live="polite">
            <span className="official-figure text-foreground">{results.length}</span> of{" "}
            <span className="official-figure">{UNIVERSITY_PROGRAMS.length}</span> programmes
          </p>
        </div>
      </section>

      {compared.length > 0 && (
        <section
          aria-labelledby="uni-compare-heading"
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="uni-compare-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <School className="h-4 w-4 text-category-profile" aria-hidden />
              Comparison ({compared.length}/{MAX_COMPARE})
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCompareIds([])}>
              Clear all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">
                Side-by-side comparison of the selected programmes. Requirements are indicative;
                verify each on its official page.
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Field
                  </th>
                  {compared.map((p) => (
                    <th key={p.id} scope="col" className="py-2 pr-3 align-bottom font-medium">
                      <span className="block">{p.program}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b">
                  <th scope="row" className="py-2 pr-3 font-medium text-muted-foreground">
                    University
                  </th>
                  {compared.map((p) => (
                    <td key={p.id} className="py-2 pr-3">
                      {p.university} <span className="text-muted-foreground">({p.city})</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <th scope="row" className="py-2 pr-3 font-medium text-muted-foreground">
                    Language
                  </th>
                  {compared.map((p) => (
                    <td key={p.id} className="py-2 pr-3">
                      {LANGUAGE_BADGE_LABEL[p.language]}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <th scope="row" className="py-2 pr-3 font-medium text-muted-foreground">
                    Field
                  </th>
                  {compared.map((p) => (
                    <td key={p.id} className="py-2 pr-3">
                      {p.field}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <th scope="row" className="py-2 pr-3 font-medium text-muted-foreground">
                    Indicative note
                  </th>
                  {compared.map((p) => (
                    <td key={p.id} className="py-2 pr-3 text-muted-foreground">
                      {p.note}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-muted-foreground">
                    Verify
                  </th>
                  {compared.map((p) => (
                    <td key={p.id} className="py-2 pr-3">
                      <a
                        href={p.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-category-profile underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Official page
                        <span className="sr-only"> for {p.program} (opens in a new tab)</span>
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              selected={compareIds.includes(p.id)}
              canSelect={canSelectMore}
              onToggleCompare={toggleCompare}
              shortlisted={isShortlisted(p.id)}
              canShortlist={canonicalIdFor.has(p.id)}
              onToggleShortlist={toggleShortlist}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No programmes match these filters. Try a different language or clear the search.
        </p>
      )}
    </div>
  );
}
