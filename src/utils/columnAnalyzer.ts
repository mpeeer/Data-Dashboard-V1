import type { Row } from './fileParser';

export type ColumnType = 'number' | 'date' | 'string';

export interface ColumnStats {
  name: string;
  type: ColumnType;
  nonNull: number;
  nullCount: number;
  uniqueCount: number;
  /** Up to 5 representative sample values */
  samples: string[];
  /** Numeric stats (only if type === 'number') */
  numeric?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdev: number;
    sum: number;
  };
  /** Date stats (only if type === 'date') */
  date?: {
    min: Date;
    max: Date;
    spanDays: number;
  };
  /** Top categories (only if type === 'string') */
  categories?: { value: string; count: number }[];
}

/**
 * Classify a column by sampling its non-null values.
 * A column is "number" or "date" if >= threshold% of values parse as that type.
 * Order of attempt: number first (most specific), then date, else string.
 */
const NUMBER_THRESHOLD = 0.7;
const DATE_THRESHOLD = 0.7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T\s][\d:.\-+Z]*)?$/;
const SLASH_DATE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const DASH_DATE = /^\d{1,2}-\d{1,2}-\d{2,4}$/;

function tryNumber(v: string): number | null {
  // Reject dates that look like numbers but shouldn't be (e.g. "2024" alone is ambiguous — skip plain year).
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v)) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function tryDate(v: string): Date | null {
  if (ISO_DATE.test(v) || SLASH_DATE.test(v) || DASH_DATE.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

export function analyzeColumns(rows: Row[], columns: string[]): ColumnStats[] {
  return columns.map((col) => analyzeColumn(rows, col));
}

function analyzeColumn(rows: Row[], col: string): ColumnStats {
  const values: string[] = [];
  let nullCount = 0;
  for (const row of rows) {
    const v = row[col];
    if (v === null || v === undefined || v === '') nullCount++;
    else values.push(String(v));
  }

  const total = values.length;
  if (total === 0) {
    return {
      name: col,
      type: 'string',
      nonNull: 0,
      nullCount,
      uniqueCount: 0,
      samples: [],
    };
  }

  // Try number first (most strict).
  let nParsed = 0;
  let dParsed = 0;
  for (const v of values) {
    if (tryNumber(v) !== null) nParsed++;
    else if (tryDate(v) !== null) dParsed++;
  }
  const nRatio = nParsed / total;
  const dRatio = dParsed / total;

  const uniqueSet = new Set(values);
  const samples = Array.from(uniqueSet).slice(0, 5).map(truncate);

  if (nRatio >= NUMBER_THRESHOLD) {
    const nums = values.map(Number).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
    const sum = nums.reduce((s, x) => s + x, 0);
    const mean = sum / nums.length;
    const median =
      nums.length % 2 === 0
        ? (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2
        : nums[(nums.length - 1) / 2];
    const variance = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
    return {
      name: col,
      type: 'number',
      nonNull: total,
      nullCount,
      uniqueCount: uniqueSet.size,
      samples,
      numeric: {
        min: nums[0],
        max: nums[nums.length - 1],
        mean,
        median,
        stdev: Math.sqrt(variance),
        sum,
      },
    };
  }

  if (dRatio >= DATE_THRESHOLD) {
    const dates = values.map((v) => new Date(v)).filter((d) => !Number.isNaN(d.getTime()));
    dates.sort((a, b) => a.getTime() - b.getTime());
    const min = dates[0];
    const max = dates[dates.length - 1];
    const spanDays = Math.max(0, Math.round((max.getTime() - min.getTime()) / 86_400_000));
    return {
      name: col,
      type: 'date',
      nonNull: total,
      nullCount,
      uniqueCount: uniqueSet.size,
      samples: samples.map((s) => formatDate(new Date(s))),
      date: { min, max, spanDays },
    };
  }

  // Otherwise treat as string / categorical.
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const categories = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    name: col,
    type: 'string',
    nonNull: total,
    nullCount,
    uniqueCount: uniqueSet.size,
    samples,
    categories: categories.slice(0, 8),
  };
}

function truncate(s: string): string {
  return s.length > 28 ? s.slice(0, 25) + '…' : s;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '–';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) {
    // Show comma grouping below 1e6, otherwise scale.
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}
