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
          className: `dropzone${isDragActive ? ' is-dragging' : ''}`,
        })}
      >
        <input {...getInputProps()} />

        <h1>{isDragActive ? 'Release to load' : 'Load a data file'}</h1>
        <p>Drop a CSV, TSV, TXT, or JSON file anywhere in this box.</p>

        <div className="browse-row">
          <button type="button" className="btn btn-primary" onClick={open}>
            {busy ? 'Loading\u2026' : 'Choose file\u2026'}
          </button>
        </div>

        <div className="hint">.csv  .tsv  .txt  .json  \u00b7  max 50 MB</div>
      </div>
    </section>
  );
}
