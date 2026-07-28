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
          msg: `Loaded ${result.rows.length.toLocaleString()} rows · ${result.columns.length} columns from ${file.name}`,
          kind: 'info',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      setToast({ msg, kind: 'error' });
    } finally {
      setBusy(false);
      // Auto-dismiss toasts.
      window.setTimeout(() => setToast(null), 4500);
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
    <>
      <div className="bg-canvas">
        <div className="orb-extra" />
      </div>

      <div className="app-shell">
        <header className="glass topbar">
          <div className="brand">
            <div className="brand-mark" />
            <span className="brand-name">Lumen</span>
            <span style={{ color: 'var(--text-mute)', fontSize: 12, marginLeft: 4, fontWeight: 500 }}>
              Data Dashboard
            </span>
          </div>
          <div className="topbar-actions">
            {parsed && (
              <span className="file-chip">
                {parsed.fileName} · {formatBytes(parsed.fileSize)}
                <button type="button" aria-label="Clear" onClick={onReset}>
                  ×
                </button>
              </span>
            )}
            {parsed && (
              <UploadButton onFile={onFile} busy={busy} />
            )}
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
              <DataPreview parsed={parsed} columns={columnStats} />
            </main>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast is-${toast.kind}`} role="status">
          {toast.msg}
        </div>
      )}
    </>
  );
}

function UploadButton({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  return (
    <label className="btn" style={{ position: 'relative', cursor: 'pointer' }}>
      {busy ? (
        <>
          <span className="spinner" />
          Loading…
        </>
      ) : (
        'Replace file'
      )}
      <input
        type="file"
        accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
        }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}
