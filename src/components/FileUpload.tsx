import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFile: (file: File) => void;
  busy?: boolean;
}

const ACCEPT = {
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'text/plain': ['.txt'],
  'application/json': ['.json'],
};

function UploadIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M5 20h14" />
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l14 9-6 2-2 6Z" />
    </svg>
  );
}

export function FileUpload({ onFile, busy }: FileUploadProps) {
  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPT,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <section className="hero">
      <div
        {...getRootProps({
          className: `glass dropzone${isDragActive ? ' is-dragging' : ''}`,
        })}
      >
        <input {...getInputProps()} />

        <div className="dropzone-icon" aria-hidden="true">
          <UploadIcon />
        </div>

        <h1>Drop your data here</h1>
        <p>
          Lumen turns any CSV, TSV, TXT, or JSON file into a clean dashboard — no setup, no
          configuration, no fluff. Drop a file to begin.
        </p>

        <div className="browse-row">
          <button type="button" className="btn btn-primary" onClick={open}>
            {busy ? (
              <>
                <span className="spinner" />
                Reading…
              </>
            ) : (
              <>
                <ClickIcon />
                <span style={{ marginLeft: 6 }}>Choose a file</span>
              </>
            )}
          </button>
        </div>

        <div className="hint">
          Supports <kbd>.csv</kbd> <kbd>.tsv</kbd> <kbd>.txt</kbd> <kbd>.json</kbd> · max 50 MB
        </div>
      </div>
    </section>
  );
}
