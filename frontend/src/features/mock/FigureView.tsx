import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Figure } from "@/lib/exam/schema";

/** Category-accent palette for chart series. */
const COLORS = ["hsl(222 89% 55%)", "hsl(160 84% 39%)", "hsl(35 92% 50%)", "hsl(262 83% 58%)", "hsl(199 89% 48%)"];

/**
 * Render a generated Writing Task-1 figure with Recharts (or a table). The model supplies real
 * underlying data so the prompt describes an actual chart rather than "imagine a chart".
 */
export function FigureView({ figure }: { figure: Figure }) {
  // Pivot series→points into a row-per-label shape Recharts consumes.
  const labels = figure.series[0]?.points.map((p) => p.label) ?? [];
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of figure.series) row[s.name] = s.points[i]?.value ?? 0;
    return row;
  });

  return (
    <figure className="rounded-md border bg-card p-4">
      <figcaption className="mb-3 text-sm font-medium">{figure.title}</figcaption>
      {figure.chartType === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{figure.xLabel ?? "Category"}</th>
                {figure.series.map((s) => (
                  <th key={s.name} className="p-2 text-right official-figure">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={String(row.label)} className="border-b">
                  <td className="p-2">{row.label}</td>
                  {figure.series.map((s) => (
                    <td key={s.name} className="p-2 text-right official-figure">{row[s.name]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {figure.chartType === "line" ? (
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {figure.series.map((s, i) => (
                  <Line key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            ) : figure.chartType === "pie" ? (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={data} dataKey={figure.series[0]?.name} nameKey="label" outerRadius={90} label>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {figure.series.map((s, i) => (
                  <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
