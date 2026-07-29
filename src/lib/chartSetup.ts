import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import type { SurfaceColors } from '../utils/themes';

/**
 * Build the structural ChartOptions with theme-aware colors baked in.
 * Each chart subcomponent calls this passing the surface colors from its
 * own useTheme() / getThemeContext() read so its ticks, grid, legend
 * and tooltip track the active theme (paper stays readable, dark modes
 * stay subtle).
 */
export function getBaseChartOptions(surface: SurfaceColors): ChartOptions {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200, easing: 'easeOutCubic' },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: surface.textMute,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: false,
          font: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 10 },
        },
      },
      tooltip: {
        backgroundColor: surface.isLight ? 'rgba(255,255,255,0.97)' : 'rgba(20,20,20,0.95)',
        borderColor: surface.isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 8,
        titleColor: surface.isLight ? 'rgba(20,20,20,0.95)' : 'rgba(220,220,220,0.95)',
        bodyColor: surface.isLight ? 'rgba(20,20,20,0.95)' : 'rgba(220,220,220,0.95)',
        cornerRadius: 4,
        titleFont: { family: 'system-ui', size: 11, weight: 'normal' },
        bodyFont: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 11 },
      },
    },
    scales: {
      x: {
        ticks: { color: surface.textMute, font: { family: 'system-ui', size: 10 } },
        grid: { color: surface.grid, display: false },
        border: { display: false },
      },
      y: {
        ticks: {
          color: surface.textMute,
          font: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 10 },
        },
        grid: { color: surface.grid, drawTicks: false },
        border: { display: false },
      },
    },
  };
}
