<!-- LUMEN — DATA DASHBOARD -->
<p align="center">
  <img src="public/icon.svg" alt="Lumen logo" width="80" height="80" />
</p>

<h1 align="center">Lumen — Data Dashboard</h1>

<p align="center">
  <strong>Instant, client-side data exploration.</strong><br />
  Drop a CSV, TSV, TXT, or JSON file and get structured visualizations — no servers, no sign-up, no configuration.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="Node >= 18" />
</p>

<p align="center">
  <img src="public/screenshot.png" alt="Lumen dashboard screenshot" width="800" />
</p>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Supported File Formats](#supported-file-formats)
- [How It Works](#how-it-works)
- [Export](#export)
- [Theming](#theming)
- [Deployment](#deployment)
  - [GitHub Pages](#github-pages)
  - [Desktop App (PWA)](#desktop-app-pwa)
  - [Native Binary (Tauri)](#native-binary-tauri)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [License](#license)

---

## Features

### Data Input
- **Drag-and-drop** or **file-browse** for `.csv`, `.tsv`, `.txt`, and `.json` files.
- Automatic delimiter detection — no manual configuration required.
- 50 MB file size cap; all parsing runs locally in the browser.

### Smart Column Analysis
Each column is inspected and classified as **numeric**, **date**, or **text** using a configurable 70 % threshold. Statistics computed per column include:

| Numeric              | Date                    | Text                     |
| -------------------- | ----------------------- | ------------------------ |
| Mean, median, stdev  | Earliest / latest dates | Unique count             |
| Min / max / range    | Day span                | Top-N category frequency |
| Null count           | Null count              | Null count               |

### Auto-Generated Visualizations
The dashboard automatically renders up to 5 histograms, 3 category breakdowns, 1 time-series line, 1 mean-by-category bar, and 1 doughnut chart:

- **Histogram** — numeric distribution with 10 equal-width bins.
- **Category Bar Chart** — horizontal breakdown of top-N string values.
- **Time-Series Line** — date × numeric trend over time.
- **Metric Bar Chart** — mean of a numeric column grouped by category.
- **Doughnut Chart** — proportional share of the top string column.

### Interactive Exploration
- **Data Outline sidebar** — lists every column with its type, unique count, mean, range, and sample values.
- **Focus Mode** — click any column to filter all charts and statistics to that column.
- **Scrollable Data Preview** — the first 50 rows formatted as a paginated table.

### Statistical Insights Engine
A built-in, deterministic insight engine analyzes every dataset and produces factual observations, including:

- Per-column summary statistics.
- Top-5 category distributions with percentages.
- **Pearson correlation** coefficients between numeric column pairs (reported for |r| ≥ 0.5).
- Date-range spans and trend direction with percentage change.
- Row-level extremes (highest and lowest values per numeric column).

All insights are computed locally — no AI models, no external API calls.

### Export
Generate **PDF reports** directly from the dashboard:

- **Report PDF** — a written findings document with embedded charts.
- **Charts PDF** — a visual-only export of every rendered chart.

Both outputs are generated client-side using `pdf-lib` and the Chart.js offscreen renderer. No data ever leaves your machine.

### Theming
Four preset color themes plus a **custom accent picker**:

- `lumen` (default) — cool blue / green / amber.
- `graphite` — neutral grayscale.
- `paper` — light-mode with crisp contrast.
- `ember` — warm orange / red / yellow.
- **Custom** — choose any accent color via a color input; the full 6-color palette is derived automatically.

Theme preference is persisted in `localStorage` per browser.

### Modern Glass UI
Frosted-glass surfaces, animated gradient orbs, and Inter typography. Fully responsive across desktop and tablet viewports.

### Progressive Web App
Installable on desktop and mobile home screens. Works offline once the service worker caches the application shell.

---

## Quick Start

**Prerequisites:** Node.js 18 or later.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (hot reload on http://localhost:5173)
npm run dev

# 3. Open http://localhost:5173 and drop sample-data.csv onto the window,
#    or click "Choose a file" to browse.
```

To create and preview a production build:

```bash
npm run build
npm run preview   # serves dist/ on http://localhost:4173
```

---

## Supported File Formats

| Extension | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `.csv`    | Comma-separated values.                                        |
| `.tsv`    | Tab-separated values.                                          |
| `.txt`    | Any delimited text — PapaParse auto-detects the delimiter.     |
| `.json`   | Top-level array of objects, or `{ "rows" \| "data": […] }`.   |

A **`sample-data.csv`** is included (60 rows of fictional Q1–Q2 product sales) for immediate testing.

**Limits:** 50 MB maximum file size. Up to 5 numeric histograms and 3 category breakdowns are rendered automatically. Column type detection requires ≥ 70 % of non-null values to match the inferred type (adjustable in `src/utils/columnAnalyzer.ts`).

---

## How It Works

When a file is loaded, Lumen walks every column once using the following chart-selection rules:

1. **Numeric columns** → histogram (up to 5 rendered).
2. **String columns** → horizontal category bar + doughnut on the highest-cardinality column (up to 3 bars).
3. **Date + Numeric columns** → time-series line chart.
4. **String + Numeric columns** → vertical bar of mean values by category.

Clicking any column in the sidebar enters **Focus Mode**, filtering all charts and statistics to that column's data.

---

## Export

Click **Report PDF** or **Charts PDF** in the top bar to download.

| Export        | Contents                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Report PDF    | Written findings (insights) followed by full-page chart figures.         |
| Charts PDF    | One chart per page, with title, caption, and row count.                  |

Both exports are generated entirely in the browser. Rendering uses an offscreen `<canvas>` element — charts are drawn, captured as PNG data URLs, and embedded into the PDF document.

---

## Theming

Click the theme button in the top bar to open the picker. Choose from four presets or set a custom accent color. The selected theme updates all CSS custom properties and Chart.js palette colors immediately.

---

## Deployment

### GitHub Pages

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) and a `.nojekyll` marker for clean asset paths.

**One-time setup:**

1. Go to **Settings → Pages** in the repository.
2. Set the source to **GitHub Actions**.
3. Push to `main`.

Every subsequent push triggers a build and deploys to:

```
https://<owner>.github.io/<repo-name>/
```

The Vite build uses `base: './'`, so relative asset paths work regardless of the repository name.

**Local Pages build:**

```bash
npm run build
npm run serve   # serves dist/ on http://localhost:4173
```

### Desktop App (PWA)

After deploying (or running `npm run preview`), open the URL in Chrome or Edge:

1. Click the **install icon** in the address bar (or *⋮ → Install Lumen*).
2. Launch from the Start Menu, Dock, or Applications folder.

The installed app runs standalone (no browser chrome) and caches the application shell for offline use.

### Native Binary (Tauri)

For a lightweight (~10 MB) native executable that uses the system WebView (no bundled Chromium):

> **Prerequisites:** [Rust toolchain](https://rustup.rs) and Tauri's [platform-specific dependencies](https://tauri.app/start/prerequisites/).

From the project root (with the dev server stopped):

```bash
npm install --save-dev @tauri-apps/cli@latest
npx tauri init
```

Use these answers when prompted by `tauri init`:

| Prompt                                  | Answer                                  |
| --------------------------------------- | --------------------------------------- |
| Dev command (`beforeDevCommand`)        | `npm run dev`                           |
| Build command (`beforeBuildCommand`)    | `npm run build`                         |
| Frontend dist directory (`frontendDist`)| `../dist`                               |
| Dev server URL (`devUrl`)               | `http://localhost:5173`                 |

Then add to `package.json` scripts:

```json
"tauri:dev":   "tauri dev",
"tauri:build": "npm run build && tauri build"
```

```bash
npm run tauri:build   # outputs .exe (Windows), .dmg (macOS), or .AppImage / .deb (Linux)
```

**Alternatives:** Electron (heavier, ~150 MB) or Node SEA for a JS-based launcher.

---

## Project Structure

```
src/
├── App.tsx                    # Application shell and layout
├── main.tsx                   # React entry point
├── lib/
│   └── chartSetup.ts          # Shared Chart.js registration and defaults
├── utils/
│   ├── fileParser.ts          # CSV / TSV / TXT / JSON parsing
│   ├── columnAnalyzer.ts      # Column type inference and statistics
│   ├── insights.ts            # Deterministic statistical insight engine
│   ├── chartRender.ts         # Offscreen Chart.js → PNG renderer
│   ├── pdfExport.ts           # PDF generation (report + charts)
│   ├── themes.ts              # Theme definitions and palette derivation
│   └── useTheme.ts            # Theme state hook with localStorage persistence
├── components/
│   ├── FileUpload.tsx         # Drag-and-drop / browse input
│   ├── DataOutline.tsx        # Column list sidebar
│   ├── StatsCards.tsx         # Summary statistics row
│   ├── ChartsPanel.tsx        # Chart orchestration and layout
│   ├── HistogramChart.tsx     # Numeric distribution
│   ├── CategoryBarChart.tsx   # Horizontal category breakdown
│   ├── MetricBarChart.tsx     # Vertical aggregation bar chart
│   ├── MetricLineChart.tsx    # Time-series line chart
│   ├── MetricDoughnut.tsx     # Category share doughnut
│   ├── DataPreview.tsx        # Paginated data table
│   ├── ExportMenu.tsx         # PDF export controls
│   └── ThemePicker.tsx        # Theme selection popover
└── styles/
    └── glass.css              # Glassmorphism theme and layout

public/
└── icon.svg                   # Brand mark and PWA icon

.github/workflows/
└── deploy.yml                 # GitHub Pages auto-deploy workflow

sample-data.csv                 # 60 rows of fictional sales data
```

---

## Technology Stack

| Layer           | Library                                                      |
| --------------- | ------------------------------------------------------------ |
| Build tooling   | [Vite 5](https://vitejs.dev)                                 |
| UI framework    | [React 18](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org/) |
| Charts          | [Chart.js 4](https://www.chartjs.org) via [react-chartjs-2](https://react-chartjs-2.js.org/) |
| File parsing    | [PapaParse 5](https://www.papaparse.com)                     |
| Drag-and-drop   | [react-dropzone 14](https://react-dropzone.js.org)           |
| PDF generation  | [pdf-lib](https://pdf-lib.js.org)                            |
| PWA support     | [vite-plugin-pwa](https://vite-pwa-org.netlify.app)          |
| Typography      | [Inter](https://rsms.me/inter/) via Google Fonts             |
| Styling         | Custom CSS (glassmorphism) — no framework dependency         |

No CSS framework, no UI kit, no external state management library.

---

## Development

```bash
npm run dev        # Vite dev server with HMR
npm run typecheck  # TypeScript type-checking (no emit)
npm run build      # Production build → dist/
npm run serve      # Preview production build on http://localhost:4173
```

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Jeremy.

See the [LICENSE](./LICENSE) file for full terms.
