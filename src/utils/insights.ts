// Deterministic insight engine: turns column stats + rows into short factual
// observations written in plain prose. No AI markers, no filler, no chatty
// "I notice that…" — just stats like a printed report.

import type { ColumnStats } from './columnAnalyzer';
import type { Row } from './fileParser';

export interface Insight {
  title: string;
  body: string;
}

const round = (n: number, d = 3) => {
  if (!Number.isFinite(n)) return '–';
  const m = Math.pow(10, d);
  return Math.round(n * m) / m;
};

const fmt = (n: number) => {
  if (!Number.isFinite(n)) return '–';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e4) return n.toLocaleString();
  if (Number.isInteger(n)) return n.toLocaleString();
  return round(n, 3).toLocaleString();
};

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const count = (stats: ColumnStats[], type: ColumnStats['type']) =>
  stats.filter((s) => s.type === type).length;

const pearson = (rows: Row[], a: string, b: string): number => {
  // Standard Pearson r on paired numeric values.
  const xs: number[] = [];
  const ys: number[] = [];
  for (const r of rows) {
    const x = Number(r[a]);
    const y = Number(r[b]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    xs.push(x);
    ys.push(y);
  }
  const n = xs.length;
  if (n < 3) return NaN;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const ex = xs[i] - mx;
    const ey = ys[i] - my;
    num += ex * ey;
    dx += ex * ex;
    dy += ey * ey;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? NaN : num / den;
};

const detectTrend = (
  rows: Row[],
  dateCol: string,
  numCol: string
): { first: number; last: number; mean: number; dates: string[] } | null => {
  const pts: { date: Date; y: number }[] = [];
  for (const r of rows) {
    const d = new Date(String(r[dateCol] ?? ''));
    const y = Number(r[numCol]);
    if (Number.isNaN(d.getTime()) || !Number.isFinite(y)) continue;
    pts.push({ date: d, y });
  }
  pts.sort((a, b) => a.date.getTime() - b.date.getTime());
  if (pts.length < 3) return null;
  return {
    first: pts[0].y,
    last: pts[pts.length - 1].y,
    mean: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    dates: [pts[0].date.toISOString().slice(0, 10), pts[pts.length - 1].date.toISOString().slice(0, 10)],
  };
};

export function generateInsights(stats: ColumnStats[], rows: Row[]): Insight[] {
  const out: Insight[] = [];

  // 1. Dataset summary.
  out.push({
    title: 'Dataset',
    body:
      `${rows.length.toLocaleString()} rows · ${stats.length} columns ` +
      `(${count(stats, 'number')} numeric, ${count(stats, 'date')} date, ${count(stats, 'string')} text).`,
  });

  // 2. Per-numeric-column stats.
  for (const c of stats.filter((s) => s.type === 'number').slice(0, 4)) {
    if (!c.numeric) continue;
    const n = c.numeric;
    const nullPart = c.nullCount > 0 ? ` · ${c.nullCount} missing` : '';
    out.push({
      title: c.name,
      body:
        `${c.nonNull.toLocaleString()} values${nullPart}. ` +          `Range ${fmt(n.min)}-${fmt(n.max)}. ` +          `Mean ${fmt(n.mean)} (median ${fmt(n.median)}, stdev ${fmt(n.stdev)}).`,
    });
  }

  // 3. Categorical breakdowns (top 5 values per categorical column).
  for (const c of stats.filter((s) => s.type === 'string').slice(0, 3)) {
    if (!c.categories || c.categories.length < 2) continue;
    const total = c.categories.reduce((s, x) => s + x.count, 0);
    const top = c.categories.slice(0, 5);
    const parts = top.map(
      (x) => `${x.value} ${x.count.toLocaleString()} (${Math.round((x.count / total) * 100)}%)`
    );
    out.push({
      title: c.name,
      body: `${c.uniqueCount.toLocaleString()} distinct values · ${parts.join(', ')}.`,
    });
  }

  // 4. Date range.
  for (const c of stats.filter((s) => s.type === 'date').slice(0, 2)) {
    if (!c.date) continue;
    out.push({
      title: c.name,
      body: `${c.nonNull.toLocaleString()} dates, ${c.date.min.toISOString().slice(0, 10)} to ${c.date.max.toISOString().slice(0, 10)} (${c.date.spanDays.toLocaleString()} day span).`,
    });
  }

  // 5. Strong Pearson correlations between numeric pairs.
  const nums = stats.filter((s) => s.type === 'number');
  const correlations: { a: string; b: string; r: number }[] = [];
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const r = pearson(rows, nums[i].name, nums[j].name);
      if (Number.isFinite(r) && Math.abs(r) >= 0.5) correlations.push({ a: nums[i].name, b: nums[j].name, r });
    }
  }
  correlations.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  for (const c of correlations.slice(0, 4)) {
    const strength = Math.abs(c.r) >= 0.8 ? 'very strong' : Math.abs(c.r) >= 0.6 ? 'strong' : 'moderate';
    const direction = c.r > 0 ? 'increase together' : 'move opposite';
    out.push({
      title: `${c.a} × ${c.b}`,
      body: `${cap(strength)} correlation (Pearson r = ${c.r.toFixed(2)}); the two ${direction} across the dataset.`,
    });
  }

  // 6. Date × numeric trend if applicable.
  const dateStat = stats.find((s) => s.type === 'date');
  const numStat = stats.find((s) => s.type === 'number');
  if (dateStat?.name && numStat?.name) {
    const t = detectTrend(rows, dateStat.name, numStat.name);
    if (t) {
      const pct = t.first === 0 ? null : ((t.last - t.first) / Math.abs(t.first)) * 100;
      const sign = pct === null ? '' : t.last > t.first ? '+' : t.last < t.first ? '-' : '=';
      out.push({
        title: `${numStat.name} over ${dateStat.name}`,
        body:
          pct === null
            ? `${numStat.name} averages ${fmt(t.mean)} from ${t.dates[0]} to ${t.dates[1]}.`
            : `${numStat.name} moves from ${fmt(t.first)} to ${fmt(t.last)} (${sign}${Math.abs(pct).toFixed(0)}%) over ${t.dates[0]}-${t.dates[1]}.`,
      });
    }
  }

  // 7. Quick extremes (best/worst if it's a numeric column that looks like a metric).
  if (nums.length > 0 && rows.length > 0) {
    const target = nums[0].name;
    const ranked = rows
      .map((r, i) => ({ i, v: Number(r[target]) }))
      .filter((x) => Number.isFinite(x.v))
      .sort((a, b) => b.v - a.v);
    if (ranked.length >= 2) {
      const top = ranked[0];
      const bottom = ranked[ranked.length - 1];
      out.push({
        title: `Top & bottom ${target}`,
        body: `Highest row ${top.i + 1}: ${fmt(top.v)}. Lowest row ${bottom.i + 1}: ${fmt(bottom.v)}. Spread ${fmt(top.v - bottom.v)}.`,
      });
    }
  }

  return out;
}
