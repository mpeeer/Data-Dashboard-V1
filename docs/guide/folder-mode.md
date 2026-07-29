# Folder Mode

Open an entire directory instead of a single file. Browse, preview, and switch between files without leaving the dashboard.

![Lumen dashboard](/screenshot.png)

## Opening a Folder

From the empty state, click **Select folder** and choose a directory. Lumen scans for compatible files (`.csv`, `.tsv`, `.txt`, `.json`) and displays them in a file browser.

Unsupported file types are ignored. Empty folders show an error.

## File Browser

Each file card shows:

- **Type badge** — CSV, TSV, JSON, or TXT
- **Filename**
- **File size** — formatted in bytes, KB, or MB
- **Preview stats** — column count and row count, loaded asynchronously

Click any file to open it in the full dashboard view.

## Switching Files

While viewing a dashboard from a folder:

- Click **← Folder** in the top bar to return to the file browser
- Click **Select another folder** in the browser to choose a different directory
- Click **×** on the file chip to return to the file browser

## Recent Folders

Lumen remembers your last five folders. Each recent folder shows the folder name, file count, and total size. Recent folders persist across sessions in local storage.

Remove individual entries with the × button next to each folder name.
