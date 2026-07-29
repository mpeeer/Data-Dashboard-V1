# Getting Started

Lumen runs entirely in your browser. No server. No accounts. No configuration.

![Lumen dashboard](/screenshot.png)

## Prerequisites

- Node.js 18 or later
- A modern browser (Chrome, Firefox, Safari, Edge)

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Drop a data file onto the window or click **Choose file** to browse. You can also click **Select folder** to open an entire directory.

A `sample-data.csv` is included with 60 rows of fictional sales data for immediate testing.

## Supported Formats

| Format | Description |
|---|---|
| `.csv` | Comma-separated values |
| `.tsv` | Tab-separated values |
| `.txt` | Any delimited text — delimiter is auto-detected |
| `.json` | Array of objects, or `{ "rows" \| "data": […] }` |

Files up to 50 MB are supported. All parsing happens locally in your browser.

## The Dashboard

Once a file loads, the dashboard appears with three sections:

- **Sidebar** — Every column listed with its type, unique count, range, and sample values. Click any column to focus all charts on that data.
- **Statistics** — Summary cards showing total rows, columns, null counts, and date ranges.
- **Charts** — Visualizations auto-generated based on each column's data type.

Use the search bar at the top to find any value across every column. Expand any chart to fullscreen with scroll-to-zoom and drag-to-pan.

## Production Build

```bash
npm run build
npm run preview
```

Serves the production build at `http://localhost:4173`.
