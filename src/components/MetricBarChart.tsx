import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getBaseChartOptions } from '../lib/chartSetup';
import { getThemeContext } from '../utils/themes';
import { useTheme } from '../utils/useTheme';

interface MetricBarChartProps {
  labels: string[];
  values: number[];
  label: string;
}

export function MetricBarChart({ labels, values, label }: MetricBarChartProps) {
  const { theme } = useTheme();
  const { palette, surface } = getThemeContext(theme);
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: palette[0],
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  };

  const base = getBaseChartOptions(surface);
  const options = {
    ...base,
    plugins: { ...base.plugins, legend: { display: false } },
  };

  return <Bar data={data} options={options as ChartOptions<'bar'>} />;
}
