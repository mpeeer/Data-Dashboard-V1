import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { baseChartOptions, chartColors } from '../lib/chartSetup';

interface CategoryBarChartProps {
  labels: string[];
  values: number[];
  label: string;
}

export function CategoryBarChart({ labels, values, label }: CategoryBarChartProps) {
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) =>
          chartColors.palette[i % chartColors.palette.length]
        ),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    indexAxis: 'y' as const,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
    },
  };

  return <Bar data={data} options={options as ChartOptions<'bar'>} />;
}
