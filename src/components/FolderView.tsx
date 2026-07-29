// Folder file browser. Shows a list of supported data files found in the
// selected folder, with name, size, type badge, and live preview stats.
// Clicking a file triggers onSelectFile.

import { useEffect, useState } from 'react';
import { formatBytes, previewFile, type FilePreview } from '../utils/fileParser';

export interface FolderFile {
  name: string;
  size: number;
  file: File;
}

interface FolderViewProps {
  files: FolderFile[];
  onSelectFile: (file: File) => void;
  onSelectAnother: () => void;
}

const SUPPORTED = new Set(['csv', 'tsv', 'txt', 'json']);

function extType(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return SUPPORTED.has(ext) ? ext.toUpperCase() : ext;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function FolderView({ files, onSelectFile, onSelectAnother }: FolderViewProps) {
  const [previews, setPreviews] = useState<Record<string, FilePreview | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPreviews({});

    Promise.all(
      files.map(async (f) => {
        try {
          const p = await previewFile(f.file);
          return { name: f.name, preview: p };
        } catch {
          return { name: f.name, preview: null };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, FilePreview | null> = {};
      for (const r of results) map[r.name] = r.preview;
      setPreviews(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [files]);

  return (
    <section className="folder-view">
      <div className="folder-head">
        <h1>Folder loaded</h1>
        <p>{files.length} supported file{files.length !== 1 ? 's' : ''} found</p>
        <button
          type="button"
          className="btn"
          onClick={onSelectAnother}
        >
          Select another folder
        </button>
      </div>
      <div className="folder-grid">
        {files.map((f, i) => {
          const pv = previews[f.name];
          return (
            <button
              key={i}
              type="button"
              className="folder-file-card"
              onClick={() => onSelectFile(f.file)}
            >
              <span className="folder-file-type">{extType(f.name)}</span>
              <span className="folder-file-name">{f.name}</span>
              <span className="folder-file-meta">
                {loading ? (
                  <span className="folder-file-pulse">…</span>
                ) : pv ? (
                  <>
                    <span className="folder-file-cols" title={`${pv.columns.length} columns`}>
                      {pv.columns.length} col{pv.columns.length !== 1 ? 's' : ''}
                    </span>
                    <span className="folder-file-rows" title={`${pv.rowCount} rows`}>
                      {formatCount(pv.rowCount)} row{pv.rowCount !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="folder-file-err">—</span>
                )}
              </span>
              <span className="folder-file-size">{formatBytes(f.size)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
