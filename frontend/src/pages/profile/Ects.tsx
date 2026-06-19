import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { OfficialFactRow } from "@/components/common/OfficialFact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ECTS_YEAR } from "@/lib/facts";
import {
  ECTS_PER_YEAR,
  creditsToEcts,
  summarizeEcts,
  type CourseEntry,
} from "@/lib/calc/ects";

let rowSeq = 0;
const nextId = () => `course-${rowSeq++}`;

const SEED_COURSES: CourseEntry[] = [
  { id: nextId(), name: "Algorithms & Data Structures", ects: 8 },
  { id: nextId(), name: "Databases", ects: 6 },
  { id: nextId(), name: "Distributed Systems", ects: 6 },
  { id: nextId(), name: "Bachelor's Thesis", ects: 12 },
];

/** Workload band label from the equivalent full-time years. */
function workloadBand(years: number): string {
  if (years <= 0) return "—";
  if (years < 1) return "Under one full-time year";
  if (years < 2) return "About a Bachelor's segment";
  if (years < 3.5) return "Full Bachelor's range (≈ 180 ECTS)";
  return "Beyond a standard Bachelor's";
}

/** Feature 05 — ECTS calculator. Deterministic credit summation + non-ECTS normalization. */
export default function ProfileEcts() {
  const [courses, setCourses] = useState<CourseEntry[]>(SEED_COURSES);
  const fieldBase = useId();

  // Convert tab state
  const [totalCredits, setTotalCredits] = useState("160");
  const [homeCreditsPerYear, setHomeCreditsPerYear] = useState("40");

  const summary = useMemo(() => summarizeEcts(courses), [courses]);

  const addCourse = () => setCourses((prev) => [...prev, { id: nextId(), name: "", ects: 0 }]);
  const removeCourse = (id: string) =>
    setCourses((prev) => prev.filter((c) => c.id !== id));
  const updateName = (id: string, name: string) =>
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  const updateEcts = (id: string, raw: string) => {
    const value = raw === "" ? 0 : Number(raw);
    const ects = Number.isFinite(value) && value >= 0 ? value : 0;
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ects } : c)));
  };

  const converted = useMemo<{ value: number | null; error: string | null }>(() => {
    const credits = Number(totalCredits);
    const perYear = Number(homeCreditsPerYear);
    if (totalCredits.trim() === "" || homeCreditsPerYear.trim() === "") {
      return { value: null, error: null };
    }
    if (!Number.isFinite(credits) || !Number.isFinite(perYear)) {
      return { value: null, error: "Enter numeric values." };
    }
    try {
      return { value: creditsToEcts(credits, perYear), error: null };
    } catch (e) {
      return { value: null, error: e instanceof Error ? e.message : "Could not convert." };
    }
  }, [totalCredits, homeCreditsPerYear]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature 05 · Profile"
        title="ECTS calculator"
        description="Total your credits in ECTS so a German admissions office can compare your degree to its own. A Master's is typically 120 ECTS over two years; a Bachelor's 180. All sums are computed deterministically."
        category="profile"
        fileRef="§ 05"
      />

      <Tabs defaultValue="sum">
        <TabsList>
          <TabsTrigger value="sum">Sum ECTS courses</TabsTrigger>
          <TabsTrigger value="convert">Convert non-ECTS credits</TabsTrigger>
        </TabsList>

        {/* ── Panel 1: course-by-course ECTS summation ───────────── */}
        <TabsContent value="sum">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <section
              className="rounded-lg border bg-card p-5 shadow-sm"
              aria-labelledby="courses-heading"
            >
              <h2 id="courses-heading" className="mb-4 text-sm font-medium">
                Courses
              </h2>
              <ul className="space-y-2">
                {courses.map((course, idx) => {
                  const nameId = `${fieldBase}-name-${course.id}`;
                  const ectsId = `${fieldBase}-ects-${course.id}`;
                  return (
                    <li key={course.id} className="flex items-end gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <label htmlFor={nameId} className="sr-only">
                          Course {idx + 1} name
                        </label>
                        <Input
                          id={nameId}
                          value={course.name}
                          onChange={(e) => updateName(course.id, e.target.value)}
                          placeholder={`Course ${idx + 1}`}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label htmlFor={ectsId} className="eyebrow block">
                          ECTS
                        </label>
                        <Input
                          id={ectsId}
                          type="number"
                          min={0}
                          step={0.5}
                          inputMode="decimal"
                          value={course.ects === 0 ? "" : course.ects}
                          onChange={(e) => updateEcts(course.id, e.target.value)}
                          placeholder="0"
                          className="official-figure"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCourse(course.id)}
                        aria-label={`Remove ${course.name || `course ${idx + 1}`}`}
                        className="shrink-0 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </li>
                  );
                })}
                {courses.length === 0 && (
                  <li className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                    No courses yet. Add one to start totalling ECTS.
                  </li>
                )}
              </ul>
              <Button variant="outline" size="sm" onClick={addCourse} className="mt-3">
                <Plus aria-hidden />
                Add course
              </Button>
            </section>

            <aside className="space-y-3">
              <section
                className="rounded-lg border bg-card p-5 shadow-sm"
                aria-labelledby="summary-heading"
              >
                <h2 id="summary-heading" className="eyebrow mb-3">
                  Summary
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Total ECTS</dt>
                    <dd className="official-figure text-3xl font-bold leading-none text-category-profile">
                      {summary.totalEcts}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-2 text-sm">
                    <dt className="text-muted-foreground">Courses</dt>
                    <dd className="official-figure font-medium">{summary.courseCount}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Equivalent years</dt>
                    <dd className="official-figure font-medium">{summary.equivalentYears}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">Est. workload</dt>
                    <dd className="official-figure text-right font-medium">
                      {summary.workloadHoursMin.toLocaleString("en")}–
                      {summary.workloadHoursMax.toLocaleString("en")} h
                    </dd>
                  </div>
                  <div className="border-t border-dashed pt-2 text-sm">
                    <dt className="text-xs text-muted-foreground">Band</dt>
                    <dd className="mt-0.5 font-medium">{workloadBand(summary.equivalentYears)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[0.7rem] text-muted-foreground">
                  Reference: {ECTS_PER_YEAR} ECTS per full-time year.
                </p>
              </section>
            </aside>
          </div>
        </TabsContent>

        {/* ── Panel 2: non-ECTS credit normalization ─────────────── */}
        <TabsContent value="convert">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <section
              className="rounded-lg border bg-card p-5 shadow-sm"
              aria-labelledby="convert-heading"
            >
              <h2 id="convert-heading" className="mb-1 text-sm font-medium">
                Normalize a non-ECTS system
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Studied in a system that doesn't use ECTS (e.g. US semester credits)? Scale your
                total against your home system's credits-per-year. Example: 160 credits over a 4-year
                degree means 40 credits/year, which normalizes to 240 ECTS.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="total-credits" className="eyebrow block">
                    Total credits earned
                  </label>
                  <Input
                    id="total-credits"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={totalCredits}
                    onChange={(e) => setTotalCredits(e.target.value)}
                    className="official-figure"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="home-credits" className="eyebrow block">
                    Home credits / year
                  </label>
                  <Input
                    id="home-credits"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={homeCreditsPerYear}
                    onChange={(e) => setHomeCreditsPerYear(e.target.value)}
                    className="official-figure"
                  />
                </div>
              </div>
              {converted.error && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {converted.error}
                </p>
              )}
            </section>

            <aside>
              <section
                className="rounded-lg border bg-card p-5 shadow-sm"
                aria-labelledby="convert-result-heading"
              >
                <h2 id="convert-result-heading" className="eyebrow mb-3">
                  Normalized
                </h2>
                <p className="text-xs text-muted-foreground">Equivalent ECTS</p>
                <p className="official-figure text-3xl font-bold leading-none text-category-profile">
                  {converted.value !== null ? converted.value : "—"}
                </p>
                <p className="mt-3 text-[0.7rem] text-muted-foreground">
                  Linear scaling against {ECTS_PER_YEAR} ECTS/year. Confirm the exact recognition
                  with uni-assist or your university.
                </p>
              </section>
            </aside>
          </div>
        </TabsContent>
      </Tabs>

      <OfficialFactRow fact={ECTS_YEAR} />
    </div>
  );
}
