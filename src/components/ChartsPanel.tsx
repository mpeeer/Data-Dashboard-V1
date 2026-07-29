import React, { useEffect, useMemo, useState } from 'react';
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
    [rows, targeted, selected],
  );

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Close on Escape
  useEffect(() => {
    if (expandedIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedIdx(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expandedIdx]);

  const expandedChart = expandedIdx !== null ? charts[expandedIdx] : null;

  if (charts.length === 0) {
    return <div className="no-charts">No charts can be drawn from this column.</div>;
  }

  return (
    <>
      <div className="charts-grid">
        {charts.map((c, i) => (
          <div key={i} className="chart-card">
            <div className="chart-head">
              <h4 className="chart-title">{c.title}</h4>
              <div className="chart-subtitle">{c.subtitle}</div>
              <button
                type="button"
                className="chart-expand-btn"
                title="Fullscreen"
                aria-label={`Expand ${c.title}`}
                onClick={() => setExpandedIdx(i)}
              >
                ↗
              </button>
            </div>
            <div className="chart-canvas">{c.node}</div>
          </div>
        ))}
      </div>

      {/* Fullscreen overlay */}
      {expandedChart && (
        <div
          className="chart-fs-backdrop"
          onClick={() => setExpandedIdx(null)}
        >
          <div
            className="chart-fs-body"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chart-fs-head">
              <h4 className="chart-title">{expandedChart.title}</h4>
              <div className="chart-subtitle">{expandedChart.subtitle}</div>
              <div className="chart-fs-actions">
                <button
                  type="button"
                  className="btn chart-fs-reset"
                  onClick={() => setResetKey((k) => k + 1)}
                >
                  Reset zoom
                </button>
                <button
                  type="button"
                  className="btn chart-fs-close"
                  onClick={() => setExpandedIdx(null)}
                  aria-label="Close fullscreen"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="chart-fs-canvas" key={resetKey}>
              {React.isValidElement(expandedChart.node)
                ? React.cloneElement(expandedChart.node as React.ReactElement<{ zoom?: boolean }>, { zoom: true })
                : expandedChart.node}
            </div>
          </div>
        </div>
      )}
    </>
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
  selected: string | null,
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

  // 1. Histograms: one per numeric column (capped).
  for (const c of nums.slice(0, LIMIT_HISTOGRAMS)) {
    const values = collectNumeric(rows, c.name);
    if (values.length === 0) continue;
    cards.push({
      title: `Distribution of ${c.name}`,
      subtitle: `${values.length.toLocaleString()} values · mean ${fmt(c.numeric!.mean)}`,
      node: <HistogramChart values={values} label={c.name} />,
    });
  }

  // 2. Top category breakdowns (horizontal bar).
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

  // 3. Time series: date + numeric pair.
  if (dates.length > 0 && nums.length > 0) {
    const dateCol = dates[0].name;
    const numCol = nums[0].name;
    const ts = aggregateByDate(rows, dateCol, numCol);
    if (ts.length >= 3) {
      cards.push({
        title: `${numCol} over ${dateCol}`,
        subtitle: `${ts.length} time points`,
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

  // 4. Mean-by-category aggregations.
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

  // 5. Doughnut.
  const donutStr = strings[0];
  if (donutStr?.categories) {
    const top = donutStr.categories.slice(0, 6);
    if (top.length >= 2) {
      cards.push({
        title: `${donutStr.name} share`,
        subtitle: `Top ${top.length} of ${donutStr.uniqueCount.toLocaleString()}`,
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
