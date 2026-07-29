import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataOutline } from './components/DataOutline';
import { ChartsPanel } from './components/ChartsPanel';
import { StatsCards } from './components/StatsCards';
import { DataPreview } from './components/DataPreview';
import { ThemePicker } from './components/ThemePicker';
import { SearchBar } from './components/SearchBar';
import { FolderView, type FolderFile } from './components/FolderView';
import { parseFile, formatBytes, type ParsedFile } from './utils/fileParser';
import { analyzeColumns } from './utils/columnAnalyzer';

// ── recent folders (localStorage) ──────────────────────────────────

interface RecentFolder {
  name: string;
  fileCount: number;
  totalSize: number;
  timestamp: number;
}

const RECENT_KEY = 'lumen-recent-folders';
const MAX_RECENT = 5;

function loadRecent(): RecentFolder[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e: unknown) =>
        e && typeof e === 'object' &&
        typeof (e as RecentFolder).name === 'string' &&
        typeof (e as RecentFolder).fileCount === 'number' &&
        typeof (e as RecentFolder).timestamp === 'number',
    ).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecent(folders: RecentFolder[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(folders.slice(0, MAX_RECENT)));
  } catch { /* quota exceeded — silently drop */ }
}

function addRecent(name: string, fileCount: number, totalSize: number) {
  const current = loadRecent().filter((f) => f.name !== name);
  current.unshift({ name, fileCount, totalSize, timestamp: Date.now() });
  saveRecent(current);
}

// ── helpers ─────────────────────────────────────────────────────────

interface Toast {
  msg: string;
  kind: 'info' | 'error';
}

const SUPPORTED_EXTS = new Set(['csv', 'tsv', 'txt', 'json']);

function filterFolderFiles(files: File[]): { folderName: string; files: FolderFile[] } {
  const filtered = files
    .filter((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return SUPPORTED_EXTS.has(ext);
    })
    .map((f) => ({ name: f.name, size: f.size, file: f }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Extract folder name from the first file's webkitRelativePath
  const firstPath = files[0]?.webkitRelativePath ?? '';
  const folderName = firstPath.split('/')[0] || 'Folder';

  return { folderName, files: filtered };
}

// ── component ───────────────────────────────────────────────────────

export default function App() {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFiles, setFolderFiles] = useState<FolderFile[] | null>(null);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>(loadRecent);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((t: Toast) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  // Refresh recent list on mount (in case another tab wrote)
  useEffect(() => {
    setRecentFolders(loadRecent());
  }, []);

  const onFile = useCallback(async (file: File) => {
    setBusy(true);
    try {
      const result = await parseFile(file);
      setParsed(result);
      setSelected(null);
      if (result.rows.length === 0) {
        showToast({ msg: `${file.name} parsed but contained no rows.`, kind: 'info' });
      } else {
        showToast({
          msg: `${result.rows.length.toLocaleString()} rows \u00b7 ${result.columns.length} columns`,
          kind: 'info',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      showToast({ msg, kind: 'error' });
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const onFolder = useCallback((files: File[]) => {
    const { folderName, files: filtered } = filterFolderFiles(files);
    if (filtered.length === 0) {
      showToast({ msg: 'No supported files found in this folder.', kind: 'error' });
      return;
    }
    setFolderFiles(filtered);
    setParsed(null);
    setSelected(null);
    const totalSize = filtered.reduce((sum, f) => sum + f.size, 0);
    addRecent(folderName, filtered.length, totalSize);
    setRecentFolders(loadRecent());
    showToast({
      msg: `${filtered.length} file${filtered.length !== 1 ? 's' : ''} found in ${folderName}`,
      kind: 'info',
    });
  }, [showToast]);

  const onFolderFileSelect = useCallback(
    async (file: File) => {
      await onFile(file);
    },
    [onFile],
  );

  const onSelectAnother = useCallback(() => {
    setFolderFiles(null);
    setParsed(null);
  }, []);

  const onBackToFolder = useCallback(() => {
    setParsed(null);
    setSelected(null);
  }, []);

  const columnStats = useMemo(() => {
    if (!parsed) return [];
    return analyzeColumns(parsed.rows, parsed.columns);
  }, [parsed]);

  const loaded = parsed && parsed.rows.length > 0;
  const hasFolder = folderFiles && folderFiles.length > 0;
  const showFolder = hasFolder && !loaded;
  const showEmpty = !hasFolder && !loaded;

  const onReset = useCallback(() => {
    window.clearTimeout(toastTimer.current);
    setParsed(null);
    setSelected(null);
    setToast(null);
    // When viewing a file from a folder, keep the folder context.
    // Otherwise (single file), clear everything.
    if (!hasFolder) {
      setFolderFiles(null);
    }
  }, [hasFolder]);

  const onClearRecent = useCallback((name: string) => {
    const updated = loadRecent().filter((f) => f.name !== name);
    saveRecent(updated);
    setRecentFolders(updated);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <svg className="brand-logo" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          </svg>
          <span className="brand-text">lumen</span>
          {parsed && <span className="brand-sub"> · {parsed.fileName}</span>}
        </div>
        {loaded && (
          <SearchBar
            rows={parsed.rows}
            columns={parsed.columns}
            onSelectColumn={setSelected}
            onSearch={setSearchQuery}
          />
        )}
        <div className="topbar-actions">
            <ThemePicker />
            {hasFolder && loaded && (
              <button
                type="button"
                className="btn"
                onClick={onBackToFolder}
              >
                ← Folder
              </button>
            )}
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

      {showEmpty && (
        <FileUpload onFile={onFile} onFolder={onFolder} busy={busy}>
          {recentFolders.length > 0 && (
            <div className="recent-section">
              <h3 className="recent-head">Recent folders</h3>
              <div className="recent-list">
                {recentFolders.map((rf) => (
                  <div key={rf.name} className="recent-item">
                    <span className="recent-folder-icon">📁</span>
                    <span className="recent-folder-name">{rf.name}</span>
                    <span className="recent-folder-count">{rf.fileCount} file{rf.fileCount !== 1 ? 's' : ''}</span>
                    <span className="recent-folder-size">{typeof rf.totalSize === 'number' ? formatBytes(rf.totalSize) : ''}</span>
                    <button
                      type="button"
                      className="recent-folder-clear"
                      title="Remove from list"
                      onClick={() => onClearRecent(rf.name)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FileUpload>
      )}

      {showFolder && folderFiles && (
        <FolderView
          files={folderFiles}
          onSelectFile={onFolderFileSelect}
          onSelectAnother={onSelectAnother}
        />
      )}

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
              <DataPreview parsed={parsed} columns={columnStats} searchQuery={searchQuery} />
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
