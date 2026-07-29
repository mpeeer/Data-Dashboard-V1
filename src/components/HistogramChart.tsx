import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getBaseChartOptions, addZoomOptions } from '../lib/chartSetup';
import { getThemeContext } from '../utils/themes';
import { useTheme } from '../utils/useTheme';

interface HistogramChartProps {
  values: number[];
  binCount?: number;
  label: string;
  zoom?: boolean;
}

export function HistogramChart({ values, binCount = 10, label, zoom }: HistogramChartProps) {
  const { theme } = useTheme();
  const { palette, surface } = getThemeContext(theme);
  const { labels, counts } = bin(values, binCount);
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: counts,
        backgroundColor: palette[0],
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 50,
        categoryPercentage: 0.95,
        barPercentage: 1,
      },
    ],
  };
  const base = getBaseChartOptions(surface);
  let options: Record<string, unknown> = {
    ...base,
    plugins: { ...base.plugins, legend: { display: false } },
  };
  if (zoom) options = addZoomOptions(options);
  return <Bar data={data} options={options as ChartOptions<'bar'>} />;
}

function bin(values: number[], binCount: number) {
  if (values.length === 0) return { labels: [], counts: [] };

  // Single-pass min/max (avoids Math.min(...values) call-stack overflow on large arrays).
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }

  if (min === max) {
    return { labels: [formatBin(min, max)], counts: [values.length] };
  }
  const width = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  const labels = counts.map((_, i) => {
    const lo = min + i * width;
    const hi = i === binCount - 1 ? max : min + (i + 1) * width;
    return formatBin(lo, hi);
  });
  return { labels, counts };
}

function formatBin(lo: number, hi: number): string {
  const fmt = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(1));
  return `${fmt(lo)}–${fmt(hi)}`;
}
