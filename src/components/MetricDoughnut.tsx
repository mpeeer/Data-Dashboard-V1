import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getBaseChartOptions } from '../lib/chartSetup';
import { getThemeContext } from '../utils/themes';
import { useTheme } from '../utils/useTheme';

interface MetricDoughnutProps {
  labels: string[];
  values: number[];
  label: string;
}

export function MetricDoughnut({ labels, values, label }: MetricDoughnutProps) {
  const { theme } = useTheme();
  const { palette, surface } = getThemeContext(theme);
  // Doughnut slice borders need to read against the active surface so the
  // gap between slices doesn't disappear on paper (light) themes.
  const sliceBorder = surface.isLight ? 'rgba(255,255,255,0.85)' : 'rgba(11,13,26,0.6)';
  const data: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        borderColor: sliceBorder,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const base = getBaseChartOptions(surface);
  const options = {
    ...base,
    cutout: '60%',
    scales: {},
  };

  return <Doughnut data={data} options={options as ChartOptions<'doughnut'>} />;
}
