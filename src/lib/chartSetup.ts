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

export const chartColors = {
  text: 'rgba(237, 237, 237, 0.85)',
  textMute: 'rgba(115, 115, 115, 0.9)',
  grid: 'rgba(255, 255, 255, 0.04)',
  palette: [
    'rgba(96, 165, 250, 0.85)',   // blue
    'rgba(52, 211, 153, 0.85)',   // green
    'rgba(251, 191, 36, 0.85)',    // amber
    'rgba(248, 113, 113, 0.85)',  // red
    'rgba(167, 139, 250, 0.85)',  // violet
    'rgba(45, 212, 191, 0.85)',   // teal
  ],
};

export const baseChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 200, easing: 'easeOutCubic' },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: chartColors.textMute,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: false,
        font: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 10 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(20, 20, 20, 0.95)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      padding: 8,
      titleColor: chartColors.text,
      bodyColor: chartColors.text,
      cornerRadius: 4,
      titleFont: { family: 'system-ui', size: 11, weight: 'normal' },
      bodyFont: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 11 },
    },
  },
  scales: {
    x: {
      ticks: { color: chartColors.textMute, font: { family: 'system-ui', size: 10 } },
      grid: { color: chartColors.grid, display: false },
      border: { display: false },
    },
    y: {
      ticks: { color: chartColors.textMute, font: { family: 'ui-monospace, SF Mono, Menlo, monospace', size: 10 } },
      grid: { color: chartColors.grid, drawTicks: false },
      border: { display: false },
    },
  },
};
