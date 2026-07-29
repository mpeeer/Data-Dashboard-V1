import { useCallback, useMemo, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataOutline } from './components/DataOutline';
import { ChartsPanel } from './components/ChartsPanel';
import { StatsCards } from './components/StatsCards';
import { DataPreview } from './components/DataPreview';
import { parseFile, formatBytes, type ParsedFile } from './utils/fileParser';
import { analyzeColumns } from './utils/columnAnalyzer';

interface Toast {
  msg: string;
  kind: 'info' | 'error';
}

export default function App() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const onFile = useCallback(async (file: File) => {
    setBusy(true);
    setToast(null);
    try {
      const result = await parseFile(file);
      setParsed(result);
      setSelected(null);
      if (result.rows.length === 0) {
        setToast({ msg: `${file.name} parsed but contained no rows.`, kind: 'info' });
      } else {
        setToast({
          msg: `${result.rows.length.toLocaleString()} rows · ${result.columns.length} columns`,
          kind: 'info',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      setToast({ msg, kind: 'error' });
    } finally {
      setBusy(false);
      window.setTimeout(() => setToast(null), 3500);
    }
  }, []);

  const onReset = useCallback(() => {
    setParsed(null);
    setSelected(null);
    setToast(null);
  }, []);

  const columnStats = useMemo(() => {
    if (!parsed) return [];
    return analyzeColumns(parsed.rows, parsed.columns);
  }, [parsed]);

  const loaded = parsed && parsed.rows.length > 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          lumen
          {parsed && <span className="brand-sub"> · {parsed.fileName}</span>}
        </div>
        <div className="topbar-actions">
          {parsed && (
            <span className="file-chip">
              {formatBytes(parsed.fileSize)}
              <button type="button" aria-label="Clear" onClick={onReset}>
                ×
              </button>
            </span>
          )}
          {parsed && <UploadButton onFile={onFile} busy={busy} />}
        </div>
      </header>

      {!loaded && <FileUpload onFile={onFile} busy={busy} />}

      {loaded && (
        <div className="dashboard">
          <DataOutline
            columns={columnStats}
            totalRows={parsed.rows.length}
            selected={selected}
            onSelect={setSelected}
          />
          <main className="main">
            <StatsCards columns={columnStats} totalRows={parsed.rows.length} />
            <ChartsPanel
              rows={parsed.rows}
              columns={columnStats}
              selected={selected}
            />
            <section>
              <DataPreview parsed={parsed} columns={columnStats} />
            </section>
          </main>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function UploadButton({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  return (
    <label className="btn">
      {busy ? 'Loading…' : 'Replace file'}
      <input
        type="file"
        accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json"
        className="file-input-hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}
