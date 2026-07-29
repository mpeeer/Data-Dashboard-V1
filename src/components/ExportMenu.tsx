import { useCallback, useState } from 'react';
import type { ColumnStats } from '../utils/columnAnalyzer';
import type { Row } from '../utils/fileParser';
import { generateInsights } from '../utils/insights';
import { generateReport, generateCharts } from '../utils/pdfExport';

interface ExportMenuProps {
  fileName: string;
  rows: Row[];
  columns: ColumnStats[];
  selected: string | null;
}

type Busy = 'idle' | 'report' | 'charts';

const stripExt = (name: string) => name.replace(/\.[^.]+$/, '');

const downloadBytes = (bytes: Uint8Array, fileName: string) => {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Keep the anchor and blob URL alive long enough for the browser's download
  // manager to start the fetch. Revoking too eagerly can silently cancel the
  // download in Chromium (especially while the PWA service worker is active —
  // see vite.config.ts → workbox.navigateFallbackDenylist).
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 60_000);
};

export function ExportMenu({ fileName, rows, columns, selected }: ExportMenuProps) {
  const [busy, setBusy] = useState<Busy>('idle');

  const runReport = useCallback(async () => {
    if (busy !== 'idle') return;
    setBusy('report');
    try {
      const insights = generateInsights(columns, rows);
      const pdf = await generateReport({ fileName, rows, columns, selected, insights });
      downloadBytes(pdf, `${stripExt(fileName)}-report.pdf`);
    } catch (err) {
      console.error('[ExportMenu] report failed', err);
    } finally {
      setBusy('idle');
    }
  }, [busy, fileName, rows, columns, selected]);

  const runCharts = useCallback(async () => {
    if (busy !== 'idle') return;
    setBusy('charts');
    try {
      const pdf = await generateCharts({ fileName, rows, columns, selected });
      downloadBytes(pdf, `${stripExt(fileName)}-charts.pdf`);
    } catch (err) {
      console.error('[ExportMenu] charts failed', err);
    } finally {
      setBusy('idle');
    }
  }, [busy, fileName, rows, columns, selected]);

  return (
    <div className="export-menu" role="group" aria-label="Export">
      <button
        type="button"
        className="btn"
        onClick={runReport}
        disabled={busy !== 'idle'}
        title="Generate a written findings report plus charts as PDF"
      >
        {busy === 'report' ? '\u2026 report' : 'Report PDF'}
      </button>
      <button
        type="button"
        className="btn"
        onClick={runCharts}
        disabled={busy !== 'idle'}
        title="Generate a charts-only PDF"
      >
        {busy === 'charts' ? '\u2026 charts' : 'Charts PDF'}
      </button>
    </div>
  );
}
