import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CATEGORY_ACCENT, CATEGORY_LABELS } from "@/lib/categories";
import { uid } from "@/lib/doc/export";
import { useSyncedState } from "@/lib/persist/useSyncedState";
import { SEED_EVENTS } from "@/lib/seed/events";
import type { FeatureCategoryKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserDeadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category?: FeatureCategoryKey;
}

interface CalEvent {
  id: string;
  title: string;
  date: string;
  category?: FeatureCategoryKey;
  kind: "seed" | "user";
  href?: string;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** 6×7 Monday-first grid of dates covering the given month (with adjacent-month spill). */
function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const days: Date[] = [];
    for (let d = 0; d < 7; d += 1) {
      days.push(new Date(year, month, 1 - startOffset + w * 7 + d));
    }
    weeks.push(days);
  }
  return weeks;
}

function dotClass(category?: FeatureCategoryKey): string {
  return category ? CATEGORY_ACCENT[category].indicator : "bg-primary";
}

/** Deadline calendar — official seed dates + your own deadlines on a month grid (work order §8D-33). */
export default function CalendarPage() {
  const today = new Date();
  const todayIso = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [userDeadlines, setUserDeadlines] = useSyncedState<UserDeadline[]>("calendar:deadlines", []);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const events: CalEvent[] = useMemo(
    () => [
      ...SEED_EVENTS.map((e) => ({ id: e.id, title: e.title, date: e.date, category: e.category, kind: "seed" as const, href: e.href })),
      ...userDeadlines.map((d) => ({ id: d.id, title: d.title, date: d.date, category: d.category, kind: "user" as const })),
    ],
    [userDeadlines],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => monthGrid(year, month), [year, month]);

  const monthPrefix = `${year}-${pad(month + 1)}`;
  const monthEvents = events
    .filter((e) => e.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const go = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const addDeadline = () => {
    if (!title.trim() || !date) return;
    setUserDeadlines((prev) => [...prev, { id: uid("dl"), title: title.trim(), date }]);
    setTitle("");
    setDate("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kalender · Calendar"
        title="Deadline calendar"
        description="Every application, VPD, visa, and Sperrkonto date on a month grid — plus the deadlines you add yourself. Official dates that change yearly are flagged on the Deadlines page."
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous month">
                <ChevronLeft aria-hidden />
              </Button>
              <h2 className="text-center text-lg font-semibold tracking-tight" style={{ minWidth: "10rem" }}>
                {MONTHS[month]} {year}
              </h2>
              <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Next month">
                <ChevronRight aria-hidden />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.flat().map((d) => {
              const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
              const inMonth = d.getMonth() === month;
              const dayEvents = byDate.get(iso) ?? [];
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={cn(
                    "min-h-[3.5rem] rounded-md border p-1 text-left",
                    inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
                    isToday && "ring-2 ring-primary",
                  )}
                >
                  <span className={cn("official-figure text-xs", isToday && "font-bold text-primary")}>
                    {d.getDate()}
                  </span>
                  <ul className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <li key={e.id} className="flex items-center gap-1">
                        <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass(e.category))} />
                        <span className="truncate text-[0.6rem] leading-tight">{e.title}</span>
                      </li>
                    ))}
                    {dayEvents.length > 3 && (
                      <li className="text-[0.6rem] text-muted-foreground">+{dayEvents.length - 3} more</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{MONTHS[month]} {year} — dates</CardTitle>
          </CardHeader>
          <CardContent>
            {monthEvents.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                No dates this month. Add a deadline, or browse the{" "}
                <Link to="/deadlines" className="text-primary hover:underline">deadlines list</Link>.
              </p>
            ) : (
              <ul className="space-y-2">
                {monthEvents.map((e) => (
                  <li key={e.id} className="flex items-start gap-2 rounded-md border bg-card p-2.5 text-sm">
                    <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(e.category))} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">
                        {e.href ? <Link to={e.href} className="hover:underline">{e.title}</Link> : e.title}
                      </p>
                      <p className="official-figure text-xs text-muted-foreground">
                        {e.date}
                        {e.category && ` · ${CATEGORY_LABELS[e.category]}`}
                        {e.kind === "user" && " · yours"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Add a deadline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="dl-title" className="eyebrow block">Title</label>
              <Input id="dl-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="TUM application deadline" />
            </div>
            <div className="space-y-1">
              <label htmlFor="dl-date" className="eyebrow block">Date</label>
              <Input id="dl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={addDeadline} disabled={!title.trim() || !date}>
              <CalendarPlus aria-hidden /> Add deadline
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
