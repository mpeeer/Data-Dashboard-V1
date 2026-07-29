// Render chart.js chart configurations to base64 PNGs offscreen.
// Light-theme surface so charts look right on a white PDF page, but
// the data palette comes from the caller (active theme's colors).

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
  type ChartConfiguration,
} from 'chart.js';

// Local registration — same as src/lib/chartSetup.ts but isolated for export.
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
  Filler,
);

const LIGHT_SURFACE = {
  text: '#1a1a1a',
  textMute: '#666666',
  grid: '#e5e5e5',
  bg: '#ffffff',
};

async function mountChart(cfg: ChartConfiguration): Promise<HTMLCanvasElement> {
  // Mount a hidden canvas, draw the chart, then return it.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.width = '1080px';
  host.style.height = '540px';
  document.body.appendChild(host);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 540;
  host.appendChild(canvas);

  new ChartJS(canvas, cfg);

  // Give chart.js two animation frames to fully layout + draw (then disable animations for repeat calls).
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  return canvas;
}

function lightBaseOptions(fontFamily = 'system-ui, -apple-system, sans-serif') {
  return {
    responsive: false,
    maintainAspectRatio: false,
    animation: false as const,
    devicePixelRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: LIGHT_SURFACE.textMute,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: false,
          font: { family: fontFamily, size: 11 },
        },
      },
      tooltip: { enabled: false },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { color: LIGHT_SURFACE.textMute, font: { family: fontFamily, size: 10 } },
        grid: { color: LIGHT_SURFACE.grid, display: false },
        border: { display: false },
      },
      y: {
        ticks: {
          color: LIGHT_SURFACE.textMute,
          font: { family: fontFamily, size: 10 },
        },
        grid: { color: LIGHT_SURFACE.grid, drawTicks: false },
        border: { display: false },
      },
    },
  };
}

function binValues(values: number[], binCount = 10): { labels: string[]; counts: number[] } {
  if (values.length === 0) return { labels: [], counts: [] };
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return { labels: [`${min}`], counts: [values.length] };
  const width = (max - min) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  const fmt = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(1));
  const labels = counts.map((_, i) => `${fmt(min + i * width)}–${fmt(i === binCount - 1 ? max : min + (i + 1) * width)}`);
  return { labels, counts };
}

async function renderOnce(builder: () => ChartConfiguration): Promise<string> {
  const cfg = builder();
  const canvas = await mountChart(cfg);
  const url = canvas.toDataURL('image/png');
  // Destroy chart.js listeners first (it owns resize/animation internals).
  ChartJS.getChart(canvas)?.destroy();
  // Then remove only the host div — never the document body.
  canvas.parentElement?.remove();
  return url;
}

export function createChartRender(palette: string[]) {
  const p = palette;

  return {
    histogram(values: number[], label: string): Promise<string> {
      const { labels, counts } = binValues(values, 10);
      return renderOnce(() => ({
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label,
              data: counts,
              backgroundColor: p[0],
              borderRadius: 2,
              borderSkipped: false,
              maxBarThickness: 60,
              categoryPercentage: 0.95,
              barPercentage: 1,
            },
          ],
        },
        options: { ...lightBaseOptions() },
      }));
    },

    categoryHorizontal(labels: string[], values: number[], label: string): Promise<string> {
      return renderOnce(() => ({
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: labels.map((_, i) => p[i % p.length]),
              borderRadius: 2,
              borderSkipped: false,
              maxBarThickness: 28,
            },
          ],
        },
        options: { ...lightBaseOptions(), indexAxis: 'y' as const },
      }));
    },

    barVertical(labels: string[], values: number[], label: string): Promise<string> {
      return renderOnce(() => ({
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: p[0],
              borderRadius: 2,
              borderSkipped: false,
              maxBarThickness: 60,
            },
          ],
        },
        options: { ...lightBaseOptions() },
      }));
    },

    line(labels: string[], values: number[], label: string): Promise<string> {
      return renderOnce(() => ({
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: p[0],
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 2,
            },
          ],
        },
        options: { ...lightBaseOptions() },
      }));
    },

    doughnut(labels: string[], values: number[], label: string): Promise<string> {
      return renderOnce(() => ({
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: labels.map((_, i) => p[i % p.length]),
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 0,
            },
          ],
        },
        options: { ...lightBaseOptions(), cutout: '60%', scales: undefined },
      }));
    },
  };
}
