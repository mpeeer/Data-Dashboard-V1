import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getBaseChartOptions, addZoomOptions } from '../lib/chartSetup';
import { getThemeContext } from '../utils/themes';
import { useTheme } from '../utils/useTheme';

interface CategoryBarChartProps {
  labels: string[];
  values: number[];
  label: string;
  zoom?: boolean;
}

export function CategoryBarChart({ labels, values, label, zoom }: CategoryBarChartProps) {
  const { theme } = useTheme();
  const { palette, surface } = getThemeContext(theme);
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  const base = getBaseChartOptions(surface);
  let options: Record<string, unknown> = {
    ...base,
    indexAxis: 'y' as const,
    plugins: { ...base.plugins, legend: { display: false } },
  };
  if (zoom) options = addZoomOptions(options);

  return <Bar data={data} options={options as ChartOptions<'bar'>} />;
}
