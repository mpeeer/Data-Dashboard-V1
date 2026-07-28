import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { baseChartOptions, chartColors } from '../lib/chartSetup';

interface MetricDoughnutProps {
  labels: string[];
  values: number[];
  label: string;
}

export function MetricDoughnut({ labels, values, label }: MetricDoughnutProps) {
  const data: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) => chartColors.palette[i % chartColors.palette.length]),
        borderColor: 'rgba(11, 13, 26, 0.6)',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    ...baseChartOptions,
    cutout: '60%',
    scales: {},
  };

  return <Doughnut data={data} options={options as ChartOptions<'doughnut'>} />;
}
