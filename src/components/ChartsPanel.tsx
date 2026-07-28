import { useMemo } from 'react';
import type { ColumnStats } from '../utils/columnAnalyzer';
import type { Row } from '../utils/fileParser';
import { HistogramChart } from './HistogramChart';
import { CategoryBarChart } from './CategoryBarChart';
import { MetricBarChart } from './MetricBarChart';
import { MetricLineChart } from './MetricLineChart';
import { MetricDoughnut } from './MetricDoughnut';

interface ChartsPanelProps {
  rows: Row[];
  columns: ColumnStats[];
  selected: string | null;
}

const LIMIT_HISTOGRAMS = 5;
const LIMIT_CATEGORY_BARS = 3;

export function ChartsPanel({ rows, columns, selected }: ChartsPanelProps) {
  const targeted = useMemo<ColumnStats[]>(() => {
    if (selected) {
      const found = columns.find((c) => c.name === selected);
      return found ? [found] : [];
    }
    return columns;
  }, [columns, selected]);

  const charts = useMemo(
    () => buildCharts(rows, targeted, selected),
    [rows, targeted, selected]
  );

  if (charts.length === 0) {
    return (
      <div className="glass" style={{ padding: 22, color: 'var(--text-mute)' }}>
        No charts can be drawn from this column. Select a different column.
      </div>
    );
  }

  return (
    <div className="charts-grid">
      {charts.map((c, i) => (
        <div key={i} className="glass chart-card">
          <div className="chart-header">
            <div>
              <h4 className="chart-title">{c.title}</h4>
              <div className="chart-subtitle">{c.subtitle}</div>
            </div>
          </div>
          <div className="chart-canvas-sm">{c.node}</div>
        </div>
      ))}
    </div>
  );
}

interface ChartCard {
  title: string;
  subtitle: string;
  node: React.ReactNode;
}

function buildCharts(
  rows: Row[],
  stats: ColumnStats[],
  selected: string | null
): ChartCard[] {
  const cards: ChartCard[] = [];

  const nums: ColumnStats[] = [];
  const strings: ColumnStats[] = [];
  const dates: ColumnStats[] = [];
  for (const s of stats) {
    if (s.type === 'number') nums.push(s);
    else if (s.type === 'date') dates.push(s);
    else strings.push(s);
  }

  // 1. Histograms: one per numeric column (capped to LIMIT_HISTOGRAMS).
  const histNums = nums.slice(0, LIMIT_HISTOGRAMS);
  for (const c of histNums) {
    const values = collectNumeric(rows, c.name);
    if (values.length === 0) continue;
    cards.push({
      title: `Distribution of ${c.name}`,
      subtitle: `${values.length.toLocaleString()} values · mean ${fmt(c.numeric!.mean)}`,
      node: <HistogramChart values={values} label={c.name} />,
    });
  }

  // 2. Top category breakdowns (horizontal bar). When a column is selected we chart that one only.
  if (!selected || strings.length > 0) {
    const list = selected ? strings : strings.slice(0, LIMIT_CATEGORY_BARS);
    for (const c of list) {
      if (!c.categories || c.categories.length === 0) continue;
      const top = c.categories.slice(0, 8);
      cards.push({
        title: `${c.name} breakdown`,
        subtitle: `Top ${top.length} of ${c.uniqueCount.toLocaleString()} values`,
        node: (
          <CategoryBarChart
            labels={top.map((t) => t.value)}
            values={top.map((t) => t.count)}
            label={c.name}
          />
        ),
      });
    }
  }

  // 3. Time series: only when both a date and numeric column exist.
  if (dates.length > 0 && nums.length > 0) {
    const dateCol = dates[0].name;
    const numCol = nums[0].name;
    const ts = aggregateByDate(rows, dateCol, numCol);
    if (ts.length >= 3) {
      cards.push({
        title: `${numCol} over ${dateCol}`,
        subtitle: `${ts.length} time points · ${dateCol} sorted ascending`,
        node: (
          <MetricLineChart
            labels={ts.map((p) => p.x)}
            values={ts.map((p) => p.y)}
            label={numCol}
          />
        ),
      });
    }
  }

  // 4. Mean-by-category aggregations: only in unfiltered view.
  if (!selected && nums.length > 0 && strings.length > 0) {
    const candidates = strings.slice(0, LIMIT_CATEGORY_BARS);
    const numCol = nums[0].name;
    for (const c of candidates) {
      const aggs = aggregateByCategory(rows, c.name, numCol);
      if (aggs.length < 2) continue;
      const top = [...aggs].sort((a, b) => b.mean - a.mean).slice(0, 8);
      cards.push({
        title: `Mean ${numCol} by ${c.name}`,
        subtitle: `Top ${top.length} of ${c.uniqueCount.toLocaleString()} categories`,
        node: (
          <MetricBarChart
            labels={top.map((t) => t.label)}
            values={top.map((t) => t.mean)}
            label={`mean of ${numCol}`}
          />
        ),
      });
    }
  }

  // 5. Doughnut: top string column share.
  const donutStr = strings[0];
  if (donutStr?.categories) {
    const top = donutStr.categories.slice(0, 6);
    if (top.length >= 2) {
      cards.push({
        title: `${donutStr.name} share`,
        subtitle: `Top ${top.length} values of ${donutStr.uniqueCount.toLocaleString()}`,
        node: (
          <MetricDoughnut
            labels={top.map((t) => t.value)}
            values={top.map((t) => t.count)}
            label={donutStr.name}
          />
        ),
      });
    }
  }

  return cards;
}

function collectNumeric(rows: Row[], col: string): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[col];
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function aggregateByDate(rows: Row[], dateCol: string, numCol: string) {
  const points: { raw: Date; x: string; y: number }[] = [];
  for (const row of rows) {
    const dRaw = row[dateCol];
    const nRaw = row[numCol];
    if (dRaw === null || nRaw === null) continue;
    const d = new Date(String(dRaw));
    const n = Number(nRaw);
    if (Number.isNaN(d.getTime()) || !Number.isFinite(n)) continue;
    points.push({ raw: d, x: d.toISOString().slice(0, 10), y: n });
  }
  points.sort((a, b) => a.raw.getTime() - b.raw.getTime());

  // Aggregate by date (mean per bucket).
  const groups = new Map<string, { sum: number; count: number }>();
  for (const p of points) {
    const cur = groups.get(p.x) ?? { sum: 0, count: 0 };
    cur.sum += p.y;
    cur.count += 1;
    groups.set(p.x, cur);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([x, g]) => ({ x, y: g.sum / g.count }));
}

function aggregateByCategory(rows: Row[], catCol: string, numCol: string) {
  const groups = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const c = r[catCol];
    const n = r[numCol];
    if (c === null || n === null) continue;
    const num = Number(n);
    if (!Number.isFinite(num)) continue;
    const key = String(c);
    const cur = groups.get(key) ?? { sum: 0, count: 0 };
    cur.sum += num;
    cur.count += 1;
    groups.set(key, cur);
  }
  return Array.from(groups.entries())
    .map(([label, g]) => ({ label, mean: g.sum / g.count, count: g.count }))
    .filter((a) => a.count >= 1);
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(3);
}
