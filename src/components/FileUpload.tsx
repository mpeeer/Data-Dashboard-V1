import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFile: (file: File) => void;
  onFolder: (files: File[]) => void;
  busy?: boolean;
  children?: React.ReactNode;
}

const ACCEPT = {
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'text/plain': ['.txt'],
  'application/json': ['.json'],
};

const FILE_ACCEPT = '.csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json';

export function FileUpload({ onFile, onFolder, busy, children }: FileUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPT,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
      e.target.value = '';
    },
    [onFile],
  );

  const onFolderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list || list.length === 0) return;
      onFolder(Array.from(list));
      e.target.value = '';
    },
    [onFolder],
  );

  return (
    <section className="hero">
      <div
        {...getRootProps({
          className: `dropzone${isDragActive ? ' is-dragging' : ''}`,
        })}
      >
        {/* React-dropzone needs this for drag-and-drop to work.
            Positioned off-screen so it never intercepts clicks. */}
        <input {...getInputProps({ style: { position: 'fixed', left: '-9999px' } })} />

        <h1>{isDragActive ? 'Release to load' : 'Load a data file'}</h1>
        <p>Drop a CSV, TSV, TXT, or JSON file anywhere in this box.</p>

        <div className="browse-row">
          <span className="file-picker-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              {busy ? 'Loading\u2026' : 'Choose file\u2026'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={FILE_ACCEPT}
              className="file-input-hidden"
              onChange={onFileChange}
              aria-label="Choose file"
            />
          </span>
          <span className="folder-picker-wrap">
            <button
              type="button"
              className="btn"
              onClick={() => folderRef.current?.click()}
            >
              Select folder
            </button>
            <input
              ref={folderRef}
              type="file"
              {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>}
              className="file-input-hidden"
              onChange={onFolderChange}
              aria-label="Select folder"
            />
          </span>
        </div>

        <div className="hint">.csv  .tsv  .txt  .json  ·  max 50 MB  ·  or select a folder</div>
      </div>
      {children}
    </section>
  );
}
