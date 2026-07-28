import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { baseChartOptions, chartColors } from '../lib/chartSetup';

interface MetricBarChartProps {
  labels: string[];
  values: number[];
  label: string;
}

export function MetricBarChart({ labels, values, label }: MetricBarChartProps) {
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: chartColors.palette[0],
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
    },
  };

  return <Bar data={data} options={options as ChartOptions<'bar'>} />;
}
