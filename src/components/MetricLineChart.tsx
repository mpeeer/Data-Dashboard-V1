import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { baseChartOptions, chartColors } from '../lib/chartSetup';

interface MetricLineChartProps {
  labels: string[];
  values: number[];
  label: string;
}

export function MetricLineChart({ labels, values, label }: MetricLineChartProps) {
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: chartColors.palette[0],
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(169, 156, 255, 0.2)';
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, 'rgba(169, 156, 255, 0.45)');
          grad.addColorStop(1, 'rgba(169, 156, 255, 0)');
          return grad;
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2.5,
      },
    ],
  };

  const options = { ...baseChartOptions };

  return <Line data={data} options={options as ChartOptions<'line'>} />;
}
