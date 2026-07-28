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

// Register everything once so we don't repeat in every component.
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

/** Shared visual style for charts on a glass background. */
export const chartColors = {
  text: 'rgba(244, 245, 251, 0.86)',
  textMute: 'rgba(244, 245, 251, 0.55)',
  grid: 'rgba(255, 255, 255, 0.07)',
  gridStrong: 'rgba(255, 255, 255, 0.14)',
  palette: [
    'rgba(169, 156, 255, 0.85)',
    'rgba(255, 155, 214, 0.85)',
    'rgba(92, 225, 255, 0.85)',
    'rgba(255, 184, 107, 0.85)',
    'rgba(109, 240, 198, 0.85)',
    'rgba(255, 122, 138, 0.85)',
    'rgba(199, 167, 255, 0.85)',
    'rgba(255, 215, 130, 0.85)',
  ],
};

export const baseChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 450, easing: 'easeOutCubic' },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        color: chartColors.text,
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { family: 'Inter, system-ui', size: 11 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(20, 22, 45, 0.92)',
      borderColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
      padding: 10,
      titleColor: chartColors.text,
      bodyColor: chartColors.text,
      cornerRadius: 8,
      titleFont: { family: 'Inter, system-ui', size: 12, weight: 'bold' },
      bodyFont: { family: 'Inter, system-ui', size: 12 },
    },
  },
  scales: {
    x: {
      ticks: { color: chartColors.textMute, font: { family: 'Inter, system-ui', size: 11 } },
      grid: { color: chartColors.grid, drawTicks: false },
      border: { display: false },
    },
    y: {
      ticks: { color: chartColors.textMute, font: { family: 'Inter, system-ui', size: 11 } },
      grid: { color: chartColors.grid, drawTicks: false },
      border: { display: false },
    },
  },
};
