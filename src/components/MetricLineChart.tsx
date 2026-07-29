import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getBaseChartOptions, addZoomOptions } from '../lib/chartSetup';
import { getThemeContext, hexToRgba } from '../utils/themes';
import { useTheme } from '../utils/useTheme';

interface MetricLineChartProps {
  labels: string[];
  values: number[];
  label: string;
  zoom?: boolean;
}

export function MetricLineChart({ labels, values, label, zoom }: MetricLineChartProps) {
  const { theme } = useTheme();
  const { palette, surface } = getThemeContext(theme);
  const accent = palette[0];
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: accent,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return hexToRgba(accent, 0.20);
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, hexToRgba(accent, 0.45));
          grad.addColorStop(1, hexToRgba(accent, 0));
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

  let options = { ...getBaseChartOptions(surface) } as Record<string, unknown>;
  if (zoom) options = addZoomOptions(options);

  return <Line data={data} options={options as ChartOptions<'line'>} />;
}
